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

// Posting a saved project to Ravelry and managing its photos, from My
// Projects. Ravelry itself is faked in the browser (routes under
// /api/account/ravelry, and Ravelry's photo upload address), so no Ravelry
// app or account is needed. The server side is covered by unit tests.

import { expect, test, type Page } from '@playwright/test';
import { idbSet, signIn, uniqueEmail, useTestIp } from './helpers';

test.beforeEach(async ({ page, context, baseURL }) => {
  await useTestIp(page);
  await context.addCookies([
    { name: '_clck', value: '1', url: baseURL },
    { name: '_clsk', value: '1', url: baseURL },
  ]);
});

const TINY_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const TINY_PNG_URL = `data:image/png;base64,${TINY_PNG}`;
const RAVELRY_UPLOAD = 'https://api.ravelry.com/upload/image.json';

type FakePhoto = {
  photoId: number;
  sortOrder: number;
  isPicture: boolean;
  squareUrl: string | null;
  smallUrl: string | null;
  mediumUrl: string | null;
  medium2Url: string | null;
  aspectRatio: number | null;
};
type FakeLink = {
  projectId: string;
  url: string;
  postedAt: number;
  updatedAt: number;
  photos: FakePhoto[];
};

/**
 * Stands in for the app's Ravelry routes and Ravelry's upload address: an
 * account that is connected as "ada", with the projects posted and photos
 * added through it kept in the test. Set on the context, which also sees the
 * service worker's requests.
 */
async function fakeRavelry(page: Page) {
  let link: FakeLink | null = null;
  let nextPhoto = 1;
  const calls: { method: string; path: string; body?: unknown }[] = [];
  const uploads: string[] = [];

  await page.context().route(RAVELRY_UPLOAD, (route) => {
    uploads.push(route.request().url());
    return route.fulfill({ status: 200, json: {} });
  });

  await page
    .context()
    .route(/\/api\/account\/ravelry(?:[/?]|$)/, async (route) => {
      const request = route.request();
      const method = request.method();
      const path = new URL(request.url()).pathname.replace(
        '/api/account/ravelry',
        '',
      );
      const hasBody = method === 'POST' || method === 'PUT';
      const body =
        hasBody && request.headers()['content-type']?.includes('json')
          ? request.postDataJSON()
          : undefined;
      if (method !== 'GET') calls.push({ method, path, body });

      if (path === '' && method === 'GET')
        return route.fulfill({
          json: {
            available: true,
            connected: true,
            username: 'ada',
            needsReconnect: false,
            failed: false,
          },
        });
      if (path === '/projects')
        return route.fulfill({ json: { projects: link ? [link] : [] } });
      if (path === '/options')
        return route.fulfill({
          json: {
            crafts: [{ id: 1, name: 'Crochet' }],
            statuses: [{ id: 1, name: 'In progress' }],
          },
        });
      if (path === '/yarns') return route.fulfill({ json: { yarns: [] } });

      const match = path.match(/^\/projects\/([^/]+)(?:\/(.*))?$/);
      if (!match) return route.fulfill({ status: 404, json: { message: '?' } });
      const [, projectId, rest] = match;

      if (!rest) {
        if (method === 'GET')
          return link
            ? route.fulfill({ json: { project: link } })
            : route.fulfill({
                status: 404,
                json: { code: 'NOT_FOUND', message: 'Not posted' },
              });
        if (method === 'POST') {
          link = {
            projectId,
            url: 'https://www.ravelry.com/projects/ada/x',
            postedAt: link?.postedAt ?? Date.now(),
            updatedAt: Date.now(),
            photos: link?.photos ?? [],
          };
          return route.fulfill({ json: { project: link } });
        }
        if (method === 'DELETE') {
          link = null;
          return route.fulfill({ json: { unlinked: true } });
        }
      }
      if (rest === 'photos/upload' && method === 'POST')
        return route.fulfill({
          json: { uploadToken: 't', uploadUrl: RAVELRY_UPLOAD },
        });
      if (rest === 'photos' && method === 'POST' && link) {
        const photo: FakePhoto = {
          photoId: nextPhoto++,
          sortOrder: link.photos.length,
          isPicture: Boolean((body as { picture?: boolean })?.picture),
          squareUrl: null,
          smallUrl: TINY_PNG_URL,
          mediumUrl: TINY_PNG_URL,
          medium2Url: null,
          aspectRatio: 1,
        };
        // The app's picture replaces its last one
        link.photos = [
          ...link.photos.filter((p) => !(photo.isPicture && p.isPicture)),
          photo,
        ];
        return route.fulfill({
          json: { photos: link.photos, processing: false },
        });
      }
      const photoMatch = rest?.match(/^photos\/(\d+)$/);
      if (photoMatch && method === 'DELETE' && link) {
        link.photos = link.photos.filter(
          (p) => p.photoId !== Number(photoMatch[1]),
        );
        return route.fulfill({ json: { photos: link.photos } });
      }
      return route.fulfill({ status: 404, json: { message: '?' } });
    });

  return { calls, uploads, link: () => link };
}

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

