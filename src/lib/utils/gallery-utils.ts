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
import { browser, dev } from '$app/env';

import { PUBLIC_WORDPRESS_BASE_URL } from '$app/env/public';
import { yarnLinkSearch } from '#lib/utils/gallery-link-utils.js';
import type { LinkedGalleryPost } from '#lib/utils/gallery-match-utils.js';

export type GalleryPageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

/** Fields an older gallery plugin doesn't have: `projectName` (1.6.0), `views` (1.11.0) */
const NEWER_FIELDS = ['projectName', 'views'];

/**
 * Sends a query to the gallery's GraphQL. An older gallery plugin rejects any
 * query asking for a field it doesn't have (`NEWER_FIELDS`): the query is then
 * sent again without those, so the gallery works whichever plugin is live.
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
  const missing = NEWER_FIELDS.filter((field) =>
    first.result?.errors?.some((e: { message?: string }) =>
      e.message?.includes(`Cannot query field "${field}"`),
    ),
  );
  if (!missing.length) return first;
  return send(
    missing.reduce(
      (text, field) => text.replace(new RegExp(`\\b${field}\\b`, 'g'), ''),
      query,
    ),
  );
}

export type GalleryProjectNode = {
  title: string;
  /** The name the project was given, if any (gallery plugin 1.6.0) */
  projectName?: string | null;
  databaseId: number;
  /** How many times its gallery page was viewed, all time (gallery plugin 1.11.0) */
  views?: number | null;
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
  /** Asked for Popular, but the gallery can't sort by it (a plugin before 1.8.0): Newest instead */
  popularUnavailable?: boolean;
};

/** A palette shared to the gallery on its own, from an account (plugin 1.5.0). */
export type GallerySharedPaletteNode = {
  __typename: 'Palette';
  title: string;
  databaseId: number;
  /** As for projects */
  views?: number | null;
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
  /** As for projects: Newest instead of Popular */
  popularUnavailable?: boolean;
};

/**
 * Palette posts for the palette galleries: palettes shared on their own, and
 * (gallery plugin 1.7.0) those brought across from projects by the one-time
 * import. Falls back to projects' palettes where the gallery has no palettes
 * yet (a plugin before 1.5.0).
 */
