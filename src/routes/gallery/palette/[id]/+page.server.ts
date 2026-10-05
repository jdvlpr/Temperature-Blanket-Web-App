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

// A palette shared to the gallery on its own (gallery plugin 1.5.0+). Its
// owner's name shows only when they included it on their public gallery, read
// from D1 now, so a rename shows straight away.

import type { GalleryOwner } from '$lib/server/gallery/store';
import {
  queryGallery,
  type GallerySharedPaletteNode,
} from '$lib/utils/gallery-utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const prerender = false;

export type GalleryPalettePage = Pick<
  GallerySharedPaletteNode,
  'databaseId' | 'title' | 'yarnUrls' | 'date'
>;

export const load: PageServerLoad = async (event) => {
  const id = Number(event.params.id);
  if (!Number.isSafeInteger(id) || id < 1) error(404, 'Not found');

  const [palette, owner] = await Promise.all([
    getPalette(id),
    getOwner(event, id),
  ]);
  if (palette === undefined)
    error(503, 'The gallery couldn’t be reached. Try again later.');
  if (!palette) error(404, 'Not found');
  return { palette, owner };
};

/** The published palette, null when there's none, undefined when the gallery can't be reached. */
async function getPalette(
  id: number,
): Promise<GalleryPalettePage | null | undefined> {
  try {
    const { response, result } = await queryGallery(
      `query GALLERY_PALETTE($id: ID!) {
        palette(id: $id, idType: DATABASE_ID) { databaseId title yarnUrls date }
      }`,
      { id },
    );
    if (!response.ok) return undefined;
    // A gallery without palettes (before 1.5.0) has no such type: none here
    return result?.data?.palette ?? null;
  } catch (e) {
    console.error('Could not load gallery palette', e);
    return undefined;
  }
}

async function getOwner(
  event: Parameters<PageServerLoad>[0],
  id: number,
): Promise<GalleryOwner | null> {
  const env = event.platform?.env;
  if (env?.ACCOUNTS_ENABLED !== 'true' || !env.DB) return null;
  try {
    const { ownerForPost } = await import('$lib/server/gallery/store');
    return await ownerForPost(env.DB, id);
  } catch (e) {
    console.error('Could not look up gallery palette owner', e);
    return null;
  }
}
