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

// Connecting Ravelry from the iPhone app (see
// src/lib/server/ravelry/app-connect.ts), under `wrangler dev`: the app's
// code, the page that asks first, and Continue going to Ravelry.

import {
  expect,
  request as playwrightRequest,
  test,
  type APIRequestContext,
} from '@playwright/test';
import { createHash, randomBytes } from 'node:crypto';
import {
  latestCode,
  randomTestIp,
  TEST_TURNSTILE_HEADERS,
  uniqueEmail,
} from './helpers';

/** The app's bearer header, for a new account signed in with a code. */
async function appBearer(baseURL: string, email: string) {
  const browser = await playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL, 'CF-Connecting-IP': randomTestIp() },
  });
  await browser.post('/api/auth/email-otp/send-verification-otp', {
    headers: TEST_TURNSTILE_HEADERS,
    data: { email, type: 'sign-in' },
  });
  await browser.post('/api/auth/sign-in/email-otp', {
    data: { email, otp: await latestCode(browser, email) },
  });
  const verifier = randomBytes(32).toString('base64url');
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  const confirmed = await browser.post(`/app-sign-in?challenge=${challenge}`, {
    form: {},
  });
  const code = (await confirmed.text()).match(
    /temperatureblanket:\/\/sign-in\?code=([A-Za-z0-9_-]{43})/,
  )![1];
  const app = await playwrightRequest.newContext({ baseURL });
  const session = await (
    await app.post('/api/account/app-session', { data: { code, verifier } })
  ).json();
  return { app, bearer: { Authorization: `Bearer ${session.token}` } };
}

/** The app's browser sheet: no cookies of the account's */
const sheet = (baseURL: string) =>
  playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL },
  });

const codeOf = (url: string) => new URL(url).searchParams.get('code')!;

async function startConnect(app: APIRequestContext, bearer: object) {
  const started = await app.post('/api/account/ravelry/connect', {
    headers: { ...bearer, 'Content-Type': 'application/json' },
  });
  expect(started.ok()).toBe(true);
  return (await started.json()).url as string;
}

test('the app connects Ravelry through a page that asks first', async ({
  baseURL,
}) => {
  const email = uniqueEmail('app-ravelry');
  const { app, bearer } = await appBearer(baseURL!, email);

  // Signed out, there's no code
  const signedOut = await app.post('/api/account/ravelry/connect', {
    headers: { 'Content-Type': 'application/json' },
  });
  expect(signedOut.status()).toBe(401);

  const url = await startConnect(app, bearer);
  expect(url).toMatch(/\/app-ravelry-connect\?code=[A-Za-z0-9_-]{43}$/);

  // The page names the account and doesn't spend the code
  const browser = await sheet(baseURL!);
  for (let i = 0; i < 2; i++) {
    const page = await browser.get(url);
    expect(page.ok()).toBe(true);
    expect(page.headers()['cache-control']).toContain('no-store');
    expect(await page.text()).toContain(email);
  }

  // Continue goes to Ravelry with Better Auth's state cookie, once
  const go = await browser.post('/app-ravelry-connect/continue', {
    form: { code: codeOf(url) },
    maxRedirects: 0,
  });
  expect(go.status()).toBe(303);
  const ravelry = new URL(go.headers()['location']);
  expect(ravelry.host).toBe('www.ravelry.com');
  expect(ravelry.searchParams.get('redirect_uri')).toBe(
    `${baseURL}/api/auth/callback/ravelry`,
  );
  const cookies = go
    .headersArray()
    .filter((h) => h.name.toLowerCase() === 'set-cookie');
  expect(cookies.map((c) => c.value.split('=')[0])).toEqual(['tb.state']);

  const again = await browser.post('/app-ravelry-connect/continue', {
    form: { code: codeOf(url) },
    maxRedirects: 0,
  });
  expect(again.headers()['location']).toBe(
    'temperatureblanket://ravelry?result=expired',
  );
  // So is the page, once the code is spent
  const spent = await browser.get(url, { maxRedirects: 0 });
  expect(spent.headers()['location']).toBe(
    'temperatureblanket://ravelry?result=expired',
  );
});

test('Continue only works from the page itself', async ({ baseURL }) => {
  const { app, bearer } = await appBearer(
    baseURL!,
    uniqueEmail('app-ravelry-csrf'),
  );
  const url = await startConnect(app, bearer);
  const other = await playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: 'https://evil.example' },
  });
  const forged = await other.post('/app-ravelry-connect/continue', {
    form: { code: codeOf(url) },
    maxRedirects: 0,
  });
  expect(forged.status()).toBe(403);
  // The code is still good for the app's own sheet
  const page = await (await sheet(baseURL!)).get(url);
  expect(page.ok()).toBe(true);
});

test('the end of the link goes back to the app with a plain result', async ({
  baseURL,
}) => {
  const browser = await sheet(baseURL!);
  const resultOf = async (query: string) =>
    (
      await browser.get(`/app-ravelry-connect/done${query}`, {
        maxRedirects: 0,
      })
    ).headers()['location'];
  expect(await resultOf('')).toBe(
    'temperatureblanket://ravelry?result=connected',
  );
  expect(await resultOf('?error=access_denied')).toBe(
    'temperatureblanket://ravelry?result=canceled',
  );
  expect(
    await resultOf('?error=account_already_linked_to_different_user'),
  ).toBe('temperatureblanket://ravelry?result=already_linked');
  expect(await resultOf('?error=something%20else')).toBe(
    'temperatureblanket://ravelry?result=failed',
  );
});
