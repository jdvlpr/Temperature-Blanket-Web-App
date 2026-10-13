// Exports the palettes of every gallery project, for the gallery plugin's one-time
// import (`wp tempblanket import-palettes <file> [--dry-run]`, plugin 1.7.0), so the
// palette gallery can list palette posts only.
//
//   node scripts/export-project-palettes.ts --wp http://tb-gallery.local --out palettes.json
//   node scripts/export-project-palettes.ts --wp ... --out ... --verify   # local only: slow
//
// It reads the gallery's public GraphQL (read-only), oldest project first, and keeps
// the palettes the palette gallery has shown from projects: getPalettesFromProjects'
// own filters (yarn colors, not preset schemes) and titles (the project's name or its
// places, with " - 2" and so on for a project's later gauges). Each palette is kept
// once, from its oldest project (the same colors as the gallery groups by, with
// sameColorList, so one project's palette never shows as two people's); the app's own modules (and its yarn data) are loaded
// through Vite, since they need the app's aliases and environment. --verify also runs getPalettesFromProjects
// on every project at once and checks the counts match (it's quadratic, so not for the
// full production gallery).
//
// Titles of unnamed projects show their dates in this machine's locale (the app uses
// each viewer's), and become fixed text once imported. Choose it with LC_ALL, e.g.
// LC_ALL=en_US.UTF-8 node scripts/export-project-palettes.ts ...
//
// Rows: { projectId, title, yarnUrl, date }, with yarnUrl without v= and date as
// WPGraphQL gives it (site-local YYYY-MM-DDTHH:MM:SS).

import { writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { createServer } from 'vite';

const { values } = parseArgs({
  options: {
    wp: { type: 'string' },
    out: { type: 'string' },
    'page-size': { type: 'string', default: '100' },
    verify: { type: 'boolean', default: false },
  },
});
if (!values.wp || !values.out) {
  console.error(
    'Usage: node scripts/export-project-palettes.ts --wp <gallery URL> --out <file.json> [--verify]',
  );
  process.exit(1);
}
const graphqlUrl = `${values.wp.replace(/\/+$/, '')}/graphql`;
const pageSize = Math.min(100, Math.max(1, Number(values['page-size']) || 100));

type ProjectNode = {
  databaseId: number;
  date: string;
  projectName?: string | null;
  projectUrl: string;
  yarnUrls: string;
  locations: string;
};

type Row = { projectId: number; title: string; yarnUrl: string; date: string };

/** The link without its v= parameter, every other byte as it was (as the plugin does). */
function withoutVersion(url: string) {
  const queryStart = url.indexOf('?');
  if (queryStart === -1) return url;
  const hash = url.indexOf('#', queryStart);
  const fragment = hash === -1 ? '' : url.slice(hash);
  const query = url.slice(queryStart + 1, hash === -1 ? undefined : hash);
  const params = query
    .split('&')
    .filter((param) => param !== 'v' && !param.startsWith('v='));
  return url.slice(0, queryStart + 1) + params.join('&') + fragment;
}

/** Projects from 2022 stored www. links, which the plugin refuses; it's the same page. */
function withoutWww(url: string) {
  return url.replace(
    /^https:\/\/www\.temperature-blanket\.com\//,
    'https://temperature-blanket.com/',
  );
}

// projectName is plugin 1.6.0; an older gallery rejects it, so ask without it
let withName = true;
async function fetchPage(after: string | null) {
  const query = `query EXPORT_PROJECT_PALETTES($first: Int, $after: String) {
    projects(first: $first, after: $after, where: { orderby: { field: DATE, order: ASC } }) {
      pageInfo { hasNextPage endCursor }
      nodes { databaseId date ${withName ? 'projectName' : ''} projectUrl yarnUrls locations }
    }
  }`;
  const response = await fetch(graphqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { first: pageSize, after } }),
  });
  const result = await response.json().catch(() => null);
  if (
    withName &&
    result?.errors?.some((error: { message?: string }) =>
      error.message?.includes('projectName'),
    )
  ) {
    withName = false;
    return fetchPage(after);
  }
  if (!response.ok || !result?.data?.projects)
    throw new Error(
      `GraphQL request failed (${response.status}): ${JSON.stringify(result?.errors ?? result).slice(0, 500)}`,
    );
  return result.data.projects as {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: ProjectNode[];
  };
}

