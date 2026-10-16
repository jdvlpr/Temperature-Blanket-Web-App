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

// Whether to welcome the signed-in account: only in the session that made it,
// and asked of the server once per account in this browser.

import { getSession } from './client';

const KEY = 'welcome_checked';
/**
 * A new account's first session is made in the same request as the account,
 * moments later; signing in again elsewhere, even right away, takes longer
 */
const NEW_ACCOUNT_MS = 2 * 1000;

function checkedIds(): string[] {
  try {
    const ids = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

/** True once, for an account made in the session this browser has. */
export async function isNewAccount(userId: string): Promise<boolean> {
  if (checkedIds().includes(userId)) return false;
  // Offline: ask again on the next page load
  const session = await getSession().catch(() => undefined);
  if (session === undefined) return false;
  try {
    localStorage.setItem(KEY, JSON.stringify([...checkedIds(), userId]));
  } catch {
    // Private browsing can't remember: don't risk asking every time
    return false;
  }
  if (!session || session.user.id !== userId) return false;
  const made = Date.parse(session.user.createdAt);
  const signedIn = Date.parse(session.session.createdAt);
  return signedIn - made < NEW_ACCOUNT_MS;
}
