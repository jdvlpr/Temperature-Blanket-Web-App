// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

// Accounts are loaded only for /api/auth/* requests (see hooks.server.ts), so the
// rest of the site never pays for them.

import { getEmailSender, type EmailMessage } from '#lib/server/email/index.js';
import { TURNSTILE_HEADER, verifyTurnstile } from '#lib/server/turnstile.js';
import { json, type RequestEvent } from '@sveltejs/kit';
import { betterAuth } from 'better-auth';
import { AsyncLocalStorage } from 'node:async_hooks';
import { cleanUpExpired } from './cleanup';
import {
  allowCodeRequest,
  allowIpCodeRequest,
  CODE_REQUESTS_PER_IP,
  countEmailSent,
  EMAILS_PER_DAY,
  emailsLeftToday,
  readLimit,
} from './code-request-limit';
import { emailChangedNotice, signInCodeEmail } from './emails';
import { withSignedInHint } from './hint-cookie';
import { deleteUserProjectData } from '#lib/server/sync/store.js';
import { cleanName } from '#lib/utils/string-utils.js';
import { buildAuthOptions, MAX_DISPLAY_NAME_LENGTH } from './options';
import { readAuthSettings } from './settings';
import { hasAccount, readSignUpLimit, signUpsOpen } from './sign-up-limit';
import { getPlatform } from '#lib/server/cloudflare.js';

type Auth = ReturnType<typeof createAuth>;

// The current request's platform, for work Better Auth starts on its own
// (sending codes, background tasks) from an instance shared across requests.
const requestPlatform = new AsyncLocalStorage<App.Platform | undefined>();

function runInBackground(promise: Promise<unknown>) {
  const logged = promise.catch((e) =>
    console.error('Account background task failed', e),
  );
  requestPlatform.getStore()?.ctx?.waitUntil(logged);
}

const dailyEmailLimit = (env: NonNullable<App.Platform['env']>) =>
  readLimit(env.EMAIL_DAILY_LIMIT, EMAILS_PER_DAY, 'EMAIL_DAILY_LIMIT');

// Only Resend's sends count against the daily limit; the dev outbox is free
const emailIsCapped = (env: App.Platform['env']) =>
  env?.EMAIL_SENDER === 'resend' && !!env.DB;

/**
 * Sends an email, if today's limit allows it. Every email is counted here,
 * whichever route asked for it; requests check emailsLeftToday first so they
 * can say so instead of claiming a code is on its way.
 */
async function sendEmail(
  platform: App.Platform | undefined,
  message: EmailMessage,
) {
  const env = platform?.env;
  if (
    env &&
    emailIsCapped(env) &&
    !(await countEmailSent(env.DB!, dailyEmailLimit(env)))
  )
    throw new Error('Daily email limit reached, so this email was not sent');
  await getEmailSender(platform).send(message);
}

function createAuth(
  platform: App.Platform,
  settings: Extract<
    ReturnType<typeof readAuthSettings>,
    { status: 'ready' }
  >['settings'],
) {
  return betterAuth(
    buildAuthOptions({
      ...settings,
      database: platform.env!.DB!,
      sendSignInCode: (email, code, purpose) =>
        sendEmail(
          requestPlatform.getStore(),
          signInCodeEmail(email, code, purpose),
        ),
      runInBackground,
      deleteUserData: async (userId) => {
        const env = requestPlatform.getStore()?.env;
        if (env?.DB) {
          const { releaseGalleryPosts, defaultGalleryApi } =
            await import('#lib/server/gallery/index.js');
          await releaseGalleryPosts(env.DB, defaultGalleryApi(), userId);
        }
        if (env?.PROJECTS) await deleteUserProjectData(env.PROJECTS, userId);
      },
      signUpsOpen: async () => {
        const env = requestPlatform.getStore()?.env;
        return (
          !!env?.DB &&
          signUpsOpen(env.DB, readSignUpLimit(env.ACCOUNTS_SIGNUP_LIMIT))
        );
      },
      // Catch schema drift locally only: introspecting D1 on every cold start
      // costs CPU the free plan can't spare (works on D1 since 1.7.6, issue #11346)
      validateSchema: platform.env?.ENABLE_DEV_ROUTES === 'true',
    }),
  );
}

// One instance per isolate: creating it is too costly to repeat on every request
let cached: { key: string; auth: Auth } | undefined;

/** The shared auth instance, or a 404 (accounts off) or 503 (misconfigured) Response. */
function authFor(platform: App.Platform | undefined): Auth | Response {
  const result = readAuthSettings(platform?.env);

  if (result.status === 'disabled')
    return json({ message: 'Not found' }, { status: 404 });
  if (result.status === 'misconfigured' || !platform?.env?.DB) {
    console.error(
      'Accounts are misconfigured:',
      result.status === 'misconfigured' ? result.reason : 'no DB binding',
    );
    return json({ message: 'Accounts are not available' }, { status: 503 });
  }

  const key = JSON.stringify(result.settings);
  if (cached?.key !== key)
    cached = { key, auth: createAuth(platform, result.settings) };
  return cached.auth;
}

async function jsonBody(request: Request) {
  return request
    .clone()
    .json()
    .catch(() => null);
}

