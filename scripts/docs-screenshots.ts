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
//
// It also records the short clips (CLIPS, shown by DocsClip): each is
// <name>-light.mp4 and -dark.mp4, with the first frame as -light.jpg and
// -dark.jpg for its poster, and its size in docs-shots.json too. Frames come
// from Chrome's screencast at twice the size, with a cursor drawn in (headless
// Chrome has none), and ffmpeg (on the PATH) makes them a video. Each clip
// also leaves a sheet of a frame a second in .svelte-kit/docs-clips/, to
// check it by. How to add one: .claude/skills/docs-clips/SKILL.md.
//
// And each Guides & Help card's picture (CARDS), which is also its page's
// share picture: static/images/docs/cards/<slug>-light.jpg and -dark.jpg,
// 1200×630. A page without one is named at the end of the run.
//
// A few (the Publish dialog and clip) sign in a new account with an emailed
// code, so they need a server with EMAIL_SIGN_IN and ENABLE_DEV_ROUTES: the
// dev server (`pnpm dev:accounts`), or `wrangler pages dev` on an accounts
// build. Their names say which: --only publish-and-share/publish-dialog.

import {
  chromium,
  type BrowserContext,
  type Locator,
  type Page,
} from '@playwright/test';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { GUIDES, REFERENCE } from '../src/lib/docs/docs-index.ts';

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
// The whole of this year, with days still to come
const THIS_YEAR = `/?project=1#l=2643743'${new Date().getFullYear()}0101${new Date().getFullYear()}1231&s=10&u=m`;

type Shot = {
  name: string;
  /** Opens what's shown, and returns the part of the page to capture */
  open: (page: Page) => Promise<Locator>;
  /** For a panel as tall as the window: end the shot below its content */
  trim?: boolean;
  /** A taller window, so bars and toasts at the bottom stay below the shot */
  height?: number;
  /** Only the part of the target in the window (for long pages and lists) */
  inView?: boolean;
};

