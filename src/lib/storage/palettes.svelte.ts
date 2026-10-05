import { browser } from '$app/environment';
import { account } from '$lib/accounts/summary.svelte';
import type { PaletteRecord } from '$lib/sync/protocol';
import { get, update } from 'idb-keyval';
import { trashCutoff } from './trash';
import { cleanName } from '$lib/utils/string-utils';

/** Present once the palette belongs to an account (see $lib/sync) */
export type PaletteSyncState = {
  ownerUserId: string;
  /** The account's revision this copy is based on; null until first uploaded */
  rev: number | null;
  /** Changed here since the last upload */
  dirty: boolean;
};

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
  /** In the Trash since then. Set instead of removing the palette, so deletes sync */
  deletedAt?: number;
  /** Deleted for good, waiting to tell the account: kept only as a record */
  purged?: true;
  sync?: PaletteSyncState;
};

const SAVED_PALETTES_KEY = 'saved_palettes';
export const MAX_SAVED_PALETTE_NAME_LENGTH = 100;

const cleanPaletteName = (name: unknown): string =>
  cleanName(name, MAX_SAVED_PALETTE_NAME_LENGTH);

const newId = (): string => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  // randomUUID only exists in secure contexts (e.g. not plain http on a LAN)
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
};

const expired = (p: SavedPalette, cutoff: number) =>
  !!p.deletedAt && p.deletedAt < cutoff;

/** What a palette becomes once deleted for good, until the account knows */
const tombstone = (p: SavedPalette, now: number): SavedPalette => ({
  id: p.id,
  name: '',
  code: '',
  createdAt: p.createdAt,
  updatedAt: now,
  deletedAt: p.deletedAt ?? now,
  purged: true,
  sync: { ...p.sync!, dirty: true },
});

export class PaletteStorage {
  /** The signed-in account's ID, which new palettes belong to */
  static syncOwner = (): string | null =>
    __ACCOUNTS_ENABLED__ ? (account.summary?.id ?? null) : null;

  /** Called after a change, to schedule a sync. Set by $lib/sync. */
  static onChange: (() => void) | undefined;

  static isAvailable(): boolean {
    if (!browser) return false;
    try {
      return typeof indexedDB !== 'undefined';
    } catch {
      return false;
    }
  }

  /** Every stored palette, including deleted ones and records of purged ones */
  static async getAll(): Promise<SavedPalette[]> {
    if (!this.isAvailable()) return [];
    try {
      return (await get<SavedPalette[]>(SAVED_PALETTES_KEY)) || [];
    } catch {
      return [];
    }
  }

  /**
   * Whether to show a palette: not purged, and while someone is signed in, not
   * another account's (a shared browser)
   */
  private static shown(p: SavedPalette, owner = this.syncOwner()): boolean {
    return !p.purged && (!owner || !p.sync || p.sync.ownerUserId === owner);
  }

  /** Palettes that aren't deleted, newest first */
  static async list(): Promise<SavedPalette[]> {
    const owner = this.syncOwner();
    const all = await this.getAll();
    return all
      .filter((p) => !p.deletedAt && this.shown(p, owner))
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

    const owner = this.syncOwner();
    let result: { palette: SavedPalette; added: boolean } | undefined;
    await update<SavedPalette[]>(SAVED_PALETTES_KEY, (all = []) => {
      const existing = all.find(
        (p) => p.code === code && !p.deletedAt && this.shown(p, owner),
      );
      if (existing) {
        result = { palette: existing, added: false };
        return all;
      }
      const now = Date.now();
      const palette: SavedPalette = {
        id: newId(),
        name: cleanPaletteName(name),
        code,
        createdAt: now,
        updatedAt: now,
        // Signed in: the account's, with a change to upload
        ...(owner && { sync: { ownerUserId: owner, rev: null, dirty: true } }),
      };
      result = { palette, added: true };
      return [...all, palette];
    });
    if (result?.added) this.onChange?.();
    return result!;
  }

  static async rename(id: string, name: string): Promise<void> {
    await this.change(id, (p) => ({ ...p, name: cleanPaletteName(name) }));
  }

