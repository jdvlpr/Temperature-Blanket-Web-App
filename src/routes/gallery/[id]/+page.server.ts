// Copyright (c) 2024, Thomas (https://github.com/jdvlpr)
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
import { recordPageView } from '$lib/utils';
import type { PageServerLoad } from './$types';

export const prerender = true;

export const load: PageServerLoad = async (event) => {
  return { stream: getProject(event) };
};

async function getProject(event) {
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
