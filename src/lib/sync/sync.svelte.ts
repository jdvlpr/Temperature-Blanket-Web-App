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

// When to sync, and what the app shows about it. Loaded only once someone signs
// in, so guests never download it.
//
// Sync runs after a save (debounced), on sign-in, when the tab regains focus (at
// most once a minute) and when the browser comes back online. There's no timer:
// the free plan's daily request cap is shared by everyone. Only one tab syncs at
// a time, and a change during a sync schedules another pass.

import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { account } from '$lib/accounts/summary.svelte';
import { toast } from '$lib/state/page-state.svelte';
import { PaletteStorage, savedPalettes } from '$lib/storage/palettes.svelte';
import {
  applyAccountPreferences,
  leaveAccountPreferences,
  onPreferencesChange,
  pendingPreferences,
} from '$lib/storage/preferences-sync.svelte';
import { ProjectStorage } from '$lib/storage/projects.svelte';
import {
  syncAccount,
  SyncHttpError,
  type PaletteLocal,
  type PreferencesLocal,
  type SyncReport,
} from './engine';
import { createHttpSyncServer, sha256 } from './http';
import { sync } from './status.svelte';

export { sync, type SyncState } from './status.svelte';

// Only long enough to fold writes that land together into one pass
const SAVE_DELAY_MS = 300;
const FOCUS_INTERVAL_MS = 60_000;
const BUSY_RETRY_MS = 10_000;
// Long enough that trying out colors or settings one after another sends only
// the last
const PREFERENCES_DELAY_MS = 5_000;

let started = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let running: Promise<void> | null = null;
let again = false;
let lastFocusSync = 0;
/** The problem last shown in a toast, so each one is shown once */
let shownProblem: Problem | null = null;

const server = createHttpSyncServer();

const paletteLocal: PaletteLocal = {
  list: () => PaletteStorage.getAll(),
  apply: (userId, records) => PaletteStorage.applyFromAccount(userId, records),
  settle: (userId, sentUpdatedAt, record, applied) =>
    PaletteStorage.settleUpload(userId, sentUpdatedAt, record, applied),
  forgetMissing: (userId, onServer) =>
    PaletteStorage.forgetMissing(userId, onServer),
};

const preferencesLocal: PreferencesLocal = {
  apply: applyAccountPreferences,
  pending: pendingPreferences,
};

/** Syncs soon, folding several quick changes into one pass. */
export function scheduleSync(delay = SAVE_DELAY_MS) {
  if (!started) return;
  clearTimeout(timer);
  timer = setTimeout(() => void syncNow(), delay);
}

async function runPass(userId: string) {
  if (!navigator.onLine) {
    sync.state = 'offline';
    return;
  }
  sync.state = 'syncing';
  try {
    sync.lastReport = await syncAccount(
      userId,
      ProjectStorage.localStore(),
      server,
      {
        origin: location.origin,
        sha256,
        palettes: paletteLocal,
        preferences: preferencesLocal,
      },
    );
    sync.state = 'idle';
    sync.lastSyncedAt = Date.now();
  } catch (e) {
    if (!(e instanceof SyncHttpError)) {
      console.error('Sync failed', e);
      sync.state = 'error';
    } else if (e.status === 0) sync.state = 'offline';
    else if (e.status === 401) sync.state = 'signed-out';
    else if (e.code === 'SYNC_PAUSED') sync.state = 'paused';
    else sync.state = 'error';
  } finally {
    sync.version++;
    // Palettes from other devices show up in open lists
    await savedPalettes.refresh().catch(() => {});
  }
  await toastNewProblem(userId).catch(() => {});
}

type Problem = 'signed-out' | 'storage-full' | 'too-large';

const PROBLEMS: Record<Problem, { message: string; action: string }> = {
  'signed-out': {
    message: 'You’re signed out, so your projects aren’t syncing.',
    action: 'Sign in',
  },
  'storage-full': {
    message:
      'Your account’s storage is full, so some projects aren’t syncing. Remove projects you no longer need.',
    action: 'Your projects',
  },
  'too-large': {
    message:
      'A project is too large to sync. It’s still saved in this browser.',
    action: 'Your projects',
  },
};

async function currentProblem(userId: string): Promise<Problem | null> {
  if (sync.state === 'signed-out') return 'signed-out';
  const errors = new Set(
    (await ProjectStorage.getIndex())
      .filter((item) => item.sync?.ownerUserId === userId)
      .map((item) => item.sync?.error),
  );
  if (errors.has('QUOTA_EXCEEDED')) return 'storage-full';
  if (errors.has('PROJECT_TOO_LARGE')) return 'too-large';
  return null;
}

/** A toast when a problem someone must act on starts; routine syncs stay quiet. */
async function toastNewProblem(userId: string) {
  const problem = await currentProblem(userId);
  if (problem && problem !== shownProblem) {
    const { message, action } = PROBLEMS[problem];
    toast.trigger({
      message,
      category: 'error',
      autohide: false,
      action: { label: action, response: () => goto(resolve('/account')) },
    });
  }
  shownProblem = problem;
}

