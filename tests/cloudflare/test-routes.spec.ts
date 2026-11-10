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

// Only meaningful under `wrangler dev` (pnpm test:e2e:cloudflare), which serves the
// build as the deployed Worker does: a request matching the root _redirects or a
// file in the build is answered without running the Worker; everything else runs it.

import { expect, test } from '@playwright/test';
import { existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const BUILD_DIR = '.svelte-kit/cloudflare';

// Gone, with no files: the root _redirects sends each on. A path under it to try.
const REDIRECTED = ['/blog/some-old-post', '/changelog'];

// Read inside the tests, not at collection time: Playwright collects tests before
// the webServer command rebuilds, so a module-level read could see a stale build.
function filesIn(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { recursive: true, encoding: 'utf8' }).map((file) =>
    file.split('\\').join('/'),
  );
}

/** Every prerendered page's address: about.html → /about, a/index.html → /a. */
function prerenderedPages(): string[] {
  return filesIn(BUILD_DIR)
    .filter(
      (file) =>
        file.endsWith('.html') &&
        file !== '404.html' &&
        !file.startsWith('_app/') &&
        !file.startsWith('pagefind/'),
    )
    .map(
      (file) =>
        '/' + file.replace(/(^|\/)index\.html$/, '').replace(/\.html$/, ''),
    );
}

test.describe('Cloudflare routing (Worker static assets)', () => {
  test('every prerendered page is served', async ({ request }) => {
    const pages = prerenderedPages();
    expect(pages.length).toBeGreaterThan(0);
    for (const path of pages) {
      const response = await request.get(path);
      expect.soft(response.status(), path).toBe(200);
      expect
        .soft(response.headers()['content-type'] ?? '', path)
        .toContain('text/html');
    }
  });

  test('gone routes redirect', async ({ request }) => {
    for (const path of REDIRECTED) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect.soft(response.status(), path).toBe(301);
    }
  });

  // A file under /api would be served in place of the Worker's answer. Only
  // the API's own docs pages (prerendered) may be there.
  test('no file in the build stands in for an API route', () => {
    const dir = join(BUILD_DIR, 'api');
    const notPages = filesIn(dir).filter(
      (file) => !file.endsWith('.html') && statSync(join(dir, file)).isFile(),
    );
    expect(notPages).toEqual([]);
  });

  test('API routes are served by the Worker', async ({ request }) => {
    const response = await request.get('/api/yarn-colorways/ping');
    expect(response.status()).toBe(200);
    expect(await response.json()).toEqual({ message: 'OK' });
  });
});