/** The planner with the project's weather loaded, at one of its sections */
async function planner(
  page: Page,
  section: 'location' | 'weather-data' | 'gauges' | 'preview',
  project = PROJECT,
) {
  // Without the analytics question (its old key, still read)
  await page.addInitScript(() =>
    localStorage.setItem('disable_toast_analytics', 'true'),
  );
  await page.goto(new URL(project, base).href);
  await page.getByRole('button', { name: /^Get Weather Data/ }).click();
  await page.getByRole('button', { name: /^Source:/ }).waitFor();
  const key = { location: '1', 'weather-data': '2', gauges: '3', preview: '4' };
  await page.keyboard.press(key[section]);
  // Without toasts (like "Units set to") over the shot
  for (const toast of await page
    .getByRole('button', { name: 'Dismiss toast' })
    .all())
    await toast.click();
  await settle(page);
  // Location is a centered column; its shots are of the column, not the
  // empty width beside it
  return section === 'location'
    ? page.locator('#page-section-location > div')
    : page.locator(`#page-section-${section}`);
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

/** A target's box, cut to what's in the window */
async function inView(page: Page, target: Locator) {
  const box = await target.boundingBox();
  const size = page.viewportSize();
  if (!box || !size) return box;
  const top = Math.max(box.y, 0);
  return {
    x: box.x,
    y: top,
    width: box.width,
    height: Math.min(box.y + box.height, size.height) - top,
  };
}

const menu = (page: Page) => page.getByRole('menu').last();
const dialog = (page: Page) => page.getByRole('dialog').last();

/** Scrolls until `target` stays `top` px from the window's top: changing
 * step, or the chart laid out late, can scroll the page back */
async function keepAt(page: Page, target: Locator, top = 72) {
  for (let tries = 0, still = 0; still < 3 && tries < 30; tries++) {
    const at = await target.evaluate(
      (node) => node.getBoundingClientRect().top,
    );
    if (Math.abs(at - top) < 2) still++;
    else {
      still = 0;
      await page.evaluate((y) => scrollTo(0, scrollY + y), at - top);
    }
    await page.waitForTimeout(300);
  }
  await settle(page);
}

/** Toasts (like "Saved") off the shot */
async function dismissToasts(page: Page) {
  for (const toast of await page
    .getByRole('button', { name: 'Dismiss toast' })
    .all())
    await toast.click().catch(() => {});
}

/** Signs in a new account with an emailed code, as a made-up maker. Needs
 * a server with EMAIL_SIGN_IN and ENABLE_DEV_ROUTES (the dev outbox): the
 * dev server, or `wrangler pages dev` on an accounts build */
async function signIn(page: Page) {
  const email = `docs-${Date.now()}@example.test`;
  await page.goto(new URL('/auth/sign-in', base).href);
  await page.getByRole('button', { name: 'Use email instead' }).click();
  await page.getByLabel('Email').fill(email);
  await page.getByRole('button', { name: 'Email me a code' }).click();
  await page.getByText(`We sent a code to ${email}`).waitFor();
  let code: string | undefined;
  for (let i = 0; i < 40 && !code; i++) {
    const response = await page.request.get(
      new URL(`/api/dev/outbox?to=${encodeURIComponent(email)}`, base).href,
    );
    const messages: { text: string }[] = await response.json();
    code = messages[0]?.text.match(/\b(\d{6})\b/)?.[1];
    if (!code) await page.waitForTimeout(500);
  }
  if (!code) throw new Error(`No sign-in code came for ${email}`);
  await page.getByLabel('Code').fill(code);
  const welcome = page.getByRole('dialog', { name: 'Welcome!' });
  const name = welcome.getByLabel('Your display name');
  await name.fill('Robin Ellis');
  await name.press('Enter');
  await welcome.waitFor({ state: 'detached' });
  // Then any later step of the welcome: Not now
  const later = page.getByRole('button', { name: 'Not now' });
  if (
    await later.waitFor({ timeout: 3000 }).then(
      () => true,
      () => false,
    )
  )
    await later.click();
}

/** The planner's project saved (to the account, when signed in) */
async function saveProject(page: Page) {
  await page.keyboard.press('ControlOrMeta+s');
  // Its Saved toast
  await page.getByRole('button', { name: 'Dismiss toast' }).first().waitFor();
  await dismissToasts(page);
}

/** A page of the site, without the analytics question */
async function visit(page: Page, path: string) {
  await page.addInitScript(() =>
    localStorage.setItem('disable_toast_analytics', 'true'),
  );
  await page.goto(new URL(path, base).href);
}

/** A palette of real yarn in the Yarn Palette Creator */
async function yarnPalette(page: Page) {
  await visit(page, '/yarn');
  await page.waitForLoadState('networkidle');
  await settle(page);
  // Again if pressed before the page was ready for it
  const choose = page.getByRole('menuitem', { name: /Choose Colorways/ });
  for (let i = 0; i < 5 && !(await choose.isVisible()); i++) {
    await page.getByRole('button', { name: /Get Colors/ }).click();
    await choose.waitFor({ timeout: 2000 }).catch(() => {});
  }
  await choose.click();
  const picker = dialog(page);
  await picker.getByRole('combobox').first().click();
  await page.keyboard.type('Special DK');
  await page
    .getByRole('option', { name: /Special DK/ })
    .first()
    .click();
  await settle(page);
  const cards = picker.locator('button[aria-pressed]');
  for (const i of [2, 9, 16, 23, 30, 37]) await cards.nth(i).click();
  await picker.getByRole('button', { name: 'Save', exact: true }).click();
  await picker.waitFor({ state: 'detached' });
  await page.mouse.move(0, 0);
  await settle(page);
}

const SHOTS: Shot[] = [
  {
    name: 'gauges-and-ranges/edit-range',
    open: async (page) => {
      const section = await planner(page, 'gauges');
      await section.locator('.range-to').nth(2).click();
      await settle(page);
      return section;
    },
    trim: true,
  },
  {
    // Days in ranges is on to start with
    name: 'choose-ranges/days-in-ranges',
    open: async (page) => planner(page, 'gauges'),
    trim: true,
  },
  {
    name: 'knit-along-all-year/future-days',
    open: async (page) => planner(page, 'location', THIS_YEAR),
    height: 2200,
  },
  {
    name: 'match-your-yarn/choose-colorways',
    open: async (page) => {
      await planner(page, 'gauges');
      await page.getByRole('button', { name: /Get Colors/ }).click();
      await page.getByRole('menuitem', { name: /Choose Colorways/ }).click();
      const picker = dialog(page);
      await picker.getByRole('combobox').first().click();
      await page.keyboard.type('Special DK');
      await page
        .getByRole('option', { name: /Special DK/ })
        .first()
        .click();
      await settle(page);
      // A few colorways, so the strip of picked ones shows
      const cards = picker.locator('button[aria-pressed]');
      for (let i = 0; i < 4; i++) await cards.nth(i * 3).click();
      await settle(page);
      return picker;
    },
    trim: true,
  },
  {
    name: 'rain-snow-sunshine/rain-gauge',
    open: async (page) => {
      const section = await planner(page, 'gauges');
      await page.getByRole('button', { name: 'Add Gauge' }).click();
      await page.getByRole('menuitem', { name: 'Rain Gauge' }).click();
      // Off the colors, so none shows its hex code over the gauges
      await page.mouse.move(0, 0);
      await settle(page);
      return section;
    },
    trim: true,
  },
  {
    name: 'version-7/site-menu',
    open: async (page) => {
      await planner(page, 'location');
      return page.getByRole('navigation', { name: 'Site' });
    },
  },
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
      await page.getByRole('button', { name: /^Source:/ }).click();
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
      await dialog(page).getByText('Page Size').waitFor();
      // Its pages, drawn after it opens
      await dialog(page)
        .getByAltText(/^Page 1 of/)
        .waitFor({ timeout: 30_000 });
      await page.waitForTimeout(800);
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
  {
    name: 'palette-creator/palette',
    open: async (page) => {
      await yarnPalette(page);
      return page.locator('main');
    },
    trim: true,
  },
  {
    name: 'explore/colorway-finder',
    open: async (page) => {
      await visit(page, '/yarn-colorway-finder');
      await page.waitForLoadState('networkidle');
      await settle(page);
      await page
        .getByPlaceholder(/e\.g\., pink/)
        .pressSequentially('#9caf88', { delay: 80 });
      await page.waitForTimeout(1200);
      await settle(page);
      return page.locator('main');
    },
    inView: true,
    height: 1100,
  },
  {
    name: 'explore/gallery',
    open: async (page) => {
      await visit(page, '/gallery');
      // Its cards' pictures, not the placeholders before them
      await page.locator('main a img').first().waitFor({ timeout: 30_000 });
      await page.waitForTimeout(2500);
      await settle(page);
      return page.locator('main');
    },
    inView: true,
    height: 1100,
  },
  {
    name: 'publish-and-share/publish-dialog',
    open: async (page) => {
      await signIn(page);
      await planner(page, 'preview');
      await saveProject(page);
      await page.keyboard.press('.');
      await dialog(page)
        .getByRole('button', { name: /^Publish to Gallery/ })
        .click();
      await dialog(page).getByText('Anonymous').waitFor();
      // Showing the maker's name, as most pages do
      await dialog(page)
        .getByRole('checkbox', { name: /Anonymous/ })
        .click();
      // Without the focus ring the click leaves
      await page.evaluate(() =>
        (document.activeElement as HTMLElement | null)?.blur(),
      );
      await settle(page);
      return dialog(page);
    },
    trim: true,
  },
];

// ***************
// Clips
// ***************

type Clip = {
  name: string;
  /** Opens what the clip starts on (not recorded) */
  open: (page: Page) => Promise<void>;
  /** What's recorded, after a moment on the first frame */
  play: (page: Page) => Promise<void>;
};

/** The window a clip is recorded in: about the width of a guide's text */
const CLIP_VIEWPORT = { width: 800, height: 720 };

/** A cursor for the clips (big enough to follow at a guide's width), following the mouse and showing its presses; its tip is at the mouse */
function drawCursor() {
  const cursor = document.createElement('div');
  cursor.innerHTML =
    '<svg width="38" height="38" viewBox="0 0 24 24"><path d="M4 2v17l4.5-4.2 3.1 6.7 2.8-1.3-3-6.5 6.1-.3z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>';
  const ring = document.createElement('div');
  Object.assign(cursor.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    zIndex: '2147483647',
    pointerEvents: 'none',
    transform: 'translate(-100px, -100px)',
  });
  Object.assign(ring.style, {
    position: 'absolute',
    left: '-18px',
    top: '-21px',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgb(59 130 246 / 0.35)',
    opacity: '0',
    transition: 'opacity 120ms',
  });
  cursor.prepend(ring);
  addEventListener(
    'mousemove',
    (event) =>
      (cursor.style.transform = `translate(${event.clientX - 6}px, ${event.clientY - 3}px)`),
    true,
  );
  addEventListener('mousedown', () => (ring.style.opacity = '1'), true);
  addEventListener('mouseup', () => (ring.style.opacity = '0'), true);
  document.documentElement.append(cursor);
}

