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

// Signing the iPhone app in (see src/lib/server/auth/app-session.ts), under
// `wrangler dev`: the confirm page's code, the exchange, and the app's
// session on the sync routes.

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

const secret = () => randomBytes(32).toString('base64url');
const challengeOf = (verifier: string) =>
  createHash('sha256').update(verifier).digest('base64url');

/** A browser signed in with an emailed code. */
async function signedInBrowser(baseURL: string, email: string) {
  const api = await playwrightRequest.newContext({
    baseURL,
    extraHTTPHeaders: { Origin: baseURL, 'CF-Connecting-IP': randomTestIp() },
  });
  const sent = await api.post('/api/auth/email-otp/send-verification-otp', {
    headers: TEST_TURNSTILE_HEADERS,
    data: { email, type: 'sign-in' },
  });
  expect(sent.ok()).toBe(true);
  const signedIn = await api.post('/api/auth/sign-in/email-otp', {
    data: { email, otp: await latestCode(api, email) },
  });
  expect(signedIn.ok()).toBe(true);
  return api;
}

/** Presses Continue on the confirm page and returns the code it hands the app. */
async function codeFor(browser: APIRequestContext, challenge: string) {
  const page = await browser.post(`/app-sign-in?challenge=${challenge}`, {
    form: {},
  });
  expect(page.ok()).toBe(true);
  const link = (await page.text()).match(
    /temperatureblanket:\/\/sign-in\?code=([A-Za-z0-9_-]{43})/,
  );
  expect(link).not.toBeNull();
  return link![1];
}

test('the app signs in with a code, syncs and signs out', async ({
  baseURL,
}) => {
  const email = uniqueEmail('app-sign-in');
  const browser = await signedInBrowser(baseURL!, email);
  // The app: no cookies of its own
  const app = await playwrightRequest.newContext({ baseURL });

  // The page says who's signed in before anything is handed over
  const verifier = secret();
  const confirm = await browser.get(
    `/app-sign-in?challenge=${challengeOf(verifier)}`,
  );
  expect(await confirm.text()).toContain(email);

  const code = await codeFor(browser, challengeOf(verifier));
  const exchanged = await app.post('/api/account/app-session', {
    data: { code, verifier },
  });
  expect(exchanged.status()).toBe(200);
  const session = await exchanged.json();
  expect(session.user.email).toBe(email);
  expect(session.expiresAt).toBeGreaterThan(Date.now());
  const bearer = { Authorization: `Bearer ${session.token}` };

  // A code works once
  const again = await app.post('/api/account/app-session', {
    data: { code, verifier },
  });
  expect(again.status()).toBe(400);

  const me = await app.get('/api/account/app-session', { headers: bearer });
  expect((await me.json()).user.id).toBe(session.user.id);
  const changes = await app.get('/api/sync/changes?since=0', {
    headers: bearer,
  });
  expect(changes.status()).toBe(200);
  expect((await changes.json()).fullResyncRequired).toBe(false);

  // No token, or a made-up one, is signed out
  expect((await app.get('/api/sync/changes?since=0')).status()).toBe(401);
  const forged = await app.get('/api/sync/changes?since=0', {
    headers: { Authorization: `Bearer ${session.token.split('.')[0]}.AAAA` },
  });
  expect(forged.status()).toBe(401);

  // An app's session can't start another
  const fromApp = await app.post(
    `/app-sign-in?challenge=${challengeOf(secret())}`,
    { headers: { ...bearer, Origin: baseURL! }, form: {}, maxRedirects: 0 },
  );
  expect(await fromApp.text()).not.toContain('temperatureblanket://');

  // Signing the app out leaves the browser signed in
  // (A request with no Content-Type counts as a form to SvelteKit, which
  // refuses forms from elsewhere: the app always names one)
  const out = await app.delete('/api/account/app-session', {
    headers: { ...bearer, 'Content-Type': 'application/json' },
  });
  expect(out.status()).toBe(204);
  expect(
    (await app.get('/api/sync/changes?since=0', { headers: bearer })).status(),
  ).toBe(401);
  expect((await browser.get('/api/sync/changes?since=0')).status()).toBe(200);
});

test('a code is no use without the secret behind its challenge', async ({
  baseURL,
}) => {
  const browser = await signedInBrowser(baseURL!, uniqueEmail('app-secret'));
  const app = await playwrightRequest.newContext({ baseURL });
  const verifier = secret();
  const code = await codeFor(browser, challengeOf(verifier));

  const wrong = await app.post('/api/account/app-session', {
    data: { code, verifier: secret() },
  });
  expect(wrong.status()).toBe(400);
  // And the try spent it
  const right = await app.post('/api/account/app-session', {
    data: { code, verifier },
  });
  expect(right.status()).toBe(400);
});

