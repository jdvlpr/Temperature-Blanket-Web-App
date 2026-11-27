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
import type { D1Database } from '@cloudflare/workers-types';
import type { RequestEvent } from '@sveltejs/kit';
import { betterAuth } from 'better-auth';
import { APIError } from 'better-auth/api';
import { decryptOAuthToken } from 'better-auth/oauth2';
import { AsyncLocalStorage } from 'node:async_hooks';
import {
  bearerToken,
  createAppSession,
  withBearerSession,
  type AppSession,
  type AppSessionContext,
} from './app-session';
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
import {
  buildAuthOptions,
  MAX_DISPLAY_NAME_LENGTH,
  RAVELRY_PROVIDER_ID,
  SIGN_UPS_PAUSED,
} from './options';
import {
  emailSignInOn,
  readAuthSettings,
  type AppleSettings,
} from './settings';
import {
  appleClientSecret,
  readAppleRevokeSettings,
  revokeAppleAuthorization,
  revokeAppleToken,
  type AppleRevokeSettings,
} from './apple-revoke';
import { hasAccount, readSignUpLimit, signUpsOpen } from './sign-up-limit';
import { getPlatform } from '#lib/server/cloudflare.js';

type Auth = ReturnType<typeof betterAuth<ReturnType<typeof buildAuthOptions>>>;

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

type ReadySettings = Extract<
  ReturnType<typeof readAuthSettings>,
  { status: 'ready' }
>['settings'];

/** The website's Sign in with Apple client: the Services ID and its key */
const appleWebClient = (
  apple: AppleSettings | undefined,
): AppleRevokeSettings | undefined =>
  apple?.web && { clientId: apple.web.clientId, ...apple.web.key };

/**
 * Takes the website off the person's Apple ID when their account goes: a
 * website sign-in left Apple's refresh token (encrypted) on the account row,
 * issued to the Services ID. Nothing to do for an app-only Apple sign-in.
 */
async function revokeWebAppleSignIn(
  db: D1Database,
  auth: Auth,
  client: AppleRevokeSettings,
  userId: string,
) {
  const row = await db
    .prepare(
      'select "refreshToken" from "account" where "userId" = ? and "providerId" = \'apple\' and "refreshToken" is not null',
    )
    .bind(userId)
    .first<{ refreshToken: string }>();
  if (!row) return;
  const context = (await auth.$context) as unknown as Parameters<
    typeof decryptOAuthToken
  >[1];
  const token = await decryptOAuthToken(row.refreshToken, context);
  await revokeAppleToken(client, token, 'refresh_token');
}

