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

import { browser, dev } from '$app/environment';
import { PUBLIC_WORDPRESS_BASE_URL } from '$env/static/public';

export const fetchProjects = async ({
  first = 40,
  last = null, // TODO: is this being used by anything? I don't think so.
  after = null,
  before = null, // TODO: is this being used by anything? I don't think so.
  search = '',
  order = 'DESC',
  yarn = '',
  pattern = '',
}) => {
  let variables = { first, last, after, before, search, order };
  if (pattern) variables.projectTag = `[${pattern}]`;
  if (yarn) variables.yarn = yarn;
  const url = `${PUBLIC_WORDPRESS_BASE_URL}/graphql`;
  const query = `
            query GET_PAGINATED_PROJECTS
              {
                projects(
                  first: ${first}
                  ${last ? `last: "${last}"` : ''}
                  ${after ? `after: "${after}"` : ''}
                  ${before ? `before: "${before}"` : ''}
                  where: {${
                    search
                      ? `search: "${search}", 
                    `
                      : ''
                  }${
                    yarn
                      ? `yarnUrls: "${yarn}", 
                      `
                      : ''
                  }${
                    pattern
                      ? `projectTag: "[${pattern}]", 
                        `
                      : ''
                  }
                        orderby: {field: DATE, order: ${order}}
                  }
                ) {
                  pageInfo {
                    hasNextPage
                    hasPreviousPage
                    startCursor
                    endCursor
                  }
                  edges {
                    node {
                      title
                      databaseId
                      projectUrl
                      yarnUrls
                      locations
                      featuredImage {
                        node {
                          mediaItemUrl
                          mediaDetails {
                            sizes(include: MEDIUM) {
                              sourceUrl
                            }
                          }
                        }
                      }
                      date
                    }
                  }
                }
              }`;

  const requestObj = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
    }),
  };

  // id,title,link,date,featured_media,featured_image_src,meta
  let response = await fetch(url, requestObj);

  const projects = await response.json();

  let data = projects.data.projects;
  return data;
};

export const recordPageView = async (id) => {
  if (dev || !browser) return;
  await fetch(
    `${PUBLIC_WORDPRESS_BASE_URL}/wp-json/wordpress-popular-posts/v2/views/${id}`,
    {
      method: 'POST',
    },
  );
};

export const fetchPopularProjects = async ({
  months = 3,
  limit = 40,
  timeUnit = 'month',
}) => {
  if (months == 0.25) {
    // 0.25 months means 1 week
    timeUnit = 'week';
    months = 1;
  } else if (months == 0.0357) {
    // 0.0357 months means 1 day
    timeUnit = 'day';
    months = 1;
  }
  const url = `${PUBLIC_WORDPRESS_BASE_URL}/wp-json/wordpress-popular-posts/v1/popular-posts/?post_type=tempblanket_project&limit=${limit}&range=custom&time_unit=${timeUnit}&time_quantity=${months}&_fields=id,title,date,featured_media,featured_image_src,meta`;

  const response = await fetch(url);
  const popularProjects = await response.json();
  return popularProjects;
};