export const fetchPaletteGallery = async ({
  first = 40,
  after = null,
  search = '',
  order = 'DESC',
  yarn = '',
  days = POPULAR_DAYS,
}: {
  first?: number;
  after?: string | null;
  search?: string;
  order?: string;
  yarn?: string;
  days?: number;
}): Promise<FetchPaletteGalleryResult> => {
  if (order === 'POPULAR') {
    const popular = await fetchPopularIds({
      type: 'palette',
      days,
      search,
      yarn,
      offset: Number(after) || 0,
      limit: first,
    });
    if (popular) {
      const nodes = await fetchNodesByIds<PaletteGalleryNode>(
        PALETTES_BY_IDS,
        'contentNodes',
        popular.ids,
      );
      return { pageInfo: popularPageInfo(popular, after), edges: nodes };
    }
    // Newest from the start, never as a next page of Popular
    if (after) throw new Error('Popular sort unavailable');
    return {
      ...(await fetchPaletteGallery({ first, search, yarn, order: 'DESC' })),
      popularUnavailable: true,
    };
  }
  const query = `
    query PALETTE_GALLERY($first: Int, $after: String, $search: String, $yarn: String, $order: OrderEnum!) {
      contentNodes(
        first: $first
        after: $after
        where: {
          contentTypes: [TEMPBLANKET_PALETTE]
          search: $search
          yarnUrls: $yarn
          orderby: { field: DATE, order: $order }
        }
      ) {
        pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
        edges {
          node {
            __typename
            ... on Palette { title databaseId yarnUrls date views }
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

const PROJECT_NODE_FIELDS = `
  title
  projectName
  databaseId
  views
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
  date`;

/** How far back Popular counts views by default, in days */
export const POPULAR_DAYS = 30;

type PopularIds = { ids: number[]; total: number; hasMore: boolean };

/** Whether the gallery has answered that it can't sort by Popular */
let popularMissing = false;

/**
 * The IDs of the gallery's projects or palettes matching these filters, most
 * viewed in the last `days` first, then newest (gallery plugin 1.8.0). Null
 * when the gallery has no such route (an older plugin), so the caller shows
 * Newest instead; any other failure throws, like the other gallery queries.
 */
async function fetchPopularIds({
  type,
  days,
  search = '',
  yarn = '',
  pattern = '',
  include = [],
  offset = 0,
  limit = 40,
}: {
  type: 'project' | 'palette';
  days: number;
  search?: string;
  yarn?: string;
  pattern?: string;
  /** Only these posts (at most 100) */
  include?: number[];
  offset?: number;
  limit?: number;
}): Promise<PopularIds | null> {
  if (popularMissing) return null;
  const params = new URLSearchParams({
    type,
    days: String(days),
    offset: String(offset),
    limit: String(limit),
  });
  if (search) params.set('search', search);
  if (yarn) params.set('yarn', yarn);
  if (pattern) params.set('pattern', pattern);
  if (include.length) params.set('include', include.join(','));
  const response = await fetch(
    `${PUBLIC_WORDPRESS_BASE_URL}/wp-json/tbgalleryapi/v1/popular?${params}`,
  );
  const result = await response.json().catch(() => null);
  if (response.ok && Array.isArray(result?.ids)) return result;
  if (result?.code === 'rest_no_route') {
    // An older plugin: don't ask again this visit
    popularMissing = true;
    return null;
  }
  throw new Error(`Popular sort failed (${response.status})`);
}

/**
 * These posts' IDs, most viewed in the last `days` first, then newest: one
 * person's pages. Null when the gallery can't sort by views (an older plugin).
 */
export const fetchPopularOrder = async ({
  type,
  days,
  ids,
}: {
  type: 'project' | 'palette';
  days: number;
  ids: number[];
}): Promise<number[] | null> =>
  (await fetchPopularIds({ type, days, include: ids, limit: 100 }))?.ids ??
  null;

/** Popular results as a page, its "cursor" being how many are shown */
function popularPageInfo(
  { ids, hasMore }: PopularIds,
  after: string | null,
): GalleryPageInfo {
  const offset = Number(after) || 0;
  return {
    hasNextPage: hasMore,
    hasPreviousPage: offset > 0,
    startCursor: String(offset),
    endCursor: String(offset + ids.length),
  };
}

/**
 * These posts' fields, in the order of `ids` (GraphQL's `in` doesn't keep
 * it), a hundred at a time. `connection` takes `$first` and `$ids` and lists
 * `nodes`. Posts not found are left out; with `strict`, a failed request throws
 * instead of finding none.
 */
async function fetchNodesByIds<T extends { databaseId: number }>(
  connection: string,
  field: string,
  ids: number[],
  { strict = false } = {},
): Promise<{ node: T }[]> {
  if (!ids.length) return [];
  const chunks = [];
  for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100));
  const results = await Promise.all(
    chunks.map((chunk) =>
      queryGallery(`query BY_IDS($first: Int, $ids: [ID]) { ${connection} }`, {
        first: chunk.length,
        ids: chunk,
      }),
    ),
  );
  const byId = new Map<number, T>();
  for (const { response, result } of results) {
    const nodes: T[] | undefined = result?.data?.[field]?.nodes;
    if (strict && (!response.ok || !Array.isArray(nodes)))
      throw new Error(`Gallery request failed (${response.status})`);
    for (const node of nodes ?? []) byId.set(node.databaseId, node);
  }
  return ids.flatMap((id) => {
    const node = byId.get(id);
    return node ? [{ node }] : [];
  });
}

const PROJECTS_BY_IDS = `projects(first: $first, where: { in: $ids }) { nodes { ${PROJECT_NODE_FIELDS} } }`;
const PALETTES_BY_IDS = `contentNodes(first: $first, where: { contentTypes: [TEMPBLANKET_PALETTE], in: $ids }) {
  nodes { __typename ... on Palette { title databaseId yarnUrls date views } }
}`;

/** These project pages (e.g. starred ones), in this order; throws when the gallery can't be reached */
export async function fetchProjectsByIds(ids: number[]) {
  const edges = await fetchNodesByIds<GalleryProjectNode>(
    PROJECTS_BY_IDS,
    'projects',
    ids,
    { strict: true },
  );
  return edges.map((edge) => edge.node);
}

/** These palette pages, as for projects */
export async function fetchPalettesByIds(ids: number[]) {
  const edges = await fetchNodesByIds<GallerySharedPaletteNode>(
    PALETTES_BY_IDS,
    'contentNodes',
    ids,
    { strict: true },
  );
  return edges.map((edge) => edge.node);
}

/**
 * These pages' views, all time, by page ID (My Library's cards of the
 * account's own pages): only the views, in one request a hundred at a time.
 * Pages not found, or a gallery before 1.11.0, give none.
 */
export async function fetchViewsByIds(
  kind: 'project' | 'palette',
  ids: number[],
): Promise<Map<number, number>> {
  const edges = await fetchNodesByIds<{ databaseId: number; views?: number }>(
    kind === 'project'
      ? `projects(first: $first, where: { in: $ids }) { nodes { databaseId views } }`
      : `contentNodes(first: $first, where: { contentTypes: [TEMPBLANKET_PALETTE], in: $ids }) {
          nodes { __typename ... on Palette { databaseId views } }
        }`,
    kind === 'project' ? 'projects' : 'contentNodes',
    ids,
  );
  return new Map(
    edges.flatMap(({ node }) =>
      typeof node.views === 'number' ? [[node.databaseId, node.views]] : [],
    ),
  );
}

export const fetchProjects = async ({
  first = 40,
  last = null, // TODO: is this being used by anything? I don't think so.
  after = null,
  before = null, // TODO: is this being used by anything? I don't think so.
  search = '',
  order = 'DESC',
  yarn = '',
  pattern = '',
  days = POPULAR_DAYS,
}: {
  first?: number;
  last?: string | null;
  after?: string | null;
  before?: string | null;
  search?: string;
  order?: string;
  yarn?: string;
  pattern?: string;
  days?: number;
}): Promise<FetchProjectsResult> => {
  if (order === 'POPULAR') {
    const popular = await fetchPopularIds({
      type: 'project',
      days,
      search,
      yarn,
      pattern,
      offset: Number(after) || 0,
      limit: first,
    });
    if (popular) {
      const edges = await fetchNodesByIds<GalleryProjectNode>(
        PROJECTS_BY_IDS,
        'projects',
        popular.ids,
      );
      return { pageInfo: popularPageInfo(popular, after), edges };
    }
    // Newest from the start, never as a next page of Popular
    if (after) throw new Error('Popular sort unavailable');
    return {
      ...(await fetchProjects({ first, search, yarn, pattern, order: 'DESC' })),
      popularUnavailable: true,
    };
  }
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
                    node { ${PROJECT_NODE_FIELDS} }
                  }
                }
              }`;

  const { result } = await queryGallery(query);
  return result.data.projects;
};

