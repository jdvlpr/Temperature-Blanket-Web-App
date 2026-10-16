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

// Gallery pages from accounts under `wrangler pages dev`, with publishing from
// accounts switched off (GALLERY_PUBLISH_ENABLED unset), as on Pages previews.
// These tests never reach WordPress: publishing itself is tested against the
// Local WordPress site (see the plugin's dev/README.md), and the server's side
// of publishing and updating in place by src/lib/server/gallery/index.test.ts.
// Where a test needs publishing on, fakeGallery stands in for the app's routes
// in the browser.

import { expect, test, type Page } from '@playwright/test';
import { idbSet, localD1, signIn, uniqueEmail, useTestIp } from './helpers';

test.beforeEach(async ({ page, context, baseURL }) => {
  await useTestIp(page);
  await context.addCookies([
    { name: '_clck', value: '1', url: baseURL },
    { name: '_clsk', value: '1', url: baseURL },
  ]);
});

// A browser's DELETE says where it's from. Without that (or a body type),
// SvelteKit takes it for a cross-site form submission and refuses it (403).
const sameOrigin = (baseURL: string | undefined) => ({
  headers: { Origin: baseURL ?? '' },
});

const userIdFor = (email: string) =>
  String(localD1(`select "id" from "user" where "email" = '${email}'`)[0].id);

type FakePost = {
  postId: number;
  projectId: string;
  title: string;
  publishedAt: number;
  updatedAt?: number | null;
  kind?: 'project' | 'palette';
  link?: string | null;
  showOwner?: boolean;
};

/**
 * Stands in for the account's gallery routes, which can't publish here
 * (GALLERY_PUBLISH_ENABLED is off and WordPress isn't running): a list of
 * pages kept by the test that publishing adds to, PUT updates in place (the
 * page keeps its ID, so its link stays the same), PATCH changes Anonymous on
 * and DELETE removes. WordPress's side of an update (plugin route
 * `tbgalleryapi/v1/project/<id>` or `palette/<id>`, 404 for an unknown page)
 * is covered by src/lib/server/gallery/index.test.ts. Set on the context,
 * which also sees the service worker's requests.
 */
async function fakeGallery(page: Page, initial: FakePost[] = []) {
  const posts = [...initial];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calls: { method: string; postId?: number; body?: any }[] = [];
  let nextId = 900;
  await page.context().route('**/api/account/gallery**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const match = url.pathname.match(/^\/api\/account\/gallery(?:\/(\d+))?$/);
    if (!match) return route.fallback();
    const postId = match[1] ? Number(match[1]) : undefined;
    const method = request.method();
    const body =
      method === 'GET' || method === 'DELETE'
        ? undefined
        : request.postDataJSON();
    if (method !== 'GET') calls.push({ method, postId, body });
    const post = posts.find((p) => p.postId === postId);
    const answer = (p: FakePost) => ({
      code: 200,
      id: p.postId,
      link: `https://wp.example.test/${p.kind ?? 'project'}/${p.postId}/x/`,
      title: p.title,
      message: 'Success!',
    });

    if (method === 'GET' && postId === undefined)
      return route.fulfill({
        json: {
          posts,
          publishing: true,
          settings: {
            showOwnerDefault: false,
            removeOnDelete: false,
            publicId: null,
          },
          name: 'Ada Lovelace',
        },
      });
    if (method === 'POST' && postId === undefined) {
      const created: FakePost = {
        postId: nextId++,
        projectId: new URL(String(body.project_url)).searchParams.get(
          'project',
        )!,
        title: String(body.project_name || body.title),
        publishedAt: Date.now(),
        updatedAt: null,
        kind: 'project',
        showOwner: url.searchParams.get('showOwner') === 'true',
        // The link it was published from, as the server records it
        link: String(body.project_url),
      };
      posts.push(created);
      return route.fulfill({ json: answer(created) });
    }
    if (postId === undefined) return route.fallback();
    if (!post)
      return route.fulfill({
        status: 404,
        json: { code: 'NOT_FOUND', message: 'No such gallery page' },
      });
    if (method === 'PUT') {
      if (post.kind === 'palette') {
        post.title = body.title;
        post.link = body.yarnUrl;
      } else {
        post.title = String(body.project_name || body.title);
        post.link = String(body.project_url);
      }
      post.updatedAt = Date.now();
      return route.fulfill({ json: answer(post) });
    }
    if (method === 'PATCH' && typeof body?.showOwner === 'boolean') {
      post.showOwner = body.showOwner;
      return route.fulfill({
        json: { showOwner: body.showOwner, publicId: 'AAAAAAAAAAAA' },
      });
    }
    if (method === 'DELETE') {
      posts.splice(posts.indexOf(post), 1);
      return route.fulfill({ status: 204 });
    }
    return route.fallback();
  });
  return { posts, calls };
}

