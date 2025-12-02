import { getRequestEvent, prerender } from '$app/server';
import { PUBLIC_WORDPRESS_BASE_URL } from '$env/static/public';
import { recordPageView } from '$lib/utils';
import * as v from 'valibot';

export const getProject = prerender(v.number(), async (id: number) => {
  const event = getRequestEvent();

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
                            mediaDetails {
                                width
                                height
                            }
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
    return null;
  }

  await recordPageView(id);

  // Modify the project url origin to match the event url's origin
  // For example https://temperature-blanket.com gets changed to http://localhost:5173 in dev
  if (event) {
    const projectURL = new URL(project?.data?.project?.projectUrl);
    const newUrl = `${event.url.origin}${projectURL.pathname}${projectURL.search}${projectURL.hash}`;
    project.data.project.projectUrl = newUrl;
  }

  return project?.data?.project;
});
