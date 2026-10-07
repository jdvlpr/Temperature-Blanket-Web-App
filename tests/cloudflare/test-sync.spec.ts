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
  meta: { title: string; href?: string };
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

/** Edits a saved project, as saving it again in the Project Planner would. */
async function editProject(page: Page, id: string, title: string) {
  await page.evaluate(
    async ({ id, title }) => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const open = indexedDB.open('keyval-store');
        open.onsuccess = () => resolve(open.result);
        open.onerror = () => reject(open.error);
      });
      const store = db.transaction('keyval', 'readwrite').objectStore('keyval');
      const read = <T>(key: string) =>
        new Promise<T>((resolve) => {
          const request = store.get(key);
          request.onsuccess = () => resolve(request.result);
        });
      const project = await read<{ title: string }>(`p_${id}`);
      const index = await read<
        {
          id: string;
          meta: { title: string };
          sync: Record<string, unknown>;
        }[]
      >('projects_index');
      const item = index.find((i) => i.id === id)!;
      item.meta.title = title;
      item.sync = { ...item.sync, dirty: true, updatedAt: Date.now() };
      store.put({ ...project, title }, `p_${id}`);
      store.put(index, 'projects_index');
      await new Promise((resolve) => (store.transaction.oncomplete = resolve));
      db.close();
    },
    { id, title },
  );
}