/** Moves the mouse to the middle of something, at a pace you can follow */
async function moveTo(page: Page, target: Locator, ms = 600) {
  const box = await target.boundingBox();
  if (!box) throw new Error(`Nothing to move to: ${target}`);
  const to = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const from = await page.evaluate(() => window.__clipMouse ?? { x: 0, y: 0 });
  const steps = Math.max(1, Math.round(ms / 16));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const ease = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
    await page.mouse.move(
      from.x + (to.x - from.x) * ease,
      from.y + (to.y - from.y) * ease,
    );
    await page.waitForTimeout(16);
  }
  await page.evaluate((at) => (window.__clipMouse = at), to);
}

async function clickOn(page: Page, target: Locator, ms?: number) {
  await moveTo(page, target, ms);
  await page.waitForTimeout(150);
  // If it moved on the way (a late layout), go on to where it is now
  await moveTo(page, target, 100);
  await page.mouse.down();
  await page.waitForTimeout(120);
  await page.mouse.up();
}

declare global {
  interface Window {
    __clipMouse?: { x: number; y: number };
  }
}

const value = (page: Page, date: string, param: string) =>
  page.getByRole('button', { name: `Edit ${date}, ${param}:` });

/** The Weather step with the table's first rows in view, or with `at` (in
 * the step) just under the top bar */
