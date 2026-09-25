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

// Project sync in the browser, with two browser contexts as two devices, under
// `wrangler pages dev`. Projects are written straight into IndexedDB (as the
// Project Planner saves them) so the tests don't depend on live weather data.
// The merge and conflict rules are unit-tested in src/lib/sync/engine.test.ts.

import {
  expect as baseExpect,
  test,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test';
import { localD1, randomTestIp, signIn, uniqueEmail } from './helpers';

// A sync pass is several requests, slower while the other specs run alongside
const expect = baseExpect.configure({ timeout: 15_000 });

type IndexItem = {
  id: string;
  meta: { title: string };
  sync?: {
    ownerUserId: string;
    rev: number | null;
    dirty: boolean;
    updatedAt?: number;
    lastSyncedAt?: number | null;
    error?: string | null;
  };
};

/** A new browser, as another device would be. */
async function device(browser: Browser, baseURL: string) {
  const context = await browser.newContext({
    extraHTTPHeaders: { 'CF-Connecting-IP': randomTestIp() },
  });
  // Pre-answer the analytics consent toast, which covers bottom buttons
  await context.addCookies([
    { name: '_clck', value: '1', url: baseURL },
    { name: '_clsk', value: '1', url: baseURL },
  ]);
  return { context, page: await context.newPage() };
}

/** Writes to idb-keyval's store, as ProjectStorage does. */
async function idbSet(page: Page, entries: Record<string, unknown>) {
  await page.evaluate(async (entries) => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open('keyval-store');
      open.onupgradeneeded = () => open.result.createObjectStore('keyval');
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const tx = db.transaction('keyval', 'readwrite');
    for (const [key, value] of Object.entries(entries))
      tx.objectStore('keyval').put(value, key);
    await new Promise((resolve) => (tx.oncomplete = resolve));
    db.close();
  }, entries);
}

async function savedIndex(page: Page): Promise<IndexItem[]> {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = indexedDB.open('keyval-store');
      open.onupgradeneeded = () => open.result.createObjectStore('keyval');
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const request = db
      .transaction('keyval')
      .objectStore('keyval')
      .get('projects_index');
    const index = await new Promise<IndexItem[] | undefined>(
      (resolve) => (request.onsuccess = () => resolve(request.result)),
    );
    db.close();
    return index ?? [];
  });
}

/** Saves a project in this browser, as the Project Planner would. */
async function saveProject(
  page: Page,
  title: string,
  sync?: IndexItem['sync'] & { updatedAt: number },
) {
  const id = String(Date.now() + Math.floor(Math.random() * 1000));
  const href = new URL(`/?project=${id}`, page.url()).href;
  const project = {
    createdAt: new Date().toISOString(),
    date: 'today',
    href,
    isCustomWeatherData: true,
    title,
    weatherData: [],
    weatherSource: { name: 'Meteostat', useSecondary: false },
  };
  const index = await savedIndex(page);
  index.push({
    id,
    meta: {
      date: 'today',
      href,
      title,
      isCustomWeatherData: true,
    } as IndexItem['meta'],
    ...(sync && { sync: { lastSyncedAt: null, error: null, ...sync } }),
  });
  await idbSet(page, { [`p_${id}`]: project, projects_index: index });
  return id;
}

/** Opens the Project Planner's list of saved projects (shown when there are any). */
async function openSavedProjects(page: Page, { empty = false } = {}) {
  await page.goto('/');
  // Retried: a click before the page finishes loading does nothing
  await expect(async () => {
    await page.getByRole('button', { name: 'Project Options' }).click();
    await expect(
      page
        .getByRole('dialog')
        .getByRole('heading', { name: 'Project', exact: true }),
    ).toBeVisible({ timeout: 1000 });
  }).toPass();
  if (!empty)
    await expect(
      page.getByRole('heading', { name: 'Saved Projects' }),
    ).toBeVisible();
}

const serverProjectIds = async (page: Page): Promise<string[]> => {
  const response = await page.request.get('/api/sync/changes?since=0');
  const body = await response.json();
  return body.changes
    .filter((c: { deleted: boolean }) => !c.deleted)
    .map((c: { id: string }) => c.id);
};

const userIdOf = async (page: Page): Promise<string> =>
  (await (await page.request.get('/api/account/export')).json()).account.id;

let contexts: BrowserContext[] = [];
test.afterEach(async () => {
  await Promise.all(contexts.map((c) => c.close()));
  contexts = [];
});

async function twoDevices(browser: Browser, baseURL: string) {
  const phone = await device(browser, baseURL);
  const laptop = await device(browser, baseURL);
  contexts.push(phone.context, laptop.context);
  return { phone: phone.page, laptop: laptop.page };
}

