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

// Accounts under `wrangler pages dev` (pnpm test:e2e:cloudflare), built with
// PUBLIC_ACCOUNTS_ENABLED=true. Sign-in codes are read from the dev email outbox.

import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';
import { execFileSync } from 'node:child_process';

/** Polls the dev outbox for the newest code sent to an address. */
async function latestCode(
  request: APIRequestContext,
  email: string,
): Promise<string> {
  let code: string | undefined;
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `/api/dev/outbox?to=${encodeURIComponent(email)}`,
        );
        const messages: { text: string }[] = await response.json();
        code = messages[0]?.text.match(/\b(\d{6})\b/)?.[1];
        return code;
      },
      { message: `a code emailed to ${email}` },
    )
    .toBeTruthy();
  return code!;
}

// Rate limits are per client IP, and every local request comes from the same one.
// Locally, wrangler passes a client-sent CF-Connecting-IP through (Cloudflare's edge
// overwrites it in production), so each test gets its own address and limit.
const randomTestIp = () =>
  `10.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${1 + Math.floor(Math.random() * 254)}`;

test.beforeEach(async ({ page, context, baseURL }) => {
  await page.setExtraHTTPHeaders({ 'CF-Connecting-IP': randomTestIp() });
  // Pre-answer the analytics consent toast, which otherwise covers buttons at the
  // bottom of the page (as in test-project-planner.spec.ts)
  await context.addCookies([
    { name: '_clck', value: '1', url: baseURL },
    { name: '_clsk', value: '1', url: baseURL },
  ]);
});

