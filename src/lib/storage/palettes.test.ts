import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { PaletteRecord } from '$lib/sync/protocol';
import {
  MAX_SAVED_PALETTE_NAME_LENGTH,
  PaletteStorage,
  savedPalettes,
} from './palettes.svelte';

const vi_mockStore = {
  data: new Map<string, unknown>(),
};

vi.mock('idb-keyval', () => ({
  get: vi.fn((key: string) => Promise.resolve(vi_mockStore.data.get(key))),
  update: vi.fn((key: string, updater: (old: unknown) => unknown) => {
    vi_mockStore.data.set(key, updater(vi_mockStore.data.get(key)));
    return Promise.resolve();
  }),
}));

vi.mock('$app/environment', () => ({
  browser: true,
  dev: true,
  version: '1.0.0',
}));

const RED = 'palette:ff0000';
const BLUE = 'palette:0000ffyarn:brand1-yarn1';

describe('PaletteStorage', () => {
  beforeEach(() => {
    vi_mockStore.data.clear();
    vi.stubGlobal('indexedDB', {});
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
  });

  it('starts empty', async () => {
    expect(await PaletteStorage.list()).toEqual([]);
  });

  it('adds a palette with a trimmed name and ms timestamps', async () => {
    const { palette, added } = await PaletteStorage.add({
      code: RED,
      name: '  Sunset  ',
    });
    expect(added).toBe(true);
    expect(palette).toMatchObject({
      name: 'Sunset',
      code: RED,
      createdAt: 1_000,
      updatedAt: 1_000,
    });
    expect(palette.id).toBeTruthy();
    expect(await PaletteStorage.list()).toEqual([palette]);
  });

  it('defaults to an empty name and caps long names', async () => {
    const { palette } = await PaletteStorage.add({ code: RED });
    expect(palette.name).toBe('');

    await PaletteStorage.rename(palette.id, 'x'.repeat(500));
    const [renamed] = await PaletteStorage.list();
    expect(renamed.name).toHaveLength(MAX_SAVED_PALETTE_NAME_LENGTH);
  });

  it('does not add the same code twice', async () => {
    const first = await PaletteStorage.add({ code: RED });
    const second = await PaletteStorage.add({ code: RED, name: 'Again' });
    expect(second.added).toBe(false);
    expect(second.palette.id).toBe(first.palette.id);
    expect(await PaletteStorage.list()).toHaveLength(1);
  });

  it('lists newest first', async () => {
    await PaletteStorage.add({ code: RED });
    vi.setSystemTime(2_000);
    await PaletteStorage.add({ code: BLUE });
    const codes = (await PaletteStorage.list()).map((p) => p.code);
    expect(codes).toEqual([BLUE, RED]);
  });

  it('renames and bumps updatedAt', async () => {
    const { palette } = await PaletteStorage.add({ code: RED });
    vi.setSystemTime(5_000);
    await PaletteStorage.rename(palette.id, 'Warm');
    const [renamed] = await PaletteStorage.list();
    expect(renamed).toMatchObject({
      name: 'Warm',
      createdAt: 1_000,
      updatedAt: 5_000,
    });
  });

  it('soft deletes, hides deleted palettes, and restores them', async () => {
    const { palette } = await PaletteStorage.add({ code: RED });
    vi.setSystemTime(3_000);
    await PaletteStorage.remove(palette.id);

    expect(await PaletteStorage.list()).toEqual([]);
    const [stored] = await PaletteStorage.getAll();
    expect(stored).toMatchObject({ deletedAt: 3_000, updatedAt: 3_000 });

    vi.setSystemTime(4_000);
    await PaletteStorage.restore(palette.id);
    const [restored] = await PaletteStorage.list();
    expect(restored.deletedAt).toBeUndefined();
    expect(restored.updatedAt).toBe(4_000);
  });

  it('saves a deleted code again as a new palette', async () => {
    const first = await PaletteStorage.add({ code: RED });
    await PaletteStorage.remove(first.palette.id);
    const second = await PaletteStorage.add({ code: RED });
    expect(second.added).toBe(true);
    expect(second.palette.id).not.toBe(first.palette.id);
    expect(await PaletteStorage.list()).toHaveLength(1);
  });

  it('refreshes the reactive list', async () => {
    await PaletteStorage.add({ code: RED });
    await savedPalettes.refresh();
    expect(savedPalettes.loaded).toBe(true);
    expect(savedPalettes.items.map((p) => p.code)).toEqual([RED]);
  });

  it('lists deleted palettes newest first and drops them after 30 days', async () => {
    const old = await PaletteStorage.add({ code: RED });
    const recent = await PaletteStorage.add({ code: BLUE });
    vi.setSystemTime(new Date('2026-01-01').getTime());
    await PaletteStorage.remove(old.palette.id);
    vi.setSystemTime(new Date('2026-01-20').getTime());
    await PaletteStorage.remove(recent.palette.id);

    expect((await PaletteStorage.listDeleted()).map((p) => p.code)).toEqual([
      BLUE,
      RED,
    ]);

    vi.setSystemTime(new Date('2026-02-05').getTime());
    expect((await PaletteStorage.listDeleted()).map((p) => p.code)).toEqual([
      BLUE,
    ]);
    expect(await PaletteStorage.getAll()).toHaveLength(1);
  });

  it('deletes for good, one at a time or all at once', async () => {
    const a = await PaletteStorage.add({ code: RED });
    const b = await PaletteStorage.add({ code: BLUE });
    await PaletteStorage.add({ code: 'palette:00ff00' });
    await PaletteStorage.remove(a.palette.id);
    await PaletteStorage.remove(b.palette.id);

    await PaletteStorage.deleteForever(a.palette.id);
    expect(await PaletteStorage.listDeleted()).toHaveLength(1);

    await PaletteStorage.emptyTrash();
    expect(await PaletteStorage.listDeleted()).toEqual([]);
    expect(await PaletteStorage.list()).toHaveLength(1);
  });

  it('restores without showing a palette twice if it was saved again', async () => {
    const first = await PaletteStorage.add({ code: RED });
    await PaletteStorage.remove(first.palette.id);
    await PaletteStorage.add({ code: RED });

    await PaletteStorage.restore(first.palette.id);
    expect(await PaletteStorage.list()).toHaveLength(1);
    expect(await PaletteStorage.listDeleted()).toEqual([]);
  });

  it('refresh also loads the deleted palettes', async () => {
    const { palette } = await PaletteStorage.add({ code: RED });
    await PaletteStorage.remove(palette.id);
    await savedPalettes.refresh();
    expect(savedPalettes.items).toEqual([]);
    expect(savedPalettes.deleted.map((p) => p.code)).toEqual([RED]);
  });
});

