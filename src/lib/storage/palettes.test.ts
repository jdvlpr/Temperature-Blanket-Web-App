import { beforeEach, describe, expect, it, vi } from 'vitest';
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
});
