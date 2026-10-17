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

// The screenshots in Guides & Help, light and dark. Run it again after the UI
// changes to refresh every shot:
//   PUBLIC_ACCOUNTS_ENABLED=true pnpm build && pnpm preview   # in another terminal (as launched)
//   node scripts/docs-screenshots.ts [--base https://localhost:4173] [--only <name>]
// Each shot is static/images/docs/<name>-light.png and -dark.png (DocsShot's
// `src` is <name>), and its size goes into src/lib/docs/docs-shots.json, which
// DocsShot reads, so pages never need sizes by hand. The project is a year of
// London's weather, looked up live, with the default gauge.

import { chromium, type Locator, type Page } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};
const base = arg('base') ?? 'https://localhost:4173';
const only = arg('only');

// London (GeoNames 2643743), all of 2025, from Open-Meteo (s=1, without
// trying the other source: 0)
const PROJECT = `/?project=1#l=2643743'2025010120251231&s=10&u=m`;

type Shot = {
  name: string;
  /** Opens what's shown, and returns the part of the page to capture */
  open: (page: Page) => Promise<Locator>;
  /** For a panel as tall as the window: end the shot below its content */
  trim?: boolean;
  /** A taller window, so bars and toasts at the bottom stay below the shot */
  height?: number;
};

/** The planner with the project's weather loaded, at one of its sections */
async function planner(
  page: Page,
  section: 'location' | 'weather-data' | 'gauges' | 'preview',
) {
  // Without the analytics question (its old key, still read)
  await page.addInitScript(() =>
    localStorage.setItem('disable_toast_analytics', 'true'),
  );
  await page.goto(new URL(PROJECT, base).href);
  await page.getByRole('button', { name: /^Search/ }).click();
  await page.getByRole('button', { name: /^Weather Source/ }).waitFor();
  const key = { location: '1', 'weather-data': '2', gauges: '3', preview: '4' };
  await page.keyboard.press(key[section]);
  await settle(page);
  return page.locator(`#page-section-${section}`);
}

/** Lets menus, charts and fonts finish moving */
async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
}

/** A panel's box, ending a little below the lowest thing shown in it */
async function trimmed(panel: Locator) {
  const box = await panel.boundingBox();
  if (!box) return null;
  const bottom = await panel.evaluate((node) =>
    Math.max(
      ...[...node.querySelectorAll('*')]
        .filter((el) => el.children.length === 0 && el.checkVisibility())
        .map((el) => el.getBoundingClientRect().bottom),
    ),
  );
  return { ...box, height: Math.min(box.height, bottom - box.y + 16) };
}

const menu = (page: Page) => page.getByRole('menu').last();
const dialog = (page: Page) => page.getByRole('dialog').last();

const SHOTS: Shot[] = [
  {
    name: 'preview/rows',
    open: async (page) => {
      const section = await planner(page, 'preview');
      return section.locator('#preview-svg-image');
    },
    height: 2200,
  },
  {
    name: 'library-and-account/card-menu',
    open: async (page) => {
      await planner(page, 'weather-data');
      await page.keyboard.press('.');
      await page.getByTestId('menu-save').click();
      await page.getByTestId('autosave-status').waitFor();
      await page.goto(new URL('/my-projects', base).href);
      await page
        .getByRole('button', { name: /^More for/ })
        .first()
        .click();
      await settle(page);
      return menu(page);
    },
  },
  {
    name: 'location-and-dates/location',
    open: async (page) => {
      return planner(page, 'location');
    },
  },
  {
    name: 'weather/weather-source',
    open: async (page) => {
      await planner(page, 'weather-data');
      await page.getByRole('button', { name: /^Weather Source/ }).click();
      await settle(page);
      return dialog(page);
    },
  },
  {
    name: 'gauges-and-ranges/ranges-menu',
    open: async (page) => {
      await planner(page, 'gauges');
      await page.getByRole('button', { name: /^Ranges/ }).click();
      await settle(page);
      return menu(page);
    },
  },
  {
    name: 'colors-and-yarn/get-colors',
    open: async (page) => {
      await planner(page, 'gauges');
      await page.getByRole('button', { name: /Get Colors/ }).click();
      await settle(page);
      return menu(page);
    },
  },
  {
    name: 'download/pdf-options',
    open: async (page) => {
      await planner(page, 'weather-data');
      await page.keyboard.press('.');
      await page
        .getByRole('button', { name: /^Download/ })
        .first()
        .click();
      await page.getByRole('button', { name: /^PDF/ }).click();
      await page.getByRole('button', { name: /^Customize/ }).click();
      await settle(page);
      return dialog(page);
    },
    trim: true,
  },
  {
    name: 'library-and-account/project-menu',
    open: async (page) => {
      await planner(page, 'weather-data');
      await page.keyboard.press('.');
      await settle(page);
      return dialog(page);
    },
    trim: true,
  },
];

async function main() {
  const browser = await chromium.launch();
  const sizes: Record<string, { width: number; height: number }> = JSON.parse(
    await readFile(join(root, 'src/lib/docs/docs-shots.json'), 'utf8').catch(
      () => '{}',
    ),
  );
  for (const shot of SHOTS) {
    if (only && shot.name !== only) continue;
    for (const theme of ['light', 'dark'] as const) {
      const context = await browser.newContext({
        baseURL: base,
        ignoreHTTPSErrors: true,
        viewport: { width: 1280, height: shot.height ?? 1400 },
        colorScheme: theme,
        reducedMotion: 'reduce',
        // Sharp on high-density screens; the sizes kept are CSS pixels
        deviceScaleFactor: 2,
      });
      const page = await context.newPage();
      const target = await shot.open(page).catch(async (error) => {
        // Where it stopped, to see why
        const failed = join(root, '.svelte-kit/docs-screenshot-failed.png');
        await page.screenshot({ path: failed, fullPage: true });
        console.error(`${shot.name} failed; the page is in ${failed}`);
        throw error;
      });
      const file = join(
        root,
        'static/images/docs',
        `${shot.name}-${theme}.png`,
      );
      await mkdir(dirname(file), { recursive: true });
      const box = shot.trim
        ? await trimmed(target)
        : await target.boundingBox();
      if (shot.trim && box)
        await page.screenshot({
          path: file,
          clip: box,
          animations: 'disabled',
        });
      else await target.screenshot({ path: file, animations: 'disabled' });
      if (box)
        sizes[shot.name] = {
          width: Math.round(box.width),
          height: Math.round(box.height),
        };
      console.log(`${shot.name}-${theme}.png`);
      await context.close();
    }
  }
  await writeFile(
    join(root, 'src/lib/docs/docs-shots.json'),
    `${JSON.stringify(sizes, null, 2)}\n`,
  );
  await browser.close();
}

await main();