async function weatherTable(
  page: Page,
  at: (section: Locator) => Locator = (section) => section.getByRole('table'),
) {
  const section = await planner(page, 'weather-data');
  const table = at(section);
  // Again until it stays: the step and the chart, laid out late, can move it
  for (let tries = 0, still = 0; still < 3 && tries < 30; tries++) {
    const top = await table.evaluate(
      (node) => node.getBoundingClientRect().top,
    );
    if (Math.abs(top - 72) < 2) still++;
    else {
      still = 0;
      await page.evaluate((y) => scrollTo(0, scrollY + y - 72), top);
    }
    await page.waitForTimeout(300);
  }
  await settle(page);
}

/** Edit Weather Data, opened on a day's value */
async function editWeather(page: Page, date: string, param: string) {
  await weatherTable(page);
  await value(page, date, param).click();
  await dialog(page).getByRole('grid').waitFor();
  await settle(page);
}

const cell = (page: Page, row: number, column: number) =>
  dialog(page)
    .locator(`[data-grid-row="${row}"]`)
    .getByRole('gridcell')
    .nth(column);

const CLIPS: Clip[] = [
  {
    name: 'weather-doesnt-match/change-one-day',
    open: weatherTable,
    play: async (page) => {
      await clickOn(page, value(page, '2025-01-03', 'High'), 900);
      await dialog(page).getByRole('grid').waitFor();
      await page.waitForTimeout(900);
      await page.keyboard.type('5.5', { delay: 180 });
      await page.waitForTimeout(400);
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1200);
      await clickOn(
        page,
        dialog(page).getByRole('button', { name: 'Apply', exact: true }),
        900,
      );
      await page.waitForTimeout(600);
    },
  },
  {
    name: 'weather-doesnt-match/change-several-days',
    open: (page) => editWeather(page, '2025-01-01', 'High'),
    play: async (page) => {
      // High, from the 2nd to the 6th (the grid moves on a row as it nears its end)
      await moveTo(page, cell(page, 1, 0), 900);
      await page.waitForTimeout(200);
      await page.mouse.down();
      await moveTo(page, cell(page, 4, 0), 900);
      await page.mouse.up();
      await page.waitForTimeout(700);
      await clickOn(page, dialog(page).getByPlaceholder('±0'), 800);
      await page.waitForTimeout(200);
      await page.keyboard.type('2', { delay: 180 });
      await page.waitForTimeout(300);
      await clickOn(
        page,
        dialog(page).getByRole('button', { name: 'Add', exact: true }),
        500,
      );
      await page.waitForTimeout(1600);
      await clickOn(
        page,
        dialog(page).getByRole('button', { name: 'Apply', exact: true }),
        900,
      );
      await page.waitForTimeout(600);
    },
  },
  {
    name: 'weather/check-for-updates',
    open: async (page) => {
      await planner(page, 'location');
      // Saved, so its weather is kept and the button checks for updates
      await page.keyboard.press('ControlOrMeta+s');
      const button = page.locator('#location-action-button');
      await button.filter({ hasText: 'Check for Updates' }).waitFor();
      // The source has since refined some days: a few highs by enough to
      // change color, a few by a little
      await page.route(
        'https://archive-api.open-meteo.com/**',
        async (route) => {
          const response = await route.fetch();
          const data = await response.json();
          const highs: number[] = data.daily.temperature_2m_max;
          const by = (i: number, d: number) =>
            (highs[i] = Math.round((highs[i] + d) * 10) / 10);
          for (const i of [2, 3, 4, 5, 6]) by(i, 4);
          for (const i of [9, 10, 11]) by(i, 0.3);
          await route.fulfill({ response, json: data });
        },
      );
      // Without its Saved toast
      await page
        .getByRole('button', { name: 'Dismiss toast' })
        .first()
        .waitFor();
      for (const toast of await page
        .getByRole('button', { name: 'Dismiss toast' })
        .all())
        await toast.click();
      await button.scrollIntoViewIfNeeded();
      await settle(page);
    },
    play: async (page) => {
      await clickOn(page, page.locator('#location-action-button'), 700);
      await dialog(page).getByText('Update Past Days').waitFor();
      await page.waitForTimeout(1100);
      await clickOn(
        page,
        dialog(page)
          .locator('label')
          .filter({ hasText: 'Update Past Days' })
          .locator('input + div'),
        700,
      );
      await page.waitForTimeout(600);
      await clickOn(
        page,
        dialog(page).getByRole('button', {
          name: /Choose which days to update/,
        }),
        700,
      );
      await page.waitForTimeout(800);
      await clickOn(
        page,
        dialog(page).getByRole('button', { name: /^Filters/ }),
        700,
      );
      await page.waitForTimeout(400);
      await clickOn(
        page,
        dialog(page).getByRole('checkbox', { name: /^New color/ }),
        600,
      );
      await page.waitForTimeout(1200);
      await clickOn(
        page,
        dialog(page).getByRole('button', { name: 'Back', exact: true }),
        700,
      );
      await page.waitForTimeout(500);
      await clickOn(
        page,
        dialog(page).getByRole('button', { name: /^Update \d+ Days?$/ }),
        700,
      );
      await page.waitForTimeout(600);
    },
  },
  {
    name: 'weather/table-filters',
    open: (page) =>
      weatherTable(page, (section) =>
        section.getByRole('button', { name: /^Filters/ }),
      ),
    play: async (page) => {
      const section = page.locator('#page-section-weather-data');
      await clickOn(
        page,
        section.getByRole('button', { name: /^Filters/ }),
        900,
      );
      await page.waitForTimeout(500);
      await clickOn(
        page,
        section.getByRole('checkbox', { name: /^Color/ }),
        700,
      );
      await page.waitForTimeout(700);
      await clickOn(
        page,
        section.getByRole('radio', { name: /^Color 3/ }),
        800,
      );
      await page.waitForTimeout(1200);
      await clickOn(
        page,
        section.getByRole('button', { name: /^Filters/ }),
        800,
      );
      await page.waitForTimeout(600);
      await clickOn(page, section.getByRole('button', { name: /^View/ }), 800);
      await page.waitForTimeout(400);
      await clickOn(
        page,
        menu(page).getByRole('menuitemcheckbox', { name: /Show Colors/ }),
        700,
      );
      await page.waitForTimeout(500);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(900);
      await clickOn(
        page,
        section.getByRole('button', { name: /: color details$/ }).first(),
        900,
      );
      await page.waitForTimeout(1400);
    },
  },
  {
    name: 'weather/import-csv',
    open: (page) =>
      weatherTable(page, (section) =>
        section.getByRole('group', { name: 'Weather Data' }),
      ),
    play: async (page) => {
      const section = page.locator('#page-section-weather-data');
      await clickOn(
        page,
        section.getByRole('button', { name: 'Edit', exact: true }),
        900,
      );
      await dialog(page).getByRole('grid').waitFor();
      await page.waitForTimeout(700);
      await clickOn(
        page,
        dialog(page).getByRole('button', { name: 'Import File' }),
        800,
      );
      await page.waitForTimeout(600);
      const chooser = page.waitForEvent('filechooser');
      await clickOn(
        page,
        dialog(page).getByRole('button', { name: 'Browse Files' }),
        800,
      );
      await (
        await chooser
      ).setFiles(join(root, 'scripts/docs-fixtures/my-readings.csv'));
      await page.waitForFunction(() =>
        /Read \d+ days?/.test(document.body.innerText),
      );
      await page.waitForTimeout(1400);
      // Folded away, so the grid's changed values show
      await clickOn(
        page,
        dialog(page).getByRole('button', { name: 'Import File' }),
        700,
      );
      await page.waitForTimeout(1800);
      await clickOn(
        page,
        dialog(page).getByRole('button', { name: 'Apply', exact: true }),
        900,
      );
      await page.waitForTimeout(600);
    },
  },
  {
    name: 'weather/grouping',
    open: (page) =>
      weatherTable(page, (section) =>
        section.getByRole('group', { name: 'Weather Data' }),
      ),
    play: async (page) => {
      const section = page.locator('#page-section-weather-data');
      await clickOn(
        page,
        section.getByRole('button', { name: /Grouping/ }),
        900,
      );
      await page.waitForTimeout(600);
      await clickOn(
        page,
        menu(page).getByRole('menuitemradio', { name: /Weekly/ }),
        700,
      );
      await page.waitForTimeout(1600);
    },
  },
  {
    name: 'choose-ranges/change-a-range',
    open: async (page) => {
      const section = await planner(page, 'gauges');
      await keepAt(page, section.locator('.range-to').nth(1), 260);
    },
    play: async (page) => {
      const section = page.locator('#page-section-gauges');
      await clickOn(page, section.locator('.range-to').nth(2), 800);
      await page.waitForTimeout(600);
      await page.keyboard.press('ControlOrMeta+a');
      await page.keyboard.type('21', { delay: 220 });
      await page.waitForTimeout(600);
      await clickOn(
        page,
        section.getByRole('button', { name: 'Save range for color 3' }),
        700,
      );
      await page.waitForTimeout(1800);
    },
  },
  {
    name: 'print-and-track/progress',
    open: async (page) => {
      const section = await planner(page, 'preview');
      await keepAt(page, section.getByTestId('progress-button'), 72);
    },
    play: async (page) => {
      const section = page.locator('#page-section-preview');
      await clickOn(page, section.getByTestId('progress-button'), 800);
      const editor = page.getByTestId('progress-editor');
      await editor.waitFor();
      await page.waitForTimeout(900);
      // The day opens the date picker, which a recording can't show: the
      // day is picked as it would be there
      await clickOn(page, editor.getByText('Tap to pick a day'), 700);
      await editor.locator('input[type="date"]').fill('2025-03-28');
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(900);
      const next = editor.getByTitle('On a day');
      await clickOn(page, next, 600);
      await page.waitForTimeout(400);
      await clickOn(page, next, 300);
      await page.waitForTimeout(800);
      await clickOn(
        page,
        dialog(page).getByRole('button', { name: 'Save', exact: true }),
        700,
      );
      await page.waitForTimeout(900);
      await clickOn(page, section.getByTestId('progress-menu'), 700);
      await page.waitForTimeout(500);
      await clickOn(
        page,
        menu(page).getByRole('menuitemcheckbox', { name: /Show my progress/ }),
        600,
      );
      await page.waitForTimeout(700);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1200);
    },
  },
  {
    name: 'plan-a-blanket/four-steps',
    open: async (page) => {
      await visit(page, '/');
      await page.getByPlaceholder('Enter a place').waitFor();
      await settle(page);
    },
    play: async (page) => {
      await clickOn(page, page.getByPlaceholder('Enter a place'), 700);
      await page.keyboard.type('London', { delay: 160 });
      const result = page
        .locator('.autocomplete > div')
        .filter({ hasText: /England/ })
        .first();
      await result.waitFor();
      await page.waitForTimeout(500);
      await clickOn(page, result, 600);
      await page.waitForTimeout(800);
      await clickOn(page, page.locator('#location-action-button'), 700);
      await page
        .getByRole('button', { name: /^Source:/ })
        .waitFor({ timeout: 60_000 });
      await dismissToasts(page);
      await page.waitForTimeout(1600);
      const step = (name: string) =>
        page.locator('#bottom-section-nav button').filter({ hasText: name });
      await clickOn(page, step('Colors'), 700);
      await page.waitForTimeout(1800);
      await clickOn(page, step('Preview'), 700);
      await page.waitForTimeout(1600);
    },
  },
  {
    name: 'publish-and-share/publish',
    open: async (page) => {
      await page
        .context()
        .grantPermissions(['clipboard-read', 'clipboard-write'], {
          origin: new URL(base).origin,
        });
      await signIn(page);
      await planner(page, 'preview');
      await saveProject(page);
      await keepAt(
        page,
        page.locator('#page-section-preview').getByRole('button', {
          name: /^Share/,
        }),
        120,
      );
    },
    play: async (page) => {
      const section = page.locator('#page-section-preview');
      const share = section.getByRole('button', { name: /^Share/ });
      await clickOn(page, share, 800);
      await page.waitForTimeout(700);
      await clickOn(
        page,
        menu(page).getByRole('menuitem', { name: /^Copy Link/ }),
        700,
      );
      await page.waitForTimeout(1800);
      await dismissToasts(page);
      await clickOn(page, share, 700);
      await page.waitForTimeout(600);
      await clickOn(
        page,
        menu(page).getByRole('menuitem', { name: /^Publish to Gallery/ }),
        700,
      );
      await dialog(page).getByText('Anonymous').waitFor();
      await page.waitForTimeout(1200);
      const anonymous = dialog(page).getByRole('checkbox', {
        name: /Anonymous/,
      });
      await clickOn(page, anonymous, 700);
      await page.waitForTimeout(1200);
      // Up to Publish: posting to the gallery needs the real site
      await moveTo(
        page,
        dialog(page).getByRole('button', { name: 'Publish', exact: true }),
        800,
      );
      await page.waitForTimeout(600);
    },
  },
];

