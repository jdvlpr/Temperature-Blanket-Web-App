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

import { expect, test, type APIRequestContext } from '@playwright/test';

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

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({ 'CF-Connecting-IP': randomTestIp() });
});

const uniqueEmail = (label: string) =>
  `${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;

test.describe('Accounts: sign in with an emailed code', () => {
  test('sign in, see the account, sign out', async ({ page, request }) => {
    const email = uniqueEmail('sign-in');

    await page.goto('/auth/sign-in');
    await page.getByLabel('Email').fill(email);
    await page.getByRole('button', { name: 'Email me a code' }).click();
    await expect(page.getByText(`We sent a code to ${email}`)).toBeVisible();

    await page.getByLabel('Code').fill(await latestCode(request, email));
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();

    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByTestId('account-email')).toHaveText(email);

    // The session survives a reload
    await page.reload();
    await expect(page.getByTestId('account-email')).toHaveText(email);

    await page.getByRole('button', { name: 'Sign out' }).click();
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
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    // Scoped to the page: the analytics consent toast is also an alert
    await expect(page.getByRole('main').getByRole('alert')).toHaveText(
      'That code isn’t right, or it has expired.',
    );
    await expect(page).toHaveURL(/\/auth\/sign-in$/);
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
});
