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

// A project's name in the links people share (Copy Link, a gallery page's
// "Open in…"), so whoever opens one sees it too. Only there: the project's own
// address (project.url) and every link stored from it stay without it, as
// small as they can be. One short key, `m`, at the end of the hash, only when
// there's a name other than the location title. Spaces are `+`; hash readers
// that don't know `m` skip it.

import { cleanName } from '#lib/utils/clean-name.js';

export const NAME_HASH_KEY = 'm';
/** The longest name a link carries, and the longest one that can be typed */
export const MAX_LINK_NAME_LENGTH = 60;

/** The link with the project's name added, or as it is without one. */
export function withProjectName(
  href: string,
  name: string | null | undefined,
  title?: string,
): string {
  const cleaned = cleanName(name, MAX_LINK_NAME_LENGTH);
  if (!cleaned || cleaned === title?.trim() || !href.includes('#')) return href;
  const value = encodeURIComponent(cleaned).replace(/%20/g, '+');
  return `${href}&${NAME_HASH_KEY}=${value}`;
}

/** The name a link's hash carries, or '' without one. */
export function projectNameFromHash(hash: string): string {
  const item = hash
    .replace(/^#/, '')
    .split('&')
    .find((part) => part.startsWith(`${NAME_HASH_KEY}=`));
  if (!item) return '';
  try {
    const value = item.slice(NAME_HASH_KEY.length + 1).replace(/\+/g, ' ');
    return cleanName(decodeURIComponent(value), MAX_LINK_NAME_LENGTH);
  } catch {
    return '';
  }
}
