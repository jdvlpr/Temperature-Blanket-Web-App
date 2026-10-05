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

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Deletes expired sessions and codes and stale rate-limit rows. Cloudflare Pages
 * has no scheduled jobs, so this runs in the background after each sign-in.
 * Better Auth stores dates as ISO strings and rate-limit times as milliseconds.
 */
export async function cleanUpExpired(db: D1Database, now = Date.now()) {
  const nowIso = new Date(now).toISOString();
  await db.batch([
    db.prepare('delete from "session" where "expiresAt" < ?').bind(nowIso),
    db.prepare('delete from "verification" where "expiresAt" < ?').bind(nowIso),
    db
      .prepare('delete from "rateLimit" where "lastRequest" < ?')
      .bind(now - DAY_MS),
    db
      .prepare('delete from "codeRequestLimit" where "windowStart" < ?')
      .bind(now - DAY_MS),
  ]);
}