/**
 * Palette pages whose link holds one of these links (gallery plugin 1.7.0),
 * in one request; check each with `postsWithColors`. None when the gallery has
 * no palettes, or can't be reached.
 */
export async function fetchPalettePagesForLinks(
  links: string[],
): Promise<LinkedGalleryPost[]> {
  const searches = [
    ...new Set(links.map(yarnLinkSearch).filter((s): s is string => !!s)),
  ].slice(0, 10);
  if (!searches.length) return [];
  const fields = (withSource: boolean) =>
    `nodes { databaseId title date yarnUrls ${withSource ? 'sourceProjectId' : ''} }`;
  const query = (withSource: boolean) =>
    `query PALETTE_PAGES(${searches.map((_, i) => `$s${i}: String`).join(', ')}) {
      ${searches
        .map(
          (_, i) =>
            `p${i}: palettes(first: 10, where: { yarnUrls: $s${i} }) { ${fields(withSource)} }`,
        )
        .join('\n')}
    }`;
  const variables = Object.fromEntries(searches.map((s, i) => [`s${i}`, s]));
  try {
    let { response, result } = await queryGallery(query(true), variables);
    // A gallery before 1.7.0 has no sourceProjectId
    if (
      result?.errors?.some((e: { message?: string }) =>
        e.message?.includes('sourceProjectId'),
      )
    )
      ({ response, result } = await queryGallery(query(false), variables));
    if (!response.ok || !result?.data) return [];
    const posts = new Map<number, LinkedGalleryPost>();
    for (const found of Object.values(result.data) as {
      nodes?: LinkedGalleryPost[];
    }[])
      for (const post of found?.nodes ?? []) posts.set(post.databaseId, post);
    return [...posts.values()];
  } catch (e) {
    console.error('Could not look up palette pages', e);
    return [];
  }
}

