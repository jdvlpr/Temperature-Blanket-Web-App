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

// The promo video's UI footage (promo/, Remotion): each clip is
// promo/public/footage/<name>.mp4 (gitignored), where its scene's FootageSlot
// plays it in place of the drawn stand-in.
//   pnpm dev:accounts                 # in another terminal
//   node scripts/promo-video.ts --base https://localhost:5173 [--only <name>]
// It records with docs-screenshots.ts's recorder (Chrome's screencast at 2×,
// a drawn cursor, ffmpeg), light only (the stand-ins are light UI), faster
// than the docs' clips: the slots are a second or two long. Each window has
// its slot's shape, or the clip is cropped to it. A sheet of a frame a second
// for each is in .svelte-kit/promo-footage/.
//
// Every clip shows the motion graphics' own blanket (promo/src/data/hero.json:
// Minneapolis, 2025, Open-Meteo, °F, 10 Stylecraft Special DK colors, Auto
// ranges), built once per run through the planner and checked against the
// file before anything is recorded. The browser is in Minneapolis's timezone,
// since the app asks Open-Meteo for days in it, as the export did.
//
// Not here: ravelry.mp4, recorded with the owner signed in to Ravelry.

import {
  chromium,
  type Browser,
  type Locator,
  type Page,
} from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  base,
  clickOn,
  dialog,
  hideBetaBanner,
  keepAt,
  moveTo,
  moveToPoint,
  planner,
  record,
  root,
  saveProject,
  settle,
  value,
  visit,
  type Clip,
} from './docs-screenshots.ts';

const only = (() => {
  const i = process.argv.indexOf('--only');
  return i === -1 ? undefined : process.argv[i + 1];
})();

type Hero = {
  location: { short: string; lat: number; lng: number; timezone: string };
  dates: { from: string; to: string };
  gauge: { yarn: string };
  palette: { hex: string; name: string }[];
  ranges: { from: number; to: number }[];
};
const hero: Hero = JSON.parse(
  await readFile(join(root, 'promo/src/data/hero.json'), 'utf8'),
);

const OUT = join(root, 'promo/public/footage');
const SHEETS = join(root, '.svelte-kit/promo-footage');

/** The planner screen in PlanIt (1100×688) */
const PLAN = { width: 1280, height: 800 };
/** The "…and so much more" tiles (700×330) */
const TILE = { width: 1280, height: 604 };
const TILE_ASPECT = 700 / 330;

async function newContext(browser: Browser, viewport = PLAN) {
  const context = await browser.newContext({
    baseURL: base,
    ignoreHTTPSErrors: true,
    viewport,
    colorScheme: 'light',
    deviceScaleFactor: 2,
    timezoneId: hero.location.timezone,
  });
  await context.addInitScript(hideBetaBanner);
  return context;
}

/** The hero project's link, as the app writes it: built through the planner
 * and checked against hero.json */
async function heroLink(browser: Browser) {
  const context = await newContext(browser);
  const page = await context.newPage();
  // The place by search, as someone would find it, matched by its position
  const found: { geonames: { geonameId: number; lat: string; lng: string }[] } =
    await (
      await page.request.get(
        new URL(
          `/api/location/search/${encodeURIComponent(hero.location.short)}`,
          base,
        ).href,
      )
    ).json();
  const place = found.geonames.find(
    (g) =>
      Math.abs(+g.lat - hero.location.lat) < 0.001 &&
      Math.abs(+g.lng - hero.location.lng) < 0.001,
  );
  if (!place) throw new Error(`${hero.location.short} wasn't found`);
  const day = (iso: string) => iso.replaceAll('-', '');
  const start = `/?project=1#l=${place.geonameId}'${day(hero.dates.from)}${day(hero.dates.to)}&s=10&u=i`;
  const section = await planner(page, 'gauges', start);

  // Its colors: the yarn's colorways, hottest first
  const choose = page.getByRole('menuitem', { name: /Choose Colorways/ });
  for (let i = 0; i < 5 && !(await choose.isVisible()); i++) {
    await section.getByRole('button', { name: /Get Colors/ }).click();
    await choose.waitFor({ timeout: 2000 }).catch(() => {});
  }
  await choose.click();
  const picker = dialog(page);
  await picker.getByRole('combobox').first().click();
  const yarn = hero.gauge.yarn.replace(/^Stylecraft /, '');
  await page.keyboard.type(yarn);
  await page
    .getByRole('option', { name: new RegExp(yarn) })
    .first()
    .click();
  await settle(page);
  for (const { name } of hero.palette) {
    const number = name.split(' ').pop();
    await picker
      .locator('button[aria-pressed]')
      .filter({ hasText: new RegExp(`\\b${number}\\b`) })
      .first()
      .click();
  }
  await picker.getByRole('button', { name: 'Save', exact: true }).click();
  await picker.waitFor({ state: 'detached' });
  await settle(page);

  // Its link, as Copy Link makes it (the address doesn't keep the colors)
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: new URL(base).origin,
  });
  await page.getByRole('button', { name: /^Project/ }).click();
  await page
    .getByRole('button', { name: /^Copy Link/ })
    .last()
    .click();
  const link = new URL(
    await page.evaluate(() => navigator.clipboard.readText()),
  );
  // The same blanket as the motion graphics, or nothing is recorded
  const temp = new URLSearchParams(link.hash.slice(1)).get('temp') ?? '';
  const got = [...temp.matchAll(/([0-9a-f]{6})\((-?[\d.]+)'(-?[\d.]+)\)/g)].map(
    ([, hex, from, to]) => `#${hex} ${from}→${to}`,
  );
  const want = hero.palette.map(
    ({ hex }, i) => `${hex} ${hero.ranges[i].from}→${hero.ranges[i].to}`,
  );
  if (got.join() !== want.join())
    throw new Error(
      `The planner's gauge isn't hero.json's:\n  got  ${got.join(', ')}\n  want ${want.join(', ')}`,
    );
  console.log(`hero: ${link.pathname}${link.search}${link.hash}`);
  await context.close();
  return `${link.pathname}${link.search}${link.hash}`;
}

/** A box of `aspect` around `target`, `width` wide, inside the window */
async function around(
  page: Page,
  target: Locator,
  aspect: number,
  width: number,
) {
  const box = await target.boundingBox();
  const size = page.viewportSize();
  if (!box || !size) return null;
  const w = Math.min(width, size.width);
  const h = Math.min(Math.round(w / aspect), size.height);
  const clamp = (v: number, max: number) => Math.max(0, Math.min(v, max));
  return {
    x: clamp(box.x + box.width / 2 - w / 2, size.width - w),
    y: clamp(box.y + box.height / 2 - h / 2, size.height - h),
    width: w,
    height: h,
  };
}

/** Scrolls the page by `by` px over `ms`, smoothly */
async function glide(page: Page, by: number, ms = 1200) {
  const steps = Math.round(ms / 32);
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, by / steps);
    await page.waitForTimeout(32);
  }
}

