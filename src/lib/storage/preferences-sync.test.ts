import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => void store.set(key, value),
  removeItem: (key: string) => void store.delete(key),
});

const { preferences } = await import('./preferences.svelte');
const sync = await import('./preferences-sync.svelte');

const DEFAULT_THEME = JSON.parse(JSON.stringify(preferences.value.theme));

describe('preferences sync on this device', () => {
  let changes = 0;

  beforeAll(() => {
    sync.onPreferencesChange(() => changes++);
  });

  beforeEach(() => {
    preferences.value.theme = { ...DEFAULT_THEME };
    preferences.value.defaultYarn = '';
    store.delete('preferences_sync');
    // The first look, as on page load
    sync.notePreferenceChanges();
    changes = 0;
  });

  /** A change made here, noted as the tracker's effect does */
  const change = (fn: () => void) => {
    fn();
    sync.notePreferenceChanges();
  };

  it('a new device with nothing chosen has nothing to send', () => {
    expect(sync.pendingPreferences('u1')).toBeNull();
  });

  it('a new device takes the account’s choices, and doesn’t send them back', () => {
    sync.applyAccountPreferences('u1', {
      rev: 3,
      values: {
        'theme.id': { value: 'rocket', updatedAt: 50 },
        defaultYarn: { value: 'brand-yarn', updatedAt: 60 },
      },
    });
    sync.notePreferenceChanges();
    expect(preferences.value.theme.id).toBe('rocket');
    expect(preferences.value.defaultYarn).toBe('brand-yarn');
    expect(changes).toBe(0);
    expect(sync.pendingPreferences('u1')).toBeNull();
  });

  it('sends a change made here, and stops once the account has it', () => {
    change(() => (preferences.value.defaultYarn = 'brand-yarn'));
    expect(changes).toBe(1);
    const pending = sync.pendingPreferences('u1');
    expect(Object.keys(pending ?? {})).toEqual(['defaultYarn']);
    expect(pending!.defaultYarn!.value).toBe('brand-yarn');

    // The account answers with what it now has
    sync.applyAccountPreferences('u1', { rev: 4, values: pending! });
    sync.notePreferenceChanges();
    expect(sync.pendingPreferences('u1')).toBeNull();
    expect(changes).toBe(1);
  });

  it('a newer change here wins over an older one on the account', () => {
    change(() => (preferences.value.theme.id = 'modern'));
    sync.applyAccountPreferences('u1', {
      rev: 2,
      values: { 'theme.id': { value: 'rocket', updatedAt: 1 } },
    });
    sync.notePreferenceChanges();
    expect(preferences.value.theme.id).toBe('modern');
    expect(sync.pendingPreferences('u1')?.['theme.id']?.value).toBe('modern');
  });

  it('a choice from before changes were noted loses to the account, but is sent to an empty one', () => {
    // As the first page load after this shipped: nothing noted yet, so the
    // tracker's first look finds a choice it never saw made
    store.delete('preferences_sync');
    preferences.value.theme.id = 'crimson';
    sync.notePreferenceChanges();
    expect(changes).toBe(0);

    expect(sync.pendingPreferences('u1')?.['theme.id']?.value).toBe('crimson');
    sync.applyAccountPreferences('u1', {
      rev: 2,
      values: { 'theme.id': { value: 'rocket', updatedAt: 2 } },
    });
    sync.notePreferenceChanges();
    expect(preferences.value.theme.id).toBe('rocket');
  });

  it('starts over for a different account, and leaving keeps the preferences', () => {
    change(() => (preferences.value.defaultYarn = 'brand-yarn'));
    const pending = sync.pendingPreferences('u1')!;
    sync.applyAccountPreferences('u1', { rev: 1, values: pending });
    sync.leaveAccountPreferences('u1');
    expect(preferences.value.defaultYarn).toBe('brand-yarn');
    expect(sync.pendingPreferences('u2')?.defaultYarn?.value).toBe(
      'brand-yarn',
    );
  });
});