test.describe('Gallery pages from accounts', () => {
  test('signed out, the routes refuse', async ({ request, baseURL }) => {
    expect((await request.get('/api/account/gallery')).status()).toBe(401);
    expect(
      (await request.post('/api/account/gallery', { data: {} })).status(),
    ).toBe(401);
    expect(
      (
        await request.delete('/api/account/gallery/1', sameOrigin(baseURL))
      ).status(),
    ).toBe(401);
    expect(
      (
        await request.patch('/api/account/gallery/1', {
          data: { showOwner: true },
        })
      ).status(),
    ).toBe(401);
    // Updating a page in place is the account's too
    expect(
      (await request.put('/api/account/gallery/1', { data: {} })).status(),
    ).toBe(401);
  });

  test('with publishing off, publishing pauses but settings work', async ({
    page,
    request,
    baseURL,
  }) => {
    const email = uniqueEmail('gallery-off');
    await signIn(page, request, email);
    const api = page.request;

    const listed = await api.get('/api/account/gallery');
    expect(await listed.json()).toEqual({
      posts: [],
      settings: {
        showOwnerDefault: false,
        removeOnDelete: false,
        publicId: null,
      },
      publishing: false,
      // New accounts start with a made-up name
      name: expect.stringMatching(/^[A-Z][a-z]+ [A-Z][a-z]+ [1-9]\d$/),
    });

    const published = await api.post('/api/account/gallery', {
      data: { project_url: 'https://temperature-blanket.com/?project=x#h' },
    });
    expect(published.status()).toBe(503);
    expect((await published.json()).code).toBe('GALLERY_PAUSED');

    const patched = await api.patch('/api/account/gallery', {
      data: { showOwnerDefault: true },
    });
    expect((await patched.json()).settings).toEqual({
      showOwnerDefault: true,
      removeOnDelete: false,
      publicId: null,
    });
    expect(
      (await api.patch('/api/account/gallery', { data: {} })).status(),
    ).toBe(400);

    // Updating a page in place pauses with publishing
    const updated = await api.put('/api/account/gallery/123456', { data: {} });
    expect(updated.status()).toBe(503);
    expect((await updated.json()).code).toBe('GALLERY_PAUSED');

    // Not this account's page
    expect(
      (
        await api.delete('/api/account/gallery/123456', sameOrigin(baseURL))
      ).status(),
    ).toBe(404);
    expect(
      (
        await api.patch('/api/account/gallery/123456', {
          data: { showOwner: true },
        })
      ).status(),
    ).toBe(404);

    // Nothing published and publishing off: no sharing on My Projects
    await page.goto('/my-projects');
    await expect(
      page.getByRole('heading', { name: 'My Library', exact: true }),
    ).toBeVisible();
    await expect(page.getByTestId('gallery-name-status')).toHaveCount(0);
  });

  test('a saved project’s page is included on the public gallery, and deleting the account asks about it', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('gallery-list');
    await signIn(page, request, email);
    const userId = userIdFor(email);
    // No display name yet (new accounts start with a made-up one)
    localD1(`update "user" set "name" = '' where "id" = '${userId}'`);
    const postId = 900_000_000 + Math.floor(Math.random() * 1e8);

    // A saved project with a page
    await page.goto('/my-projects');
    const id = String(Date.now());
    const href = new URL(`/?project=${id}`, page.url()).href;
    const title = 'Ottawa from 2025 to 2026';
    await idbSet(page, {
      [`p_${id}`]: {
        createdAt: new Date().toISOString(),
        date: 'today',
        href,
        isCustomWeatherData: true,
        title,
        weatherData: [],
        weatherSource: { name: 'Meteostat', useSecondary: false },
      },
      projects_index: [
        {
          id,
          meta: { date: 'today', href, title, isCustomWeatherData: true },
          updatedAt: Date.now() - 60_000,
        },
      ],
    });
    localD1(
      `insert into "galleryPost" ("postId", "userId", "projectId", "title", "publishedAt")
       values (${postId}, '${userId}', '${id}', '${title}', ${Date.now()})`,
    );
    await page.reload();
    // The project isn't in the account: leave it in this browser
    await page.getByRole('button', { name: /^Not now/ }).click();
    await expect(
      page.getByRole('button', { name: `Share ${title}` }),
    ).toBeVisible();

    // Each page's Anonymous is set when publishing or updating it, not in its
    // Share dialog; the display name itself is in the Account page's Profile
    // settings
    await page
      .getByRole('button', { name: 'Share Ottawa from 2025 to 2026' })
      .click();
    const dialog = page.getByRole('dialog', {
      name: 'Share “Ottawa from 2025 to 2026”',
    });
    await expect(
      dialog.getByRole('button', { name: /^Edit Gallery Page/ }),
    ).toBeVisible();
    await expect(
      dialog.getByRole('checkbox', { name: /Anonymous/ }),
    ).toHaveCount(0);
    await expect(page.getByTestId('gallery-name-status')).toContainText(
      'Add a Name for Gallery Pages',
    );
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    // Its name shown (as Update Gallery Page does), with no display name yet
    expect(
      (
        await page.request.patch(`/api/account/gallery/${postId}`, {
          data: { showOwner: true },
        })
      ).ok(),
    ).toBe(true);
    await page
      .getByTestId('gallery-name-status')
      .getByRole('link', { name: 'Add a Name for Gallery Pages' })
      .click();
    await expect(page).toHaveURL(/\/account#display-name$/);
    await expect(
      page.getByLabel('Display name', { exact: true }),
    ).toBeFocused();
    await expect(
      page.getByText('Add a display name above to show it'),
    ).toBeVisible();
    await page.getByLabel('Display name', { exact: true }).fill('Ada Lovelace');
    await page.getByRole('button', { name: 'Save name' }).click();
    await expect(page.getByTestId('gallery-owner-page')).toBeVisible();

    await page.goto('/account');
    await page.getByRole('button', { name: 'Delete account' }).click();
    await expect(
      page.getByRole('radio', {
        name: 'Keep in the gallery, without your name',
      }),
    ).toBeChecked();
    await page.getByRole('radio', { name: 'Remove from the gallery' }).check();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // The download includes the page
    const exported = await page.request.get('/api/account/export');
    const data = await exported.json();
    expect(data.gallery.pages).toEqual([
      expect.objectContaining({
        title: 'Ottawa from 2025 to 2026',
        url: expect.stringMatching(new RegExp(`/gallery/${postId}$`)),
        onPublicGallery: true,
      }),
    ]);
  });

  test('a saved project shows if it is published, and its Share dialog changes its one page', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('gallery-sharing');
    await signIn(page, request, email);
    const userId = userIdFor(email);
    localD1(
      `update "user" set "name" = 'Ada Lovelace' where "id" = '${userId}'`,
    );

    // A project saved here before its page was added
    await page.goto('/my-projects');
    const id = String(Date.now());
    const href = new URL(`/?project=${id}`, page.url()).href;
    const title = 'Quito from 2025 to 2026';
    await idbSet(page, {
      [`p_${id}`]: {
        createdAt: new Date().toISOString(),
        date: 'today',
        href,
        isCustomWeatherData: true,
        title,
        weatherData: [],
        weatherSource: { name: 'Meteostat', useSecondary: false },
      },
      projects_index: [
        {
          id,
          meta: { date: 'today', href, title, isCustomWeatherData: true },
          updatedAt: Date.now() - 60_000,
        },
      ],
    });
    // Its page, published before the project was last saved
    const postId = 700_000_000 + Math.floor(Math.random() * 1e8);
    localD1(
      `insert into "galleryPost" ("postId", "userId", "projectId", "title", "publishedAt")
       values (${postId}, '${userId}', '${id}', '${title}', ${Date.now() - 3_600_000})`,
    );

    await page.reload();
    // The project isn't in the account: leave it in this browser
    await page.getByRole('button', { name: /^Not now/ }).click();
    const share = page.getByRole('button', { name: `Share ${title}` });
    await expect(share).toBeVisible();
    // One page, one status: Published, and changed since
    await expect(share.locator('..')).toContainText(
      'Published · changed since',
    );
    // Versions are gone
    await expect(page.getByText(/versions?\b/)).toHaveCount(0);

    await share.click();
    const dialog = page.getByRole('dialog', { name: `Share “${title}”` });
    // One list: the link first (a copy anyone can open), then its page
    await expect(dialog.getByRole('list', { name: 'Share' })).toBeVisible();
    await expect(
      dialog.getByRole('button', { name: /^Copy Link/ }),
    ).toBeVisible();
    // Gallery Page: its state, then its options
    const status = dialog.locator('#share-gallery-status');
    await expect(status).toContainText('Published');
    await expect(status).toContainText('Anonymous');
    await expect(
      dialog.getByRole('link', { name: /^View Gallery Page/ }),
    ).toHaveAttribute('href', `/gallery/${postId}`);
    // One way in to everything else, saying it changed since
    const edit = dialog.getByRole('button', { name: /^Edit Gallery Page/ });
    await expect(edit).toBeVisible();
    await expect(edit).toHaveAccessibleDescription(
      /Changed since its page was last updated/,
    );
    await expect(
      dialog.getByRole('button', { name: /^Publish to Gallery/ }),
    ).toHaveCount(0);
    await expect(
      dialog.getByRole('button', { name: /^Unpublish/ }),
    ).toHaveCount(0);

    // The name on the page: not changed here (it's in Edit Gallery Page), but
    // shown
    await expect(
      dialog.getByRole('checkbox', { name: /Anonymous/ }),
    ).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    expect(
      (
        await page.request.patch(`/api/account/gallery/${postId}`, {
          data: { showOwner: true },
        })
      ).ok(),
    ).toBe(true);
    expect(
      localD1(
        `select "showOwner" from "galleryPost" where "postId" = ${postId}`,
      )[0].showOwner,
    ).toBe(1);
    await page.reload();
    await share.click();
    await expect(status).toContainText('By Ada Lovelace');
    // (Close, not Escape: right after a reload, the thumbnail drawing can take
    // a key press)
    await dialog.getByRole('button', { name: 'Close' }).click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByTestId('gallery-name-status')).toContainText(
      'By Ada Lovelace',
    );
    await expect(page.getByTestId('gallery-owner-page')).toBeVisible();

    // Unpublish: asks first
    // (WordPress, which trashes the post, isn't running here: as if it did)
    const removed: string[] = [];
    await page.route(`**/api/account/gallery/*`, (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      removed.push(new URL(route.request().url()).pathname.split('/').pop()!);
      return route.fulfill({ status: 204 });
    });
    // In Edit Gallery Page, even when the project can't be got ready to
    // update (its edited weather isn't saved with it)
    await share.click();
    await edit.click();
    const editor = page.getByRole('dialog', { name: 'Edit Gallery Page' });
    await expect(editor).toContainText('edited weather data');
    await editor.getByRole('button', { name: /^Unpublish…/ }).click();
    await expect(editor).toContainText(`Unpublish “${title}”?`);
    await expect(
      editor.getByRole('button', { name: 'Unpublish', exact: true }),
    ).toBeFocused();
    await editor.getByRole('button', { name: 'Keep Published' }).click();
    expect(removed).toEqual([]);
    await expect(
      editor.getByRole('button', { name: /^Unpublish…/ }),
    ).toBeFocused();
    await editor.getByRole('button', { name: /^Unpublish…/ }).click();
    await editor
      .getByRole('button', { name: 'Unpublish', exact: true })
      .click();
    await expect(
      editor.getByRole('heading', { name: 'Unpublished' }),
    ).toBeFocused();
    expect(removed).toEqual([String(postId)]);
    await editor.getByRole('button', { name: 'Done' }).click();
    await expect(editor).toHaveCount(0);
    await expect(share.locator('..')).not.toContainText('Published');
    // (Publishing is off here, so with no page there's nothing left to change)
  });

  test('on its own gallery page, the owner edits it in the same dialog: their name, or unpublish', async ({
    page,
    request,
    browser,
    baseURL,
  }) => {
    const email = uniqueEmail('gallery-owner-menu');
    await signIn(page, request, email);
    const userId = userIdFor(email);
    localD1(
      `update "user" set "name" = 'Ada Lovelace' where "id" = '${userId}'`,
    );
    const postId = 900_000_000 + Math.floor(Math.random() * 1e7);
    localD1(
      `insert into "galleryPost" ("postId", "userId", "projectId", "title", "publishedAt")
       values (${postId}, '${userId}', 'p-bar', 'Lima', ${Date.now()})`,
    );

    await page.goto(`/gallery/${postId}`);
    const edit = page.getByRole('button', { name: /^Edit Gallery Page/ });
    // (The project isn't saved in this browser: only what needs just the page)
    await edit.click();
    const editor = page.getByRole('dialog', { name: 'Edit Gallery Page' });
    await expect(editor).toContainText('isn’t on this device yet');

    // Anonymous off: the name on this page
    const anonymous = editor.getByRole('checkbox', { name: /Anonymous/ });
    await expect(anonymous).toBeChecked();
    await anonymous.uncheck();
    await editor.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(editor.getByRole('heading', { name: 'Saved' })).toBeFocused();
    await editor.getByRole('button', { name: 'Done' }).click();
    await expect(editor).toHaveCount(0);
    // ("By" shows under the project's title, which needs WordPress)
    await expect
      .poll(
        () =>
          localD1(
            `select "showOwner" from "galleryPost" where "postId" = ${postId}`,
          )[0].showOwner,
      )
      .toBe(1);

    // Unpublish: asks first
    // (WordPress, which trashes the post, isn't running here: as if it did)
    const removed: string[] = [];
    await page.route(`**/api/account/gallery/*`, (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      removed.push(new URL(route.request().url()).pathname.split('/').pop()!);
      return route.fulfill({ status: 204 });
    });
    await edit.click();
    await editor.getByRole('button', { name: /^Unpublish…/ }).click();
    await expect(editor).toContainText('Unpublish “Lima”?');
    await editor.getByRole('button', { name: 'Keep Published' }).click();
    expect(removed).toEqual([]);
    await editor.getByRole('button', { name: /^Unpublish…/ }).click();
    await editor
      .getByRole('button', { name: 'Unpublish', exact: true })
      .click();
    await expect(editor).toHaveCount(0);
    await expect(page.getByTestId('gallery-page-edit')).toContainText(
      'Unpublished',
    );
    expect(removed).toEqual([String(postId)]);

    // Anyone else sees no button
    const visitor = await browser.newContext({ baseURL });
    const other = await visitor.newPage();
    await other.goto(`/gallery/${postId}`);
    await expect(
      other.getByRole('link', { name: 'Project Gallery' }),
    ).toBeVisible();
    await expect(other.getByTestId('gallery-page-edit')).toHaveCount(0);
    await visitor.close();
  });

  test('a saved project is published, then updated in place, from Share on My Projects, without leaving it', async ({
    page,
    request,
  }) => {
    await signIn(page, request, uniqueEmail('gallery-in-place'));

    // Two saved projects with their weather kept (edited, so it's always
    // loaded). The first has more in it than the second, to tell if any of
    // it is left behind when the second loads over it.
    await page.goto('/my-projects');
    const day = (date: string, t: number) => ({
      location: 0,
      date,
      tavg: { metric: t, imperial: t * 1.8 + 32 },
      tmin: { metric: t - 5, imperial: (t - 5) * 1.8 + 32 },
      tmax: { metric: t + 5, imperial: (t + 5) * 1.8 + 32 },
      prcp: { metric: 1, imperial: 0.04 },
      snow: { metric: 0, imperial: 0 },
      dayt: { metric: 43_200, imperial: 43_200 },
    });
    const saved = (id: string, name: string, days: number, extra: string) => {
      const to = `2025-01-0${days}`;
      const href = new URL(
        `/?project=${id}#l=3652462'20250101${to.replaceAll('-', '')}&temp=ff0000(0'15)0000ff(15'30)!mlh2t${extra}&u=m`,
        page.url(),
      ).href;
      const title = `Quito from 2025-01-01 to ${to}`;
      return {
        project: {
          name,
          createdAt: new Date().toISOString(),
          date: 'today',
          href,
          isCustomWeatherData: true,
          locations: [
            {
              id: 3652462,
              label: 'Quito',
              lat: '-0.22985',
              lng: '-78.52495',
              elevation: 2800,
              from: '2025-01-01',
              to,
              duration: 'c',
              source: 'Meteostat',
            },
          ],
          title,
          weatherData: Array.from({ length: days }, (_, i) =>
            day(`2025-01-0${i + 1}`, 12 + 2 * i),
          ),
          weatherSource: { name: 'Meteostat', useSecondary: false },
        },
        item: {
          id,
          meta: { date: 'today', href, title, name, isCustomWeatherData: true },
          updatedAt: Date.now() - 60_000,
        },
      };
    };
    const first = String(Date.now());
    const second = String(Date.now() + 1);
    // A rain gauge, week grouping, and rows with season targets
    const firstExtra =
      "&prcp=ff0000(0'5)0000ff(5'10)!mlh2t&rows=tmax'tmin'tavg'tmax(123)&w=1";
    const a = saved(first, 'First test', 2, firstExtra);
    const b = saved(second, 'Second test', 3, '&rows=tavg(300)');
    await idbSet(page, {
      [`p_${first}`]: a.project,
      [`p_${second}`]: b.project,
      projects_index: [a.item, b.item],
    });

    // Publishing is off here: as if it were on
    const gallery = await fakeGallery(page);
    const sent = () => gallery.calls.filter((call) => call.method === 'POST');
    const updates = () => gallery.calls.filter((call) => call.method === 'PUT');

    await page.reload();
    // In the account: a project's page follows the account's copy into the Trash
    await page.getByRole('button', { name: /^Add 2 projects/ }).click();
    const card = (name: string) =>
      page.getByRole('button', { name: `Share ${name}` }).locator('..');
    const shareDialog = (name: string) =>
      page.getByRole('dialog', { name: `Share “${name}”` });
    // From the card's Share dialog to the publish dialog
    const openFromShare = async (name: string, row: RegExp) => {
      await page.getByRole('button', { name: `Share ${name}` }).click();
      await shareDialog(name).getByRole('button', { name: row }).click();
    };
    const publishDialog = page.getByRole('dialog', {
      name: 'Publish to Gallery',
    });
    const updateDialog = page.getByRole('dialog', {
      name: 'Edit Gallery Page',
    });
    await expect(card('First test')).not.toContainText('Published');

    // The first opens over My Projects; closing it leaves everything as it was
    await openFromShare('First test', /^Publish to Gallery/);
    await expect(publishDialog.locator('svg#preview-svg-image')).toBeVisible();
    await expect(page).toHaveURL(/\/my-projects$/);
    await page.keyboard.press('Escape');
    await expect(publishDialog).toHaveCount(0);
    expect(sent()).toHaveLength(0);

    // Another one opens over the page too: it doesn't load again
    // (gone if the page loads again)
    await page.evaluate(() => Object.assign(window, { __notReloaded: true }));
    const send = async (
      dialog: typeof publishDialog,
      button: string,
      done: string,
    ) => {
      await expect(dialog.locator('svg#preview-svg-image')).toBeVisible();
      await expect(page).toHaveURL(/\/my-projects$/);
      await dialog.getByRole('button', { name: button, exact: true }).click();
      await expect(dialog.getByRole('heading', { name: done })).toBeVisible();
    };
    await openFromShare('Second test', /^Publish to Gallery/);
    await send(publishDialog, 'Publish', 'Published');
    await page.keyboard.press('Escape');
    await expect(publishDialog).toHaveCount(0);
    expect(sent()).toHaveLength(1);
    const projectUrl = new URL(String(sent()[0].body.project_url));
    expect(projectUrl.searchParams.get('project')).toBe(second);
    // Only its own: nothing of the first one's is left
    expect(projectUrl.hash).toContain("l=3652462'2025010120250103");
    expect(projectUrl.hash).toContain('&rows=tavg(300)');
    expect(projectUrl.hash).not.toContain('prcp=');
    expect(projectUrl.hash).not.toContain('&w=');
    expect(projectUrl.hash).not.toContain('&n=');
    expect(sent()[0].body.project_name).toBe('Second test');
    expect(sent()[0].body.total_days).toBe(3);

    // Its card says so, without leaving the page
    await expect(card('Second test')).toContainText('Published');
    await expect(card('First test')).not.toContainText('Published');
    const postId = gallery.posts[0].postId;

    // And the first, all of it
    await openFromShare('First test', /^Publish to Gallery/);
    await send(publishDialog, 'Publish', 'Published');
    await page.keyboard.press('Escape');
    expect(sent()).toHaveLength(2);
    const firstUrl = new URL(String(sent()[1].body.project_url));
    expect(firstUrl.searchParams.get('project')).toBe(first);
    expect(firstUrl.hash).toContain("l=3652462'2025010120250102");
    expect(firstUrl.hash).toContain("prcp=ff0000(0'5)0000ff(5'10)");
    expect(firstUrl.hash).toContain("&rows=tmax'tmin'tavg'tmax(123)");
    expect(firstUrl.hash).toContain('&w=1');
    expect(sent()[1].body.total_days).toBe(2);
    await expect(card('First test')).toContainText('Published');

    // Published: Share has its page, and updating it, not publishing again
    await page.getByRole('button', { name: 'Share Second test' }).click();
    const dialog = shareDialog('Second test');
    await expect(
      dialog.getByRole('button', { name: /^Publish to Gallery/ }),
    ).toHaveCount(0);
    await expect(
      dialog.getByRole('link', { name: /^View Gallery Page/ }),
    ).toHaveAttribute('href', `/gallery/${postId}`);
    // Changed since it was published (as if edited on another device): only
    // then is there something to update
    gallery.posts.find((p) => p.postId === postId)!.link = 'changed';
    await dialog.getByRole('button', { name: /^Edit Gallery Page/ }).click();
    await send(updateDialog, 'Save', 'Saved');
    // The same page: its link is the same, and nothing new was published
    await expect(
      updateDialog.getByRole('link', { name: /^View Gallery Page/ }),
    ).toHaveAttribute('href', `/gallery/${postId}`);
    expect(updates()).toHaveLength(1);
    expect(updates()[0].postId).toBe(postId);
    expect(
      new URL(String(updates()[0].body.project_url)).searchParams.get(
        'project',
      ),
    ).toBe(second);
    expect(updates()[0].body.project_name).toBe('Second test');
    expect(sent()).toHaveLength(2);
    expect(gallery.posts).toHaveLength(2);
    await page.keyboard.press('Escape');
    await expect(updateDialog).toHaveCount(0);
    await expect(card('Second test')).toContainText('Published');
    await expect(card('Second test')).not.toContainText('changed since');

    // Anonymous, from Edit Gallery Page (not the Share dialog): the name on
    // the page, changed on its own when the project is up to date
    await page.getByRole('button', { name: 'Share Second test' }).click();
    await expect(
      dialog.getByRole('checkbox', { name: /Anonymous/ }),
    ).toHaveCount(0);
    await dialog.getByRole('button', { name: /^Edit Gallery Page/ }).click();
    const owner = page.getByRole('dialog', { name: 'Edit Gallery Page' });
    const anonymous = owner.getByRole('checkbox', { name: /Anonymous/ });
    await expect(anonymous).toBeChecked();
    const apply = owner.getByRole('button', { name: 'Save', exact: true });
    await expect(apply).toBeDisabled();
    await anonymous.uncheck();
    await expect(owner.getByText('By Ada Lovelace')).toBeVisible();
    await apply.click();
    await expect(owner.getByText('Shows your name on its page')).toBeVisible();
    expect(gallery.posts.find((p) => p.postId === postId)?.showOwner).toBe(
      true,
    );
    expect(sent()).toHaveLength(2);
    await page.keyboard.press('Escape');
    await expect(owner).toHaveCount(0);
    await page.getByRole('button', { name: 'Share Second test' }).click();
    await expect(dialog.locator('#share-gallery-status')).toContainText(
      'By Ada Lovelace',
    );

    // Unpublish, from Edit Gallery Page: asks first, then Back to Share, where
    // it can be published again
    await dialog.getByRole('button', { name: /^Edit Gallery Page/ }).click();
    await owner.getByRole('button', { name: /^Unpublish…/ }).click();
    await owner.getByRole('button', { name: 'Keep Published' }).click();
    expect(gallery.posts).toHaveLength(2);
    await owner.getByRole('button', { name: /^Unpublish…/ }).click();
    await owner.getByRole('button', { name: 'Unpublish', exact: true }).click();
    await expect(
      owner.getByRole('heading', { name: 'Unpublished' }),
    ).toBeFocused();
    await owner.getByRole('button', { name: /^Back/ }).click();
    await expect(
      dialog.getByRole('button', { name: /^Publish to Gallery/ }),
    ).toBeVisible();
    expect(gallery.calls.filter((call) => call.method === 'DELETE')).toEqual([
      { method: 'DELETE', postId, body: undefined },
    ]);
    expect(gallery.posts.map((p) => p.postId)).not.toContain(postId);
    await page.keyboard.press('Escape');
    await expect(card('Second test')).not.toContainText('Published');
    await expect(card('First test')).toContainText('Published');
    expect(await page.evaluate(() => '__notReloaded' in window)).toBe(true);
  });

  test('a saved palette is updated in place from Share, keeping its page', async ({
    page,
    request,
    baseURL,
  }) => {
    await signIn(page, request, uniqueEmail('gallery-palette-update'));
    await page.goto('/my-palettes');
    const colors = 'ff0000ffa500';
    const now = Date.now();
    await idbSet(page, {
      saved_palettes: [
        {
          id: 'pal-sunset',
          name: 'Sunset',
          code: `palette:${colors}`,
          createdAt: now - 60_000,
          updatedAt: now - 60_000,
        },
      ],
    });
    const gallery = await fakeGallery(page, [
      {
        postId: 777,
        projectId: 'pal-sunset',
        kind: 'palette',
        title: 'Sunset',
        link: `${baseURL}/yarn?s=${colors}`,
        publishedAt: now,
        showOwner: false,
      },
    ]);
    await page.reload();
    await page.getByRole('button', { name: /^Not now/ }).click();

    const share = page.getByRole('button', { name: 'Share Sunset' });
    await expect(share.locator('..')).toContainText('Published');
    await share.click();
    const dialog = page.getByRole('dialog', { name: 'Share “Sunset”' });
    await dialog.getByRole('button', { name: /^Edit Gallery Page/ }).click();

    // Nothing to save until something differs; then its name and colors are
    // updated in place
    const update = page.getByRole('dialog', { name: 'Edit Gallery Page' });
    await expect(update.getByRole('textbox', { name: 'Name' })).toHaveValue(
      'Sunset',
    );
    const save = update.getByRole('button', { name: 'Save', exact: true });
    await expect(save).toBeDisabled();
    await expect(
      update.getByRole('button', { name: /^Unpublish…/ }),
    ).toBeVisible();
    await update.getByRole('textbox', { name: 'Name' }).fill('Sunset, Updated');
    await save.click();
    await expect(update.getByRole('heading', { name: 'Saved' })).toBeFocused();
    await expect(
      update.getByRole('link', { name: 'View Gallery Page' }),
    ).toHaveAttribute('href', '/gallery/palette/777');
    expect(gallery.calls.filter((call) => call.method === 'PUT')).toEqual([
      {
        method: 'PUT',
        postId: 777,
        body: {
          title: 'Sunset, Updated',
          yarnUrl: `${baseURL}/yarn?s=${colors}`,
        },
      },
    ]);
    expect(gallery.posts).toHaveLength(1);
    expect(gallery.posts[0].title).toBe('Sunset, Updated');
  });

  test('signed out, Share offers Copy Link and signing in to publish', async ({
    page,
    request,
  }) => {
    // Publishing needs an account: the old anonymous route is gone
    const gone = await request.post('/api/project', { data: {} });
    expect(gone.status()).toBe(410);
    expect((await gone.json()).code).toBe('SIGN_IN_TO_PUBLISH');

    await page.goto('/my-projects');
    const id = String(Date.now());
    const href = new URL(`/?project=${id}`, page.url()).href;
    const title = 'Oslo from 2025 to 2026';
    await idbSet(page, {
      [`p_${id}`]: {
        createdAt: new Date().toISOString(),
        date: 'today',
        href,
        isCustomWeatherData: true,
        title,
        weatherData: [],
        weatherSource: { name: 'Meteostat', useSecondary: false },
      },
      projects_index: [
        {
          id,
          meta: { date: 'today', href, title, isCustomWeatherData: true },
          updatedAt: Date.now() - 60_000,
        },
      ],
    });
    await page.reload();

    await page.getByRole('button', { name: `Share ${title}` }).click();
    const dialog = page.getByRole('dialog', { name: `Share “${title}”` });
    await expect(
      dialog.getByRole('button', { name: /^Copy Link/ }),
    ).toBeVisible();
    const signIn = dialog.getByRole('link', { name: /^Sign In to Publish/ });
    await expect(signIn).toHaveAttribute('href', /^\/auth\/sign-in/);
    await expect(
      dialog.getByRole('button', { name: /^Publish to Gallery/ }),
    ).toHaveCount(0);
  });

  test('an owner gets a page listing the gallery pages they include', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('gallery-owner');
    await signIn(page, request, email);
    const userId = userIdFor(email);
    localD1(
      `update "user" set "name" = 'Grace Hopper' where "id" = '${userId}'`,
    );
    const postId = 800_000_000 + Math.floor(Math.random() * 1e8);
    localD1(
      `insert into "galleryPost" ("postId", "userId", "projectId", "title", "publishedAt")
       values (${postId}, '${userId}', 'p1', 'Lima', ${Date.now()})`,
    );

    expect((await request.get('/gallery/by/AAAAAAAAAAAA')).status()).toBe(404);
    expect((await request.get('/gallery/by/not-an-id')).status()).toBe(404);

    const { publicId } = await (
      await page.request.patch(`/api/account/gallery/${postId}`, {
        data: { showOwner: true },
      })
    ).json();
    expect(publicId).toMatch(/^[A-Za-z0-9]{12}$/);

    await page.goto(`/gallery/by/${publicId}`);
    await expect(
      page.getByRole('heading', { name: 'Grace Hopper’s Gallery' }),
    ).toBeVisible();

    // Linked from My Projects
    await page.goto('/my-projects');
    await expect(page.getByTestId('gallery-owner-page')).toHaveAttribute(
      'href',
      `/gallery/by/${publicId}`,
    );

    // With nothing included any more, the page goes away
    await page.request.patch(`/api/account/gallery/${postId}`, {
      data: { showOwner: false },
    });
    expect((await request.get(`/gallery/by/${publicId}`)).status()).toBe(404);
  });
});