// ***************
// Cards
// ***************

/** A Guides & Help card's picture, also its page's share picture: a frame
 * of the page's most telling part, from a shot's `open` or its own */
type Card = {
  slug: string;
  open: (page: Page) => Promise<Locator>;
  /** Frames the middle of a tall target, not its top */
  middle?: boolean;
};

/** The card's frame in CSS pixels; saved at twice that, 1200×630, the size
 * share pictures (og:image) are best at */
const CARD = { width: 600, height: 315 };
/** Wider parts are framed at most this wide, so their text stays readable */
const CARD_MAX_WIDTH = 900;

const shot = (name: string) => {
  const found = SHOTS.find((s) => s.name === name);
  if (!found) throw new Error(`No shot ${name} for a card`);
  return found.open;
};

const CARDS: Card[] = [
  {
    slug: 'plan-a-blanket',
    open: async (page) =>
      (await planner(page, 'preview')).locator('#preview-svg-image'),
  },
  {
    slug: 'weather-doesnt-match',
    open: async (page) => {
      await editWeather(page, '2025-01-03', 'High');
      return dialog(page);
    },
  },
  { slug: 'choose-ranges', open: async (page) => planner(page, 'gauges') },
  { slug: 'match-your-yarn', open: shot('match-your-yarn/choose-colorways') },
  {
    slug: 'knit-along-all-year',
    open: shot('knit-along-all-year/future-days'),
  },
  { slug: 'move-or-back-up', open: shot('library-and-account/project-menu') },
  { slug: 'publish-and-share', open: shot('explore/gallery') },
  {
    slug: 'ravelry-sync',
    open: async (page) => {
      // A gallery project's page, as a Ravelry project links to
      await visit(page, '/gallery');
      await page.locator('main a img').first().waitFor({ timeout: 30_000 });
      await page.locator('main a:has(img)').first().click();
      await page.waitForURL(/\/gallery\/\d+/);
      await page.locator('main img').first().waitFor();
      await page.waitForTimeout(2000);
      await settle(page);
      return page.locator('main');
    },
  },
  { slug: 'print-and-track', open: shot('download/pdf-options') },
  { slug: 'rain-snow-sunshine', open: shot('rain-snow-sunshine/rain-gauge') },
  { slug: 'location-and-dates', open: shot('location-and-dates/location') },
  { slug: 'weather', open: async (page) => planner(page, 'weather-data') },
  { slug: 'gauges-and-ranges', open: shot('gauges-and-ranges/ranges-menu') },
  { slug: 'colors-and-yarn', open: shot('colors-and-yarn/get-colors') },
  {
    slug: 'preview',
    // Another pattern than Plan a Blanket's rows
    open: async (page) => {
      const section = await planner(page, 'preview');
      await section.getByTitle('Preview 12-Point Star Layout').click();
      await settle(page);
      await page.waitForTimeout(800);
      return section.locator('#preview-svg-image');
    },
    middle: true,
  },
  {
    slug: 'download',
    open: async (page) => {
      const section = await planner(page, 'weather-data');
      await section
        .getByRole('button', { name: /^Download/ })
        .first()
        .click();
      await settle(page);
      return menu(page);
    },
  },
  { slug: 'palette-creator', open: shot('palette-creator/palette') },
  { slug: 'library-and-account', open: shot('library-and-account/card-menu') },
  {
    slug: 'gallery-and-ravelry',
    open: async (page) => {
      await visit(page, '/gallery/palettes');
      await page.waitForTimeout(4000);
      await settle(page);
      return page.locator('main');
    },
  },
  { slug: 'explore', open: shot('explore/colorway-finder') },
  { slug: 'credits', open: shot('weather/weather-source') },
];