  static async remove(id: string): Promise<void> {
    await this.change(id, (p) => ({ ...p, deletedAt: Date.now() }));
  }

  /** Undo a remove, or restore from the Trash */
  static async restore(id: string): Promise<void> {
    const all = await this.getAll();
    const palette = all.find((p) => p.id === id);
    // Saved again since: keep that one rather than show the palette twice
    if (
      palette &&
      all.some((p) => p.code === palette.code && !p.deletedAt && this.shown(p))
    ) {
      await this.deleteForever(id);
      return;
    }
    await this.change(id, ({ deletedAt: _, ...p }) => p);
  }

  /**
   * Deleted palettes (the Trash), most recently deleted first. Ones deleted
   * more than TRASH_DAYS ago (see ./trash) are removed for good on the way;
   * the account purges them at the same age.
   */
  static async listDeleted(): Promise<SavedPalette[]> {
    const owner = this.syncOwner();
    const all = await this.getAll();
    const cutoff = trashCutoff();
    if (all.some((p) => expired(p, cutoff))) {
      await update<SavedPalette[]>(SAVED_PALETTES_KEY, (current = []) =>
        current.filter((p) => !expired(p, cutoff)),
      );
    }
    return all
      .filter((p) => p.deletedAt && !expired(p, cutoff) && this.shown(p, owner))
      .sort((a, b) => (b.deletedAt ?? 0) - (a.deletedAt ?? 0));
  }

  /**
   * Delete a palette in the Trash for good. One the account has keeps a record
   * until the account knows, so its other devices remove it too.
   */
  static async deleteForever(id: string): Promise<void> {
    await this.purge((p) => p.id === id);
  }

  /** Delete every palette in the Trash for good */
  static async emptyTrash(): Promise<void> {
    const owner = this.syncOwner();
    await this.purge((p) => !!p.deletedAt && this.shown(p, owner));
  }

  private static async purge(which: (p: SavedPalette) => boolean) {
    if (!this.isAvailable()) throw new Error('IndexedDB is not available');
    const now = Date.now();
    let synced = false;
    await update<SavedPalette[]>(SAVED_PALETTES_KEY, (all = []) =>
      all.flatMap((p) => {
        if (p.purged || !which(p)) return [p];
        if (p.sync?.rev == null) return [];
        synced = true;
        return [tombstone(p, now)];
      }),
    );
    if (synced) this.onChange?.();
  }

  private static async change(
    id: string,
    fn: (palette: SavedPalette) => SavedPalette,
  ): Promise<void> {
    if (!this.isAvailable()) throw new Error('IndexedDB is not available');
    let owned = false;
    await update<SavedPalette[]>(SAVED_PALETTES_KEY, (all = []) =>
      all.map((p) => {
        if (p.id !== id || p.purged) return p;
        const next = { ...fn(p), updatedAt: Date.now() };
        if (next.sync) {
          owned = true;
          next.sync = { ...next.sync, dirty: true };
        }
        return next;
      }),
    );
    if (owned) this.onChange?.();
  }

  // *****************
  // Sync (see $lib/sync). Unused unless accounts are on and someone signs in.
  // *****************

  /**
   * Takes in the account's palettes from the changes feed. A palette changed
   * here more recently keeps its change (it uploads next); a purged one goes.
   */
  static async applyFromAccount(userId: string, records: PaletteRecord[]) {
    if (!records.length) return;
    const cutoff = trashCutoff();
    await update<SavedPalette[]>(SAVED_PALETTES_KEY, (all = []) => {
      const byId = new Map(all.map((p) => [p.id, p]));
      for (const record of records) {
        const mine = byId.get(record.id);
        if (record.purged || expired(fromRecord(record, userId), cutoff)) {
          byId.delete(record.id);
          continue;
        }
        // Another account's or this browser's own: never a match in practice
        if (mine && mine.sync?.ownerUserId !== userId) continue;
        if (mine?.sync?.dirty && mine.updatedAt > record.updatedAt) {
          byId.set(record.id, {
            ...mine,
            sync: { ...mine.sync, rev: record.rev },
          });
          continue;
        }
        byId.set(record.id, fromRecord(record, userId));
        // The same palette saved on two devices before either synced: the
        // account's copy stays, and one that never reached it goes
        if (!record.deletedAt)
          for (const other of byId.values())
            if (
              other.id !== record.id &&
              other.code === record.code &&
              !other.deletedAt &&
              !other.purged &&
              other.sync?.ownerUserId === userId &&
              other.sync.rev === null
            )
              byId.delete(other.id);
      }
      return [...byId.values()];
    });
  }