const updateDialog = (page: Page) =>
  page.getByRole('dialog', { name: 'Update Weather Data' });

type Footage = Clip & {
  crop?: (page: Page) => ReturnType<typeof around>;
  /** Seconds on the first frame */
  lead?: number;
};

const footage = (link: string): Footage[] => [
  // PlanIt's four steps: each slot is about a second, so each is one motion
  {
    name: 'plan-location',
    viewport: PLAN,
    open: async (page) => {
      await visit(page, '/');
      const search = page.getByPlaceholder('Enter a place');
      // Typed, with its results up (GeoNames matches whole words only)
      await search.fill(hero.location.short);
      await page
        .locator('.autocomplete > div')
        .filter({ hasText: /Minnesota/ })
        .first()
        .waitFor();
      await page.mouse.move(0, 0);
      await settle(page);
    },
    play: async (page) => {
      const result = page
        .locator('.autocomplete > div')
        .filter({ hasText: /Minnesota/ })
        .first();
      await clickOn(page, result, 450);
      await page.waitForTimeout(500);
      await moveTo(page, page.locator('#location-action-button'), 500);
    },
  },
  {
    name: 'plan-weather',
    viewport: PLAN,
    open: async (page) => {
      await planner(page, 'weather-data', link);
      await page.evaluate(() => scrollTo(0, 0));
      await settle(page);
    },
    play: async (page) => {
      await moveToPoint(page, { x: 640, y: 420 }, 300);
      await glide(page, 260, 1200);
    },
  },
  {
    name: 'plan-colors',
    viewport: PLAN,
    open: async (page) => {
      await planner(page, 'gauges', link);
      await page.evaluate(() => scrollTo(0, 0));
      await settle(page);
    },
    play: async (page) => {
      await moveToPoint(page, { x: 640, y: 380 }, 300);
      await glide(page, 220, 1200);
    },
  },
  {
    name: 'plan-preview',
    viewport: PLAN,
    open: async (page) => {
      const section = await planner(page, 'preview', link);
      // The pattern's toolbar at the top, the blanket below it
      await keepAt(page, section.getByRole('button', { name: /^Share/ }), 90);
    },
    play: async (page) => {
      await moveToPoint(page, { x: 700, y: 450 }, 300);
      await glide(page, 200, 1200);
    },
  },

  // NewDays: Update Weather Data, saved on Nov 1 and checked on Dec 1, with
  // a few past days refined a little since (so the dialog opens: when no
  // saved day changes, new days just go in)
  {
    name: 'update-weather',
    viewport: PLAN,
    // By name: the Project menu it was opened from may still be closing
    crop: (page) => around(page, updateDialog(page), 640 / 400, 860),
    open: async (page) => {
      await page.clock.setSystemTime(new Date('2025-11-01T12:00:00-06:00'));
      await planner(page, 'location', link);
      await saveProject(page);
      await page.clock.setSystemTime(new Date('2025-12-01T12:00:00-06:00'));
      await page.route(
        'https://archive-api.open-meteo.com/**',
        async (route) => {
          const response = await route.fetch();
          const data = await response.json();
          const highs: (number | null)[] = data.daily.temperature_2m_max;
          for (const i of [240, 247, 255, 262, 270, 281, 289, 296])
            if (highs[i] != null)
              highs[i] = Math.round((highs[i]! + 0.1) * 10) / 10;
          await route.fulfill({ response, json: data });
        },
      );
      await page.getByRole('button', { name: /^Project/ }).click();
      await page
        .getByRole('button', { name: /^Check for Updates/ })
        .last()
        .click();
      await updateDialog(page)
        .getByText(/Add \d+ new days?/)
        .waitFor({ timeout: 60_000 });
      await page.mouse.move(0, 0);
      await settle(page);
    },
    lead: 0.2,
    play: async (page) => {
      await page.waitForTimeout(150);
      await clickOn(
        page,
        updateDialog(page).getByRole('button', { name: /^Add \d+ Days?$/ }),
        500,
      );
      await page.waitForTimeout(600);
    },
  },

  // AndMore's tiles: all four are up within a second, for about two
  {
    name: 'more-sidebar',
    viewport: TILE,
    open: async (page) => {
      const section = await planner(page, 'preview', link);
      await keepAt(page, section.getByRole('button', { name: /^Share/ }), 90);
    },
    play: async (page) => {
      const nav = page.getByRole('navigation').first();
      await clickOn(page, nav.getByRole('button', { name: /^Create/ }), 300);
      await page.waitForTimeout(600);
      await page.keyboard.press('Escape');
      await moveTo(page, nav.getByRole('link', { name: /Gallery/ }), 500);
      await page.waitForTimeout(300);
    },
  },
  {
    name: 'more-ranges',
    viewport: TILE,
    crop: (page) =>
      around(
        page,
        page.locator('#page-section-gauges .range-to').nth(2),
        TILE_ASPECT,
        880,
      ),
    open: async (page) => {
      const section = await planner(page, 'gauges', link);
      await keepAt(page, section.locator('.range-to').nth(2), 300);
    },
    play: async (page) => {
      const section = page.locator('#page-section-gauges');
      await clickOn(page, section.locator('.range-to').nth(2), 450);
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.type(String(hero.ranges[2].to + 2), { delay: 110 });
      await clickOn(
        page,
        section.getByRole('button', { name: 'Save range for color 3' }),
        450,
      );
      await page.waitForTimeout(400);
    },
  },
  {
    name: 'more-progress',
    viewport: TILE,
    open: async (page) => {
      const section = await planner(page, 'preview', link);
      await keepAt(page, section.getByTestId('progress-button'), 72);
    },
    play: async (page) => {
      const section = page.locator('#page-section-preview');
      await clickOn(page, section.getByTestId('progress-button'), 400);
      const editor = page.getByTestId('progress-editor');
      await editor.waitFor();
      await editor.locator('input[type="date"]').fill('2025-03-28');
      const next = editor.getByTitle('On a day');
      await clickOn(page, next, 400);
      await clickOn(page, next, 200);
      await clickOn(
        page,
        dialog(page).getByRole('button', { name: 'Save', exact: true }),
        400,
      );
      await page.waitForTimeout(500);
    },
  },
  {
    name: 'more-edit-weather',
    viewport: TILE,
    // The dialog is full size: framed on the day edited, with its title above
    crop: (page) =>
      around(
        page,
        dialog(page)
          .locator('[data-grid-row="1"]')
          .getByRole('gridcell')
          .first(),
        TILE_ASPECT,
        1000,
      ),
    open: async (page) => {
      await planner(page, 'weather-data', link);
      await value(page, '2025-01-03', 'High').click();
      await dialog(page).getByRole('grid').waitFor();
      await page.mouse.move(0, 0);
      await settle(page);
    },
    lead: 0.2,
    play: async (page) => {
      await page.keyboard.type('31', { delay: 140 });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      await page.keyboard.type('28', { delay: 140 });
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      await clickOn(
        page,
        dialog(page).getByRole('button', { name: 'Apply', exact: true }),
        500,
      );
      await page.waitForTimeout(400);
    },
  },
];

async function main() {
  // The screencast is at twice the size only with the scale forced
  const browser = await chromium.launch({
    args: ['--force-device-scale-factor=2'],
  });
  const link = await heroLink(browser);
  if (only === 'hero') return browser.close();
  await mkdir(OUT, { recursive: true });
  for (const clip of footage(link)) {
    if (only && clip.name !== only) continue;
    const context = await newContext(browser, clip.viewport);
    const size = await record(context, clip, 'light', {
      out: join(OUT, clip.name),
      lead: clip.lead ?? 0.3,
      hold: 0.8,
      poster: false,
      sheet: join(SHEETS, `${clip.name}.png`),
      crop: clip.crop,
    });
    console.log(`${clip.name}.mp4 (${size.width}×${size.height})`);
    await context.close();
  }
  await browser.close();
}

await main();