/** Takes one card's picture in one theme */
async function card(context: BrowserContext, entry: Card, theme: string) {
  const page = await context.newPage();
  const target = await entry.open(page).catch(async (error) => {
    const failed = join(root, '.svelte-kit/docs-screenshot-failed.png');
    await page.screenshot({ path: failed, fullPage: true });
    console.error(`cards/${entry.slug} failed; the page is in ${failed}`);
    throw error;
  });
  await page.mouse.move(0, 0);
  await settle(page);
  const box = await target.boundingBox();
  if (!box) throw new Error(`cards/${entry.slug}: nothing to frame`);
  // From its top, centered on it, as wide as it is (within limits)
  const width = Math.min(Math.max(box.width + 32, CARD.width), CARD_MAX_WIDTH);
  const height = (width * CARD.height) / CARD.width;
  const viewport = page.viewportSize()!;
  // Wider than the frame: from its left edge, where its content starts
  const x = Math.min(
    Math.max(
      box.width + 32 > width ? box.x - 16 : box.x + box.width / 2 - width / 2,
      0,
    ),
    viewport.width - width,
  );
  const y = Math.max(
    entry.middle ? box.y + box.height / 2 - height / 2 : box.y - 16,
    0,
  );
  const png = join(root, `.svelte-kit/docs-card-${theme}.png`);
  await page.screenshot({
    path: png,
    clip: { x, y, width, height },
    animations: 'disabled',
  });
  const out = join(
    root,
    'static/images/docs/cards',
    `${entry.slug}-${theme}.jpg`,
  );
  await mkdir(dirname(out), { recursive: true });
  await run('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-i',
    png,
    '-vf',
    `scale=${CARD.width * 2}:${CARD.height * 2}:flags=lanczos`,
    '-q:v',
    '3',
    out,
  ]);
  await rm(png);
  await page.close();
}

