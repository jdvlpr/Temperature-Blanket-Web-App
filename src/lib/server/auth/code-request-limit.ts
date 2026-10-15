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
export const CODE_REQUESTS_PER_IP = 10;
export const CODE_REQUEST_WINDOW_MS = 60 * 60 * 1000;
// Under Resend's free plan: 100 a day, and 95 × 31 days stays under 3,000 a month
export const EMAILS_PER_DAY = 95;
const DAY_MS = 24 * 60 * 60 * 1000;

async function sha256(text: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(text),
  );
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, '0'),
  ).join('');
}

/**
 * Counts one request against this key and returns the count so far in the
 * current window. One statement, so concurrent requests can't both slip under
 * a limit.
 */
async function countRequest(
  db: D1Database,
  key: string,
  windowMs: number,
  now: number,
): Promise<number> {
  const row = await db
    .prepare(
      `insert into "codeRequestLimit" ("key", "windowStart", "count") values (?1, ?2, 1)
       on conflict ("key") do update set
         "count" = case when "windowStart" <= ?2 - ?3 then 1 else "count" + 1 end,
         "windowStart" = case when "windowStart" <= ?2 - ?3 then ?2 else "windowStart" end
       returning "count"`,
    )
    .bind(key, now, windowMs)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

/**
 * A limit from an optional var: the fallback when it's unset or not a whole
 * number (logged, so a typo shows up).
 */
export function readLimit(
  value: string | undefined,
  fallback: number,
  name: string,
): number {
  const text = value?.trim();
  if (!text) return fallback;
  const limit = Number(text);
  if (Number.isInteger(limit) && limit >= 0) return limit;
  console.error(`${name} must be a whole number; using ${fallback}`);
  return fallback;
}

/**
 * Counts a code request for this email address and returns whether it's
 * allowed: at most CODE_REQUESTS_PER_EMAIL per hour, from any number of IPs.
 */
export async function allowCodeRequest(
  db: D1Database,
  email: string,
  now = Date.now(),
): Promise<boolean> {
  const key = await sha256(email.trim().toLowerCase());
  return (
    (await countRequest(db, key, CODE_REQUEST_WINDOW_MS, now)) <=
    CODE_REQUESTS_PER_EMAIL
  );
}

/**
 * Counts a code request from this IP address and returns whether it's
 * allowed: at most `limit` an hour, for any number of email addresses.
 */
export async function allowIpCodeRequest(
  db: D1Database,
  ip: string,
  limit: number,
  now = Date.now(),
): Promise<boolean> {
  const key = `ip:${await sha256(ip)}`;
  return (await countRequest(db, key, CODE_REQUEST_WINDOW_MS, now)) <= limit;
}

const emailDayKey = (now: number) =>
  `email-day:${new Date(now).toISOString().slice(0, 10)}`;

/** Whether any of today's (UTC) emails are left, without counting one. */
export async function emailsLeftToday(
  db: D1Database,
  limit: number,
  now = Date.now(),
): Promise<boolean> {
  const row = await db
    .prepare('select "count" from "codeRequestLimit" where "key" = ?')
    .bind(emailDayKey(now))
    .first<{ count: number }>();
  return (row?.count ?? 0) < limit;
}

/** Counts an email about to be sent and returns whether today's limit allows it. */
export async function countEmailSent(
  db: D1Database,
  limit: number,
  now = Date.now(),
): Promise<boolean> {
  return (await countRequest(db, emailDayKey(now), DAY_MS, now)) <= limit;
}