function createAuth(
  platform: App.Platform,
  settings: ReadySettings,
  /** The website's Apple client secret, signed for this instance; without it the website half is off */
  appleSecret: string | undefined,
) {
  const appleWeb = appleWebClient(settings.apple);
  const auth: Auth = betterAuth(
    buildAuthOptions({
      ...settings,
      apple: settings.apple && {
        appBundleId: settings.apple.appBundleId,
        web:
          appleWeb && appleSecret
            ? { clientId: appleWeb.clientId, clientSecret: appleSecret }
            : undefined,
      },
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
        // The account goes either way, so a refusal from Apple is only logged
        if (env?.DB && appleWeb)
          await revokeWebAppleSignIn(env.DB, auth, appleWeb, userId).catch(
            (e) =>
              console.error(
                "Couldn't revoke the website's Sign in with Apple on delete",
                e,
              ),
          );
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
  return auth;
}

const DAY_MS = 24 * 60 * 60 * 1000;
/** How long the website's Apple client secret lasts; the instance is rebuilt a day before */
const APPLE_SECRET_DAYS = 30;
/** After a failed signing, how soon to try again */
const APPLE_RETRY_MS = 10 * 60 * 1000;

/**
 * Builds the instance, first signing the website's Apple client secret when
 * it's set up. A key that won't sign leaves Apple off on the website, not
 * accounts as a whole.
 */
async function buildAuth(platform: App.Platform, settings: ReadySettings) {
  const now = Date.now();
  const appleWeb = appleWebClient(settings.apple);
  let appleSecret: string | undefined;
  let expiresAt = Infinity;
  if (appleWeb) {
    try {
      appleSecret = await appleClientSecret(
        appleWeb,
        now,
        (APPLE_SECRET_DAYS * DAY_MS) / 1000,
      );
      expiresAt = now + (APPLE_SECRET_DAYS - 1) * DAY_MS;
    } catch (e) {
      console.error("Couldn't sign the Sign in with Apple client secret", e);
      expiresAt = now + APPLE_RETRY_MS;
    }
  }
  return { auth: createAuth(platform, settings, appleSecret), expiresAt };
}

// One instance per isolate: creating it is too costly to repeat on every
// request. A promise, so requests arriving together share one build
let cached:
  | { key: string; built: ReturnType<typeof buildAuth>; expiresAt: number }
  | undefined;

/** The shared auth instance, or a 404 (accounts off) or 503 (misconfigured) Response. */
async function authFor(
  platform: App.Platform | undefined,
): Promise<Auth | Response> {
  const result = readAuthSettings(platform?.env);

  if (result.status === 'disabled')
    return Response.json({ message: 'Not found' }, { status: 404 });
  if (result.status === 'misconfigured' || !platform?.env?.DB) {
    console.error(
      'Accounts are misconfigured:',
      result.status === 'misconfigured' ? result.reason : 'no DB binding',
    );
    return Response.json(
      { message: 'Accounts are not available' },
      { status: 503 },
    );
  }

  // The settings alone, never the signed secret, so the key stays the same
  const key = JSON.stringify(result.settings);
  if (cached?.key !== key || Date.now() >= cached.expiresAt) {
    const built = buildAuth(platform, result.settings);
    const entry = { key, built, expiresAt: Infinity };
    cached = entry;
    // A failed build is dropped, so the next request tries again
    built.then(
      ({ expiresAt }) => (entry.expiresAt = expiresAt),
      () => {
        if (cached === entry) cached = undefined;
      },
    );
  }
  return (await cached.built).auth;
}

async function jsonBody(request: Request) {
  return request
    .clone()
    .json()
    .catch(() => null);
}

const TOKEN_ROUTES = new Set([
  '/api/auth/get-access-token',
  '/api/auth/refresh-token',
  '/api/auth/account-info',
]);

const isPost = (event: RequestEvent, path: string) =>
  event.request.method === 'POST' && event.url.pathname === path;

/** Handles a request under /api/auth. */
export async function handleAuthRequest(
  event: RequestEvent,
): Promise<Response> {
  const platform = getPlatform();
  const auth = await authFor(platform);
  if (auth instanceof Response) return auth;
  const db = platform!.env!.DB!;

  return requestPlatform.run(platform, async () => {
    // Set when sign-ups are closed or full: the reply says so, whether or not
    // this email has an account, so it doesn't reveal which emails do
    let signUpsPaused = false;

    // With email codes off these routes don't exist; Better Auth answers 404
    const emailSignIn = emailSignInOn(platform!.env);
    const sendsSignInCode =
      emailSignIn && isPost(event, '/api/auth/email-otp/send-verification-otp');
    // Both routes that email a code. (The password reset ones are disabled.)
    if (
      sendsSignInCode ||
      (emailSignIn && isPost(event, '/api/auth/email-otp/request-email-change'))
    ) {
      const body = await jsonBody(event.request);
      const env = platform!.env!;
      const ip = event.request.headers.get('cf-connecting-ip');

      // A code request needs a Turnstile token, checked before the counters
      // so bots can't fill them, unless it's for the signed-in account's own
      // address (confirming it's you, changing email). A real session, not
      // just a cookie, and not any address: a Google sign-in costs no
      // Turnstile check, so it mustn't open codes to other addresses
      const ownAddress = async () => {
        const session = await auth.api.getSession({
          headers: event.request.headers,
        });
        return (
          !!session &&
          typeof body?.email === 'string' &&
          body.email.trim().toLowerCase() === session.user.email.toLowerCase()
        );
      };
      if (sendsSignInCode && !(await ownAddress())) {
        const turnstile = await verifyTurnstile({
          token: event.request.headers.get(TURNSTILE_HEADER),
          secret: env.TURNSTILE_SECRET_KEY,
          remoteIp: ip,
        });
        if (turnstile !== 'ok')
          return turnstile === 'rejected'
            ? Response.json(
                {
                  code: 'TURNSTILE_REJECTED',
                  message: "We couldn't check that you're not a robot",
                },
                { status: 403 },
              )
            : Response.json(
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
        return Response.json(
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
          return Response.json({ success: true, signUpsPaused: true });
        signUpsPaused = true;
      }

      if (
        emailIsCapped(env) &&
        !(await emailsLeftToday(db, dailyEmailLimit(env)))
      )
        return Response.json(
          {
            code: 'EMAIL_LIMIT_REACHED',
            message: 'No more emails can be sent today',
          },
          { status: 503 },
        );
    }

    // Provider tokens stay on the server: $lib/server/ravelry asks auth.api
    // for them directly, so these routes have no use from a browser
    if (TOKEN_ROUTES.has(event.url.pathname))
      return Response.json({ message: 'Not found' }, { status: 404 });

    // A linked Ravelry account is for Ravelry's API only, never a way in
    if (isPost(event, '/api/auth/sign-in/social')) {
      const body = await jsonBody(event.request);
      if (body?.provider === RAVELRY_PROVIDER_ID)
        return Response.json(
          {
            code: 'NOT_A_SIGN_IN_METHOD',
            message: 'Ravelry is not a sign-in method',
          },
          { status: 400 },
        );
    }

    // Better Auth keeps one account of any kind; a Ravelry one doesn't count,
    // so without email codes, Google can't be unlinked while only Ravelry
    // would be left
    if (!emailSignIn && isPost(event, '/api/auth/unlink-account')) {
      const [session, body] = await Promise.all([
        auth.api.getSession({ headers: event.request.headers }),
        jsonBody(event.request),
      ]);
      if (session && typeof body?.accountId === 'string') {
        const { results } = await db
          .prepare(
            'select "id", "providerId" from "account" where "userId" = ?',
          )
          .bind(session.user.id)
          .all<{ id: string; providerId: string }>();
        const target = results.find((a) => a.id === body.accountId);
        const waysIn = results.filter(
          (a) =>
            a.id !== body.accountId && a.providerId !== RAVELRY_PROVIDER_ID,
        );
        if (
          target &&
          target.providerId !== RAVELRY_PROVIDER_ID &&
          !waysIn.length
        )
          return Response.json(
            {
              code: 'FAILED_TO_UNLINK_LAST_ACCOUNT',
              message: 'You can’t unlink your last way to sign in',
            },
            { status: 400 },
          );
      }
    }

    if (isPost(event, '/api/auth/update-user')) {
      const body = await jsonBody(event.request);
      if (
        typeof body?.name === 'string' &&
        cleanName(body.name, Infinity).length > MAX_DISPLAY_NAME_LENGTH
      )
        return Response.json(
          { code: 'NAME_TOO_LONG', message: 'Display name is too long' },
          { status: 400 },
        );
    }

    // Who to notify, and of what, if this request changes the account's email.
    // Read before Better Auth consumes the request body.
    let emailChange: { from: string; to: string } | undefined;
    if (emailSignIn && isPost(event, '/api/auth/email-otp/change-email')) {
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
      return Response.json({ ...(await response.json()), signUpsPaused: true });

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
export async function requireAccount(event: RequestEvent): Promise<
  | {
      auth: Auth;
      user: { id: string; email: string; name: string; createdAt: Date };
    }
  | Response
> {
  const auth = await authFor(getPlatform());
  if (auth instanceof Response) return auth;
  const session = await auth.api.getSession({
    // The iPhone app sends its session as a bearer token (see ./app-session)
    headers: withBearerSession(event.request.headers),
  });
  if (!session)
    return Response.json({ message: 'Not signed in' }, { status: 401 });
  return { auth, user: session.user };
}

/**
 * Deletes the iPhone app's account, as the account page's Delete account does
 * (Better Auth's delete-user: the account's data, then the user and every
 * session). The app's session must be under `freshAge` old, so the app signs
 * in again first. Only for a bearer token: browsers use /api/auth/delete-user.
 */
export async function deleteAppAccount(
  event: RequestEvent,
  appleAuthorizationCode?: unknown,
): Promise<'deleted' | 'not-fresh' | Response> {
  const platform = getPlatform();
  const auth = await authFor(platform);
  if (auth instanceof Response) return auth;
  if (!bearerToken(event.request.headers))
    return Response.json({ message: 'Not signed in' }, { status: 401 });

  // deleteUserData reads the platform from here
  return requestPlatform.run(platform, async () => {
    try {
      await auth.api.deleteUser({
        headers: withBearerSession(event.request.headers),
        body: {},
      });
    } catch (e) {
      if (e instanceof APIError) {
        if (e.body?.code === 'SESSION_EXPIRED') return 'not-fresh' as const;
        if (e.statusCode === 401)
          return Response.json({ message: 'Not signed in' }, { status: 401 });
      }
      throw e;
    }
    // Signed in with Apple: take the app off the person's Apple ID too. The
    // account is gone either way, so a refusal from Apple is only logged.
    const apple = readAppleRevokeSettings(platform?.env);
    if (
      apple &&
      typeof appleAuthorizationCode === 'string' &&
      appleAuthorizationCode
    )
      await revokeAppleAuthorization(apple, appleAuthorizationCode).catch((e) =>
        console.error(
          "Couldn't revoke Sign in with Apple on Delete Account",
          e,
        ),
      );
    return 'deleted' as const;
  });
}

function withoutCredentials(headers: Headers): Headers {
  const copy = new Headers(headers);
  copy.delete('cookie');
  copy.delete('authorization');
  return copy;
}

/**
 * Signs the iPhone app in with Sign in with Apple on the device: Better Auth
 * checks the ID token (Apple's keys, the app's bundle ID as audience, the
 * nonce) and finds or makes the account (an existing account with the same
 * verified email is signed in to). The browser-style session it makes is
 * dropped for one of the app's own. 404 when Apple isn't set up for the app.
 */
export async function appleAppSession(
  event: RequestEvent,
  idToken: unknown,
  nonce: unknown,
): Promise<AppSession | Response> {
  const platform = getPlatform();
  const settings = readAuthSettings(platform?.env);
  const auth = await authFor(platform);
  if (auth instanceof Response) return auth;
  if (settings.status !== 'ready' || !settings.settings.apple?.appBundleId)
    return Response.json({ message: 'Not found' }, { status: 404 });
  if (
    typeof idToken !== 'string' ||
    typeof nonce !== 'string' ||
    !idToken ||
    !nonce
  )
    return Response.json(
      { code: 'INVALID_REQUEST', message: 'Sign in with Apple again.' },
      { status: 400 },
    );

  return requestPlatform.run(platform, async () => {
    let signedIn: { token: string; user: { id: string } };
    try {
      signedIn = (await auth.api.signInSocial({
        body: { provider: 'apple', idToken: { token: idToken, nonce } },
        // The request's host (Better Auth works out its address from it), never
        // a browser's cookies or a bearer token: this is the app's sign-in alone
        headers: withoutCredentials(event.request.headers),
      })) as { token: string; user: { id: string } };
    } catch (e) {
      if (e instanceof APIError && e.body?.code === SIGN_UPS_PAUSED)
        return Response.json(
          { code: SIGN_UPS_PAUSED, message: 'New sign-ups are paused' },
          { status: 403 },
        );
      if (e instanceof APIError && e.statusCode < 500)
        return Response.json(
          {
            code: 'INVALID_TOKEN',
            message: "Apple's sign-in couldn't be checked. Try again.",
          },
          { status: 401 },
        );
      throw e;
    }
    const context = (await auth.$context) as unknown as AppSessionContext;
    await context.internalAdapter.deleteSession(signedIn.token);
    const session = await createAppSession(context, signedIn.user.id);
    return (
      session ??
      Response.json({ message: 'Could not sign in' }, { status: 500 })
    );
  });
}

/**
 * What ./app-session needs of Better Auth, for the routes that sign the
 * iPhone app in and out. A Response (404 or 503) when accounts aren't on.
 */
export async function appSessionContext(): Promise<
  AppSessionContext | Response
> {
  const auth = await authFor(getPlatform());
  if (auth instanceof Response) return auth;
  return (await auth.$context) as unknown as AppSessionContext;
}

/**
 * The signed-in user of a browser's request, for the page that signs the
 * iPhone app in: by cookie only, never a bearer token, so an app's session
 * can't start another.
 */
export async function browserAccount(
  event: RequestEvent,
): Promise<{ id: string; email: string; name: string } | null | Response> {
  const auth = await authFor(getPlatform());
  if (auth instanceof Response) return auth;
  if (bearerToken(event.request.headers)) return null;
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });
  return session?.user ?? null;
}

/**
 * The signed-in user, for a route anyone may use: null when signed out, or
 * when accounts are off or unavailable here.
 */
export async function optionalAccount(
  event: RequestEvent,
): Promise<{ id: string; email: string; emailVerified: boolean } | null> {
  const auth = await authFor(getPlatform());
  if (auth instanceof Response) return null;
  try {
    const session = await auth.api.getSession({
      headers: withBearerSession(event.request.headers),
    });
    return session?.user ?? null;
  } catch {
    return null;
  }
}
