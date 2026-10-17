// Copyright (c) 2026, Thomas (https://github.com/jdvlpr)
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

// Open a Copy of a gallery page: its address on this site, opening a copy of
// it in the planner or on the Yarn page, named, as its page's button does.
// From a gallery card's ⋮ menu and the Project and Palette menus' Open.

import type { Color } from '#lib/types/yarn-types.js';
import { getYarnPageURL } from '#lib/utils/color-utils.js';
import { fromGalleryLink } from '#lib/utils/gallery-request.js';
import { withProjectName } from '#lib/utils/project-name-link.js';

/** A project page's copy, with its name and the weather its page kept; null
 * when its link can't be read */
export function projectCopyHref(
  url: string,
  name: string | null | undefined,
  postId: number,
) {
  try {
    // On this site, wherever the gallery saved it from (as its page does)
    const copy = new URL(
      fromGalleryLink(withProjectName(url, name?.trim() ?? ''), postId),
    );
    return `${copy.pathname}${copy.search}${copy.hash}`;
  } catch {
    return null;
  }
}

/** A palette page's colors on the Yarn page, named */
export const paletteCopyHref = (colors: Color[], name: string) =>
  `${getYarnPageURL({ colors, origin: '' })}&name=${encodeURIComponent(name)}`;
