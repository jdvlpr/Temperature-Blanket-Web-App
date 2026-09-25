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
import { signInCodeEmail } from './emails';
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

/** Handles a request under /api/auth. 404 when accounts are off, 503 when misconfigured. */
export async function handleAuthRequest(
  event: RequestEvent,
): Promise<Response> {
  const { platform } = event;
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

  const auth = cached.auth;
  return requestPlatform.run(platform, () => auth.handler(event.request));
}
