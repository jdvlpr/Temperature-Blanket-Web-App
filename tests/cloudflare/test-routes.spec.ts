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

// Only meaningful under `wrangler pages dev` (pnpm test:e2e:cloudflare), which honors _routes.json.
// Every page route excluded from the Worker must exist as a prerendered file, or it 404s in production.

import { expect, test } from '@playwright/test';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const BUILD_DIR = '.svelte-kit/cloudflare';

// Excluded so they never reach the Worker in production, but only exist in `pnpm dev`.
const DEV_ONLY_ROUTES = ['/.dev-tools/*'];

// Read inside the tests, not at collection time: Playwright collects tests before
// the webServer command rebuilds, so a module-level read could see a stale build.
function excludedRoutes() {
  const { exclude } = JSON.parse(
    readFileSync(join(BUILD_DIR, '_routes.json'), 'utf8'),
  ) as { exclude: string[] };
  // Static files like /favicon.ico or /.DS_Store aren't pages; skip them.
  const isFile = (route: string) => /\.[^/]+$/.test(route);
  return {
    pages: exclude.filter((route) => !route.endsWith('/*') && !isFile(route)),
    wildcards: exclude.filter(
      (route) => route.endsWith('/*') && !DEV_ONLY_ROUTES.includes(route),
    ),
  };
}

function htmlFilesIn(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, encoding: 'utf8' }).filter(
    (file) => file.endsWith('.html'),
  );
}

test.describe('Cloudflare routing (_routes.json)', () => {
  test('every static page route is prerendered', async ({ request }) => {
    const { pages } = excludedRoutes();
    expect(pages.length).toBeGreaterThan(0);
    for (const route of pages) {
      const response = await request.get(route);
      expect.soft(response.status(), route).toBe(200);
      expect
        .soft(response.headers()['content-type'] ?? '', route)
        .toContain('text/html');
    }
  });

  test('every static wildcard route has prerendered files', async ({
    request,
  }) => {
    const { wildcards } = excludedRoutes();
    for (const route of wildcards) {
      const prefix = route.slice(0, -2);
      const dir = join(BUILD_DIR, prefix);
      expect
        .soft(
          existsSync(dir) && readdirSync(dir).length > 0,
          `${route} has no files in the build`,
        )
        .toBe(true);
      for (const file of htmlFilesIn(dir)) {
        const path = `${prefix}/${file.replace(/(\/index)?\.html$/, '')}`;
        const response = await request.get(path);
        expect.soft(response.status(), path).toBe(200);
      }
    }
  });

  test('API routes are served by the Worker', async ({ request }) => {
    const response = await request.get('/api/yarn-colorways/ping');
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ message: 'OK' });
  });
});
