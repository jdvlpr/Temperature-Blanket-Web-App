import { browser } from '$app/environment';
import { get, update } from 'idb-keyval';

export type SavedPalette = {
  /** Internal id. Never put it in a URL. */
  id: string;
  /** Name the user gave it. Empty means show getPaletteFallbackName instead. */
  name: string;
  /** Output of colorsToPaletteCode, e.g. "palette:ff0000ffa500yarn:bernat-super_value" */
  code: string;
  /** Milliseconds since the epoch, like the updatedAt in $lib/sync */
  createdAt: number;
  updatedAt: number;
  /** Set instead of removing the palette, so a future account sync can pass deletes on */
  deletedAt?: number;
};

const SAVED_PALETTES_KEY = 'saved_palettes';
export const MAX_SAVED_PALETTE_NAME_LENGTH = 100;

const cleanName = (name: string | undefined): string =>
  (name ?? '').trim().slice(0, MAX_SAVED_PALETTE_NAME_LENGTH);

const newId = (): string => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // randomUUID only exists in secure contexts (e.g. not plain http on a LAN)
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

export class PaletteStorage {
  static isAvailable(): boolean {
    if (!browser) return false;
    try {
      return typeof indexedDB !== 'undefined';
    } catch {
      return false;
    }
  }

  /** Every stored palette, including deleted ones */
  static async getAll(): Promise<SavedPalette[]> {
    if (!this.isAvailable()) return [];
    try {
      return (await get<SavedPalette[]>(SAVED_PALETTES_KEY)) || [];
    } catch {
      return [];
    }
  }

  /** Palettes that aren't deleted, newest first */
  static async list(): Promise<SavedPalette[]> {
    const all = await this.getAll();
    return all
      .filter((p) => !p.deletedAt)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Save a palette. If the same code is already saved, nothing is added and
   * the existing palette is returned with `added: false`.
   */
  static async add({
    code,
    name,
  }: {
    code: string;
    name?: string;
  }): Promise<{ palette: SavedPalette; added: boolean }> {
    if (!this.isAvailable()) throw new Error('IndexedDB is not available');
    if (!code) throw new Error('Missing palette code');

    let result: { palette: SavedPalette; added: boolean } | undefined;
    await update<SavedPalette[]>(SAVED_PALETTES_KEY, (all = []) => {
      const existing = all.find((p) => p.code === code && !p.deletedAt);
      if (existing) {
        result = { palette: existing, added: false };
        return all;
      }
      const now = Date.now();
      const palette: SavedPalette = {
        id: newId(),
        name: cleanName(name),
        code,
        createdAt: now,
        updatedAt: now,
      };
      result = { palette, added: true };
      return [...all, palette];
    });
    return result!;
  }

  static async rename(id: string, name: string): Promise<void> {
    await this.change(id, (p) => ({ ...p, name: cleanName(name) }));
  }

  static async remove(id: string): Promise<void> {
    await this.change(id, (p) => ({ ...p, deletedAt: Date.now() }));
  }

  /** Undo a remove */
  static async restore(id: string): Promise<void> {
    await this.change(id, ({ deletedAt: _, ...p }) => p);
  }

  private static async change(
    id: string,
    fn: (palette: SavedPalette) => SavedPalette,
  ): Promise<void> {
    if (!this.isAvailable()) throw new Error('IndexedDB is not available');
    await update<SavedPalette[]>(SAVED_PALETTES_KEY, (all = []) =>
      all.map((p) => (p.id === id ? { ...fn(p), updatedAt: Date.now() } : p)),
    );
  }
}

class SavedPalettesState {
  items = $state<SavedPalette[]>([]);
  loaded = $state(false);

  async refresh() {
    this.items = await PaletteStorage.list();
    this.loaded = true;
  }
}

/** Saved palettes for the UI. Call refresh() before showing them. */
export const savedPalettes = new SavedPalettesState();
