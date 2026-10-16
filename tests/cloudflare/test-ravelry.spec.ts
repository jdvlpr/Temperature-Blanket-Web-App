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

// Posting a saved project to Ravelry and editing it there (details, yarns,
// photos, all in one dialog), from its Share dialog. Ravelry itself is faked
// in the browser (routes under /api/account/ravelry, Ravelry's photo upload
// address, and the account's gallery pages, since posting needs the
// project's gallery page with the owner's name shown), so no Ravelry or
// WordPress app is needed. The server side is covered by unit tests.

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
const photoFile = (name: string) => ({
  name,
  mimeType: 'image/png',
  buffer: Buffer.from(TINY_PNG, 'base64'),
});

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
type FakePack = {
  packId: number;
  name: string;
  colorway: string;
  yarnId: number | null;
  ours: boolean;
};
type FakeDetails = {
  name: string;
  craftId: number | null;
  statusId: number | null;
  started: string | null;
  finishBy: string | null;
  completed: string | null;
  progress: number | null;
  notes: string;
  packs: FakePack[];
};
type FakeLink = {
  projectId: string;
  url: string;
  postedAt: number;
  updatedAt: number;
  photos: FakePhoto[];
  pictureKey: string | null;
};

/**
 * Stands in for the app's Ravelry routes and Ravelry's upload address: an
 * account that is connected as "ada", with the project posted and its photos
 * kept in the test, as the server keeps them (what's on Ravelry: details and
 * yarns; photos in order; the picture's key). Set on the context, which also
 * sees the service worker's requests.
 */
