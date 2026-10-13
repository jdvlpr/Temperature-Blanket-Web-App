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

// Which gallery posts hold a palette's colors, among those found by its link
// (see gallery-link-utils): the gallery's search matches part of a link.

import { getColorsFromInput, sameColorList } from '#lib/utils/color-utils.js';
import { yarnLinksOf } from '#lib/utils/gallery-link-utils.js';
import type { Color } from '#lib/types/yarn-types.js';

/** A gallery post found by its link, and whether it has the colors asked for */
export type LinkedGalleryPost = {
  databaseId: number;
  title?: string;
  date?: string;
  yarnUrls: string;
  /** The project a palette page came from (gallery plugin 1.7.0) */
  sourceProjectId?: number | null;
};

/**
 * The posts holding these colors among those the search found: the search
 * matches part of a link, so each is checked by its colors. A palette page
 * from `sourceProjectId` comes first, then the oldest.
 */
export function postsWithColors<T extends LinkedGalleryPost>(
  colors: Color[],
  posts: T[],
  sourceProjectId?: number,
): T[] {
  if (!colors.length) return [];
  return posts
    .filter((post) =>
      yarnLinksOf(post.yarnUrls).some((link) => {
        const linkColors = getColorsFromInput({ string: link });
        return !!linkColors && sameColorList(linkColors, colors);
      }),
    )
    .sort(
      (a, b) =>
        Number(b.sourceProjectId === sourceProjectId && !!sourceProjectId) -
          Number(a.sourceProjectId === sourceProjectId && !!sourceProjectId) ||
        (a.date ?? '').localeCompare(b.date ?? '') ||
        a.databaseId - b.databaseId,
    );
}