/** Syncs now, or right after the pass in progress. */
export async function syncNow(): Promise<void> {
  clearTimeout(timer);
  const userId = account.summary?.id;
  if (!started || !userId) return;
  if (running) {
    again = true;
    return running;
  }

  running = (async () => {
    do {
      again = false;
      // Another tab is syncing. It may have missed a change made here after it
      // started, so look again shortly.
      if (navigator.locks)
        await navigator.locks.request(
          'tb-sync',
          { ifAvailable: true },
          async (lock) => {
            if (lock) await runPass(userId);
            else scheduleSync(BUSY_RETRY_MS);
          },
        );
      else await runPass(userId);
    } while (again && started);
  })().finally(() => {
    running = null;
  });
  return running;
}

function onFocus() {
  if (document.visibilityState !== 'visible') return;
  if (Date.now() - lastFocusSync < FOCUS_INTERVAL_MS) return;
  lastFocusSync = Date.now();
  scheduleSync(0);
}

const onOnline = () => scheduleSync(0);

const LOOK_INTERVAL_MS = 10_000;

/** Syncs now when someone looks at their sync status, unless it just did. */
export function refreshSync() {
  if (Date.now() - (sync.lastSyncedAt ?? 0) < LOOK_INTERVAL_MS) return;
  scheduleSync(0);
}

/** Starts syncing the signed-in account. Safe to call again. */
export function startSync() {
  if (started) return;
  started = true;
  sync.active = true;
  ProjectStorage.onChange = () => scheduleSync();
  PaletteStorage.onChange = () => scheduleSync();
  onPreferencesChange(() => scheduleSync(PREFERENCES_DELAY_MS));
  document.addEventListener('visibilitychange', onFocus);
  window.addEventListener('focus', onFocus);
  window.addEventListener('online', onOnline);
  lastFocusSync = Date.now();
  scheduleSync(0);
}

export function stopSync() {
  if (!started) return;
  started = false;
  sync.active = false;
  clearTimeout(timer);
  ProjectStorage.onChange = undefined;
  PaletteStorage.onChange = undefined;
  onPreferencesChange(undefined);
  document.removeEventListener('visibilitychange', onFocus);
  window.removeEventListener('focus', onFocus);
  window.removeEventListener('online', onOnline);
  sync.state = 'idle';
  sync.lastSyncedAt = null;
  shownProblem = null;
  sync.version++;
}

/** Remembers that this device asked to add its projects to the account. */
export async function markImportAsked(userId: string) {
  const state = await ProjectStorage.accountSyncState(userId);
  await ProjectStorage.setAccountSyncState(userId, {
    ...state,
    importAsked: true,
  });
}

/** Projects on this device that belong to no account. */
export async function guestProjectIds(): Promise<string[]> {
  return (await ProjectStorage.getIndex())
    .filter((item) => !item.sync)
    .map((item) => item.id);
}

/** Palettes on this device that belong to no account. */
export const guestPaletteIds = () => PaletteStorage.guestIds();

/**
 * Adds projects (and palettes) on this device to the account; they upload on
 * the next pass.
 */
export async function addToAccount(
  userId: string,
  ids: string[],
  paletteIds: string[] = [],
) {
  if (paletteIds.length) await PaletteStorage.addToAccount(userId, paletteIds);
  const chosen = new Set(ids);
  await ProjectStorage.updateSyncStates((item) =>
    chosen.has(item.id) && !item.sync
      ? {
          ownerUserId: userId,
          rev: null,
          dirty: true,
          updatedAt: Date.now(),
          lastSyncedAt: null,
          error: null,
        }
      : 'unchanged',
  );
  await syncNow();
}

/** The account's projects on this device that haven't finished uploading. */
export async function unsyncedCount(userId: string): Promise<number> {
  return (await ProjectStorage.getIndex()).filter(
    (item) =>
      item.sync?.ownerUserId === userId && (item.sync.dirty || item.sync.error),
  ).length;
}

/**
 * Leaving the account on this device: signing out removes its projects and
 * palettes from here (`keep` false); deleting the account keeps them as this
 * device's own. Ones that haven't finished uploading are always kept.
 */
export async function leaveAccount(userId: string, keep: boolean) {
  stopSync();
  const owned = (await ProjectStorage.getIndex()).filter(
    (item) => item.sync?.ownerUserId === userId,
  );
  if (!keep)
    for (const item of owned)
      if (!item.sync?.dirty && !item.sync?.error)
        await ProjectStorage.removeLocalOnly(item.id);
  await ProjectStorage.updateSyncStates((item) =>
    item.sync?.ownerUserId === userId ? undefined : 'unchanged',
  );
  await ProjectStorage.leaveAccountTrash(userId, keep);
  await PaletteStorage.leaveAccount(userId, keep);
  leaveAccountPreferences(userId);
  await savedPalettes.refresh().catch(() => {});
  await ProjectStorage.clearAccountSyncState(userId);
}

/** Every project the account has synced, downloaded, for "Download my data". */
export async function downloadAccountProjects(): Promise<
  { id: string; rev: number; project: unknown }[]
> {
  const latest = new Map<string, number>();
  let since = 0;
  for (;;) {
    const page = await server.changes(since);
    if (page.fullResyncRequired) {
      since = 0;
      continue;
    }
    for (const meta of page.changes)
      if (meta.deleted) latest.delete(meta.id);
      else latest.set(meta.id, meta.rev);
    since = page.nextSince;
    if (!page.hasMore) break;
  }

  const projects = [];
  for (const id of latest.keys()) {
    const data = await server.download(id);
    if (data)
      projects.push({ id, rev: data.rev, project: JSON.parse(data.json) });
  }
  return projects;
}