const server = await createServer({
  root: process.cwd(),
  server: { middlewareMode: true, hmr: false, ws: false },
  appType: 'custom',
  logLevel: 'error',
});
try {
  const { getPalettesFromProjects, sameColorList } =
    (await server.ssrLoadModule(
      '/src/lib/utils/color-utils.ts',
    )) as typeof import('../src/lib/utils/color-utils.ts');
  // The yarn dataset loads on demand in the app; without it no color is a yarn
  // color, and every palette would be filtered out
  const { ensureYarnData, isYarnDataLoaded } = (await server.ssrLoadModule(
    '/src/lib/data/yarns/colorways.svelte.ts',
  )) as typeof import('../src/lib/data/yarns/colorways.svelte.ts');
  await ensureYarnData();
  if (!isYarnDataLoaded()) throw new Error('The yarn data did not load');

  const projects: ProjectNode[] = [];
  let after: string | null = null;
  for (;;) {
    const page = await fetchPage(after);
    projects.push(...page.nodes);
    process.stderr.write(`\rProjects read: ${projects.length}`);
    if (!page.pageInfo.hasNextPage || !page.pageInfo.endCursor) break;
    after = page.pageInfo.endCursor;
  }
  process.stderr.write('\n');

  const rows: Row[] = [];
  // The palettes kept so far, compared as the gallery groups them
  const seen: Parameters<typeof sameColorList>[0][] = [];
  const counts = { links: 0, filtered: 0, repeated: 0, unreadable: 0 };
  for (const project of projects) {
    let links: string[];
    try {
      links = JSON.parse(project.yarnUrls);
      if (!Array.isArray(links)) throw new Error('not a list');
    } catch {
      counts.unreadable++;
      continue;
    }
    links.forEach((link, i) => {
      counts.links++;
      // One link at a time, so each palette's own link is known; titles are
      // numbered by the link's place in the project, as the app numbers them
      let palette;
      try {
        [palette] = getPalettesFromProjects({
          projects: [
            {
              ...project,
              __typename: 'Project',
              yarnUrls: JSON.stringify([link]),
            },
          ],
        });
      } catch {
        counts.unreadable++;
        return;
      }
      if (!palette) {
        counts.filtered++;
        return;
      }
      if (seen.some((colors) => sameColorList(colors, palette.colors))) {
        counts.repeated++;
        return;
      }
      seen.push(palette.colors);
      rows.push({
        projectId: Number(project.databaseId),
        title: i > 0 ? `${palette.page.title} - ${i + 1}` : palette.page.title,
        yarnUrl: withoutVersion(withoutWww(link)),
        date: project.date,
      });
    });
  }

  writeFileSync(values.out, JSON.stringify(rows, null, 1) + '\n');
  console.log(
    `Wrote ${rows.length} palettes from ${projects.length} projects to ${values.out} ` +
      `(${counts.links} links: ${counts.filtered} filtered out, ${counts.repeated} repeats, ${counts.unreadable} unreadable), ` +
      `dates in titles as ${Intl.DateTimeFormat().resolvedOptions().locale}.`,
  );

  if (values.verify) {
    const expected = getPalettesFromProjects({
      projects: projects.map((project) => ({
        ...project,
        __typename: 'Project' as const,
      })),
    });
    const titles = (list: { title: string }[]) =>
      JSON.stringify(list.map((item) => item.title));
    const same =
      expected.length === rows.length &&
      titles(expected.map((p) => p.page)) === titles(rows);
    console.log(
      `Verify: getPalettesFromProjects gives ${expected.length}; ${same ? 'same palettes and titles' : 'DIFFERENT'}.`,
    );
    if (!same) process.exitCode = 1;
  }
} finally {
  await server.close();
}
