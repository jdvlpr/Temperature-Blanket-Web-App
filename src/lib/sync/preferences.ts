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

// The preferences an account keeps, shared by the browser and the server. Each
// one carries when it was last changed, and the newest change to each wins, so
// changing the colors on one device and the units on another keeps both.
//
// Only preferences that follow the person sync. Ones that suit a device (text
// size, spacing, sound, vibration, motion, list or grid) stay on it, as do units
// and seasons: every project link carries its own, and opening one sets them.

/** The synced preferences, by their path in the `preferences` object */
export const SYNCED_PREFERENCE_KEYS = [
  'defaultYarn',
  'theme.id',
  'theme.mode',
  'theme.roundness',
  'theme.headingStyle',
] as const;

export type SyncedPreferenceKey = (typeof SYNCED_PREFERENCE_KEYS)[number];

export type PreferenceEntry = { value: unknown; updatedAt: number };

/** The account's preferences: only the ones ever changed */
export type PreferencesRecord = {
  rev: number;
  values: Partial<Record<SyncedPreferenceKey, PreferenceEntry>>;
};

export type PreferencesUpload = Partial<
  Record<SyncedPreferenceKey, PreferenceEntry>
>;

// Option ids, as plain strings so the server needn't load the icons the option
// lists in page-constants reference (as /api/preferences/theme)
const ALLOWED: Partial<Record<SyncedPreferenceKey, readonly unknown[]>> = {
  'theme.id': [
    'classic',
    'crimson',
    'hamlindigo',
    'modern',
    'rocket',
    'legacy',
  ],
  'theme.mode': ['light', 'dark', 'system'],
  'theme.roundness': ['sharp', 'rounded', 'pill'],
  'theme.headingStyle': ['classic', 'playful', 'refined'],
};

const MAX_TEXT_LENGTH = 100;

export const isSyncedPreferenceKey = (
  key: string,
): key is SyncedPreferenceKey =>
  (SYNCED_PREFERENCE_KEYS as readonly string[]).includes(key);

/** Whether `value` is one the preference can hold */
export function isValidPreference(key: SyncedPreferenceKey, value: unknown) {
  if (key === 'defaultYarn')
    return typeof value === 'string' && value.length <= MAX_TEXT_LENGTH;
  return ALLOWED[key]!.includes(value);
}

/** The valid entries of an upload, or null when there are none */
export function parsePreferencesUpload(
  body: unknown,
  now: number,
): PreferencesUpload | null {
  if (!body || typeof body !== 'object') return null;
  const upload: PreferencesUpload = {};
  for (const [key, entry] of Object.entries(body)) {
    if (!isSyncedPreferenceKey(key) || !entry || typeof entry !== 'object')
      continue;
    const { value, updatedAt } = entry as PreferenceEntry;
    if (
      typeof updatedAt !== 'number' ||
      !Number.isFinite(updatedAt) ||
      updatedAt <= 0 ||
      !isValidPreference(key, value)
    )
      continue;
    // A device whose clock runs ahead mustn't win every change after it
    upload[key] = { value, updatedAt: Math.min(updatedAt, now) };
  }
  return Object.keys(upload).length ? upload : null;
}

/**
 * The account's values with the newer of each uploaded one taken in, and
 * whether any was.
 */
export function mergePreferences(
  current: PreferencesRecord['values'],
  upload: PreferencesUpload,
) {
  const values = { ...current };
  let changed = false;
  for (const key of SYNCED_PREFERENCE_KEYS) {
    const entry = upload[key];
    if (entry && entry.updatedAt > (values[key]?.updatedAt ?? 0)) {
      values[key] = entry;
      changed = true;
    }
  }
  return { values, changed };
}
