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

import { getEmailSender } from '$lib/server/email';
import { json, type RequestEvent } from '@sveltejs/kit';
import { betterAuth } from 'better-auth';
import { AsyncLocalStorage } from 'node:async_hooks';
import { cleanUpExpired } from './cleanup';
import { allowCodeRequest } from './code-request-limit';
import { emailChangedNotice, signInCodeEmail } from './emails';
import { withSignedInHint } from './hint-cookie';
import { buildAuthOptions } from './options';
import { readAuthSettings } from './settings';

type Auth = ReturnType<typeof createAuth>;

// The current request's platform, for work Better Auth starts on its own
// (sending codes, background tasks) from an instance shared across requests.
const requestPlatform = new AsyncLocalStorage<App.Platform | undefined>();

function runInBackground(promise: Promise<unknown>) {
  const logged = promise.catch((e) =>
    console.error('Account background task failed', e),
  );
  requestPlatform.getStore()?.ctx.waitUntil(logged);
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
      sendSignInCode: async (email, code, purpose) => {
        const sender = getEmailSender(requestPlatform.getStore());
        await sender.send(signInCodeEmail(email, code, purpose));
      },
      runInBackground,
      // Better Auth 1.7.3-1.7.5 can't validate the schema on D1 (issue #11346, fixed
      // in 1.7.6). After upgrading, enable it where dev routes are on:
      // platform.env?.ENABLE_DEV_ROUTES === 'true'
      validateSchema: false,
    }),
  );
}

// One instance per isolate: creating it is too costly to repeat on every request
let cached: { key: string; auth: Auth } | undefined;

const MAX_DISPLAY_NAME_LENGTH = 80;

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
  const { platform } = event;
  const auth = authFor(platform);
  if (auth instanceof Response) return auth;
  const db = platform!.env!.DB!;

  return requestPlatform.run(platform, async () => {
    if (isPost(event, '/api/auth/email-otp/send-verification-otp')) {
      const body = await jsonBody(event.request);
      if (
        typeof body?.email === 'string' &&
        !(await allowCodeRequest(db, body.email))
      )
        return json(
          {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many codes requested for this email',
          },
          { status: 429 },
        );
    }

    if (isPost(event, '/api/auth/update-user')) {
      const body = await jsonBody(event.request);
      if (
        typeof body?.name === 'string' &&
        body.name.trim().length > MAX_DISPLAY_NAME_LENGTH
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

    if (emailChange && response.ok)
      runInBackground(
        getEmailSender(platform).send(
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
  const auth = authFor(event.platform);
  if (auth instanceof Response) return auth;
  const session = await auth.api.getSession({
    headers: event.request.headers,
  });
  if (!session) return json({ message: 'Not signed in' }, { status: 401 });
  return { auth, user: session.user };
}
