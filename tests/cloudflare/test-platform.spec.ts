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

// Only meaningful under `wrangler pages dev` (pnpm test:e2e:cloudflare), which provides
// the local D1 and R2 bindings and the dev-only vars from wrangler.jsonc.

import { expect, test } from '@playwright/test';

test.describe('Cloudflare bindings (local)', () => {
  test('D1 and R2 are bound, and migrations reach the same database', async ({
    request,
  }) => {
    const response = await request.get('/api/dev/platform');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.d1).toBe(true);
    expect(body.r2).toBe(true);
    // Not null: the d1_migrations table created by `pnpm db:migrate:local` is visible
    expect(body.migrationsApplied).not.toBeNull();
  });

  test('the dev email outbox stores and returns messages', async ({
    request,
  }) => {
    const to = `outbox-${Date.now()}@example.test`;
    const sent = await request.post('/api/dev/outbox', {
      data: { to, subject: 'Your sign-in code', text: 'Code: 123456' },
    });
    expect(sent.status()).toBe(200);

    const outbox = await request.get(
      `/api/dev/outbox?to=${encodeURIComponent(to)}`,
    );
    expect(outbox.status()).toBe(200);
    const messages = await outbox.json();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toMatchObject({
      to,
      subject: 'Your sign-in code',
      text: 'Code: 123456',
    });
  });
});