const run = promisify(execFile);

/** Records one clip in one theme; returns its size in CSS pixels */
async function record(context: BrowserContext, clip: Clip, theme: string) {
  const page = await context.newPage();
  await clip.open(page).catch(async (error) => {
    const failed = join(root, '.svelte-kit/docs-screenshot-failed.png');
    await page.screenshot({ path: failed, fullPage: true });
    console.error(`${clip.name} failed; the page is in ${failed}`);
    throw error;
  });
  await page.evaluate(drawCursor);
  // The cursor starts a little in from the bottom right
  const start = {
    x: CLIP_VIEWPORT.width * 0.8,
    y: CLIP_VIEWPORT.height * 0.85,
  };
  await page.mouse.move(start.x, start.y);
  await page.evaluate((at) => (window.__clipMouse = at), start);

  const frames: { data: Buffer; time: number }[] = [];
  const cdp = await context.newCDPSession(page);
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    frames.push({
      data: Buffer.from(data, 'base64'),
      time: metadata.timestamp ?? Date.now() / 1000,
    });
    void cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', {
    format: 'png',
    maxWidth: CLIP_VIEWPORT.width * 2,
    maxHeight: CLIP_VIEWPORT.height * 2,
  });
  await page.waitForTimeout(1000);
  await clip.play(page).catch(async (error) => {
    const failed = join(root, '.svelte-kit/docs-screenshot-failed.png');
    await page.screenshot({ path: failed });
    console.error(`${clip.name} failed; the page is in ${failed}`);
    throw error;
  });
  // The end stays a moment before it starts again
  await page.waitForTimeout(1800);
  const end = Date.now() / 1000;
  await cdp.send('Page.stopScreencast');
  if (frames.length < 2) throw new Error(`${clip.name}: no frames recorded`);

  const dir = await mkdtemp(join(tmpdir(), 'docs-clip-'));
  const list: string[] = [];
  for (const [i, frame] of frames.entries()) {
    const file = join(dir, `${String(i).padStart(5, '0')}.png`);
    await writeFile(file, frame.data);
    const next = frames[i + 1]?.time ?? end;
    list.push(
      `file '${file}'`,
      `duration ${Math.max(next - frame.time, 0.02)}`,
    );
  }
  // The concat demuxer needs the last file again for its duration to count
  list.push(
    `file '${join(dir, `${String(frames.length - 1).padStart(5, '0')}.png`)}'`,
  );
  await writeFile(join(dir, 'frames.txt'), list.join('\n'));

  const out = join(root, 'static/images/docs', `${clip.name}-${theme}`);
  await mkdir(dirname(out), { recursive: true });
  await run('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-f',
    'concat',
    '-safe',
    '0',
    '-i',
    join(dir, 'frames.txt'),
    '-vf',
    'fps=30,scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p',
    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-crf',
    '26',
    '-tune',
    'animation',
    '-movflags',
    '+faststart',
    '-an',
    `${out}.mp4`,
  ]);
  // The poster, for whoever has motion reduced: the first frame
  await run('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-i',
    join(dir, '00000.png'),
    '-q:v',
    '3',
    `${out}.jpg`,
  ]);
  // A sheet of a frame a second, to check the clip without playing it
  const sheet = join(
    root,
    '.svelte-kit/docs-clips',
    `${clip.name}-${theme}.png`,
  );
  await mkdir(dirname(sheet), { recursive: true });
  await run('ffmpeg', [
    '-y',
    '-loglevel',
    'error',
    '-i',
    `${out}.mp4`,
    '-vf',
    'fps=1,scale=400:-1,tile=4x5',
    '-frames:v',
    '1',
    sheet,
  ]);
  await rm(dir, { recursive: true });
  await page.close();
  return CLIP_VIEWPORT;
}

