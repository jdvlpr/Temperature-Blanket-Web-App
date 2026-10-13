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
// from D1 now, so a rename shows straight away. A palette brought across from a
// project (plugin 1.7.0) links back to it while it's published.

import type { GalleryOwner } from '#lib/server/gallery/store.js';
import {
  queryGallery,
  type GallerySharedPaletteNode,
} from '#lib/utils/gallery-utils.js';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getPlatform } from '#lib/server/cloudflare.js';

export const prerender = false;

export type GalleryPalettePage = Pick<
  GallerySharedPaletteNode,
  'databaseId' | 'title' | 'yarnUrls' | 'date'
> & {
  /** The project it came from (gallery plugin 1.7.0), which may be gone since */
  sourceProjectId?: number | null;
};

/** The published project a palette came from, for "From the project" */
export type GalleryPaletteSource = {
  databaseId: number;
  projectName?: string | null;
  locations: string;
};

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
  const sourceProject = palette.sourceProjectId
    ? await getSourceProject(palette.sourceProjectId)
    : null;
  return { palette, owner, sourceProject };
};

/** The published palette, null when there's none, undefined when the gallery can't be reached. */
async function getPalette(
  id: number,
): Promise<GalleryPalettePage | null | undefined> {
  try {
    const query = (fields: string) =>
      queryGallery(
        `query GALLERY_PALETTE($id: ID!) {
          palette(id: $id, idType: DATABASE_ID) { databaseId title yarnUrls date ${fields} }
        }`,
        { id },
      );
    let { response, result } = await query('sourceProjectId');
    // A gallery before 1.7.0 answers the unknown field with an error (and no
    // palette): ask again without it
    if (
      result?.errors?.some((e: { message?: string }) =>
        e.message?.includes('sourceProjectId'),
      )
    )
      ({ response, result } = await query(''));
    if (!response.ok) return undefined;
    // A gallery without palettes (before 1.5.0) has no such type: none here
    return result?.data?.palette ?? null;
  } catch (e) {
    console.error('Could not load gallery palette', e);
    return undefined;
  }
}

/** The project, when it's published; null otherwise, or when the gallery can't say. */
async function getSourceProject(
  id: number,
): Promise<GalleryPaletteSource | null> {
  try {
    const { response, result } = await queryGallery(
      `query GALLERY_PALETTE_SOURCE($id: ID!) {
        project(id: $id, idType: DATABASE_ID) { databaseId projectName locations }
      }`,
      { id },
    );
    return (response.ok && result?.data?.project) || null;
  } catch (e) {
    console.error('Could not load gallery palette source project', e);
    return null;
  }
}

async function getOwner(
  event: Parameters<PageServerLoad>[0],
  id: number,
): Promise<GalleryOwner | null> {
  const env = getPlatform()?.env;
  if (env?.ACCOUNTS_ENABLED !== 'true' || !env.DB) return null;
  try {
    const { ownerForPost } = await import('#lib/server/gallery/store.js');
    return await ownerForPost(env.DB, id);
  } catch (e) {
    console.error('Could not look up gallery palette owner', e);
    return null;
  }
}
