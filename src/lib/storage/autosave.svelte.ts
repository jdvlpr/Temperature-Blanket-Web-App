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

// Saves changes to a saved project a moment after editing stops: in the
// signed-in account, where the save then syncs, or in this browser. New
// projects wait for the first Save, so trying things out doesn't fill the list,
// and projects only in this browser are never added to the account without
// asking (see addOpenProjectToAccount).

import { replaceState } from '$app/navigation';
import { account } from '$lib/accounts/summary.svelte';
import { project } from '$lib/state/project-state.svelte';
import {
  lastSavedAt,
  MAX_SAVED_PROJECT_NAME_LENGTH,
  ProjectStorage,
  type StoredProjectIndexItem,
} from '$lib/storage/projects.svelte';
import { sync } from '$lib/sync/status.svelte';
import { newProjectId } from '$lib/utils/project-id-utils';

/** Saves this long after the last change */
export const IDLE_MS = 2000;
/** While changes keep coming, saves at least this often */
export const MAX_WAIT_MS = 60_000;

export const autosave: {
  /** Whether changes to the open project save by themselves */
  on: boolean;
  /** Whether they save to the signed-in account; otherwise to this browser */
  account: boolean;
  /** `conflict`: another tab or device changed it since it opened here, so
  saving stops rather than overwrite that change */
  state: 'saved' | 'waiting' | 'saving' | 'error' | 'conflict';
  /** Whether the open project is saved at all (in this browser or the account) */
  stored: boolean;
} = $state({ on: false, account: false, state: 'saved', stored: false });

/** The project as last opened or saved, to tell a real change from none */
let baseline: string | null = null;
let baselineId: string | null = null;
/** When the stored copy was last changed, and whether it was the account's
then, as this page knows it */
let known: Stamp | null = null;
let weatherEdited = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let waitingSince = 0;
let saving: Promise<void> | null = null;
let renaming: Promise<void> | null = null;

function openProjectId(): string | null {
  try {
    return new URL(project.url.href).searchParams.get('project');
  } catch {
    return null;
  }
}

/** The open project as saved in this browser, if it is */
export async function storedItem() {
  const id = openProjectId();
  return (await ProjectStorage.getIndex()).find((i) => i.id === id);
}

type Stamp = { at: number | null; synced: boolean };
const stampOf = (item: StoredProjectIndexItem): Stamp => ({
  at: lastSavedAt(item),
  synced: Boolean(item.sync),
});

/**
 * Where changes to the open project save by themselves: the signed-in
 * account's, or only in this browser. Null when it isn't saved, or is another
 * account's, which Save adds to this one.
 */
async function savesTo(): Promise<'account' | 'browser' | null> {
  if (!openProjectId()) return null;
  const item = await storedItem();
  if (!item) return null;
  if (!item.sync) return 'browser';
  // The signed-in account, when accounts are on
  const userId = ProjectStorage.syncOwner();
  return userId && sync.active && item.sync.ownerUserId === userId
    ? 'account'
    : null;
}

/**
 * Whether another tab saved over the open project, or a sync brought in
 * another device's version, since this page opened or last saved. Only a save
 * or rename here, or a download, changes when it last changed.
 */
async function changedElsewhere(): Promise<boolean> {
  // A rename here changes it too
  if (renaming) await renaming;
  const item = await storedItem();
  const now = item ? stampOf(item) : null;
  // Added to the account or left it since: that's where it starts from now
  if (!known || !now || known.synced !== now.synced) {
    known = now;
    return false;
  }
  return known.at !== null && now.at !== known.at;
}

async function refresh() {
  const where = await savesTo();
  autosave.stored = Boolean(openProjectId() && (await storedItem()));
  autosave.on = where !== null;
  autosave.account = where === 'account';
  if (!autosave.on) {
    // Saved in this browser and unchanged since
    if (autosave.stored && project.url.href === baseline && !weatherEdited)
      project.status.saved = true;
    return;
  }
  if (await changedElsewhere()) {
    clearTimeout(timer);
    autosave.state = 'conflict';
    project.status.saved = false;
  }
  // Nothing waiting: leaving the page loses nothing
  else if (autosave.state === 'saved') project.status.saved = true;
}

async function rememberStored() {
  const item = await storedItem();
  known = item ? stampOf(item) : null;
}

/** A project opened, or another one did */
function opened(href: string) {
  baseline = href;
  baselineId = openProjectId();
  weatherEdited = false;
  clearTimeout(timer);
  waitingSince = 0;
  autosave.state = 'saved';
  // The version the page loaded, recorded before a sync could replace it
  const loaded = ProjectStorage.opened;
  if (loaded && loaded.id === baselineId) {
    known = { at: loaded.updatedAt, synced: loaded.synced };
    void refresh();
  } else void rememberStored().then(refresh);
}

/**
 * Called whenever the open project changes. The first call after opening is
 * the project as opened, not a change.
 */
export function projectChanged({ weather = false } = {}) {
  const href = project.url.href;
  if (baseline === null || openProjectId() !== baselineId) {
    opened(href);
    return;
  }
  if (weather) weatherEdited = true;
  if (autosave.state === 'conflict') return;
  if (href === baseline && !weatherEdited) {
    // Back to how it was saved, as with Undo
    clearTimeout(timer);
    waitingSince = 0;
    if (autosave.on) autosave.state = 'saved';
    if (autosave.on || autosave.stored) project.status.saved = true;
    return;
  }
  if (!autosave.on) return;
  autosave.state = 'waiting';
  if (!waitingSince) waitingSince = Date.now();
  clearTimeout(timer);
  timer = setTimeout(
    () => void saveNow(),
    Math.min(IDLE_MS, waitingSince + MAX_WAIT_MS - Date.now()),
  );
}

