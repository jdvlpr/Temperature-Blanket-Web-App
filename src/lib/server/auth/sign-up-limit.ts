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

/**
 * The most accounts there may be, from ACCOUNTS_SIGNUP_LIMIT: null when it's
 * unset (no limit), 0 to close sign-ups. Anything else that isn't a whole
 * number closes sign-ups too, so a typo can't open them.
 */
export function readSignUpLimit(value: string | undefined): number | null {
  const text = value?.trim();
  if (!text) return null;
  const limit = Number(text);
  if (Number.isInteger(limit) && limit >= 0) return limit;
  console.error(
    'ACCOUNTS_SIGNUP_LIMIT must be a whole number; sign-ups are closed until it is',
  );
  return 0;
}

/** Whether a new account may be created. Accounts that exist keep working either way. */
export async function signUpsOpen(
  db: D1Database,
  limit: number | null,
): Promise<boolean> {
  if (limit === null) return true;
  if (limit === 0) return false;
  const row = await db
    .prepare('select count(*) as "count" from "user"')
    .first<{ count: number }>();
  return (row?.count ?? 0) < limit;
}

/** Whether an account uses this email (stored lowercase by Better Auth). */
export async function hasAccount(
  db: D1Database,
  email: string,
): Promise<boolean> {
  const row = await db
    .prepare('select 1 from "user" where "email" = ?')
    .bind(email.trim().toLowerCase())
    .first();
  return row !== null;
}
