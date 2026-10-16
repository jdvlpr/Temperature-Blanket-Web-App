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
// Every request counts against the free plan's daily cap, shared by everyone,
// so there's no timer, and sending and looking are kept apart:
// - Automatic saves of the open project are sent a little over a minute after
//   the last one (at most five minutes after the first), and straight away when
//   the tab is hidden. Saving here is instant either way; until then the
//   project shows "Waiting to sync" on My Projects. Other changes (Save, Save a
//   Copy, renaming, the Trash, palettes) are sent straight away, and
//   preferences after a few seconds.
// - What changed elsewhere is looked for on sign-in and page load, when the tab
//   regains focus (at most once a minute), when the browser comes back online
//   and when someone opens their sync status. Sending alone doesn't look: the
//   server refuses an upload based on an old copy anyway.
// Only one tab syncs at a time, and a change during a sync schedules another
// pass.

import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { signInHref } from '#lib/accounts/redirect.js';
import { clearSignedInHint, getSession } from '#lib/accounts/client.js';
import {
  account,
  forgetAccountSummary,
  rememberAccountSummary,
} from '#lib/accounts/summary.svelte.js';
import { toast } from '#lib/state/page-state.svelte.js';
import { PaletteStorage, savedPalettes } from '#lib/storage/palettes.svelte.js';
import {
  applyAccountPreferences,
  leaveAccountPreferences,
  onPreferencesChange,
  pendingPreferences,
} from '#lib/storage/preferences-sync.svelte.js';
import { ProjectStorage } from '#lib/storage/projects.svelte.js';
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
// Longer than autosave's once a minute while someone keeps editing, so a long
// session sends a few copies rather than one a minute
const SEND_DELAY_MS = 75_000;
const SEND_MAX_WAIT_MS = 5 * 60_000;
const FOCUS_INTERVAL_MS = 60_000;
const BUSY_RETRY_MS = 10_000;
// Long enough that trying out colors or settings one after another sends only
// the last
const PREFERENCES_DELAY_MS = 5_000;

let started = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let dueAt = 0;
/** Whether the pass due is waiting for edits to stop, so another edit moves it */
let waitingForEdits = false;
let running: Promise<void> | null = null;
let again = false;
let lastFocusSync = 0;
/** Whether the next pass looks for changes made elsewhere */
let pullNext = false;
/** When the oldest change not yet sent was made, or 0 */
let unsentSince = 0;
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

/**
 * Syncs soon, folding several quick changes into one pass. `pull` also looks
 * for changes made elsewhere; `edits` waits for edits to stop.
 */
export function scheduleSync(
  delay = SAVE_DELAY_MS,
  pull = true,
  edits = false,
) {
  if (!started) return;
  if (pull) pullNext = true;
  const at = Date.now() + delay;
  // A pass due sooner does this too
  if (timer && dueAt <= at && !(edits && waitingForEdits)) return;
  clearTimeout(timer);
  dueAt = at;
  waitingForEdits = edits;
  timer = setTimeout(() => void syncNow(), delay);
}

/**
 * Sends a change made here. One that can `wait` (an automatic save) goes once
 * edits stop, or soon when the tab is hidden.
 */
function scheduleSend(wait = false) {
  if (!started) return;
  if (!wait) return scheduleSync(SAVE_DELAY_MS, false);
  const now = Date.now();
  unsentSince ||= now;
  const delay =
    document.visibilityState === 'hidden'
      ? SAVE_DELAY_MS
      : Math.min(SEND_DELAY_MS, unsentSince + SEND_MAX_WAIT_MS - now);
  scheduleSync(Math.max(delay, SAVE_DELAY_MS), false, true);
}

async function runPass(userId: string) {
  if (!navigator.onLine) {
    sync.state = 'offline';
    return;
  }
  sync.state = 'syncing';
  let signedOut = false;
  const pull = pullNext;
  pullNext = false;
  unsentSince = 0;
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
        pull,
      },
    );
    sync.state = 'idle';
    sync.lastSyncedAt = Date.now();
  } catch (e) {
    // Try again next time
    if (pull) pullNext = true;
    if (!(e instanceof SyncHttpError)) {
      console.error('Sync failed', e);
      sync.state = 'error';
    } else if (e.status === 0) sync.state = 'offline';
    else if (e.status === 401) {
      sync.state = 'signed-out';
      signedOut = true;
    } else if (e.code === 'SYNC_PAUSED') sync.state = 'paused';
    else sync.state = 'error';
  } finally {
    sync.version++;
    // Palettes from other devices show up in open lists
    await savedPalettes.refresh().catch(() => {});
  }
  if (signedOut && (await sessionEnded(userId))) return;
  await toastNewProblem(userId).catch(() => {});
}

/**
 * After a sync is refused as signed out: when the server confirms the session
 * is over, signs out here as signing out does. The account's synced projects
 * and palettes leave this browser; ones with changes that hadn't synced stay.
 * False when that can't be confirmed.
 */
async function sessionEnded(userId: string): Promise<boolean> {
  let session: Awaited<ReturnType<typeof getSession>>;
  try {
    session = await getSession();
  } catch {
    // Offline: keep showing the account, with the signed-out notice
    return false;
  }
  if (session?.user) {
    // Still signed in after all
    rememberAccountSummary(session.user);
    sync.state = 'error';
    return false;
  }
  const kept =
    (await unsyncedCount(userId).catch(() => 0)) +
    (await PaletteStorage.getAll()).filter(
      (p) => p.sync?.ownerUserId === userId && !p.purged && p.sync.dirty,
    ).length;
  clearSignedInHint();
  try {
    await leaveAccount(userId, false);
  } catch (e) {
    // Signed out regardless; the account's items just stay here a while
    console.error('Leaving the account failed', e);
  }
  // After leaving, as signing out does, so lists refresh without its items
  forgetAccountSummary();
  toast.trigger({
    message: kept
      ? 'You’ve been signed out. Changes that hadn’t synced are still saved in this browser. Sign in to sync them.'
      : 'You’ve been signed out. Sign in to see your projects.',
    category: 'error',
    autohide: false,
    action: {
      label: 'Sign in',
      // Back to this page as it is then
      response: () => goto(signInHref(location)),
    },
  });
  return true;
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
      action: { label: action, response: () => goto(resolve('account')) },
    });
  }
  shownProblem = problem;
}

/** Syncs now, or right after the pass in progress. */
export async function syncNow(): Promise<void> {
  clearTimeout(timer);
  timer = undefined;
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
            else scheduleSync(BUSY_RETRY_MS, false);
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
  // Leaving: send what's waiting while the page can still run
  if (document.visibilityState === 'hidden') {
    if (unsentSince) scheduleSync(0, false);
    return;
  }
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
  ProjectStorage.onChange = scheduleSend;
  PaletteStorage.onChange = scheduleSend;
  onPreferencesChange(() => scheduleSync(PREFERENCES_DELAY_MS, false));
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
  timer = undefined;
  pullNext = false;
  unsentSince = 0;
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