const uniqueEmail = (label: string) =>
  `${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;

/** Signs in through the sign-in page and waits for the account page. */
async function signIn(page: Page, request: APIRequestContext, email: string) {
  await page.goto('/auth/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Email me a code' }).click();
  await expect(page.getByText(`We sent a code to ${email}`)).toBeVisible();
  // The code field submits itself on the sixth digit
  await page.getByLabel('Code').fill(await latestCode(request, email));
  await expect(page.getByTestId('account-email')).toHaveText(email);
}

test.describe('Accounts: sign in with an emailed code', () => {
  test('sign in, see the account, sign out', async ({ page, request }) => {
    const email = uniqueEmail('sign-in');

    await page.goto('/auth/sign-in');
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Email me a code' }).click();
    await expect(page.getByText(`We sent a code to ${email}`)).toBeVisible();

    await page.getByLabel('Code').fill(await latestCode(request, email));

    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByTestId('account-email')).toHaveText(email);

    // The session survives a reload
    await page.reload();
    await expect(page.getByTestId('account-email')).toHaveText(email);

    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page.getByText('You’re not signed in.')).toBeVisible();
    await page.reload();
    await expect(page.getByText('You’re not signed in.')).toBeVisible();
  });

  test('a wrong code is rejected', async ({ page, request }) => {
    const email = uniqueEmail('wrong-code');

    await page.goto('/auth/sign-in');
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Email me a code' }).click();
    const code = await latestCode(request, email);
    const wrong = code === '000000' ? '111111' : '000000';

    await page.getByLabel('Code').fill(wrong);
    // Scoped to the page: the analytics consent toast is also an alert
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'That code isn’t right, or it has expired.',
    );
    await expect(page).toHaveURL(/\/auth\/sign-in$/);
  });

  test('signing in returns to the page it started from', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('redirect');
    await page.goto('/auth/sign-in?redirect=/faq');
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Email me a code' }).click();
    // Pasted codes may carry spaces
    const code = await latestCode(request, email);
    await page.getByLabel('Code').fill(`${code.slice(0, 3)} ${code.slice(3)}`);
    await expect(page).toHaveURL(/\/faq$/);

    // A redirect to another site is ignored
    await page.goto('/account');
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await page.goto('/auth/sign-in?redirect=//evil.example');
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Email me a code' }).click();
    await page.getByLabel('Code').fill(await latestCode(request, email));
    await expect(page).toHaveURL(/\/account$/);
  });

  test('the account page signs in in place when signed out', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('in-place');
    await page.goto('/account');
    await expect(page.getByText('You’re not signed in.')).toBeVisible();
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Email me a code' }).click();
    await page.getByLabel('Code').fill(await latestCode(request, email));
    await expect(page.getByTestId('account-email')).toHaveText(email);
    await expect(page).toHaveURL(/\/account$/);
  });

  test('requests from another site are refused', async ({ request }) => {
    const response = await request.post(
      '/api/auth/email-otp/send-verification-otp',
      {
        headers: {
          Origin: 'https://evil.example',
          'CF-Connecting-IP': randomTestIp(),
        },
        data: { email: uniqueEmail('csrf'), type: 'sign-in' },
      },
    );
    expect(response.status()).toBe(403);
  });

  test('code requests are rate limited per IP', async ({ request }) => {
    const ip = randomTestIp();
    const send = () =>
      request.post('/api/auth/email-otp/send-verification-otp', {
        headers: { 'CF-Connecting-IP': ip },
        data: { email: uniqueEmail('rate-limit'), type: 'sign-in' },
      });
    // The email code plugin allows 3 a minute
    for (let i = 0; i < 3; i++) expect((await send()).status()).toBe(200);
    expect((await send()).status()).toBe(429);
  });

  test('code requests are limited per email address, from any IP', async ({
    request,
  }) => {
    const email = uniqueEmail('per-email');
    const send = () =>
      request.post('/api/auth/email-otp/send-verification-otp', {
        headers: { 'CF-Connecting-IP': randomTestIp() },
        data: { email, type: 'sign-in' },
      });
    for (let i = 0; i < 5; i++) expect((await send()).status()).toBe(200);
    const blocked = await send();
    expect(blocked.status()).toBe(429);
    expect((await blocked.json()).code).toBe('TOO_MANY_REQUESTS');
  });
});

test.describe('Accounts: signed-in hint and sessions', () => {
  test('the hint cookie follows the session, and signed-out pages make no session request', async ({
    page,
    context,
    request,
  }) => {
    const sessionRequests: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes('/api/auth/get-session'))
        sessionRequests.push(r.url());
    });

    await page.goto('/account');
    await expect(page.getByText('You’re not signed in.')).toBeVisible();
    expect(sessionRequests).toHaveLength(0);

    await signIn(page, request, uniqueEmail('hint'));
    const cookies = await context.cookies();
    const hint = cookies.find((c) => c.name === 'tb_signed_in');
    const session = cookies.find((c) => c.name.endsWith('tb.session_token'));
    expect(hint?.value).toBe('1');
    expect(hint?.httpOnly).toBe(false);
    expect(session?.httpOnly).toBe(true);

    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page.getByText('You’re not signed in.')).toBeVisible();
    expect(
      (await context.cookies()).some((c) => c.name === 'tb_signed_in'),
    ).toBe(false);
  });

  test('sign out everywhere ends sessions in other browsers', async ({
    browser,
    request,
  }) => {
    const email = uniqueEmail('everywhere');
    const [first, second] = await Promise.all([
      browser.newContext(),
      browser.newContext(),
    ]);
    const pageA = await first.newPage();
    const pageB = await second.newPage();
    await pageA.setExtraHTTPHeaders({ 'CF-Connecting-IP': randomTestIp() });
    await pageB.setExtraHTTPHeaders({ 'CF-Connecting-IP': randomTestIp() });

    await signIn(pageA, request, email);
    await signIn(pageB, request, email);

    await pageA.getByRole('button', { name: 'Sign out everywhere' }).click();
    await expect(pageA.getByText('You’re not signed in.')).toBeVisible();

    await pageB.reload();
    await expect(pageB.getByText('You’re not signed in.')).toBeVisible();

    await Promise.all([first.close(), second.close()]);
  });
});

/** Polls the dev outbox until a message whose subject matches arrives. */
async function expectEmail(
  request: APIRequestContext,
  to: string,
  subject: RegExp,
) {
  await expect
    .poll(
      async () => {
        const response = await request.get(
          `/api/dev/outbox?to=${encodeURIComponent(to)}`,
        );
        const messages: { subject: string }[] = await response.json();
        return messages.some((message) => subject.test(message.subject));
      },
      { message: `an email to ${to} matching ${subject}` },
    )
    .toBe(true);
}

test.describe('Accounts: managing the account', () => {
  test('display name is saved, and an overlong one is refused', async ({
    page,
    request,
  }) => {
    await signIn(page, request, uniqueEmail('name'));
    await page.getByLabel('Display name').fill('Blanket Maker');
    await page.getByRole('button', { name: 'Save name' }).click();
    await expect(page.getByRole('status')).toHaveText('Saved');
    await page.reload();
    await expect(page.getByLabel('Display name')).toHaveValue('Blanket Maker');

    const tooLong = await page.request.post('/api/auth/update-user', {
      data: { name: 'x'.repeat(81) },
    });
    expect(tooLong.status()).toBe(400);
    expect((await tooLong.json()).code).toBe('NAME_TOO_LONG');
  });

  test('email change needs codes from both addresses and notifies the old one', async ({
    page,
    request,
  }) => {
    const oldEmail = uniqueEmail('old');
    const newEmail = uniqueEmail('new');
    await signIn(page, request, oldEmail);

    await page.getByRole('button', { name: 'Change email' }).click();
    await expect(page.getByText('First, confirm it’s you')).toBeVisible();
    await page
      .getByLabel('Code sent to your current email')
      .fill(await latestCode(request, oldEmail));
    await page.getByLabel('New email').fill(newEmail);
    await page
      .getByRole('button', { name: 'Send a code to the new email' })
      .click();

    await page
      .getByLabel('Code sent to your new email')
      .fill(await latestCode(request, newEmail));
    await expect(
      page.getByText(`Your email is now ${newEmail}.`),
    ).toBeVisible();
    await expect(page.getByTestId('account-email')).toHaveText(newEmail);
    await expectEmail(request, oldEmail, /email was changed/);

    // The new address signs in to the same account
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await signIn(page, request, newEmail);
  });

  test('delete with a fresh session; signing in again starts a new account', async ({
    page,
    context,
    request,
  }) => {
    const email = uniqueEmail('delete');
    await signIn(page, request, email);
    await page.getByLabel('Display name').fill('Soon Gone');
    await page.getByRole('button', { name: 'Save name' }).click();
    await expect(page.getByRole('status')).toHaveText('Saved');

    await page.getByRole('button', { name: 'Delete account' }).click();
    await page.getByRole('button', { name: 'Yes, delete my account' }).click();
    await expect(page.getByText('Your account was deleted.')).toBeVisible();
    expect(
      (await context.cookies()).some((c) => c.name === 'tb_signed_in'),
    ).toBe(false);

    await signIn(page, request, email);
    await expect(page.getByLabel('Display name')).toHaveValue('');
  });

  test('delete with an old session asks for a new code first', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('stale');
    await signIn(page, request, email);

    // Age the session past the 10-minute freshness limit in the local database
    const twentyMinutesAgo = new Date(
      Date.now() - 20 * 60 * 1000,
    ).toISOString();
    execFileSync('pnpm', [
      'exec',
      'wrangler',
      'd1',
      'execute',
      'DB',
      '--local',
      '--command',
      `update "session" set "createdAt" = '${twentyMinutesAgo}' where "userId" = (select "id" from "user" where "email" = '${email}')`,
    ]);

    await page.getByRole('button', { name: 'Delete account' }).click();
    await page.getByRole('button', { name: 'Yes, delete my account' }).click();
    await expect(
      page.getByText('To delete your account, confirm it’s you'),
    ).toBeVisible();
    await page.getByLabel('Code').fill(await latestCode(request, email));
    await expect(page.getByText('Your account was deleted.')).toBeVisible();
  });

  test('export returns the account, and 401 when signed out', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('export');
    await signIn(page, request, email);

    const response = await page.request.get('/api/account/export');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-disposition']).toContain('attachment');
    const data = await response.json();
    expect(data.account.email).toBe(email);
    expect(data.sessions.length).toBeGreaterThan(0);

    expect((await request.get('/api/account/export')).status()).toBe(401);
  });
});

/** Runs SQL against the local D1 database that wrangler pages dev uses. */
function localD1(sql: string): Record<string, unknown>[] {
  const output = execFileSync('pnpm', [
    'exec',
    'wrangler',
    'd1',
    'execute',
    'DB',
    '--local',
    '--json',
    '--command',
    sql,
  ]).toString();
  return JSON.parse(output)[0].results;
}

/** Adds a linked Google sign-in, as linking would store it (Google can't run here). */
function seedGoogleAccount(userId: string) {
  const now = new Date().toISOString();
  localD1(
    `insert into "account" ("id", "accountId", "providerId", "userId", "createdAt", "updatedAt") values ('google-${userId}', 'google-user-${userId}', 'google', '${userId}', '${now}', '${now}')`,
  );
}

const googleAccountCount = (userId: string) =>
  localD1(
    `select count(*) as n from "account" where "userId" = '${userId}' and "providerId" = 'google'`,
  )[0].n;

async function currentUserId(page: Page): Promise<string> {
  return (await (await page.request.get('/api/account/export')).json()).account
    .id;
}

test.describe('Accounts: Google', () => {
  test('Google is offered when configured, and starts at Google', async ({
    page,
    request,
    baseURL,
  }) => {
    const options = await request.get('/api/account/sign-in-options');
    expect(await options.json()).toEqual({ google: true });
    await page.goto('/auth/sign-in');
    await expect(
      page.getByRole('button', { name: 'Continue with Google' }),
    ).toBeVisible();

    const response = await request.post('/api/auth/sign-in/social', {
      headers: { Origin: baseURL! },
      data: { provider: 'google', callbackURL: '/account' },
    });
    const url = new URL((await response.json()).url);
    expect(url.host).toBe('accounts.google.com');
    expect(url.searchParams.get('redirect_uri')).toBe(
      `${baseURL}/api/auth/callback/google`,
    );
  });

  test('unlink Google', async ({ page, request }) => {
    await signIn(page, request, uniqueEmail('unlink'));
    const userId = await currentUserId(page);
    seedGoogleAccount(userId);
    await page.reload();

    const google = page.getByTestId('provider-google');
    await expect(google.getByText('Linked')).toBeVisible();
    await google.getByRole('button', { name: 'Unlink Google' }).click();
    await expect(
      google.getByRole('button', { name: 'Link Google' }),
    ).toBeVisible();
    expect(googleAccountCount(userId)).toBe(0);
  });

  test('unlink with an old session asks for a new code first', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('unlink-stale');
    await signIn(page, request, email);
    const userId = await currentUserId(page);
    seedGoogleAccount(userId);
    // Age the session past the 10-minute freshness limit
    const twentyMinutesAgo = new Date(
      Date.now() - 20 * 60 * 1000,
    ).toISOString();
    localD1(
      `update "session" set "createdAt" = '${twentyMinutesAgo}' where "userId" = '${userId}'`,
    );
    await page.reload();

    const google = page.getByTestId('provider-google');
    await google.getByRole('button', { name: 'Unlink Google' }).click();
    await expect(
      page.getByText('To unlink Google, confirm it’s you'),
    ).toBeVisible();
    await page.getByLabel('Code').fill(await latestCode(request, email));
    await expect(
      google.getByRole('button', { name: 'Link Google' }),
    ).toBeVisible();
    expect(googleAccountCount(userId)).toBe(0);
  });

  test('deleting the account removes its linked sign-ins', async ({
    page,
    request,
  }) => {
    await signIn(page, request, uniqueEmail('delete-linked'));
    const userId = await currentUserId(page);
    seedGoogleAccount(userId);

    await page.getByRole('button', { name: 'Delete account' }).click();
    await page.getByRole('button', { name: 'Yes, delete my account' }).click();
    await expect(page.getByText('Your account was deleted.')).toBeVisible();

    expect(
      localD1(
        `select (select count(*) from "account" where "userId" = '${userId}') as accounts, (select count(*) from "session" where "userId" = '${userId}') as sessions, (select count(*) from "user" where "id" = '${userId}') as users`,
      )[0],
    ).toEqual({ accounts: 0, sessions: 0, users: 0 });
  });
});