async function fakeRavelry(page: Page) {
  let link: FakeLink | null = null;
  let details: FakeDetails | null = null;
  let nextPhoto = 1;
  let nextPack = 1;
  /** Answer the next read as "deleted on Ravelry" */
  let goneNext = false;
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
            statuses: [
              { id: 1, name: 'In progress' },
              { id: 2, name: 'Finished' },
            ],
          },
        });
      if (path === '/yarns') return route.fulfill({ json: { yarns: [] } });

      const match = path.match(/^\/projects\/([^/]+)(?:\/(.*))?$/);
      if (!match) return route.fulfill({ status: 404, json: { message: '?' } });
      const [, projectId, rest] = match;

      if (!rest) {
        if (method === 'GET') {
          if (link && goneNext) {
            link = details = null;
            goneNext = false;
            return route.fulfill({
              status: 404,
              json: {
                code: 'RAVELRY_GONE',
                message:
                  'That project was deleted on Ravelry, so it’s unlinked here',
              },
            });
          }
          return link && details
            ? route.fulfill({ json: { project: link, details } })
            : route.fulfill({
                status: 404,
                json: { code: 'NOT_LINKED', message: 'Not posted' },
              });
        }
        if (method === 'POST') {
          const b = body as Record<string, unknown> & {
            yarns?: { name: string; colorway: string }[];
            packs?: {
              add: { name: string; colorway: string }[];
              remove: number[];
            };
          };
          if (!link || !details) {
            details = {
              name: String(b.name),
              craftId: (b.craftId as number) ?? null,
              statusId: (b.statusId as number) ?? null,
              started: (b.started as string) ?? null,
              finishBy: (b.finishBy as string) ?? null,
              completed: (b.completed as string) ?? null,
              progress: (b.progress as number) ?? null,
              notes: String(b.notes ?? ''),
              packs: (b.yarns ?? []).map((y) => ({
                packId: nextPack++,
                name: y.name,
                colorway: y.colorway,
                yarnId: null,
                ours: true,
              })),
            };
            link = {
              projectId,
              url: 'https://www.ravelry.com/projects/ada/x',
              postedAt: Date.now(),
              updatedAt: Date.now(),
              photos: [],
              pictureKey: null,
            };
          } else {
            const { packs, ...fields } = b;
            Object.assign(details, fields);
            details.packs = [
              ...details.packs.filter(
                (p) => !(packs?.remove ?? []).includes(p.packId),
              ),
              ...(packs?.add ?? []).map((y) => ({
                packId: nextPack++,
                name: y.name,
                colorway: y.colorway,
                yarnId: null,
                ours: true,
              })),
            ];
            link.updatedAt = Date.now();
          }
          return route.fulfill({ json: { project: link } });
        }
        if (method === 'DELETE') {
          link = details = null;
          return route.fulfill({ json: { unlinked: true } });
        }
      }
      if (rest === 'photos/upload' && method === 'POST')
        return route.fulfill({
          json: { uploadToken: 't', uploadUrl: RAVELRY_UPLOAD },
        });
      if (rest === 'photos' && method === 'POST' && link) {
        const { picture, pictureKey } = (body ?? {}) as {
          picture?: boolean;
          pictureKey?: string;
        };
        const photo: FakePhoto = {
          photoId: nextPhoto++,
          sortOrder: link.photos.length,
          isPicture: Boolean(picture),
          squareUrl: null,
          smallUrl: TINY_PNG_URL,
          mediumUrl: TINY_PNG_URL,
          medium2Url: null,
          aspectRatio: 1,
        };
        // The app's picture replaces its last one, and keeps its key
        link.photos = [
          ...link.photos.filter((p) => !(photo.isPicture && p.isPicture)),
          photo,
        ];
        if (photo.isPicture) link.pictureKey = pictureKey ?? null;
        return route.fulfill({
          json: { photos: link.photos, processing: false },
        });
      }
      if (rest === 'photos/order' && method === 'POST' && link) {
        const { photoIds } = body as { photoIds: number[] };
        link.photos = photoIds.map((id, i) => ({
          ...link!.photos.find((p) => p.photoId === id)!,
          sortOrder: i,
        }));
        return route.fulfill({ json: { photos: link.photos } });
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

  return {
    calls,
    uploads,
    link: () => link,
    details: () => details,
    /** Ravelry's other yarns, which this app didn't add, and one it did and no longer uses */
    addOldPacks: () =>
      details?.packs.push(
        {
          packId: 900,
          name: 'Old Yarn',
          colorway: 'Gone',
          yarnId: null,
          ours: true,
        },
        {
          packId: 901,
          name: 'Mine',
          colorway: 'Own',
          yarnId: null,
          ours: false,
        },
      ),
    deleteOnRavelry: () => (goneNext = true),
  };
}

