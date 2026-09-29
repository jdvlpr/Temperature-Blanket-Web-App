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

import { PUBLIC_WORDPRESS_BASE_URL } from '$env/static/public';
import { recordPageView } from '$lib/utils/gallery-utils';
import type { GalleryOwner } from '$lib/server/gallery/store';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  const [{ project }, owner] = await Promise.all([
    getProject(event),
    getOwner(event),
  ]);
  return { project, owner };
};

/** The account that published this page, if its owner chose to show their name. */
async function getOwner(
  event: Parameters<PageServerLoad>[0],
): Promise<GalleryOwner | null> {
  const env = event.platform?.env;
  const id = Number(event.params.id);
  if (env?.ACCOUNTS_ENABLED !== 'true' || !env.DB || !Number.isSafeInteger(id))
    return null;
  try {
    const { ownerForPost } = await import('$lib/server/gallery/store');
    return await ownerForPost(env.DB, id);
  } catch (e) {
    // Before migration 0004, or D1 unavailable: the page renders without a name
    console.error('Could not look up gallery page owner', e);
    return null;
  }
}

async function getProject(event: Parameters<PageServerLoad>[0]) {
  const id = +event.params.id;

  const response = await fetch(`${PUBLIC_WORDPRESS_BASE_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
            query GET_PROJECT_BY_ID {
                project(id: ${id}, idType: DATABASE_ID) {
                    title
                    date
                    projectUrl
                    totalDays
                    weatherSources
                    missingDays
                    locations
                    featuredImage {
                        node {
                            mediaItemUrl
                        }
                    }
                    projectTags {
                      nodes {
                        description
                        name
                        
                      }
                    }
                }
            }`,
    }),
  });

  const project = await response.json();

  if (!response.ok || !project?.data?.project) {
    return { project: null };
  }

  await recordPageView(id);

  // Modify the project url origin to match the event url's origin
  // For example https://temperature-blanket.com gets changed to http://localhost:5173 in dev
  const projectURL = new URL(project?.data?.project?.projectUrl);
  const newUrl = `${event.url.origin}${projectURL.pathname}${projectURL.search}${projectURL.hash}`;
  project.data.project.projectUrl = newUrl;

  return { project: project?.data?.project };
}
