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

// Palettes shared to the gallery on their own (gallery plugin 1.5.0+): a name
// and one Yarn Palette Creator link.

import { getColorsFromInput } from '$lib/utils/color-utils';
import { decodeHtmlEntities } from '$lib/utils/string-utils';

/**
 * A shared palette's colors, and its Yarn Palette Creator link on this site
 * (path and query only, so it opens here whichever origin it was shared from).
 * Null when the link can't be read. Colorway names need the yarn data loaded.
 */
export function sharedPaletteFrom(yarnUrls: string) {
  try {
    const url = new URL((JSON.parse(yarnUrls) as string[])[0]);
    const colors = getColorsFromInput({ string: url.href });
    return colors && colors.length
      ? { colors, href: `${url.pathname}${url.search}` }
      : null;
  } catch {
    return null;
  }
}

/** A gallery title as WordPress renders it (HTML-encoded), as plain text. */
export const galleryTitleText = (title: string | null | undefined) =>
  decodeHtmlEntities(title ?? '').trim();