/**
 * Projects whose links hold this link, oldest first, a page at a time; check
 * each with `postsWithColors`. Null when the gallery can't be reached.
 */
export async function fetchProjectsWithLink(
  link: string,
  { first = 12, after = null }: { first?: number; after?: string | null } = {},
): Promise<{ pageInfo: GalleryPageInfo; nodes: GalleryProjectNode[] } | null> {
  const search = yarnLinkSearch(link);
  if (!search) return null;
  try {
    const { response, result } = await queryGallery(
      `query PROJECTS_WITH_LINK($search: String, $first: Int, $after: String) {
        projects(first: $first, after: $after, where: { yarnUrls: $search, orderby: { field: DATE, order: ASC } }) {
          pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
          nodes {
            title projectName databaseId projectUrl yarnUrls locations date views
            featuredImage { node { mediaItemUrl mediaDetails { sizes(include: MEDIUM) { sourceUrl } } } }
          }
        }
      }`,
      { search, first, after },
    );
    if (!response.ok || !result?.data?.projects) return null;
    return result.data.projects;
  } catch (e) {
    console.error('Could not look up projects with a palette', e);
    return null;
  }
}

export const recordPageView = async (id: string | number) => {
  if (dev || !browser) return;
  await fetch(
    `${PUBLIC_WORDPRESS_BASE_URL}/wp-json/wordpress-popular-posts/v2/views/${id}`,
    {
      method: 'POST',
    },
  );
};

/** The orders a gallery can show in: newest first, or oldest (Newest reversed) */
export type GalleryOrder = 'DESC' | 'ASC';

/** A gallery's sorts: Popular (most viewed first) or by date */
export type GallerySort = 'POPULAR' | GalleryOrder;

/** The sorts the menu offers; oldest first is Newest with Reverse on */
export const GALLERY_SORTS = [
  {
    value: 'POPULAR',
    label: 'Popular',
    details: 'Most viewed first, then newest',
  },
  { value: 'DESC', label: 'Newest' },
] as const;

/** Popular's periods, in days, as the gallery's popular route takes them */
export const POPULAR_PERIODS = [
  { value: '1', label: 'Past Day' },
  { value: '7', label: 'Past Week' },
  { value: '30', label: 'Past Month' },
  { value: '365', label: 'Past Year' },
] as const;

/**
 * A sort menu's props for a gallery sort: Oldest shows as Newest reversed.
 * Popular can't be reversed (least viewed first isn't worth browsing).
 * Popular's period is a submenu on its row; `period.set` runs before the
 * sort changes to Popular, so a page searching on both should search on the
 * period only while Popular is the sort.
 */
export function gallerySortMenu(
  sort: GallerySort,
  set: (sort: GallerySort) => void,
  period?: { days: number; set: (days: number) => void },
) {
  return {
    submenu: period && {
      option: 'POPULAR' as const,
      current: String(period.days),
      choices: POPULAR_PERIODS,
      onchoose: (days: string) => period.set(Number(days)),
    },
    sortOptions: GALLERY_SORTS,
    sort: sort === 'ASC' ? ('DESC' as const) : sort,
    reversed: sort === 'ASC',
    canReverse: (option: GallerySort) => option !== 'POPULAR',
    // Newest again keeps Reverse on; Popular turns it off
    onsort: (option: GallerySort) =>
      set(option === 'DESC' && sort === 'ASC' ? 'ASC' : option),
    onreverse: (reversed: boolean) => set(reversed ? 'ASC' : 'DESC'),
  };
}
