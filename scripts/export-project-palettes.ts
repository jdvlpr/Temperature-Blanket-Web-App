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
// Titles of unnamed projects show their dates in each viewer's locale in the app; once
// imported they're fixed text, so the export writes them as "Sep 12, 2026" everywhere,
// with one year for a range within a year ("Jan 1 to Dec 30, 2019"), and shortens them
// to fit the plugin's 80 characters by place, never by cutting a date (placesTitle).
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

const numericDate = String.raw`(\d{1,2})[/.](\d{1,2})[/.](\d{4})`;
const numericRange = new RegExp(`from ${numericDate} to ${numericDate}`, 'g');

/**
 * Projects before app 3.36.0 stored dates in their maker's locale. The app converts a
 * range only when both dates parse, so one left as numbers has a day-first date in it
 * (31/12/2021, 2.6.2023): read both dates day-first, as the other titles' dates.
 */
function withDayFirstDates(title: string) {
  return title.replace(numericRange, (range, ...parts: string[]) => {
    const dates = [parts.slice(0, 3), parts.slice(3, 6)].map(
      ([day, month, year]) => {
        const date = new Date(
          Date.UTC(Number(year), Number(month) - 1, Number(day)),
        );
        return date.getUTCDate() === Number(day) &&
          date.getUTCMonth() === Number(month) - 1
          ? date.toLocaleDateString(undefined, { timeZone: 'UTC' })
          : null;
      },
    );
    return dates[0] && dates[1] ? `from ${dates[0]} to ${dates[1]}` : range;
  });
}

// The plugin cuts longer names at this many characters
const MAX_TITLE_LENGTH = 80;
const length = (text: string) => [...text].length;
const MONTHS = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ');

/** "Sep 12, 2026" as a sortable number, or null when it isn't one. */
function dateValue(text: string) {
  const match = text.match(/^([A-Z][a-z]{2}) (\d{1,2}), (\d{4})$/);
  const month = match ? MONTHS.indexOf(match[1]) : -1;
  return match && month !== -1
    ? Number(match[3]) * 10000 + month * 100 + Number(match[2])
    : null;
}

/** "from Jan 1 to Dec 30, 2019" when both dates are in the same year. */
function rangeText(from: string, to: string) {
  const year = from.match(/, (\d{4})$/)?.[1];
  return dateValue(from) !== null &&
    dateValue(to) !== null &&
    to.endsWith(`, ${year}`)
    ? `from ${from.slice(0, -6)} to ${to}`
    : `from ${from} to ${to}`;
}

/**
 * An unnamed project's title ("place from date to date; ..."), with one year for a
 * range within a year, and short enough for the plugin to keep whole: several places
 * become the first with "+ N more" over the whole span, then the place loses its middle
 * parts, then its country, and only then is it cut at a word, with an ellipsis. The
 * dates and the " - 2" suffix always stay.
 */
function placesTitle(title: string, suffix: string) {
  const ranges = title
    .split('; ')
    .map((part) => part.match(/^(.*) from (.+) to (.+)$/));
  if (ranges.some((range) => !range)) return title + suffix;
  const parsed = ranges as RegExpMatchArray[];

  const full = parsed
    .map(([, place, from, to]) => `${place} ${rangeText(from, to)}`)
    .join('; ');
  if (length(full + suffix) <= MAX_TITLE_LENGTH) return full + suffix;

  const places = new Set(parsed.map(([, place]) => place));
  const more = places.size > 1 ? ` + ${places.size - 1} more` : '';
  let [from, to] = [parsed[0][2], parsed.at(-1)![3]];
  if (
    parsed.every(
      ([, , start, end]) =>
        dateValue(start) !== null && dateValue(end) !== null,
    )
  ) {
    // Ranges can overlap or be out of order: the earliest start and the latest end
    from = parsed.reduce(
      (a, [, , b]) => (dateValue(b)! < dateValue(a)! ? b : a),
      from,
    );
    to = parsed.reduce(
      (a, [, , , b]) => (dateValue(b)! > dateValue(a)! ? b : a),
      to,
    );
  }
  const tail = `${more} ${rangeText(from, to)}${suffix}`;
  const fits = (place: string) => length(place + tail) <= MAX_TITLE_LENGTH;

  const place = parsed[0][1];
  const parts = place.split(', ');
  const shorter = [place, `${parts[0]}, ${parts.at(-1)}`, parts[0]].find(
    (candidate, i) => (i === 0 || parts.length > i) && fits(candidate),
  );
  if (shorter) return shorter + tail;

  const room = MAX_TITLE_LENGTH - length(tail) - 1;
  let cut = [...parts[0]].slice(0, room).join('');
  const space = cut.lastIndexOf(' ');
  if (space > room / 2) cut = cut.slice(0, space);
  return `${cut.replace(/[\s,;.-]+$/, '')}…${tail}`;
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

// The app formats location dates with toLocaleDateString(undefined, { timeZone: 'UTC' })
const toLocaleDateString = Date.prototype.toLocaleDateString;
Date.prototype.toLocaleDateString = function (_locales, options) {
  return toLocaleDateString.call(this, 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  });
};

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
  // Shared with the gallery pages, which find these palettes by their links
  const { withoutVersion, withoutWww } = (await server.ssrLoadModule(
    '/src/lib/utils/gallery-link-utils.ts',
  )) as typeof import('../src/lib/utils/gallery-link-utils.ts');
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
      const suffix = i > 0 ? ` - ${i + 1}` : '';
      rows.push({
        projectId: Number(project.databaseId),
        title: project.projectName
          ? palette.page.title + suffix
          : placesTitle(withDayFirstDates(palette.page.title), suffix),
        yarnUrl: withoutVersion(withoutWww(link)),
        date: project.date,
      });
    });
  }

  writeFileSync(values.out, JSON.stringify(rows, null, 1) + '\n');
  console.log(
    `Wrote ${rows.length} palettes from ${projects.length} projects to ${values.out} ` +
      `(${counts.links} links: ${counts.filtered} filtered out, ${counts.repeated} repeats, ${counts.unreadable} unreadable), ` +
      `dates in titles as ${new Date(Date.UTC(2026, 8, 12)).toLocaleDateString(undefined, { timeZone: 'UTC' })}.`,
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
