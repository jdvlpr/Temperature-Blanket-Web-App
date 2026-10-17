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

// My Library's Mine | Starred: which one a page shows is in its address
// (`?show=starred`), so it can be linked to and Back returns to it. The
// pages are prerendered (as Mine), so it's read in the browser only.

import { browser } from '$app/env';

const PARAM = 'show';
const STARRED = 'starred';

/** Whether this My Library address shows Starred */
export const showsStarred = (url: {
  searchParams: { get(name: string): string | null };
}) =>
  __ACCOUNTS_ENABLED__ && browser && url.searchParams.get(PARAM) === STARRED;

/** A My Library page's address showing Mine, or Starred */
export const withScope = (path: string, starred: boolean) =>
  starred ? `${path}?${PARAM}=${STARRED}` : path;
