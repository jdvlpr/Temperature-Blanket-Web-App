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

// Starred in an address (`?show=starred`): from when My Library had a Mine |
// Starred switch, those links now open the Gallery with Starred on, and the
// Gallery takes it in and drops it. The pages are prerendered, so it's read
// in the browser only.

import { browser } from '$app/env';

const PARAM = 'show';
const STARRED = 'starred';

/** Whether this address asks for Starred */
export const showsStarred = (url: {
  searchParams: { get(name: string): string | null };
}) =>
  __ACCOUNTS_ENABLED__ && browser && url.searchParams.get(PARAM) === STARRED;

/** A Gallery page's address with Starred on */
export const withStarred = (path: string) => `${path}?${PARAM}=${STARRED}`;

/** This address without `?show=starred`, the rest kept */
export function withoutStarred(url: { href: string }) {
  const next = new URL(url.href);
  next.searchParams.delete(PARAM);
  return next.pathname + next.search + next.hash;
}
