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

import type { D1Database } from '@cloudflare/workers-types';

export const CODE_REQUESTS_PER_EMAIL = 5;
export const CODE_REQUEST_WINDOW_MS = 60 * 60 * 1000;

async function emailKey(email: string): Promise<string> {
  const bytes = new TextEncoder().encode(email.trim().toLowerCase());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}

/**
 * Counts a code request for this email address and returns whether it's
 * allowed: at most CODE_REQUESTS_PER_EMAIL per hour, from any number of IPs.
 * One statement, so concurrent requests can't both slip under the limit.
 */
export async function allowCodeRequest(
  db: D1Database,
  email: string,
  now = Date.now(),
): Promise<boolean> {
  const row = await db
    .prepare(
      `insert into "codeRequestLimit" ("key", "windowStart", "count") values (?1, ?2, 1)
       on conflict ("key") do update set
         "count" = case when "windowStart" <= ?2 - ?3 then 1 else "count" + 1 end,
         "windowStart" = case when "windowStart" <= ?2 - ?3 then ?2 else "windowStart" end
       returning "count"`,
    )
    .bind(await emailKey(email), now, CODE_REQUEST_WINDOW_MS)
    .first<{ count: number }>();
  return (row?.count ?? 0) <= CODE_REQUESTS_PER_EMAIL;
}
