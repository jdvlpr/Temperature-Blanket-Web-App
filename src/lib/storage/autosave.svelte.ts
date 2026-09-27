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

// Saves changes to a project that's already in the signed-in account, a moment
// after editing stops; the save then syncs. New projects wait for the first
// Save, so trying things out doesn't fill the account, and projects only in
// this browser are never added to the account without asking.

import { replaceState } from '$app/navigation';
import { account } from '$lib/accounts/summary.svelte';
import { project } from '$lib/state/project-state.svelte';
import { ProjectStorage } from '$lib/storage/projects.svelte';
import { sync } from '$lib/sync/status.svelte';

/** Saves this long after the last change */
export const IDLE_MS = 2000;
/** While changes keep coming, saves at least this often */
export const MAX_WAIT_MS = 60_000;

export const autosave: {
  /** Whether changes to the open project save by themselves */
  on: boolean;
  /** `conflict`: another device changed it since it opened here, so saving
  stops rather than overwrite that change */
  state: 'saved' | 'waiting' | 'saving' | 'error' | 'conflict';
} = $state({ on: false, state: 'saved' });

/** The project as last opened or saved, to tell a real change from none */
let baseline: string | null = null;
let baselineId: string | null = null;
/** When the stored copy was last changed, as this page knows it */
let knownUpdatedAt: number | null = null;
let weatherEdited = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let waitingSince = 0;
let saving: Promise<void> | null = null;

function openProjectId(): string | null {
  try {
    return new URL(project.url.href).searchParams.get('project');
  } catch {
    return null;
  }
}

async function storedItem() {
  const id = openProjectId();
  return (await ProjectStorage.getIndex()).find((i) => i.id === id);
}

/** Whether the open project is saved, and the signed-in account's. */
async function isAccountProject(): Promise<boolean> {
  // The signed-in account, when accounts are on
  const userId = ProjectStorage.syncOwner();
  if (!userId || !sync.active || !openProjectId()) return false;
  return (await storedItem())?.sync?.ownerUserId === userId;
}

/**
 * Whether a sync brought in another device's version since this page opened
 * or last saved. Only a save here or a download changes `updatedAt`.
 */
async function changedElsewhere(): Promise<boolean> {
  const updatedAt = (await storedItem())?.sync?.updatedAt ?? null;
  return knownUpdatedAt !== null && updatedAt !== knownUpdatedAt;
}

async function refresh() {
  autosave.on = await isAccountProject();
  if (!autosave.on) return;
  if (await changedElsewhere()) {
    clearTimeout(timer);
    autosave.state = 'conflict';
    project.status.saved = false;
  }
  // Nothing waiting: leaving the page loses nothing
  else if (autosave.state === 'saved') project.status.saved = true;
}

async function rememberStored() {
  knownUpdatedAt = (await storedItem())?.sync?.updatedAt ?? null;
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
    knownUpdatedAt = loaded.updatedAt;
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
    if (autosave.on) {
      autosave.state = 'saved';
      project.status.saved = true;
    }
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

/** Saves a waiting change now, if there is one. */
export async function saveNow() {
  clearTimeout(timer);
  if (saving) await saving;
  if (autosave.state !== 'waiting') return;
  saving = (async () => {
    waitingSince = 0;
    if (!(await isAccountProject())) {
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
      // As the Save dialog does: the address bar holds the saved project
      // eslint-disable-next-line svelte/no-navigation-without-resolve
      replaceState(new URL(href), '');
      await ProjectStorage.save();
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

/** After a Save from the Save dialog: that's now the saved project. */
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

if (typeof document !== 'undefined') {
  // Leaving the tab: save now, so the change can sync before the tab sleeps
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void saveNow();
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
  knownUpdatedAt = null;
  weatherEdited = false;
  waitingSince = 0;
  saving = null;
  autosave.on = false;
  autosave.state = 'saved';
}