/** Opens My Projects, which lists saved projects with how each is synced. */
async function openSavedProjects(page: Page, { empty = false } = {}) {
  await page.goto('/my-projects');
  if (!empty)
    await expect(
      page.getByRole('heading', { name: 'My Projects', exact: true }),
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
    // Working sync shows no notice
    await expect(laptop.getByTestId('sync-status')).toHaveCount(0);
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

    // Moving it to the Trash on My Projects deletes it from the account
    await phone.goto('/my-projects');
    await phone.getByRole('button', { name: 'Delete Doomed' }).click();
    await expect.poll(() => serverProjectIds(phone)).toEqual([]);

    await laptop.reload();
    await expect.poll(async () => (await savedIndex(laptop)).length).toBe(0);

    // The account's Trash: the laptop, which never had it in its Trash, can
    // restore it, and it comes back everywhere
    await laptop.goto('/my-projects');
    await laptop.getByRole('button', { name: 'Trash (1)' }).click();
    await laptop
      .getByRole('dialog')
      .getByRole('button', { name: 'Restore Doomed' })
      .click();
    await expect.poll(() => serverProjectIds(laptop)).toHaveLength(1);
    await phone.reload();
    await expect.poll(async () => (await savedIndex(phone)).length).toBe(1);

    // Deleted again on the phone (which keeps a copy in its own Trash), then
    // deleted forever on the laptop: the phone's copy doesn't bring it back
    await phone.goto('/my-projects');
    await phone.getByRole('button', { name: 'Delete Doomed' }).click();
    await expect.poll(() => serverProjectIds(phone)).toEqual([]);
    await laptop.goto('/my-projects');
    await laptop.getByRole('button', { name: 'Trash (1)' }).click();
    const trash = laptop.getByRole('dialog');
    await trash.getByRole('button', { name: 'Delete Doomed forever' }).click();
    await trash.getByRole('button', { name: 'Yes, Delete Forever' }).click();
    await expect(trash.getByText('The Trash is empty')).toBeVisible();

    await phone.goto('/my-projects');
    await expect(
      phone.getByRole('heading', { name: 'My Projects', exact: true }),
    ).toBeVisible();
    await expect(phone.getByRole('button', { name: /^Trash/ })).toHaveCount(0);
  });

  test('palettes sync between devices, Trash included', async ({
    browser,
    baseURL,
  }) => {
    const { phone, laptop } = await twoDevices(browser, baseURL!);
    const email = uniqueEmail('sync-palettes');
    await signIn(phone, phone.request, email);
    await signIn(laptop, laptop.request, email);

    await phone.goto('/yarn');
    const dialog = phone.getByRole('dialog');
    // Retried: a click before the page finishes loading does nothing
    await expect(async () => {
      // Save Palette is in the Save & Export menu
      await phone.getByRole('button', { name: 'Save & Export' }).click();
      await phone.getByRole('menuitem', { name: /^Save Palette/ }).click();
      await expect(dialog.getByLabel('Name (optional)')).toBeVisible({
        timeout: 1000,
      });
    }).toPass();
    await dialog.getByLabel('Name (optional)').fill('Shared Dusk');
    await dialog
      .getByRole('button', { name: 'Save Palette', exact: true })
      .click();
    await expect(phone.getByText('Palette saved')).toBeVisible();

    const serverPalettes = async () =>
      (await (await phone.request.get('/api/sync/changes?since=0')).json())
        .palettes as { name: string; deletedAt: number | null }[];
    await expect
      .poll(async () => (await serverPalettes()).map((p) => p.name))
      .toEqual(['Shared Dusk']);

    // On the laptop, in My Projects
    await laptop.goto('/my-projects');
    const palettes = laptop.getByRole('list', { name: 'Saved palettes' });
    await expect(palettes.getByText('Shared Dusk')).toBeVisible();

    // Deleted on the laptop: in the phone's Trash too
    await palettes.getByRole('button', { name: 'Delete Shared Dusk' }).click();
    await expect
      .poll(async () => (await serverPalettes())[0]?.deletedAt)
      .not.toBeNull();
    await phone.goto('/my-projects');
    await phone.getByRole('button', { name: 'Trash (1)' }).click();
    await expect(
      phone.getByRole('dialog').getByRole('list', { name: 'Trash' }),
    ).toContainText('Shared Dusk');
  });

  test('signing out removes synced projects, and asks only when some haven’t synced', async ({
    browser,
    baseURL,
  }) => {
    const { phone, laptop } = await twoDevices(browser, baseURL!);
    const email = uniqueEmail('sync-sign-out');
    await signIn(phone, phone.request, email);
    const userId = await userIdOf(phone);
    await saveProject(phone, 'Synced', {
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
      .toEqual(['Synced']);

    // Everything synced: no question, and the project leaves the laptop
    await laptop.goto('/account');
    await laptop.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(laptop.getByText('You’re not signed in.')).toBeVisible();
    await expect(laptop.getByRole('dialog')).toHaveCount(0);
    expect(await savedIndex(laptop)).toEqual([]);

    // A project that can't upload: asked first, and only that one stays
    await phone.route(`${new URL(baseURL!).origin}/api/sync/**`, (route) =>
      route.request().method() === 'GET' ? route.fallback() : route.abort(),
    );
    await saveProject(phone, 'Not synced yet', {
      ownerUserId: userId,
      rev: null,
      dirty: true,
      updatedAt: Date.now(),
    });
    await phone.goto('/account');
    await phone.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(
      phone
        .getByRole('dialog')
        .getByText('1 project hasn’t finished syncing to your account'),
    ).toBeVisible();
    await phone
      .getByRole('dialog')
      .getByRole('button', { name: 'Sign out', exact: true })
      .click();
    await expect(phone.getByText('You’re not signed in.')).toBeVisible();
    const kept = await savedIndex(phone);
    expect(kept.map((i) => i.meta.title)).toEqual(['Not synced yet']);
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

    // Visiting the account page finds the session over and forgets the account;
    // the project still shows
    await phone.goto('/account');
    await expect(phone.getByText('You’re not signed in.')).toBeVisible();
    await openSavedProjects(phone);
    await expect(phone.getByRole('link', { name: 'Still here' })).toBeVisible();
    await expect(phone.getByTestId('sync-label')).toHaveText('Sign in to sync');

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

  test('when both devices change a project, both versions are kept', async ({
    browser,
    baseURL,
  }) => {
    const { phone, laptop } = await twoDevices(browser, baseURL!);
    const email = uniqueEmail('sync-conflict');
    await signIn(phone, phone.request, email);
    await signIn(laptop, laptop.request, email);
    const id = await saveProject(phone, 'Original', {
      ownerUserId: await userIdOf(phone),
      rev: null,
      dirty: true,
      updatedAt: Date.now(),
    });
    await openSavedProjects(phone);
    await expect(phone.getByTestId('sync-label')).toHaveText('Synced');
    await openSavedProjects(laptop);
    await expect(laptop.getByTestId('sync-label')).toHaveText('Synced');

    // Both edit before either syncs
    await editProject(phone, id, 'Phone edit');
    await editProject(laptop, id, 'Laptop edit');

    await openSavedProjects(phone);
    await expect(phone.getByTestId('sync-label')).toHaveText('Synced');

    await openSavedProjects(laptop);
    await expect(
      laptop.getByRole('link', { name: 'Phone edit' }),
    ).toBeVisible();
    await expect(
      laptop.getByRole('link', {
        name: /^Laptop edit \(copy from this device, /,
      }),
    ).toBeVisible();
    await expect
      .poll(async () => (await serverProjectIds(laptop)).length)
      .toBe(2);
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

/** Builds a project in the Project Planner, with live weather for Austin. */
async function buildProject(page: Page) {
  await page.goto('/');
  await page.getByPlaceholder('Enter a place').fill('Austin');
  await page
    .getByRole('option', { name: 'Austin, Texas, United States' })
    .click();
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.getByText('°C / mm °F / in')).toBeVisible();
}

async function choosePattern(page: Page, label: string) {
  const tabBar = page.locator('#bottom-section-nav');
  await tabBar.getByRole('button', { name: 'Preview', exact: true }).click();
  await page.locator('#select-pattern-type').selectOption({ label });
}

/**
 * Two devices for the Project Planner: the test IP header goes only to this
 * site, since weather services reject cross-site requests that carry it.
 */
async function plannerDevices(browser: Browser, baseURL: string) {
  const pages: Page[] = [];
  for (let i = 0; i < 2; i++) {
    const context = await browser.newContext();
    contexts.push(context);
    const ip = randomTestIp();
    await context.route(`${new URL(baseURL).origin}/**`, (route) =>
      route.continue({
        headers: { ...route.request().headers(), 'CF-Connecting-IP': ip },
      }),
    );
    await context.addCookies([
      { name: '_clck', value: '1', url: baseURL },
      { name: '_clsk', value: '1', url: baseURL },
    ]);
    pages.push(await context.newPage());
  }
  return { phone: pages[0], laptop: pages[1] };
}

const openProjectId = (page: Page) =>
  new URL(page.url()).searchParams.get('project')!;

/** Opens the Project menu, where Save and the auto-save state are. */
async function openMenu(page: Page) {
  // Retried: a click before the page finishes loading does nothing
  await expect(async () => {
    await page.getByRole('button', { name: 'Project Options' }).click();
    await expect(
      page
        .getByRole('dialog')
        .getByRole('heading', { name: 'Project', exact: true }),
    ).toBeVisible({ timeout: 1000 });
  }).toPass();
}

/** Saves from the top bar, as someone does the first time. */
async function saveFromMenu(page: Page) {
  await page.getByTestId('save-button').click();
  await expect(page.getByText('Saved to your account.')).toBeVisible();
}

/** The auto-save state the Project button's icon shows */
async function saveState(page: Page) {
  return page.getByTestId('project-button').getAttribute('data-save-status');
}

test.describe('Auto-save', () => {
  test('after the first Save, changes save and sync by themselves', async ({
    browser,
    baseURL,
  }) => {
    const { phone, laptop } = await plannerDevices(browser, baseURL!);
    const email = uniqueEmail('autosave');
    await signIn(laptop, laptop.request, email);
    await buildProject(laptop);
    await saveFromMenu(laptop);
    await expect.poll(() => saveState(laptop)).toBe('Saved to your account');
    const id = openProjectId(laptop);

    // An edit, and no Save: once saved, the address bar holds the edited project
    await choosePattern(laptop, 'Calendar');
    await expect(laptop).toHaveURL(/clnr=/);
    await expect
      .poll(async () => {
        const item = (await savedIndex(laptop)).find((i) => i.id === id);
        return item?.sync?.dirty === false && item.meta.href === laptop.url();
      })
      .toBe(true);
    await expect.poll(() => saveState(laptop)).toBe('Saved to your account');

    // The other device gets the edited project
    await signIn(phone, phone.request, email);
    await expect
      .poll(
        async () =>
          (await savedIndex(phone)).find((i) => i.id === id)?.meta.href,
      )
      .toBe(laptop.url());

    // Opening it again isn't a change: nothing is uploaded
    const before = (await savedIndex(laptop)).find((i) => i.id === id)!.sync;
    await laptop.reload();
    await expect(
      laptop.getByText('Loaded project and weather data'),
    ).toBeVisible();
    await expect.poll(() => saveState(laptop)).toBe('Saved to your account');
    await laptop.waitForTimeout(4000);
    const after = (await savedIndex(laptop)).find((i) => i.id === id)!.sync;
    expect(after?.rev).toBe(before?.rev);
    expect(after?.updatedAt).toBe(before?.updatedAt);

    // Nor is opening the Project menu
    await openMenu(laptop);
    await expect(laptop.getByTestId('autosave-status')).toHaveText(
      'Saved to your account',
    );
    await laptop.waitForTimeout(2000);
    expect((await savedIndex(laptop)).find((i) => i.id === id)!.sync).toEqual(
      after,
    );

    // A copy from the Project menu leaves the original as it was
    await laptop
      .getByRole('dialog')
      .getByRole('button', { name: 'Save a Copy' })
      .click();
    await expect(laptop.getByText('Saved a copy.')).toBeVisible();
    const copyId = openProjectId(laptop);
    expect(copyId).not.toBe(id);
    await expect
      .poll(async () => (await serverProjectIds(laptop)).length)
      .toBe(2);
    expect((await savedIndex(laptop)).find((i) => i.id === id)!.sync).toEqual(
      after,
    );
  });

  test('a change from another device isn’t overwritten by one here', async ({
    browser,
    baseURL,
  }) => {
    const { phone, laptop } = await plannerDevices(browser, baseURL!);
    const email = uniqueEmail('autosave-conflict');
    await signIn(laptop, laptop.request, email);
    await buildProject(laptop);
    await saveFromMenu(laptop);
    const id = openProjectId(laptop);
    await expect
      .poll(async () => (await serverProjectIds(laptop)).includes(id))
      .toBe(true);

    // The phone changes it while the laptop still has it open
    await signIn(phone, phone.request, email);
    await expect
      .poll(async () => (await savedIndex(phone)).some((i) => i.id === id))
      .toBe(true);
    await editProject(phone, id, 'Changed on the phone');
    await openSavedProjects(phone);
    await expect(
      phone.getByRole('link', { name: 'Changed on the phone' }),
    ).toBeVisible();
    const serverTitle = async () => {
      const body = await (
        await laptop.request.get('/api/sync/changes?since=0')
      ).json();
      return body.changes.find((c: { id: string }) => c.id === id)?.title;
    };
    await expect.poll(serverTitle).toBe('Changed on the phone');

    // The laptop syncs (opening the account menu syncs, at most every 10 s)
    await laptop.waitForTimeout(10_000);
    await laptop.getByTestId('account-button').click();
    await expect(
      laptop.getByText(
        'This project was changed in another tab or on another device',
      ),
    ).toBeVisible();
    await laptop.keyboard.press('Escape');
    await expect.poll(() => saveState(laptop)).toBe('Not saved');

    // An edit here doesn't replace the phone's version
    await choosePattern(laptop, 'Calendar');
    await laptop.waitForTimeout(4000);
    expect(await serverTitle()).toBe('Changed on the phone');

    // Saved as a copy instead: a new project, which saves by itself from now on
    await laptop.getByRole('button', { name: 'Save a copy' }).click();
    await expect(laptop.getByText('Saved a copy.')).toBeVisible();
    const copyId = openProjectId(laptop);
    expect(copyId).not.toBe(id);
    await expect(laptop).toHaveURL(/clnr=/);
    await expect
      .poll(async () => (await serverProjectIds(laptop)).sort())
      .toEqual([id, copyId].sort());
    expect(await serverTitle()).toBe('Changed on the phone');
    await choosePattern(laptop, 'Chevrons');
    await expect(laptop).not.toHaveURL(/clnr=/);
    await expect(laptop).toHaveURL(new RegExp(`project=${copyId}`));
    await expect.poll(() => saveState(laptop)).toBe('Saved to your account');
  });

  test('a new project isn’t saved until someone saves it', async ({
    browser,
    baseURL,
  }) => {
    const { laptop } = await plannerDevices(browser, baseURL!);
    await signIn(laptop, laptop.request, uniqueEmail('autosave-new'));
    await buildProject(laptop);
    await choosePattern(laptop, 'Calendar');
    await laptop.waitForTimeout(4000);

    expect(await savedIndex(laptop)).toEqual([]);
    await openMenu(laptop);
    // Wider screens: the top bar says it isn't saved, not the menu
    await expect(laptop.getByTestId('autosave-status')).toHaveCount(0);
    await laptop.keyboard.press('Escape');
    await expect(laptop.getByTestId('save-button')).toHaveAccessibleName(
      'Save',
    );
  });
});