test('signed out, the page goes to sign in and comes back', async ({
  baseURL,
}) => {
  const visitor = await playwrightRequest.newContext({ baseURL });
  const challenge = challengeOf(secret());
  const response = await visitor.get(`/app-sign-in?challenge=${challenge}`, {
    maxRedirects: 0,
  });
  expect(response.status()).toBe(303);
  expect(response.headers().location).toBe(
    `/auth/sign-in?redirect=${encodeURIComponent(`/app-sign-in?challenge=${challenge}`)}`,
  );
  // The app's Continue with Google: passed on, so the page starts Google
  const google = await visitor.get(
    `/app-sign-in?challenge=${challenge}&provider=google`,
    { maxRedirects: 0 },
  );
  expect(google.headers().location).toBe(
    `/auth/sign-in?redirect=${encodeURIComponent(`/app-sign-in?challenge=${challenge}`)}&provider=google`,
  );
  // Not opened by the app
  expect((await visitor.get('/app-sign-in')).status()).toBe(400);
});

test('the app renames the account and signs out everywhere', async ({
  baseURL,
}) => {
  const email = uniqueEmail('app-rename');
  const browser = await signedInBrowser(baseURL!, email);
  const app = await playwrightRequest.newContext({ baseURL });
  const verifier = secret();
  const code = await codeFor(browser, challengeOf(verifier));
  const session = await (
    await app.post('/api/account/app-session', { data: { code, verifier } })
  ).json();
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.token}`,
  };

  const me = await (
    await app.get('/api/account/app-session', { headers })
  ).json();
  expect(Date.parse(me.user.createdAt)).toBeLessThanOrEqual(Date.now());

  const renamed = await app.patch('/api/account/app-session', {
    headers,
    data: { name: '  Purl   Jam ' },
  });
  expect(renamed.status()).toBe(200);
  expect((await renamed.json()).user.name).toBe('Purl Jam');
  const tooLong = await app.patch('/api/account/app-session', {
    headers,
    data: { name: 'x'.repeat(81) },
  });
  expect(tooLong.status()).toBe(400);
  expect((await tooLong.json()).code).toBe('NAME_TOO_LONG');
  // Only the app's bearer session: a browser uses Better Auth's own
  expect(
    (
      await browser.patch('/api/account/app-session', {
        headers: { 'Content-Type': 'application/json' },
        data: { name: 'Nope' },
      })
    ).status(),
  ).toBe(401);

  const out = await app.delete('/api/account/app-session?everywhere=1', {
    headers,
  });
  expect(out.status()).toBe(204);
  expect(
    (await app.get('/api/account/app-session', { headers })).status(),
  ).toBe(401);
  expect((await browser.get('/api/sync/changes?since=0')).status()).toBe(401);
});

test('the app deletes its account, signing out everywhere', async ({
  baseURL,
}) => {
  const email = uniqueEmail('app-delete');
  const browser = await signedInBrowser(baseURL!, email);
  const app = await playwrightRequest.newContext({ baseURL });
  const verifier = secret();
  const code = await codeFor(browser, challengeOf(verifier));
  const session = await (
    await app.post('/api/account/app-session', { data: { code, verifier } })
  ).json();
  const json = { 'Content-Type': 'application/json' };

  // Only for the app's bearer session: a browser uses Better Auth's own
  expect(
    (await browser.delete('/api/account', { headers: json })).status(),
  ).toBe(401);
  expect((await app.delete('/api/account', { headers: json })).status()).toBe(
    401,
  );

  // The session is minutes old, so it's fresh enough
  const deleted = await app.delete('/api/account', {
    headers: { ...json, Authorization: `Bearer ${session.token}` },
  });
  expect(deleted.status()).toBe(204);
  expect(
    (
      await app.get('/api/account/app-session', {
        headers: { Authorization: `Bearer ${session.token}` },
      })
    ).status(),
  ).toBe(401);
  expect((await browser.get('/api/sync/changes?since=0')).status()).toBe(401);
});

test('Sign in with Apple for the app is off until its bundle ID is set', async ({
  baseURL,
}) => {
  const app = await playwrightRequest.newContext({ baseURL });
  const response = await app.post('/api/account/app-apple-session', {
    data: { idToken: 'a.b.c', nonce: 'n' },
  });
  expect(response.status()).toBe(404);
});
