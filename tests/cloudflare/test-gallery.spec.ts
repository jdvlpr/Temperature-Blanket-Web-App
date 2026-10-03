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
import { localD1, randomTestIp, signIn, uniqueEmail } from './helpers';

test.beforeEach(async ({ page, context, baseURL }) => {
  await page.setExtraHTTPHeaders({ 'CF-Connecting-IP': randomTestIp() });
  await context.addCookies([
    { name: '_clck', value: '1', url: baseURL },
    { name: '_clsk', value: '1', url: baseURL },
  ]);
});

const userIdFor = (email: string) =>
  String(localD1(`select "id" from "user" where "email" = '${email}'`)[0].id);

test.describe('Gallery pages from accounts', () => {
  test('signed out, the routes refuse', async ({ request }) => {
    expect((await request.get('/api/account/gallery')).status()).toBe(401);
    expect(
      (await request.post('/api/account/gallery', { data: {} })).status(),
    ).toBe(401);
    expect((await request.delete('/api/account/gallery/1')).status()).toBe(401);
  });

  test('with publishing off, publishing pauses but settings work', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('gallery-off');
    await signIn(page, request, email);
    const api = page.request;

    const listed = await api.get('/api/account/gallery');
    expect(await listed.json()).toEqual({
      posts: [],
      settings: { showName: false, removeOnDelete: false, publicId: null },
      publishing: false,
      name: '',
    });

    const published = await api.post('/api/account/gallery', {
      data: { project_url: 'https://temperature-blanket.com/?project=x#h' },
    });
    expect(published.status()).toBe(503);
    expect((await published.json()).code).toBe('GALLERY_PAUSED');

    const patched = await api.patch('/api/account/gallery', {
      data: { showName: true },
    });
    expect((await patched.json()).settings).toEqual({
      showName: true,
      removeOnDelete: false,
      publicId: expect.stringMatching(/^[A-Za-z0-9]{12}$/),
    });
    expect(
      (await api.patch('/api/account/gallery', { data: {} })).status(),
    ).toBe(400);

    // Not this account's page
    expect((await api.delete('/api/account/gallery/123456')).status()).toBe(
      404,
    );

    // Nothing published and publishing off: no gallery section on My Projects
    await page.goto('/my-projects');
    await expect(
      page.getByRole('heading', { name: 'My Projects', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'My Public Gallery Pages' }),
    ).toHaveCount(0);
  });

  test('My Projects lists published pages, and deleting the account asks about them', async ({
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

    await page.goto('/my-projects');
    await expect(
      page.getByRole('heading', { name: 'My Public Gallery Pages' }),
    ).toBeVisible();
    const pages = page.getByRole('list', { name: 'Your gallery pages' });
    await expect(
      pages.getByRole('link', { name: /Ottawa from 2025 to 2026/ }),
    ).toHaveAttribute('href', `/gallery/${postId}`);

    // The name setting itself is on the Account page, linked from here
    await expect(page.getByTestId('gallery-name-status')).toContainText(
      'Your pages don’t show your name.',
    );
    await page
      .getByRole('link', { name: 'Change on your Account page' })
      .click();
    await expect(page).toHaveURL(/\/account$/);
    await page.getByText('Show my name on my gallery pages').click();
    await expect(
      page.getByText('Add a display name above to show it.'),
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
      }),
    ]);
  });

  test('an owner who shows their name gets a page listing their gallery pages', async ({
    page,
    request,
  }) => {
    const email = uniqueEmail('gallery-owner');
    await signIn(page, request, email);
    const userId = userIdFor(email);
    localD1(
      `update "user" set "name" = 'Grace Hopper' where "id" = '${userId}'`,
    );
    // One published page, so the account page shows its gallery section
    localD1(
      `insert into "galleryPost" ("postId", "userId", "projectId", "title", "publishedAt")
       values (${800_000_000 + Math.floor(Math.random() * 1e8)}, '${userId}', 'p1', 'Lima', ${Date.now()})`,
    );

    expect((await request.get('/gallery/by/AAAAAAAAAAAA')).status()).toBe(404);
    expect((await request.get('/gallery/by/not-an-id')).status()).toBe(404);

    const { settings } = await (
      await page.request.patch('/api/account/gallery', {
        data: { showName: true },
      })
    ).json();
    expect(settings.publicId).toMatch(/^[A-Za-z0-9]{12}$/);

    await page.goto(`/gallery/by/${settings.publicId}`);
    await expect(
      page.getByRole('heading', { name: 'Projects by Grace Hopper' }),
    ).toBeVisible();

    // Linked from My Projects
    await page.goto('/my-projects');
    await expect(page.getByTestId('gallery-owner-page')).toHaveAttribute(
      'href',
      `/gallery/by/${settings.publicId}`,
    );

    // Hiding the name takes the page down
    await page.request.patch('/api/account/gallery', {
      data: { showName: false },
    });
    expect(
      (await request.get(`/gallery/by/${settings.publicId}`)).status(),
    ).toBe(404);
  });
});
