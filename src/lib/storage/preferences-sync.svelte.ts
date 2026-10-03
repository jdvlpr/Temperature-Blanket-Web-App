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

// When each synced preference (see $lib/sync/preferences) last changed on this
// device, so the newest change to each wins when it syncs. Changes are noted
// whether or not someone is signed in, so a choice made before signing in wins
// over an older one on the account. One never changed here counts as oldest, so
// a new device doesn't replace the account's choices with its defaults.
//
// Kept in Local Storage under `preferences_sync`, apart from `preferences`: the
// account's values are written there first, so taking them in doesn't count as
// a change made here.

import {
  isValidPreference,
  SYNCED_PREFERENCE_KEYS,
  type PreferencesRecord,
  type PreferencesUpload,
  type SyncedPreferenceKey,
} from '$lib/sync/preferences';
import { untrack } from 'svelte';
import { preferences } from './preferences.svelte';

const KEY = 'preferences_sync';

/** Changed before changes were noted: older than anything the account has */
const UNKNOWN_TIME = 1;

const DEFAULTS: Record<SyncedPreferenceKey, unknown> = {
  defaultYarn: '',
  'theme.id': 'classic',
  'theme.mode': 'system',
  'theme.roundness': 'pill',
  'theme.headingStyle': 'classic',
};

export type PreferencesSyncState = {
  /** Each preference's value (as JSON) when last looked at */
  seen: Partial<Record<SyncedPreferenceKey, string>>;
  /** When each was last changed; missing if never */
  updatedAt: Partial<Record<SyncedPreferenceKey, number>>;
  /** The signed-in account, and the change of each it has */
  account?: {
    userId: string;
    synced: Partial<Record<SyncedPreferenceKey, number>>;
  };
};

function readState(): PreferencesSyncState {
  try {
    const state = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (state && typeof state === 'object')
      return { seen: {}, updatedAt: {}, ...state };
  } catch {
    // Start over
  }
  return { seen: {}, updatedAt: {} };
}

function writeState(state: PreferencesSyncState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.error(e);
  }
}

function getValue(key: SyncedPreferenceKey): unknown {
  if (key === 'defaultYarn') return preferences.value.defaultYarn ?? '';
  const field = key.slice(
    'theme.'.length,
  ) as keyof typeof preferences.value.theme;
  return preferences.value.theme[field] ?? DEFAULTS[key];
}

function setValue(key: SyncedPreferenceKey, value: unknown) {
  if (key === 'defaultYarn') preferences.value.defaultYarn = value as string;
  else {
    const field = key.slice('theme.'.length);
    (preferences.value.theme as Record<string, unknown>)[field] = value;
  }
}

/** Called after a change here, e.g. to sync it */
let onChange: (() => void) | undefined;

export function onPreferencesChange(callback: (() => void) | undefined) {
  onChange = callback;
}

/**
 * Compares the synced preferences with when last looked at, and notes when
 * each that differs was changed.
 */
export function notePreferenceChanges() {
  // Read fresh each time: another tab may have noted the same change
  const state = readState();
  let changed = false;
  for (const key of SYNCED_PREFERENCE_KEYS) {
    const json = JSON.stringify(getValue(key));
    if (state.seen[key] === json) continue;
    if (state.seen[key] === undefined) {
      // First look: a choice from before changes were noted
      if (json !== JSON.stringify(DEFAULTS[key]))
        state.updatedAt[key] ??= UNKNOWN_TIME;
    } else {
      state.updatedAt[key] = Date.now();
      changed = true;
    }
    state.seen[key] = json;
  }
  writeState(state);
  if (changed) onChange?.();
}

/** Notes changes to the synced preferences from now on. Call once, in the browser. */
export function trackPreferenceChanges() {
  $effect.root(() => {
    $effect(() => {
      for (const key of SYNCED_PREFERENCE_KEYS) getValue(key);
      untrack(notePreferenceChanges);
    });
  });
}

/** The account's state for `userId`, starting over for a different account */
const accountOf = (state: PreferencesSyncState, userId: string) =>
  state.account?.userId === userId
    ? state.account
    : (state.account = { userId, synced: {} });

/** Takes in the account's preferences that are newer than this device's. */
export function applyAccountPreferences(
  userId: string,
  record: PreferencesRecord,
) {
  const state = readState();
  const account = accountOf(state, userId);
  const take: [SyncedPreferenceKey, unknown][] = [];
  for (const key of SYNCED_PREFERENCE_KEYS) {
    const entry = record.values[key];
    if (!entry || !isValidPreference(key, entry.value)) continue;
    const local = state.updatedAt[key] ?? 0;
    if (entry.updatedAt > local) {
      state.seen[key] = JSON.stringify(entry.value);
      state.updatedAt[key] = entry.updatedAt;
      take.push([key, entry.value]);
    }
    if (entry.updatedAt >= local) account.synced[key] = entry.updatedAt;
  }
  // Noted as seen before they're set, so they don't count as changes made here
  writeState(state);
  for (const [key, value] of take) setValue(key, value);
}

/** The preferences changed here since the account last had them, or null. */
export function pendingPreferences(userId: string): PreferencesUpload | null {
  const state = readState();
  const synced = state.account?.userId === userId ? state.account.synced : {};
  const upload: PreferencesUpload = {};
  for (const key of SYNCED_PREFERENCE_KEYS) {
    const updatedAt = state.updatedAt[key];
    if (updatedAt && updatedAt > (synced[key] ?? 0))
      upload[key] = { value: getValue(key), updatedAt };
  }
  return Object.keys(upload).length ? upload : null;
}

/** Leaving the account: the preferences stay on this device as they are. */
export function leaveAccountPreferences(userId: string) {
  const state = readState();
  if (state.account?.userId !== userId) return;
  delete state.account;
  writeState(state);
}