describe('PaletteStorage with sync', () => {
  let owner: string | null = null;
  const originalOwner = PaletteStorage.syncOwner;
  const record = (overrides: Partial<PaletteRecord> = {}): PaletteRecord => ({
    id: 'a1',
    rev: 5,
    name: 'From the account',
    code: RED,
    createdAt: 500,
    updatedAt: 500,
    deletedAt: null,
    purged: false,
    ...overrides,
  });

  beforeEach(() => {
    vi_mockStore.data.clear();
    vi.stubGlobal('indexedDB', {});
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    owner = null;
    PaletteStorage.syncOwner = () => owner;
    PaletteStorage.onChange = undefined;
  });

  afterEach(() => {
    PaletteStorage.syncOwner = originalOwner;
    PaletteStorage.onChange = undefined;
  });

  it('gives palettes saved while signed in to the account, and marks changes', async () => {
    owner = 'u1';
    const onChange = vi.fn();
    PaletteStorage.onChange = onChange;
    const { palette } = await PaletteStorage.add({ code: RED });
    expect(palette.sync).toEqual({ ownerUserId: 'u1', rev: null, dirty: true });

    await PaletteStorage.settleUpload(
      'u1',
      1_000,
      record({ id: palette.id, rev: 2 }),
      true,
    );
    expect((await PaletteStorage.list())[0].sync).toMatchObject({
      rev: 2,
      dirty: false,
    });

    vi.setSystemTime(2_000);
    await PaletteStorage.rename(palette.id, 'Dusk');
    expect((await PaletteStorage.list())[0]).toMatchObject({
      name: 'Dusk',
      updatedAt: 2_000,
      sync: { rev: 2, dirty: true },
    });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('keeps a record of a synced palette deleted for good, and drops an unsynced one', async () => {
    owner = 'u1';
    await PaletteStorage.applyFromAccount('u1', [record({ deletedAt: 900 })]);
    const { palette } = await PaletteStorage.add({ code: BLUE });
    await PaletteStorage.remove(palette.id);

    await PaletteStorage.emptyTrash();

    expect(await PaletteStorage.listDeleted()).toEqual([]);
    expect(await PaletteStorage.getAll()).toEqual([
      expect.objectContaining({
        id: 'a1',
        purged: true,
        code: '',
        sync: expect.objectContaining({ dirty: true }),
      }),
    ]);
    // Once the account knows, the record goes
    await PaletteStorage.settleUpload(
      'u1',
      1_000,
      record({ purged: true, code: '', rev: 6 }),
      true,
    );
    expect(await PaletteStorage.getAll()).toEqual([]);
  });

  it('takes in the account’s palettes, keeping newer changes made here', async () => {
    owner = 'u1';
    await PaletteStorage.applyFromAccount('u1', [record()]);
    expect(await PaletteStorage.list()).toEqual([
      expect.objectContaining({
        id: 'a1',
        name: 'From the account',
        sync: { ownerUserId: 'u1', rev: 5, dirty: false },
      }),
    ]);

    await PaletteStorage.rename('a1', 'Mine'); // updatedAt 1000
    await PaletteStorage.applyFromAccount('u1', [
      record({ name: 'Older', updatedAt: 800, rev: 6 }),
    ]);
    expect((await PaletteStorage.list())[0]).toMatchObject({
      name: 'Mine',
      sync: { rev: 6, dirty: true },
    });

    await PaletteStorage.applyFromAccount('u1', [
      record({ purged: true, rev: 7 }),
    ]);
    expect(await PaletteStorage.getAll()).toEqual([]);
  });

  it('drops a copy saved here that the account already has from another device', async () => {
    owner = 'u1';
    await PaletteStorage.add({ code: RED });
    await PaletteStorage.applyFromAccount('u1', [record()]);
    expect((await PaletteStorage.list()).map((p) => p.id)).toEqual(['a1']);
  });

  it('takes the account’s copy when it kept a newer one', async () => {
    owner = 'u1';
    const { palette } = await PaletteStorage.add({ code: RED });
    await PaletteStorage.settleUpload(
      'u1',
      1_000,
      record({ id: palette.id, name: 'Newer', updatedAt: 5_000 }),
      false,
    );
    expect((await PaletteStorage.list())[0]).toMatchObject({
      name: 'Newer',
      sync: { dirty: false },
    });
  });

  it("hides another account's palettes while signed in", async () => {
    owner = 'u2';
    await PaletteStorage.applyFromAccount('u2', [record()]);
    owner = 'u1';
    expect(await PaletteStorage.list()).toEqual([]);
    // Saving the same colors makes this account's own copy
    expect((await PaletteStorage.add({ code: RED })).added).toBe(true);
    owner = null;
    expect(await PaletteStorage.list()).toHaveLength(2);
  });

  it('leaves the browser on sign-out unless not uploaded yet; stays as the browser’s on account deletion', async () => {
    owner = 'u1';
    await PaletteStorage.applyFromAccount('u1', [record()]);
    await PaletteStorage.add({ code: BLUE });
    await PaletteStorage.leaveAccount('u1', false);
    const left = await PaletteStorage.getAll();
    expect(left.map((p) => p.code)).toEqual([BLUE]);
    expect(left[0].sync).toBeUndefined();

    await PaletteStorage.applyFromAccount('u1', [record()]);
    await PaletteStorage.leaveAccount('u1', true);
    expect((await PaletteStorage.getAll()).every((p) => !p.sync)).toBe(true);
    expect(await PaletteStorage.getAll()).toHaveLength(2);
  });

  it('adds this browser’s palettes to the account when asked', async () => {
    const { palette } = await PaletteStorage.add({ code: RED });
    expect(await PaletteStorage.guestIds()).toEqual([palette.id]);
    await PaletteStorage.addToAccount('u1', [palette.id]);
    expect(await PaletteStorage.guestIds()).toEqual([]);
    expect((await PaletteStorage.getAll())[0].sync).toEqual({
      ownerUserId: 'u1',
      rev: null,
      dirty: true,
    });
  });
});