const isPost = (event: RequestEvent, path: string) =>
  event.request.method === 'POST' && event.url.pathname === path;

/** Handles a request under /api/auth. */
export async function handleAuthRequest(
  event: RequestEvent,
): Promise<Response> {
  const platform = getPlatform();
  const auth = authFor(platform);
  if (auth instanceof Response) return auth;
  const db = platform!.env!.DB!;

  return requestPlatform.run(platform, async () => {
    // Set when sign-ups are closed or full: the reply says so, whether or not
    // this email has an account, so it doesn't reveal which emails do
    let signUpsPaused = false;

    const sendsSignInCode = isPost(
      event,
      '/api/auth/email-otp/send-verification-otp',
    );
    // Both routes that email a code. (The password reset ones are disabled.)
    if (
      sendsSignInCode ||
      isPost(event, '/api/auth/email-otp/request-email-change')
    ) {
      const body = await jsonBody(event.request);
      const env = platform!.env!;
      const ip = event.request.headers.get('cf-connecting-ip');

      // Signed out, a code request needs a Turnstile token, checked before
      // the counters so bots can't fill them. A real session, not just a
      // cookie: signed in, changing email or confirming it's you skips it
      if (
        sendsSignInCode &&
        !(await auth.api.getSession({ headers: event.request.headers }))
      ) {
        const turnstile = await verifyTurnstile({
          token: event.request.headers.get(TURNSTILE_HEADER),
          secret: env.TURNSTILE_SECRET_KEY,
          remoteIp: ip,
        });
        if (turnstile !== 'ok')
          return turnstile === 'rejected'
            ? json(
                {
                  code: 'TURNSTILE_REJECTED',
                  message: "We couldn't check that you're not a robot",
                },
                { status: 403 },
              )
            : json(
                {
                  code: 'TURNSTILE_UNAVAILABLE',
                  message: "The check that you're not a robot isn't working",
                },
                { status: 503 },
              );
      }

      const email = sendsSignInCode ? body?.email : body?.newEmail;
      if (
        // No address under plain vite dev
        (ip &&
          !(await allowIpCodeRequest(
            db,
            ip,
            readLimit(
              env.ACCOUNTS_CODE_LIMIT_PER_IP,
              CODE_REQUESTS_PER_IP,
              'ACCOUNTS_CODE_LIMIT_PER_IP',
            ),
          ))) ||
        (typeof email === 'string' && !(await allowCodeRequest(db, email)))
      )
        return json(
          {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many codes requested',
          },
          { status: 429 },
        );

      if (
        sendsSignInCode &&
        body?.type === 'sign-in' &&
        typeof body.email === 'string' &&
        !(await signUpsOpen(
          db,
          readSignUpLimit(platform!.env!.ACCOUNTS_SIGNUP_LIMIT),
        ))
      ) {
        // No code for a new email: it couldn't create an account
        if (!(await hasAccount(db, body.email)))
          return json({ success: true, signUpsPaused: true });
        signUpsPaused = true;
      }

      if (
        emailIsCapped(env) &&
        !(await emailsLeftToday(db, dailyEmailLimit(env)))
      )
        return json(
          {
            code: 'EMAIL_LIMIT_REACHED',
            message: 'No more emails can be sent today',
          },
          { status: 503 },
        );
    }

    if (isPost(event, '/api/auth/update-user')) {
      const body = await jsonBody(event.request);
      if (
        typeof body?.name === 'string' &&
        cleanName(body.name, Infinity).length > MAX_DISPLAY_NAME_LENGTH
      )
        return json(
          { code: 'NAME_TOO_LONG', message: 'Display name is too long' },
          { status: 400 },
        );
    }

    // Who to notify, and of what, if this request changes the account's email.
    // Read before Better Auth consumes the request body.
    let emailChange: { from: string; to: string } | undefined;
    if (isPost(event, '/api/auth/email-otp/change-email')) {
      const [session, body] = await Promise.all([
        auth.api.getSession({ headers: event.request.headers }),
        jsonBody(event.request),
      ]);
      if (session && typeof body?.newEmail === 'string')
        emailChange = { from: session.user.email, to: body.newEmail };
    }

    const { response, signedIn } = withSignedInHint(
      await auth.handler(event.request),
      event.url.protocol === 'https:',
    );
    if (signedIn) runInBackground(cleanUpExpired(db));

    if (signUpsPaused && response.ok)
      return json({ ...(await response.json()), signUpsPaused: true });

    if (emailChange && response.ok)
      runInBackground(
        sendEmail(
          platform,
          emailChangedNotice(emailChange.from, emailChange.to),
        ),
      );
    return response;
  });
}

/**
 * The signed-in user for an app route under /api/account, with the auth
 * instance for further calls. A Response (404, 503 or 401) when there's none.
 */
export async function requireAccount(
  event: RequestEvent,
): Promise<
  { auth: Auth; user: { id: string; email: string; name: string } } | Response
> {
  const auth = authFor(getPlatform());
  if (auth instanceof Response) return auth;
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });
  if (!session) return json({ message: 'Not signed in' }, { status: 401 });
  return { auth, user: session.user };
}
