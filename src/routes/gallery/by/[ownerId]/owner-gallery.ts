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

// An owner's gallery pages, read from the gallery: titles and images, leaving
// out any page that's been removed there. Shared by the owner's Projects and
// Yarn Palettes pages.

import {
  queryGallery,
  type GalleryProjectNode,
  type GallerySharedPaletteNode,
} from '#lib/utils/gallery-utils.js';

// More than any owner is likely to publish; the gallery answers 100 at most
export const MAX_PAGES = 100;

export type OwnerProject = Pick<
  GalleryProjectNode,
  'databaseId' | 'locations' | 'featuredImage' | 'projectName'
>;

export type OwnerPalette = Pick<
  GallerySharedPaletteNode,
  'databaseId' | 'title' | 'yarnUrls'
>;

/** The gallery's published projects among these IDs, newest first; null if it can't be reached. */
export async function fetchProjects(
  ids: number[],
): Promise<OwnerProject[] | null> {
  try {
    const { response, result } = await queryGallery(
      `query OWNER_PROJECTS($ids: [ID]) {
          projects(first: ${MAX_PAGES}, where: { in: $ids, orderby: { field: DATE, order: DESC } }) {
            nodes {
              databaseId
              projectName
              locations
              featuredImage {
                node {
                  mediaItemUrl
                  mediaDetails { sizes(include: MEDIUM) { sourceUrl } }
                }
              }
            }
          }
        }`,
      { ids },
    );
    return response.ok && Array.isArray(result?.data?.projects?.nodes)
      ? result.data.projects.nodes
      : null;
  } catch (e) {
    console.error('Could not load owner gallery pages', e);
    return null;
  }
}

/** The gallery's shared palettes among these IDs, newest first; null if it can't be reached. */
export async function fetchPalettes(
  ids: number[],
): Promise<OwnerPalette[] | null> {
  try {
    const { response, result } = await queryGallery(
      `query OWNER_PALETTES($ids: [ID]) {
          palettes(first: ${MAX_PAGES}, where: { in: $ids, orderby: { field: DATE, order: DESC } }) {
            nodes { databaseId title yarnUrls }
          }
        }`,
      { ids },
    );
    return response.ok && Array.isArray(result?.data?.palettes?.nodes)
      ? result.data.palettes.nodes
      : null;
  } catch (e) {
    console.error('Could not load owner palettes', e);
    return null;
  }
}