test.describe('Sync in the browser', () => {
  test('offers to add this browser’s projects, then shows them on another device', async ({
    browser,
    baseURL,
  }) => {
    const { phone, laptop } = await twoDevices(browser, baseURL!);
    const email = uniqueEmail('sync-two-devices');

    // A quiet page: the Project Planner rewrites its own URL as it loads
    await phone.goto('/privacy');
    const id = await saveProject(phone, 'Reykjavík 2026');

    await signIn(phone, phone.request, email);
    await expect(
      phone.getByRole('heading', {
        name: 'Add your projects to your account?',
      }),
    ).toBeVisible();
    await phone.getByRole('button', { name: 'Add it' }).click();
    await expect.poll(() => serverProjectIds(phone)).toEqual([id]);

    await signIn(laptop, laptop.request, email);
    // Nothing to add from a new browser
    await expect(
      laptop.getByRole('heading', {
        name: 'Add your projects to your account?',
      }),
    ).toHaveCount(0);
    await openSavedProjects(laptop);
    const link = laptop.getByRole('link', { name: 'Reykjavík 2026' });
    await expect(link).toBeVisible();
    // The link points at this site
    expect(await link.getAttribute('href')).toBe(
      new URL(`/?project=${id}`, baseURL).href,
    );
    await expect(laptop.getByTestId('sync-label')).toHaveText('Synced');
    await expect(laptop.getByTestId('sync-status')).toContainText(
      'Synced with your account',
    );
  });

  test('a project removed on one device is removed on the other', async ({
    browser,
    baseURL,
  }) => {
    const { phone, laptop } = await twoDevices(browser, baseURL!);
    const email = uniqueEmail('sync-delete');
    await signIn(phone, phone.request, email);
    await signIn(laptop, laptop.request, email);

    const userId = await userIdOf(phone);
    await saveProject(phone, 'Doomed', {
      ownerUserId: userId,
      rev: null,
      dirty: true,
      updatedAt: Date.now(),
    });
    await openSavedProjects(phone); // reloads, which syncs
    await expect(phone.getByTestId('sync-label')).toHaveText('Synced');

    await openSavedProjects(laptop);
    await expect(laptop.getByRole('link', { name: 'Doomed' })).toBeVisible();

    await phone.getByRole('button', { name: 'Remove Doomed' }).click();
    await expect.poll(() => serverProjectIds(phone)).toEqual([]);

    await laptop.reload();
    await expect.poll(async () => (await savedIndex(laptop)).length).toBe(0);
  });

  test('signing out keeps or removes the account’s projects, as chosen', async ({
    browser,
    baseURL,
  }) => {
    const { phone, laptop } = await twoDevices(browser, baseURL!);
    const email = uniqueEmail('sync-sign-out');
    await signIn(phone, phone.request, email);
    const userId = await userIdOf(phone);
    await saveProject(phone, 'Kept or not', {
      ownerUserId: userId,
      rev: null,
      dirty: true,
      updatedAt: Date.now(),
    });
    await openSavedProjects(phone);
    await expect(phone.getByTestId('sync-label')).toHaveText('Synced');

    await signIn(laptop, laptop.request, email);
    await expect
      .poll(async () => (await savedIndex(laptop)).map((i) => i.meta.title))
      .toEqual(['Kept or not']);

    // Remove from the laptop
    await laptop.goto('/account');
    await laptop.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(
      laptop.getByText('1 project from your account is saved in this browser.'),
    ).toBeVisible();
    await laptop.getByLabel('Remove them from this browser').check();
    await laptop
      .getByRole('dialog')
      .getByRole('button', { name: 'Sign out', exact: true })
      .click();
    await expect(laptop.getByText('You’re not signed in.')).toBeVisible();
    expect(await savedIndex(laptop)).toEqual([]);

    // Keep on the phone: it stays, as a project of this browser
    await phone.goto('/account');
    await phone.getByRole('button', { name: 'Sign out', exact: true }).click();
    await phone
      .getByRole('dialog')
      .getByRole('button', { name: 'Sign out', exact: true })
      .click();
    await expect(phone.getByText('You’re not signed in.')).toBeVisible();
    const kept = await savedIndex(phone);
    expect(kept.map((i) => i.meta.title)).toEqual(['Kept or not']);
    expect(kept[0].sync).toBeUndefined();
  });

  test('an ended session keeps projects here; another account can’t see them', async ({
    browser,
    baseURL,
  }) => {
    const { phone } = await twoDevices(browser, baseURL!);
    await signIn(phone, phone.request, uniqueEmail('sync-expired'));
    const userId = await userIdOf(phone);
    await saveProject(phone, 'Still here', {
      ownerUserId: userId,
      rev: null,
      dirty: true,
      updatedAt: Date.now(),
    });

    // The session ends on the server (expired, or signed out elsewhere)
    localD1(`delete from "session" where "userId" = '${userId}'`);

    await openSavedProjects(phone);
    await expect(phone.getByTestId('sync-status')).toContainText(
      'Your session ended.',
    );
    await expect(phone.getByRole('link', { name: 'Still here' })).toBeVisible();
    await expect(phone.getByTestId('sync-label')).toHaveText('Waiting to sync');

    // Someone else signs in on this browser
    await signIn(phone, phone.request, uniqueEmail('sync-other-person'));
    await openSavedProjects(phone, { empty: true });
    await expect(phone.getByRole('link', { name: 'Still here' })).toHaveCount(
      0,
    );
    expect((await savedIndex(phone)).map((i) => i.meta.title)).toEqual([
      'Still here',
    ]);
  });

  test('changes made offline sync when the browser reconnects', async ({
    browser,
    baseURL,
  }) => {
    const { phone } = await twoDevices(browser, baseURL!);
    await signIn(phone, phone.request, uniqueEmail('sync-offline'));
    const userId = await userIdOf(phone);
    await phone.goto('/');

    await phone.context().setOffline(true);
    const id = await saveProject(phone, 'Made offline', {
      ownerUserId: userId,
      rev: null,
      dirty: true,
      updatedAt: Date.now(),
    });
    expect(await serverProjectIds(phone).catch(() => [])).toEqual([]);

    await phone.context().setOffline(false);
    await expect.poll(() => serverProjectIds(phone)).toEqual([id]);
  });
});
