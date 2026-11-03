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

const menu = (page: Page) => page.getByRole('menu').last();
const dialog = (page: Page) => page.getByRole('dialog').last();

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

/** The Weather step with the table's first rows in view */
async function weatherTable(page: Page) {
  const section = await planner(page, 'weather-data');
  const table = section.getByRole('table');
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
];

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
