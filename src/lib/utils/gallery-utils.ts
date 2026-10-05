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

import { browser, dev } from '$app/environment';
import { PUBLIC_WORDPRESS_BASE_URL } from '$env/static/public';

export type GalleryPageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

/**
 * Sends a query to the gallery's GraphQL. A gallery plugin before 1.6.0 has no
 * `projectName`, and rejects any query asking for it: the query is then sent
 * again without it, so the gallery works whichever plugin is live.
 */
export async function queryGallery(
  query: string,
  variables?: Record<string, unknown>,
): Promise<{ response: Response; result: any }> {
  const send = async (text: string) => {
    const response = await fetch(`${PUBLIC_WORDPRESS_BASE_URL}/graphql`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: text, variables }),
    });
    return { response, result: await response.json().catch(() => null) };
  };
  const first = await send(query);
  const missingName = first.result?.errors?.some((e: { message?: string }) =>
    e.message?.includes('projectName'),
  );
  return missingName ? send(query.replace(/\bprojectName\b/g, '')) : first;
}

export type GalleryProjectNode = {
  title: string;
  /** The name the project was given, if any (gallery plugin 1.6.0) */
  projectName?: string | null;
  databaseId: number;
  projectUrl: string;
  yarnUrls: string;
  locations: string;
  featuredImage: {
    node: {
      mediaItemUrl: string;
      mediaDetails: {
        sizes: { sourceUrl: string }[];
      };
    };
  } | null;
  date: string;
};

export type FetchProjectsResult = {
  pageInfo: GalleryPageInfo;
  edges: { node: GalleryProjectNode }[];
};

/** A palette shared to the gallery on its own, from an account (plugin 1.5.0). */
export type GallerySharedPaletteNode = {
  __typename: 'Palette';
  title: string;
  databaseId: number;
  /** A JSON array holding the palette's Yarn Palette Creator link */
  yarnUrls: string;
  date: string;
};

export type PaletteGalleryNode =
  | (Omit<GalleryProjectNode, 'featuredImage'> & { __typename: 'Project' })
  | GallerySharedPaletteNode;

export type FetchPaletteGalleryResult = {
  pageInfo: GalleryPageInfo;
  edges: { node: PaletteGalleryNode }[];
};

/**
 * Projects and shared palettes for the palette galleries, in one list ordered by
 * date, so one cursor pages through both. Search and the yarn filter cover both.
 * Falls back to projects alone where the gallery has no palettes yet.
 */
export const fetchPaletteGallery = async ({
  first = 40,
  after = null,
  search = '',
  order = 'DESC',
  yarn = '',
}: {
  first?: number;
  after?: string | null;
  search?: string;
  order?: string;
  yarn?: string;
}): Promise<FetchPaletteGalleryResult> => {
  const query = `
    query PALETTE_GALLERY($first: Int, $after: String, $search: String, $yarn: String, $order: OrderEnum!) {
      contentNodes(
        first: $first
        after: $after
        where: {
          contentTypes: [TEMPBLANKET_PROJECT, TEMPBLANKET_PALETTE]
          search: $search
          yarnUrls: $yarn
          orderby: { field: DATE, order: $order }
        }
      ) {
        pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
        edges {
          node {
            __typename
            ... on Project { title projectName databaseId projectUrl yarnUrls locations date }
            ... on Palette { title databaseId yarnUrls date }
          }
        }
      }
    }`;
  const { result } = await queryGallery(query, {
    first,
    after,
    // Unset rather than empty, so the plugin's yarn filter isn't applied
    search: search || null,
    yarn: yarn || null,
    order: order === 'ASC' ? 'ASC' : 'DESC',
  });
  if (result?.data?.contentNodes) return result.data.contentNodes;

  // A gallery without palettes (plugin before 1.5.0) rejects the query: show
  // palettes from projects only, as before
  const projects = await fetchProjects({ first, after, search, order, yarn });
  return {
    pageInfo: projects.pageInfo,
    edges: projects.edges.map(({ node }) => ({
      node: { ...node, __typename: 'Project' as const },
    })),
  };
};

export type PopularProjectMeta = {
  project_url: string;
  yarn_urls: string;
  locations: string;
  /** The name the project was given (gallery plugin 1.6.0) */
  project_name?: string;
};

/** A project, or since gallery plugin 1.6.0 a palette shared on its own (`type`) */
export type PopularProject = {
  id: number;
  type?: string;
  /** WordPress's rendered title, HTML-encoded */
  title: string | { rendered: string };
  date: string;
  featured_media: number;
  featured_image_src: string;
  meta: PopularProjectMeta;
};

export const fetchProjects = async ({
  first = 40,
  last = null, // TODO: is this being used by anything? I don't think so.
  after = null,
  before = null, // TODO: is this being used by anything? I don't think so.
  search = '',
  order = 'DESC',
  yarn = '',
  pattern = '',
}: {
  first?: number;
  last?: string | null;
  after?: string | null;
  before?: string | null;
  search?: string;
  order?: string;
  yarn?: string;
  pattern?: string;
}): Promise<FetchProjectsResult> => {
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
                      projectName
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

  const { result } = await queryGallery(query);
  return result.data.projects;
};

export const recordPageView = async (id: string | number) => {
  if (dev || !browser) return;
  await fetch(
    `${PUBLIC_WORDPRESS_BASE_URL}/wp-json/wordpress-popular-posts/v2/views/${id}`,
    {
      method: 'POST',
    },
  );
};

/** Popular gallery posts. Palette galleries ask for shared palettes too. */
export const fetchPopularProjects = async ({
  months = 3,
  limit = 40,
  timeUnit = 'month',
  palettes = false,
}: {
  months?: number;
  limit?: number;
  timeUnit?: string;
  /** Include palettes shared on their own; a gallery plugin before 1.6.0 leaves them out */
  palettes?: boolean;
}): Promise<PopularProject[]> => {
  if (months == 0.25) {
    // 0.25 months means 1 week
    timeUnit = 'week';
    months = 1;
  } else if (months == 0.0357) {
    // 0.0357 months means 1 day
    timeUnit = 'day';
    months = 1;
  }
  const postTypes = palettes
    ? 'tempblanket_project,tempblanket_palette'
    : 'tempblanket_project';
  const url = `${PUBLIC_WORDPRESS_BASE_URL}/wp-json/wordpress-popular-posts/v1/popular-posts/?post_type=${postTypes}&limit=${limit}&range=custom&time_unit=${timeUnit}&time_quantity=${months}&_fields=id,type,title,date,featured_media,featured_image_src,meta`;

  const response = await fetch(url);
  const popularProjects = await response.json();
  return popularProjects;
};

/**
 * Popular posts in the shape the palette galleries read (see
 * getPalettesFromProjects): projects, and palettes shared on their own.
 */
export const popularToGalleryNodes = (popular: PopularProject[]) =>
  popular.map((post) =>
    post.type === 'tempblanket_palette'
      ? {
          __typename: 'Palette' as const,
          databaseId: post.id,
          title:
            typeof post.title === 'string' ? post.title : post.title.rendered,
          yarnUrls: post.meta.yarn_urls,
        }
      : {
          __typename: 'Project' as const,
          databaseId: post.id,
          projectUrl: post.meta.project_url,
          projectName: post.meta.project_name,
          yarnUrls: post.meta.yarn_urls,
          locations: post.meta.locations,
        },
  );