  /**
   * After an upload of the palette as it was at `sentUpdatedAt`: settled, or,
   * when the account kept a newer copy, that copy taken. A change made here
   * meanwhile stays to upload next.
   */
  static async settleUpload(
    userId: string,
    sentUpdatedAt: number,
    record: PaletteRecord,
    applied: boolean,
  ) {
    await update<SavedPalette[]>(SAVED_PALETTES_KEY, (all = []) =>
      all.flatMap((p) => {
        if (p.id !== record.id) return [p];
        if (p.updatedAt !== sentUpdatedAt)
          return [{ ...p, sync: { ...p.sync!, rev: record.rev } }];
        if (record.purged) return [];
        return [
          applied
            ? { ...p, sync: { ...p.sync!, rev: record.rev, dirty: false } }
            : fromRecord(record, userId),
        ];
      }),
    );
  }

  /**
   * After a full resync: the account's palettes it no longer has are gone,
   * unless changed here (those upload again as new)
   */
  static async forgetMissing(userId: string, onServer: Set<string>) {
    await update<SavedPalette[]>(SAVED_PALETTES_KEY, (all = []) =>
      all.flatMap((p) => {
        if (p.sync?.ownerUserId !== userId || p.sync.rev === null) return [p];
        if (onServer.has(p.id)) return [p];
        if (p.purged || !p.sync.dirty) return [];
        return [{ ...p, sync: { ...p.sync, rev: null } }];
      }),
    );
  }

  /** Palettes of this browser only (no account) */
  static async guestIds(): Promise<string[]> {
    return (await this.getAll())
      .filter((p) => !p.sync && !p.purged)
      .map((p) => p.id);
  }

  /** Gives this browser's palettes to the account; they upload on the next sync */
  static async addToAccount(userId: string, ids: string[]) {
    const chosen = new Set(ids);
    await update<SavedPalette[]>(SAVED_PALETTES_KEY, (all = []) =>
      all.map((p) =>
        chosen.has(p.id) && !p.sync
          ? { ...p, sync: { ownerUserId: userId, rev: null, dirty: true } }
          : p,
      ),
    );
  }

  /**
   * When an account leaves this browser: its palettes go (`keep` false) or stay
   * as this browser's own. Ones not uploaded yet always stay.
   */
  static async leaveAccount(userId: string, keep: boolean) {
    await update<SavedPalette[]>(SAVED_PALETTES_KEY, (all = []) =>
      all.flatMap((p) => {
        if (p.sync?.ownerUserId !== userId) return [p];
        if (p.purged) return [];
        if (!keep && !p.sync.dirty) return [];
        const { sync: _, ...rest } = p;
        return [rest];
      }),
    );
  }
}

const fromRecord = (record: PaletteRecord, userId: string): SavedPalette => ({
  id: record.id,
  name: cleanPaletteName(record.name),
  code: record.code,
  createdAt: record.createdAt,
  updatedAt: record.updatedAt,
  ...(record.deletedAt !== null && { deletedAt: record.deletedAt }),
  sync: { ownerUserId: userId, rev: record.rev, dirty: false },
});

class SavedPalettesState {
  items = $state<SavedPalette[]>([]);
  /** Deleted palettes, for the Trash */
  deleted = $state<SavedPalette[]>([]);
  loaded = $state(false);

  async refresh() {
    this.items = await PaletteStorage.list();
    this.deleted = await PaletteStorage.listDeleted();
    this.loaded = true;
  }
}

/** Saved palettes for the UI. Call refresh() before showing them. */
export const savedPalettes = new SavedPalettesState();
