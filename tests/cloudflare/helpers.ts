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

// Shared by the wrangler e2e specs (pnpm test:e2e:cloudflare).

import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';

/** Polls the dev outbox for the newest code sent to an address. */
export async function latestCode(
  request: APIRequestContext,
  email: string,
  /** A code already used, to wait for the next one instead */
  except?: string,
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
        return code !== except && code;
      },
      // Sent in the background, which is slower while many tests run
      { message: `a code emailed to ${email}`, timeout: 15_000 },
    )
    .toBeTruthy();
  return code!;
}

// Rate limits are per client IP, and every local request comes from the same one.
// Locally, wrangler passes a client-sent CF-Connecting-IP through (Cloudflare's edge
// overwrites it in production), so each test gets its own address and limit.
export const randomTestIp = () =>
  `10.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${1 + Math.floor(Math.random() * 254)}`;

export const uniqueEmail = (label: string) =>
  `${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;

/** Signs in through the sign-in page and waits for the account page. */
export async function signIn(
  page: Page,
  request: APIRequestContext,
  email: string,
) {
  await page.goto('/auth/sign-in');
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Email me a code' }).click();
  await expect(page.getByText(`We sent a code to ${email}`)).toBeVisible();
  // The code field submits itself on the sixth digit
  await page.getByLabel('Code').fill(await latestCode(request, email));
  await expect(page.getByTestId('account-email')).toHaveText(email);
}

/**
 * Runs SQL against the local D1 database that wrangler pages dev uses. Retried:
 * the database file can be briefly busy while the dev server writes to it.
 */
export function localD1(sql: string): Record<string, unknown>[] {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const output = execFileSync(
        'pnpm',
        [
          'exec',
          'wrangler',
          'd1',
          'execute',
          'DB',
          '--local',
          '--json',
          '--command',
          sql,
        ],
        { stdio: 'pipe' },
      ).toString();
      return JSON.parse(output)[0].results;
    } catch (e) {
      lastError = e;
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
    }
  }
  throw new Error(
    `localD1 failed: ${String((lastError as { stderr?: Buffer })?.stderr ?? lastError)}`,
  );
}