/** Why changes stopped saving, once another tab or device changed it */
export const changedElsewhereMessage = () =>
  `This project was changed ${
    autosave.account ? 'in another tab or on another device' : 'in another tab'
  }, so changes here aren’t being saved.`;

/** Saves a waiting change now, if there is one. */
export async function saveNow() {
  clearTimeout(timer);
  if (saving) await saving;
  if (autosave.state !== 'waiting') return;
  saving = (async () => {
    waitingSince = 0;
    if (!(await savesTo())) {
      autosave.on = false;
      return;
    }
    if (await changedElsewhere()) {
      autosave.state = 'conflict';
      project.status.saved = false;
      return;
    }
    autosave.state = 'saving';
    const href = project.url.href;
    try {
      // As Save does: the address bar holds the saved project
      // eslint-disable-next-line svelte/no-navigation-without-resolve
      replaceState(new URL(href), '');
      // Where it is: one only in this browser stays there
      await ProjectStorage.save({ toAccount: false });
      await rememberStored();
      baseline = href;
      weatherEdited = false;
      // Changes made while saving wait for the next save
      const changedSince = project.url.href !== href;
      autosave.state = changedSince ? 'waiting' : 'saved';
      project.status.saved = !changedSince;
      if (changedSince) timer = setTimeout(() => void saveNow(), IDLE_MS);
    } catch (e) {
      console.warn("Can't save project", e);
      autosave.state = 'error';
    }
  })();
  await saving;
  saving = null;
}

/**
 * Names the open project, or clears its name with an empty string. Its new
 * `updatedAt` is this page's own change, not another device's.
 */
export async function renameOpenProject(name: string) {
  const id = openProjectId();
  if (!id) return;
  const done = (async () => {
    await ProjectStorage.rename(id, name);
    await rememberStored();
  })();
  renaming = done;
  try {
    await done;
  } finally {
    if (renaming === done) renaming = null;
  }
}

/** After pressing Save: that's now the saved project. */
export async function projectSaved() {
  baseline = project.url.href;
  baselineId = openProjectId();
  weatherEdited = false;
  clearTimeout(timer);
  waitingSince = 0;
  autosave.state = 'saved';
  await rememberStored();
  await refresh();
}

/**
 * Adds the open project, saved only in this browser, to the signed-in account,
 * where it syncs and keeps saving by itself.
 */
export async function addOpenProjectToAccount() {
  const id = openProjectId();
  const userId = ProjectStorage.syncOwner();
  if (!id || !userId) return;
  // Waiting changes go in first, so what's added is what's here
  await saveNow();
  const { addToAccount } = await import('$lib/sync/sync.svelte');
  await addToAccount(userId, [id]);
  await rememberStored();
  await refresh();
}

/**
 * Saves the open project, as the Save button does: through autosave when it's
 * already on (never over another tab's or device's newer version), otherwise
 * as a first save, which signed in also adds it to the account. Returns the stored
 * project, or null when it couldn't be saved.
 */
export async function saveOpenProject() {
  if (autosave.on) {
    await saveNow();
    const id = openProjectId();
    project.status.saved = autosave.state === 'saved';
    return (await ProjectStorage.getIndex()).find((i) => i.id === id) ?? null;
  }

  // eslint-disable-next-line svelte/no-navigation-without-resolve
  replaceState(new URL(project.url.href), '');
  try {
    const item = await ProjectStorage.save();
    project.status.saved = true;
    await projectSaved();
    return item;
  } catch (e) {
    project.status.saved = false;
    project.status.error = {
      code: 1,
      message: 'Unable to save project to storage',
    };
    console.warn("Can't save project", { e });
    return null;
  }
}

/**
 * Saves the open project as a new one, leaving the saved original as it was.
 * Signed in, the copy is the account's and saves by itself from then on.
 * Also how changes are kept when another device changed the original.
 */
export async function saveCopy() {
  clearTimeout(timer);
  if (saving) await saving;
  const name = (await ProjectStorage.getById(project.id))?.name;
  project.id = newProjectId();
  project.createdAt = new Date().toISOString();
  // eslint-disable-next-line svelte/no-navigation-without-resolve
  replaceState(new URL(project.url.href), '');
  let item = await ProjectStorage.save();
  // A named project's copy says so; otherwise its locations name it, as before
  if (item && name) {
    const copyName = `${name} (copy)`.slice(0, MAX_SAVED_PROJECT_NAME_LENGTH);
    await ProjectStorage.rename(project.id, copyName);
    item = { ...item, meta: { ...item.meta, name: copyName } };
  }
  project.status.saved = true;
  await projectSaved();
  return item;
}

if (typeof document !== 'undefined') {
  // Leaving the tab: save now, so the change can sync before the tab sleeps.
  // Coming back: another tab may have saved over it meanwhile.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void saveNow();
    else if (baseline !== null) void refresh();
  });

  // Signing in or out, sync starting after the project opened, or a sync
  // bringing in another device's version
  $effect.root(() => {
    $effect(() => {
      void sync.active;
      void sync.version;
      void account.summary?.id;
      if (baseline !== null) void refresh();
    });
  });
}

/** For tests */
export function resetAutosave() {
  clearTimeout(timer);
  baseline = null;
  baselineId = null;
  known = null;
  weatherEdited = false;
  waitingSince = 0;
  saving = null;
  renaming = null;
  autosave.on = false;
  autosave.account = false;
  autosave.state = 'saved';
  autosave.stored = false;
}