/** A saved project with its weather kept (edited, so it's always loaded). */
function savedProject(origin: string, id: string, name: string) {
  const href = new URL(
    `/?project=${id}#l=3652462'20250101${'20250103'}&temp=ff0000(0'15)0000ff(15'30)!mlh2t&u=m`,
    origin,
  ).href;
  const title = 'Quito from 2025-01-01 to 2025-01-03';
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
          to: '2025-01-03',
          duration: 'c',
          source: 'Meteostat',
        },
      ],
      title,
      weatherData: [0, 1, 2].map((i) => day(`2025-01-0${i + 1}`, 12 + 2 * i)),
      weatherSource: { name: 'Meteostat', useSecondary: false },
    },
    item: {
      id,
      meta: { date: 'today', href, title, name, isCustomWeatherData: true },
      updatedAt: Date.now() - 60_000,
    },
  };
}

/** What has the keyboard focus, as the test can tell. */
const focused = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return {
      tag: el?.tagName.toLowerCase(),
      type: el?.getAttribute('type') ?? null,
      confirm: el?.dataset.confirm ?? null,
    };
  });

test.describe('Ravelry', () => {
  test('a saved project is posted to Ravelry from its Share dialog, and its photos are managed', async ({
    page,
    request,
    baseURL,
  }) => {
    test.setTimeout(120_000);
    const email = uniqueEmail('ravelry');

    // A project saved in this browser before signing in, then added to the
    // account (posting to Ravelry needs it there)
    await page.goto('/privacy');
    const id = String(Date.now());
    const name = 'Alpine blanket';
    const saved = savedProject(baseURL!, id, name);
    await idbSet(page, {
      [`p_${id}`]: saved.project,
      projects_index: [saved.item],
    });
    await signIn(page, request, email);
    await page
      .getByRole('heading', { name: 'Add your projects to your account?' })
      .waitFor();
    await page.getByRole('button', { name: 'Add it' }).click();
    await expect
      .poll(
        async () =>
          (
            await (await page.request.get('/api/sync/changes?since=0')).json()
          ).changes.map((c: { id: string }) => c.id),
        { timeout: 20_000 },
      )
      .toEqual([id]);

    const ravelry = await fakeRavelry(page);
    await page.goto('/my-projects');
    const share = page.getByRole('button', { name: `Share ${name}` });
    await expect(share).toBeVisible();
    await expect(share.locator('..')).not.toContainText('On Ravelry');

    // Share has a Ravelry section: not posted yet
    await share.click();
    const dialog = page.getByRole('dialog', { name: `Share “${name}”` });
    await expect(
      dialog.getByRole('heading', { name: 'Ravelry', exact: true }),
    ).toBeVisible();
    await expect(dialog.locator('#share-ravelry + p')).toContainText(
      'Not posted',
    );
    await dialog.getByRole('button', { name: /^Post to Ravelry…/ }).click();

    // The project loads behind the Post dialog and its picture is drawn
    const post = page.getByRole('dialog', { name: 'Post to Ravelry' });
    await expect(post.locator('svg#preview-svg-image')).toBeVisible();
    await expect(page).toHaveURL(/\/my-projects$/);
    await expect(post.getByLabel('Project name on Ravelry')).toHaveValue(name);
    await expect(post.getByLabel('Craft')).toHaveValue('1');
    await expect(post.getByLabel('Status')).toHaveValue('1');
    await post.getByRole('button', { name: 'Post to Ravelry' }).click();
    await expect(post.getByText('Posted to Ravelry')).toBeVisible();
    await expect(
      post.getByRole('link', { name: /^View on Ravelry/ }),
    ).toHaveAttribute('href', 'https://www.ravelry.com/projects/ada/x');

    // What was sent: the project, then its picture as the project's picture
    const posted = ravelry.calls.find(
      (call) => call.method === 'POST' && call.path === `/projects/${id}`,
    )!.body as Record<string, unknown>;
    expect(posted).toMatchObject({
      name,
      craftId: 1,
      statusId: 1,
      started: '2025-01-01',
      finishBy: '2025-01-03',
    });
    expect(String(posted.link)).toContain(`project=${id}`);
    expect(
      ravelry.calls.find((call) => call.path === `/projects/${id}/photos`)
        ?.body,
    ).toEqual({ uploadToken: 't', picture: true });
    expect(ravelry.uploads).toHaveLength(1);

    await post.getByRole('button', { name: 'Done' }).click();
    await expect(post).toHaveCount(0);
    // Its card says so, with its photo
    await expect(share.locator('..')).toContainText('On Ravelry · 1 photo');

    // Share now has its Ravelry page and photos
    await share.click();
    await expect(dialog.locator('#share-ravelry + p')).toContainText(
      'On Ravelry · 1 photo',
    );
    await expect(
      dialog.getByRole('link', { name: /^View on Ravelry/ }),
    ).toHaveAttribute('href', 'https://www.ravelry.com/projects/ada/x');
    await dialog.getByRole('button', { name: /^Photos…/ }).click();

    // Photos: the app's picture is the first
    const photos = page.getByRole('dialog', { name: 'Photos on Ravelry' });
    await expect(photos.getByRole('list', { name: 'Photos' })).toBeVisible();
    await expect(
      photos.getByRole('button', { name: /^Delete photo/ }),
    ).toHaveCount(1);

    // Add a photo of your own, through the file input
    await photos.locator('input[type=file]').setInputFiles({
      name: 'blanket.png',
      mimeType: 'image/png',
      buffer: Buffer.from(TINY_PNG, 'base64'),
    });
    await expect(photos.getByText('Photo added.')).toBeVisible();
    await expect(
      photos.getByRole('button', { name: /^Delete photo/ }),
    ).toHaveCount(2);
    // Straight from the browser to Ravelry, with the token the app gave it
    expect(ravelry.uploads).toHaveLength(2);
    expect(
      ravelry.calls.filter((call) => call.path === `/projects/${id}/photos`),
    ).toHaveLength(2);
    expect(ravelry.link()?.photos.map((p) => p.isPicture)).toEqual([
      true,
      false,
    ]);

    // Delete the last: asks first, and the focus goes to the photo before it
    await photos.getByRole('button', { name: 'Delete photo 2' }).click();
    await expect(
      photos.getByText('Delete this photo on Ravelry too?'),
    ).toBeVisible();
    await expect(
      photos.getByRole('button', { name: 'Delete', exact: true }),
    ).toBeFocused();
    await photos.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(photos.getByText('Photo deleted.')).toBeVisible();
    await expect(
      photos.getByRole('button', { name: /^Delete photo/ }),
    ).toHaveCount(1);
    await expect
      .poll(() => focused(page))
      .toMatchObject({
        tag: 'button',
        confirm: 'photo-1',
      });

    // Delete the only one left: the focus goes to Add Photos
    await photos.getByRole('button', { name: 'Delete photo 1' }).click();
    await photos.getByRole('button', { name: 'Delete', exact: true }).click();
    await expect(photos.getByText('No photos yet.')).toBeVisible();
    await expect
      .poll(() => focused(page))
      .toMatchObject({ tag: 'input', type: 'file' });
    expect(ravelry.link()?.photos).toEqual([]);
    expect(
      ravelry.calls.filter((call) => call.method === 'DELETE').length,
    ).toBe(2);
    await page.keyboard.press('Escape');
    await expect(photos).toHaveCount(0);
    await expect(share.locator('..')).toContainText('On Ravelry');
    await expect(share.locator('..')).not.toContainText('photo');

    // Update on Ravelry: the picture and link always, the rest if chosen
    await share.click();
    await dialog.getByRole('button', { name: /^Update on Ravelry…/ }).click();
    const update = page.getByRole('dialog', { name: 'Update on Ravelry' });
    await expect(update.locator('svg#preview-svg-image')).toBeVisible();
    await update.getByLabel('Dates').check();
    await update.getByRole('button', { name: 'Update on Ravelry' }).click();
    await expect(update.getByText('Updated on Ravelry')).toBeVisible();
    const posts = ravelry.calls.filter(
      (call) => call.method === 'POST' && call.path === `/projects/${id}`,
    );
    expect(posts).toHaveLength(2);
    expect((posts[1].body as { update: unknown }).update).toEqual({
      name: false,
      dates: true,
      status: false,
      notes: false,
    });
    // (The picture replaced the last one: it was added again)
    expect(ravelry.link()?.photos.map((p) => p.isPicture)).toEqual([true]);
    await update.getByRole('button', { name: 'Done' }).click();
    await expect(share.locator('..')).toContainText('On Ravelry · 1 photo');

    // Unlink, from Photos: the project stays on Ravelry, but not here
    await share.click();
    await dialog.getByRole('button', { name: /^Photos…/ }).click();
    await photos.getByRole('button', { name: 'Unlink from Ravelry' }).click();
    await photos.getByRole('button', { name: 'Unlink', exact: true }).click();
    await expect(photos).toHaveCount(0);
    await expect(share.locator('..')).not.toContainText('On Ravelry');
    expect(ravelry.link()).toBeNull();
  });
});