/** Shots and clips show the site as launched: without the beta's banner */
function hideBetaBanner() {
  const style = document.createElement('style');
  style.textContent = 'aside[aria-label="Beta"] { display: none !important; }';
  document.addEventListener('DOMContentLoaded', () =>
    document.head.append(style),
  );
}

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
      await context.addInitScript(hideBetaBanner);
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
        : shot.inView
          ? await inView(page, target)
          : await target.boundingBox();
      if ((shot.trim || shot.inView) && box)
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
  for (const entry of CARDS) {
    if (only && `cards/${entry.slug}` !== only) continue;
    for (const theme of ['light', 'dark'] as const) {
      const context = await browser.newContext({
        baseURL: base,
        ignoreHTTPSErrors: true,
        viewport: { width: 1280, height: 1400 },
        colorScheme: theme,
        reducedMotion: 'reduce',
        deviceScaleFactor: 2,
      });
      await context.addInitScript(hideBetaBanner);
      await card(context, entry, theme);
      console.log(`cards/${entry.slug}-${theme}.jpg`);
      await context.close();
    }
  }
  const carded = new Set(CARDS.map((entry) => entry.slug));
  for (const { slug } of [...GUIDES, ...REFERENCE])
    if (!carded.has(slug)) console.warn(`No card picture for ${slug}`);
  // The screencast is at twice the size only with the scale forced
  const clipBrowser = await chromium.launch({
    args: ['--force-device-scale-factor=2'],
  });
  for (const clip of CLIPS) {
    if (only && clip.name !== only) continue;
    for (const theme of ['light', 'dark'] as const) {
      const context = await clipBrowser.newContext({
        baseURL: base,
        ignoreHTTPSErrors: true,
        viewport: CLIP_VIEWPORT,
        colorScheme: theme,
        deviceScaleFactor: 2,
      });
      await context.addInitScript(hideBetaBanner);
      sizes[clip.name] = await record(context, clip, theme);
      console.log(`${clip.name}-${theme}.mp4`);
      await context.close();
    }
  }
  await writeFile(
    join(root, 'src/lib/docs/docs-shots.json'),
    `${JSON.stringify(sizes, null, 2)}\n`,
  );
  await clipBrowser.close();
  await browser.close();
}

await main();
