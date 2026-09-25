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

// The signed-in person's name, email and picture, kept in Local Storage so the
// navigation can show them without asking the server on every page. The server
// session stays the source of truth: this is cleared whenever it ends.

import { hasSignedInHint, type AccountUser } from './client';

export type AccountSummary = Pick<AccountUser, 'name' | 'email' | 'image'>;

const STORAGE_KEY = 'tb_account';

export const account: { summary: AccountSummary | null } = $state({
  summary: null,
});

/** Loads the saved summary, if this browser may still be signed in. */
export function loadAccountSummary() {
  if (!hasSignedInHint()) {
    forgetAccountSummary();
    return;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    account.summary = saved ? JSON.parse(saved) : null;
  } catch {
    account.summary = null;
  }
}

export function rememberAccountSummary({ name, email, image }: AccountSummary) {
  account.summary = { name, email, image };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(account.summary));
  } catch {
    // Private browsing: the navigation just shows the generic icon
  }
}

export function forgetAccountSummary() {
  account.summary = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing saved
  }
}

/** Up to two initials, from the display name or else the email. */
export function initialsFor({
  name,
  email,
}: Pick<AccountSummary, 'name' | 'email'>) {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2)
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (email[0] ?? '?').toUpperCase();
}