/** The account's gallery pages: this project has one, showing the owner's name. */
async function fakeGalleryPage(page: Page, projectId: string, title: string) {
  await page.context().route(/\/api\/account\/gallery(?:\?.*)?$/, (route) =>
    route.request().method() === 'GET'
      ? route.fulfill({
          json: {
            posts: [
              {
                postId: 77,
                projectId,
                title,
                publishedAt: Date.now() - 30_000,
                kind: 'project',
                showOwner: true,
              },
            ],
            settings: {
              showOwnerDefault: true,
              removeOnDelete: false,
              publicId: 'ada-1',
            },
            publishing: true,
            name: 'Ada',
          },
        })
      : route.fallback(),
  );
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

test.describe('Ravelry', () => {
  test('a saved project is posted to Ravelry, then edited there with its photos, from one dialog', async ({
    page,
    request,
    baseURL,
  }) => {
    test.setTimeout(150_000);
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
    await fakeGalleryPage(page, id, name);
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
    await dialog.getByRole('button', { name: /^Post to Ravelry…/ }).click();

    // The project loads behind the dialog and its picture is drawn
    const post = page.getByRole('dialog', { name: 'Post to Ravelry' });
    await expect(post.locator('svg#preview-svg-image')).toBeVisible();
    await expect(page).toHaveURL(/\/my-projects$/);
    await expect(post.getByLabel('Project name on Ravelry')).toHaveValue(name);
    await expect(post.getByLabel('Craft')).toHaveValue('1');
    await expect(post.getByLabel('Status')).toHaveValue('1');
    await expect(post.getByLabel('Started')).toHaveValue('2025-01-01');
    await expect(post.getByLabel('Finish by')).toHaveValue('2025-01-03');
    await post.getByLabel('Progress (%)').fill('10');
    // A photo of its own goes up with it
    await post
      .locator('input[type=file]')
      .setInputFiles(photoFile('blanket.png'));
    await expect(post.getByText('New · blanket.png')).toBeVisible();
    await post.getByRole('button', { name: 'Post to Ravelry' }).click();
    await expect(post.getByText('Posted to Ravelry')).toBeVisible();
    await expect(
      post.getByRole('link', { name: /^View on Ravelry/ }),
    ).toHaveAttribute('href', 'https://www.ravelry.com/projects/ada/x');

    // What was sent: the project (the server builds the link line), then the
    // picture with its key, then the photo
    const posted = ravelry.calls.find(
      (call) => call.method === 'POST' && call.path === `/projects/${id}`,
    )!.body as Record<string, unknown>;
    expect(posted).toMatchObject({
      name,
      craftId: 1,
      statusId: 1,
      started: '2025-01-01',
      finishBy: '2025-01-03',
      progress: 10,
    });
    expect(posted).not.toHaveProperty('link');
    const photoPosts = ravelry.calls.filter(
      (call) => call.path === `/projects/${id}/photos`,
    );
    expect(photoPosts).toHaveLength(2);
    expect(photoPosts[0].body).toEqual({
      uploadToken: 't',
      picture: true,
      pictureKey: expect.stringMatching(/^[0-9a-f]{16}$/),
    });
    expect(photoPosts[1].body).toEqual({ uploadToken: 't', picture: false });
    expect(ravelry.uploads).toHaveLength(2);
    expect(ravelry.link()?.photos.map((p) => p.isPicture)).toEqual([
      true,
      false,
    ]);
    const pictureKey = ravelry.link()?.pictureKey;

    await post.getByRole('button', { name: 'Done' }).click();
    await expect(post).toHaveCount(0);
    await expect(share.locator('..')).toContainText('On Ravelry · 2 photos');

    // Update: opens with what's on Ravelry. The only change offered is a yarn
    // this app added that the project no longer uses
    ravelry.addOldPacks();
    await share.click();
    await dialog.getByRole('button', { name: /^Update on Ravelry…/ }).click();
    const update = page.getByRole('dialog', { name: 'Update on Ravelry' });
    await expect(update.getByLabel('Project name on Ravelry')).toHaveValue(
      name,
    );
    await expect(update.getByLabel('Progress (%)')).toHaveValue('10');
    await expect(update.getByText('Its picture is up to date')).toBeVisible();
    await expect(update.locator('svg#preview-svg-image')).toHaveCount(0);
    const save = update.getByRole('button', { name: 'Save on Ravelry' });

    // Yarns: one this app added and no longer uses is offered for removal;
    // one added on Ravelry never is
    const removeOld = update.getByLabel('Remove Old Yarn – Gone');
    await expect(removeOld).toBeChecked();
    await expect(update.getByLabel(/Mine/)).toHaveCount(0);
    await expect(update.getByLabel(/^Add .* – /)).toHaveCount(0);
    await expect(save).toBeEnabled();
    // Without it, nothing changed, so nothing to save
    await removeOld.uncheck();
    await expect(save).toBeDisabled();
    await removeOld.check();

    // Edit the name, move the photo earlier, add another
    await update
      .getByLabel('Project name on Ravelry')
      .fill('Alpine blanket II');
    await expect(save).toBeEnabled();
    await expect(
      update.getByText('Main photo · Picture from Temperature Blanket'),
    ).toBeVisible();
    await update.getByRole('button', { name: 'Move photo 2 earlier' }).click();
    await expect(update.getByText('Main photo · Photo 1')).toBeVisible();
    // The moved photo's button keeps the focus; at the start, the other one gets it
    await expect(
      update.getByRole('button', { name: 'Move photo 1 later' }),
    ).toBeFocused();
    await update
      .locator('input[type=file]')
      .setInputFiles(photoFile('second.png'));
    await save.click();
    await expect(update.getByText('Saved on Ravelry')).toBeVisible();

    // Only what changed was sent: the name, the unused yarn removed; the
    // picture wasn't drawn or sent again; the new photo went to the end and
    // the order was set
    const posts = ravelry.calls.filter(
      (call) => call.method === 'POST' && call.path === `/projects/${id}`,
    );
    expect(posts).toHaveLength(2);
    expect(posts[1].body).toEqual({
      name: 'Alpine blanket II',
      packs: { add: [], remove: [900] },
    });
    const photoCalls = ravelry.calls.filter(
      (call) => call.path === `/projects/${id}/photos`,
    );
    expect(photoCalls).toHaveLength(3);
    expect(photoCalls[2].body).toEqual({ uploadToken: 't', picture: false });
    expect(
      ravelry.calls.find((call) => call.path === `/projects/${id}/photos/order`)
        ?.body,
    ).toEqual({ photoIds: [2, 1, 3] });
    expect(ravelry.link()?.photos.map((p) => p.photoId)).toEqual([2, 1, 3]);
    expect(ravelry.link()?.pictureKey).toBe(pictureKey);
    expect(ravelry.details()?.name).toBe('Alpine blanket II');
    await update.getByRole('button', { name: 'Done' }).click();
    await expect(share.locator('..')).toContainText('On Ravelry · 3 photos');

    // Remove a photo: marked first, undoable, and only gone on Save
    await share.click();
    await dialog.getByRole('button', { name: /^Update on Ravelry…/ }).click();
    const again = page.getByRole('dialog', { name: 'Update on Ravelry' });
    await expect(again.getByText('Its picture is up to date')).toBeVisible();
    await expect(
      again.getByRole('button', { name: 'Save on Ravelry' }),
    ).toBeDisabled();
    const mark = again.getByRole('button', {
      name: 'Remove photo 1 from Ravelry',
    });
    await mark.click();
    await expect(mark).toHaveAttribute('aria-pressed', 'true');
    await expect(
      again.getByText('Will be removed', { exact: true }),
    ).toBeVisible();
    await mark.click();
    await expect(mark).toHaveAttribute('aria-pressed', 'false');
    await expect(
      again.getByRole('button', { name: 'Save on Ravelry' }),
    ).toBeDisabled();
    await mark.click();
    await again.getByRole('button', { name: 'Save on Ravelry' }).click();
    await expect(again.getByText('Saved on Ravelry')).toBeVisible();
    await expect(again.getByText('Removed 1 photo')).toBeVisible();
    expect(ravelry.calls.filter((call) => call.method === 'DELETE')).toEqual([
      { method: 'DELETE', path: `/projects/${id}/photos/2`, body: undefined },
    ]);
    // No project change was sent for that
    expect(
      ravelry.calls.filter(
        (call) => call.method === 'POST' && call.path === `/projects/${id}`,
      ),
    ).toHaveLength(2);
    expect(ravelry.link()?.photos.map((p) => p.photoId)).toEqual([1, 3]);
    await again.getByRole('button', { name: 'Done' }).click();

    // Deleted on Ravelry meanwhile: said so, and it's unlinked here
    ravelry.deleteOnRavelry();
    await share.click();
    await dialog.getByRole('button', { name: /^Update on Ravelry…/ }).click();
    const gone = page.getByRole('dialog', { name: 'Update on Ravelry' });
    await expect(gone.getByRole('alert')).toContainText('deleted on Ravelry');
    // The message's own Close, not the dialog's ✕
    await gone.getByText('Close', { exact: true }).click();
    await expect(gone).toHaveCount(0);
    await expect(share.locator('..')).not.toContainText('On Ravelry');
  });
});
