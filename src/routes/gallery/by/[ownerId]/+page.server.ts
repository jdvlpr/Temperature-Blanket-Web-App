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

// An owner's gallery pages, for owners who chose to show their name. The list
// comes from D1; titles and images from the gallery, which leaves out any page
// that's been removed there.

import { PUBLIC_WORDPRESS_BASE_URL } from '$env/static/public';
import type { GalleryProjectNode } from '$lib/utils/gallery-utils';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const prerender = false;

// More than any owner is likely to publish; the gallery answers 100 at most
const MAX_PAGES = 100;

export type OwnerProject = Pick<
  GalleryProjectNode,
  'databaseId' | 'locations' | 'featuredImage'
>;

export const load: PageServerLoad = async (event) => {
  const env = event.platform?.env;
  const { ownerPage, PUBLIC_ID_PATTERN } =
    await import('$lib/server/gallery/store');
  if (
    env?.ACCOUNTS_ENABLED !== 'true' ||
    !env.DB ||
    !PUBLIC_ID_PATTERN.test(event.params.ownerId)
  )
    error(404, 'Not found');

  const owner = await ownerPage(env.DB, event.params.ownerId);
  if (!owner) error(404, 'Not found');

  return {
    name: owner.name,
    projects: owner.postIds.length
      ? await fetchProjects(owner.postIds.slice(0, MAX_PAGES))
      : [],
  };
};

/** The gallery's published projects among these IDs, newest first; null if it can't be reached. */
async function fetchProjects(ids: number[]): Promise<OwnerProject[] | null> {
  try {
    const response = await fetch(`${PUBLIC_WORDPRESS_BASE_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `query OWNER_PROJECTS($ids: [ID]) {
          projects(first: ${MAX_PAGES}, where: { in: $ids, orderby: { field: DATE, order: DESC } }) {
            nodes {
              databaseId
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
        variables: { ids },
      }),
    });
    const result = await response.json();
    return response.ok && Array.isArray(result?.data?.projects?.nodes)
      ? result.data.projects.nodes
      : null;
  } catch (e) {
    console.error('Could not load owner gallery pages', e);
    return null;
  }
}
