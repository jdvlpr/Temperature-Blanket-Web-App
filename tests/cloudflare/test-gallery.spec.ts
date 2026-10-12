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
// Local WordPress site (see the plugin's dev/README.md).

import { expect, test } from '@playwright/test';
import { idbSet, localD1, randomTestIp, signIn, uniqueEmail } from './helpers';

test.beforeEach(async ({ page, context, baseURL }) => {
  await page.setExtraHTTPHeaders({ 'CF-Connecting-IP': randomTestIp() });
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
      name: '',
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
      page.getByRole('heading', { name: 'My Projects', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Other Gallery Pages' }),
    ).toHaveCount(0);
    await expect(page.getByTestId('gallery-name-status')).toHaveCount(0);
  });

  test('My Projects lists pages without a project here, and deleting the account asks about them', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('gallery-list');
    await signIn(page, request, email);
    const userId = userIdFor(email);
    const postId = 900_000_000 + Math.floor(Math.random() * 1e8);
    localD1(
      `insert into "galleryPost" ("postId", "userId", "projectId", "title", "publishedAt")
       values (${postId}, '${userId}', 'p1', 'Ottawa from 2025 to 2026', ${Date.now()})`,
    );

    // Its project (p1) isn't saved here, so it's listed on its own
    await page.goto('/my-projects');
    await expect(
      page.getByRole('heading', { name: 'Other Gallery Pages' }),
    ).toBeVisible();
    const pages = page.getByRole('list', { name: 'Other gallery pages' });
    await expect(
      pages.getByRole('link', { name: /Ottawa from 2025 to 2026/ }),
    ).toHaveAttribute('href', `/gallery/${postId}`);

    // Each page is included on the public gallery on its own; the display
    // name itself is on the Account page
    const include = pages.getByRole('checkbox', {
      name: 'With my name: Ottawa from 2025 to 2026',
    });
    await expect(include).not.toBeChecked();
    await expect(page.getByTestId('gallery-name-status')).toContainText(
      'add a display name',
    );
    await include.check();
    await expect(include).toBeChecked();
    await page.getByRole('link', { name: 'Account page', exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
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

  test('a saved project shows who can see it, and changing it changes its page', async ({
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
    // Its page, and an older one of the same project
    const postId = 700_000_000 + Math.floor(Math.random() * 1e8);
    localD1(
      `insert into "galleryPost" ("postId", "userId", "projectId", "title", "publishedAt")
       values (${postId}, '${userId}', '${id}', '${title}', ${Date.now()}),
              (${postId + 1}, '${userId}', '${id}', 'Older', ${Date.now() - 3_600_000})`,
    );

    await page.reload();
    // The project isn't in the account: leave it in this browser
    await page.getByRole('button', { name: /^Not now/ }).click();
    const sharing = page.getByRole('group', { name: `Sharing: ${title}` });
    const menu = sharing.getByRole('button', { name: /^Sharing:/ });
    await expect(menu).toHaveText(/: In the gallery\s*$/);
    await expect(
      sharing.getByRole('link', { name: /view its gallery page/ }),
    ).toHaveAttribute('href', `/gallery/${postId}`);
    // Unchanged since it was added: nothing to update
    await expect(
      sharing.getByRole('button', { name: /Update the gallery page/ }),
    ).toHaveCount(0);
    // The older page is listed on its own
    await expect(
      page
        .getByRole('list', { name: 'Other gallery pages' })
        .getByRole('link', { name: /Older/ }),
    ).toBeVisible();

    // With the name
    await menu.click();
    await page
      .getByRole('menuitemradio', { name: /In the gallery with my name/ })
      .click();
    await expect(menu).toHaveText(/with my name\s*$/);
    await expect(page.getByTestId('gallery-name-status')).toContainText(
      'By Ada Lovelace',
    );
    await expect(page.getByTestId('gallery-owner-page')).toBeVisible();
    expect(
      localD1(
        `select "showOwner" from "galleryPost" where "postId" = ${postId}`,
      )[0].showOwner,
    ).toBe(1);

    // Only the link: asks first, then takes the page off the gallery
    await menu.click();
    await page
      .getByRole('menuitemradio', { name: /Only people with the link/ })
      .click();
    // Both its pages, so the older one doesn't take the newer one's place
    await expect(sharing).toContainText('Remove its 2 gallery pages?');
    await sharing.getByRole('button', { name: 'Cancel' }).click();
    await expect(menu).toHaveText(/with my name\s*$/);
    // (WordPress, which trashes the post, isn't running here: as if it did)
    const removed: string[] = [];
    await page.route(`**/api/account/gallery/*`, (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      removed.push(new URL(route.request().url()).pathname.split('/').pop()!);
      return route.fulfill({ status: 204 });
    });
    await menu.click();
    await page
      .getByRole('menuitemradio', { name: /Only people with the link/ })
      .click();
    await sharing
      .getByRole('button', { name: 'Remove from the gallery' })
      .click();
    await expect(sharing).toHaveCount(0);
    expect(removed.sort()).toEqual([String(postId), String(postId + 1)]);
    await expect(
      page.getByRole('heading', { name: 'Other Gallery Pages' }),
    ).toHaveCount(0);
    // (Publishing is off here, so with no page there's nothing left to change)
  });

  test('a saved project goes to the gallery from My Projects, without leaving it', async ({
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

    // Publishing is off here: as if it were on, listing what's been sent (on
    // the context, which also sees the service worker's requests)
    const sent: Record<string, unknown>[] = [];
    await page.context().route('**/api/account/gallery**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname !== '/api/account/gallery') return route.fallback();
      if (route.request().method() === 'GET')
        return route.fulfill({
          json: {
            posts: sent.map((body, i) => ({
              postId: 900 + i,
              projectId: new URL(String(body.project_url)).searchParams.get(
                'project',
              ),
              title: body.title,
              publishedAt: Date.now(),
              kind: 'project',
              showOwner: false,
            })),
            publishing: true,
            settings: {
              showOwnerDefault: false,
              removeOnDelete: false,
              publicId: null,
            },
          },
        });
      sent.push(route.request().postDataJSON());
      return route.fulfill({
        json: { code: 200, message: 'Sent', link: '/gallery/900' },
      });
    });

    await page.reload();
    await page.getByRole('button', { name: /^Not now/ }).click();
    const menuFor = (name: string) =>
      page
        .getByRole('group', { name: `Sharing: ${name}` })
        .getByRole('button', { name: /^Sharing:/ });
    const addToGallery = async (name: string) => {
      await menuFor(name).click();
      await page
        .getByRole('menuitemradio', { name: /^In the gallery Anyone/ })
        .click();
    };
    const dialog = page.getByRole('dialog', {
      name: 'Send to Project Gallery',
    });
    await expect(menuFor('First test')).toHaveText(/Link only\s*$/);

    // The first one opens over My Projects; closing it leaves everything as it was
    await addToGallery('First test');
    await expect(dialog.locator('svg#preview-svg-image')).toBeVisible();
    await expect(page).toHaveURL(/\/my-projects$/);
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    expect(sent).toHaveLength(0);

    // Another one opens over the page too: it doesn't load again
    // (gone if the page loads again)
    await page.evaluate(() => Object.assign(window, { __notReloaded: true }));
    const send = async () => {
      await expect(dialog.locator('svg#preview-svg-image')).toBeVisible();
      await expect(page).toHaveURL(/\/my-projects$/);
      await dialog
        .getByRole('button', { name: /Yes, Send to Gallery/ })
        .click();
      await expect(dialog).toContainText(
        'The project gallery webpage has been created.',
      );
      await page.keyboard.press('Escape');
      await expect(dialog).toHaveCount(0);
    };
    await addToGallery('Second test');
    await send();
    expect(sent).toHaveLength(1);
    const projectUrl = new URL(String(sent[0].project_url));
    expect(projectUrl.searchParams.get('project')).toBe(second);
    // Only its own: nothing of the first one's is left
    expect(projectUrl.hash).toContain("l=3652462'2025010120250103");
    expect(projectUrl.hash).toContain('&rows=tavg(300)');
    expect(projectUrl.hash).not.toContain('prcp=');
    expect(projectUrl.hash).not.toContain('&w=');
    expect(projectUrl.hash).not.toContain('&n=');
    expect(sent[0].project_name).toBe('Second test');
    expect(sent[0].total_days).toBe(3);

    // Its row says so, without leaving the page
    await expect(menuFor('Second test')).toHaveText(/: In the gallery\s*$/);
    await expect(menuFor('First test')).toHaveText(/Link only\s*$/);

    // And back to the first, all of it
    await addToGallery('First test');
    await send();
    expect(sent).toHaveLength(2);
    const firstUrl = new URL(String(sent[1].project_url));
    expect(firstUrl.searchParams.get('project')).toBe(first);
    expect(firstUrl.hash).toContain("l=3652462'2025010120250102");
    expect(firstUrl.hash).toContain("prcp=ff0000(0'5)0000ff(5'10)");
    expect(firstUrl.hash).toContain("&rows=tmax'tmin'tavg'tmax(123)");
    expect(firstUrl.hash).toContain('&w=1');
    expect(sent[1].total_days).toBe(2);
    expect(await page.evaluate(() => '__notReloaded' in window)).toBe(true);
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
      page.getByRole('heading', { name: 'Projects by Grace Hopper' }),
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
