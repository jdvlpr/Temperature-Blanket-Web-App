import { browser } from '$app/environment';
import { account } from '$lib/accounts/summary.svelte';
import { locations } from '$lib/state/location-state.svelte';
import { project } from '$lib/state/project-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import type { LocationType } from '$lib/types/location-types';
import type {
  WeatherDay,
  WeatherSourceOptions,
  TISO8601DateString,
} from '$lib/types/weather-types';
import {
  dateToISO8601String,
  formatDateTime,
  numberOfDays,
  stringToDate,
} from '$lib/utils/date-utils';
import { getMoonPhase } from '$lib/state/weather-state.svelte';
import { projectCreatedAtTime } from '$lib/utils/project-id-utils';
import { cleanName } from '$lib/utils/string-utils';
import type {
  AccountSyncState,
  LocalStore,
  ProjectSyncState,
} from '$lib/sync/engine';
import { unchangedSince } from '$lib/sync/seen';
import { del, get, set, update } from 'idb-keyval';
import { trashCutoff } from './trash';

export type StoredProjectIndexItem = {
  id: string;
  meta: {
    date: string;
    href: string;
    title: string;
    /** The name someone gave the project; when empty, show the title */
    name?: string;
    isCustomWeatherData: boolean;
  };
  /** Present once the project belongs to an account (see $lib/sync) */
  sync?: ProjectSyncState;
};

export const MAX_SAVED_PROJECT_NAME_LENGTH = 100;

/**
 * A project moved to the Trash: the whole project, so it can be put back. Kept
 * apart from projects_index, so nothing that reads the saved projects sees it.
 */
export type TrashedProject = {
  item: StoredProjectIndexItem;
  project: StoredProject;
  /** Its place in projects_index, to put it back there */
  position: number;
  /** When it was moved to the Trash (ms) */
  deletedAt: number;
};

/** Bumped on every change, so lists showing saved projects can reload */
export const savedProjects = $state({ version: 0 });
const changed = () => savedProjects.version++;

export type StoredProject = {
  /** The name someone gave the project, kept across saves; the title (from its locations) is the fallback */
  name?: string;
  /** When the project was first created (ISO 8601, UTC). Missing on projects saved by older versions; use projectCreatedAtTime() to fall back to a legacy timestamp ID. */
  createdAt?: string;
  date: string;
  href: string;
  locations?: LocationType[];
  isCustomWeatherData: boolean;
  title: string;
  weatherData: WeatherDay[];
  weatherSource: WeatherSourceOptions;
};

/**
 * When a project last changed, for sorting: its last edit on any device once it
 * belongs to an account, otherwise when it was saved (IDs are save times).
 */
function lastChanged(item: StoredProjectIndexItem): number {
  return item.sync?.updatedAt ?? (Number(item.id) || 0);
}

/** Most recently changed first; newer saves first when that's unknown. */
export function sortByRecent(
  items: StoredProjectIndexItem[],
): StoredProjectIndexItem[] {
  return [...items].reverse().sort((a, b) => lastChanged(b) - lastChanged(a));
}

const PROJECTS_INDEX_KEY = 'projects_index';
const PROJECT_PREFIX = 'p_';
const SYNC_ACCOUNT_PREFIX = 'sync_account_';
const PROJECTS_TRASH_KEY = 'projects_trash';

// Index updates read, change and write the whole index, so they take turns,
// across tabs too where the browser supports it.
let indexQueue: Promise<unknown> = Promise.resolve();
function withIndexLock<T>(task: () => Promise<T>): Promise<T> {
  if (typeof navigator !== 'undefined' && navigator.locks)
    return navigator.locks.request('tb-projects-index', task);
  const run = indexQueue.then(task, task);
  indexQueue = run.catch(() => {});
  return run;
}

const indexItemFor = (
  id: string,
  project: StoredProject,
  sync: ProjectSyncState | undefined,
): StoredProjectIndexItem => ({
  id,
  meta: {
    date: project.date,
    href: project.href,
    title: project.title || '',
    ...(cleanName(project.name, MAX_SAVED_PROJECT_NAME_LENGTH) && {
      name: cleanName(project.name, MAX_SAVED_PROJECT_NAME_LENGTH),
    }),
    isCustomWeatherData: project.isCustomWeatherData || false,
  },
  ...(sync && { sync }),
});

export class ProjectStorage {
  /**
   * Check if IndexedDB is available in the current browser environment
   */
  static isAvailable(): boolean {
    if (!browser) return false;
    try {
      return typeof indexedDB !== 'undefined';
    } catch {
      return false;
    }
  }

  /**
   * Get projects index from IndexedDB
   */
  static async getIndex(): Promise<StoredProjectIndexItem[]> {
    if (!this.isAvailable()) return [];
    try {
      const index = await get<StoredProjectIndexItem[]>(PROJECTS_INDEX_KEY);
      return index || [];
    } catch {
      return [];
    }
  }

  /**
   * Set projects index in IndexedDB
   */
  static async setIndex(index: StoredProjectIndexItem[]): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('IndexedDB is not available');
    }
    await set(PROJECTS_INDEX_KEY, index);
    changed();
  }

  /**
   * Get full project by ID from IndexedDB
   */
  static async getById(id: string | null): Promise<StoredProject | null> {
    if (!id || !this.isAvailable()) return null;
    try {
      const project = await get<StoredProject>(`${PROJECT_PREFIX}${id}`);
      return project || null;
    } catch {
      return null;
    }
  }

  /**
   * Save project to IndexedDB
   * If no parameters, then save the current project
   */
  static async save({
    id,
    localProject,
  }: {
    id?: string | null;
    localProject?: StoredProject | null;
  } = {}): Promise<StoredProjectIndexItem | null> {
    if (!browser) return null;

    if (!this.isAvailable()) {
      throw new Error('IndexedDB is not available');
    }

    const _id = id || new URL(project.url.href).searchParams.get('project');
    if (!_id) return null;

    let _project = localProject || this.project();

    // Re-saving from the planner keeps the name given on My Projects
    if (_project.name === undefined) {
      const name = (await this.getById(_id))?.name;
      if (name) _project = { ..._project, name };
    }

    // The data and the index change together, so a sync can't land in between
    const indexItem = await withIndexLock(async () => {
      // Atomic-like update: set the project data first
      await set(`${PROJECT_PREFIX}${_id}`, _project);

      // Verify written data (Safety check)
      const verified = await this.getById(_id);
      if (!verified) {
        throw new Error(`Failed to verify project storage for ID: ${_id}`);
      }

      // Then update index
      const index = await this.getIndex();
      const existingIndex = index.findIndex((i) => i.id === _id);
      const existing = index[existingIndex]?.sync;

      // Signed in: the project is the account's, and has changes to upload
      const owner = this.syncOwner() ?? existing?.ownerUserId;
      const sync: ProjectSyncState | undefined = owner
        ? {
            ownerUserId: owner,
            rev: existing?.ownerUserId === owner ? existing.rev : null,
            dirty: true,
            updatedAt: Date.now(),
            lastSyncedAt:
              existing?.ownerUserId === owner ? existing.lastSyncedAt : null,
            error: null,
          }
        : undefined;

      const item = indexItemFor(_id, _project, sync);
      if (existingIndex > -1) index[existingIndex] = item;
      else index.push(item);
      await this.setIndex(index);
      return item;
    });

    this.onChange?.();
    return indexItem;
  }

  /**
   * Remove project by ID from IndexedDB
   */
  static async removeById(id: string | null): Promise<void> {
    if (!id || !this.isAvailable()) return;

    const removed = await this.removeLocalOnly(id);

    // Synced: tell the server on the next sync, so other devices remove it too
    const sync = removed?.sync;
    if (sync && sync.rev !== null) {
      const state = await this.accountSyncState(sync.ownerUserId);
      await this.setAccountSyncState(sync.ownerUserId, {
        ...state,
        pendingDeletes: [
          ...state.pendingDeletes.filter((p) => p.id !== id),
          { id, baseRev: sync.rev },
        ],
      });
    }
    this.onChange?.();
  }

  /**
   * Removes a project from this browser only, if `unless` doesn't object to its
   * current entry. Returns the entry removed, if any.
   */
  static async removeLocalOnly(
    id: string,
    unless?: (item: StoredProjectIndexItem | undefined) => boolean,
  ): Promise<StoredProjectIndexItem | undefined> {
    return withIndexLock(async () => {
      const index = await this.getIndex();
      const item = index.find((i) => i.id === id);
      if (unless?.(item)) return undefined;
      await del(`${PROJECT_PREFIX}${id}`);
      if (item) await this.setIndex(index.filter((i) => i.id !== id));
      return item;
    });
  }

  // *****************
  // Sync (see $lib/sync). Unused unless accounts are on and someone signs in.
  // *****************

  /** The signed-in account's ID, which new saves belong to */
  static syncOwner = (): string | null =>
    __ACCOUNTS_ENABLED__ ? (account.summary?.id ?? null) : null;

  /** The saved project this page opened, and when it was last changed */
  static opened: { id: string; updatedAt: number | null } | null = null;

  /** Called after a save or removal, to schedule a sync. Set by $lib/sync. */
  static onChange: (() => void) | undefined;

  static async accountSyncState(userId: string): Promise<AccountSyncState> {
    const saved = await get<AccountSyncState>(
      `${SYNC_ACCOUNT_PREFIX}${userId}`,
    ).catch(() => undefined);
    return saved ?? { since: 0, pendingDeletes: [] };
  }

  static async setAccountSyncState(userId: string, state: AccountSyncState) {
    await set(`${SYNC_ACCOUNT_PREFIX}${userId}`, state);
  }

  static async clearAccountSyncState(userId: string) {
    await del(`${SYNC_ACCOUNT_PREFIX}${userId}`);
  }

  /** Changes the sync state of several projects at once; undefined removes it. */
  static async updateSyncStates(
    update: (
      item: StoredProjectIndexItem,
    ) => ProjectSyncState | undefined | 'unchanged',
  ) {
    await withIndexLock(async () => {
      const index = await this.getIndex();
      let changed = false;
      const next = index.map((item) => {
        const sync = update(item);
        if (sync === 'unchanged') return item;
        changed = true;
        const next: StoredProjectIndexItem = { ...item, sync };
        if (!sync) delete next.sync;
        return next;
      });
      if (changed) await this.setIndex(next);
    });
  }

  /** The IndexedDB side of the sync engine. */
  static localStore(): LocalStore {
    return {
      list: async () =>
        (await this.getIndex()).map(({ id, sync }) => ({ id, sync })),
      read: (id) => this.getById(id),
      put: (id, project, sync, seen) =>
        withIndexLock(async () => {
          const index = await this.getIndex();
          const at = index.findIndex((i) => i.id === id);
          if (!unchangedSince(index[at], seen)) return false;
          await set(`${PROJECT_PREFIX}${id}`, project);
          const item = indexItemFor(id, project, sync);
          if (at > -1) index[at] = item;
          else index.push(item);
          await this.setIndex(index);
          return true;
        }),
      updateSync: (id, update) =>
        this.updateSyncStates((item) =>
          item.id === id ? update(item.sync) : 'unchanged',
        ),
      remove: async (id, seen) => {
        let unchanged = false;
        await this.removeLocalOnly(id, (item) => {
          unchanged = Boolean(item) && unchangedSince(item, seen);
          return !unchanged;
        });
        return unchanged;
      },
      accountState: (userId) => this.accountSyncState(userId),
      setAccountState: (userId, state) =>
        this.setAccountSyncState(userId, state),
    };
  }

  /**
   * Name a saved project, or clear its name with an empty string. A project in
   * an account has a change to upload, so the name reaches its other devices.
   */
  static async rename(id: string, name: string): Promise<void> {
    const trimmed = cleanName(name, MAX_SAVED_PROJECT_NAME_LENGTH);
    await withIndexLock(async () => {
      const stored = await this.getById(id);
      if (!stored) return;
      const { name: _, ...rest } = stored;
      await set(
        `${PROJECT_PREFIX}${id}`,
        trimmed ? { ...rest, name: trimmed } : rest,
      );

      const index = await this.getIndex();
      const item = index.find((i) => i.id === id);
      if (!item) return;
      const { name: __, ...meta } = item.meta;
      item.meta = trimmed ? { ...meta, name: trimmed } : meta;
      if (item.sync)
        item.sync = { ...item.sync, dirty: true, updatedAt: Date.now() };
      await this.setIndex(index);
    });
    this.onChange?.();
  }

  /**
   * Put back a project that was just removed, at its old place in the list.
   * In an account, the deletion is called off if it hasn't reached the server
   * yet, and the project is uploaded again either way: once a deletion has
   * reached the server, the sync uploads over it.
   */
  static async restore({
    item,
    project: stored,
    position,
  }: {
    item: StoredProjectIndexItem;
    project: StoredProject;
    position: number;
  }): Promise<void> {
    if (!this.isAvailable()) throw new Error('IndexedDB is not available');
    let restored = item;
    const sync = item.sync;
    if (sync) {
      if (sync.ownerUserId === this.syncOwner()) {
        restored = { ...item, sync: { ...sync, dirty: true, error: null } };
        const state = await this.accountSyncState(sync.ownerUserId);
        if (state.pendingDeletes.some((p) => p.id === item.id))
          await this.setAccountSyncState(sync.ownerUserId, {
            ...state,
            pendingDeletes: state.pendingDeletes.filter(
              (p) => p.id !== item.id,
            ),
          });
      } else {
        // Its account isn't signed in here: it comes back to this browser only
        const { sync: _, ...rest } = item;
        restored = rest;
      }
    }
    await withIndexLock(async () => {
      await set(`${PROJECT_PREFIX}${item.id}`, stored);
      const index = (await this.getIndex()).filter((i) => i.id !== item.id);
      index.splice(Math.min(position, index.length), 0, restored);
      await this.setIndex(index);
    });
    this.onChange?.();
  }

  /**
   * Move a saved project to the Trash. In an account this deletes it there too
   * (and so from the account's other devices); Restore uploads it again.
   */
  static async moveToTrash(id: string): Promise<void> {
    const index = await this.getIndex();
    const position = index.findIndex((i) => i.id === id);
    const stored = await this.getById(id);
    if (position === -1) return;
    // A list entry whose project data is missing: nothing to keep, just remove it
    if (!stored) return this.removeById(id);
    const trashed: TrashedProject = {
      item: index[position],
      project: stored,
      position,
      deletedAt: Date.now(),
    };
    // Into the Trash first, so a failure part way never loses the project
    await update<TrashedProject[]>(PROJECTS_TRASH_KEY, (trash = []) => [
      ...trash.filter((t) => t.item.id !== id),
      trashed,
    ]);
    await this.removeById(id);
  }

  /**
   * Puts back a project downloaded from the account's Trash, with a change to
   * upload: the next sync saves it over the deletion, so every device gets it.
   */
  static async putRestored(
    id: string,
    project: StoredProject,
    sync: ProjectSyncState,
  ): Promise<void> {
    if (!this.isAvailable()) throw new Error('IndexedDB is not available');
    await withIndexLock(async () => {
      await set(`${PROJECT_PREFIX}${id}`, project);
      const index = (await this.getIndex()).filter((i) => i.id !== id);
      index.push(indexItemFor(id, project, sync));
      await this.setIndex(index);
    });
    this.onChange?.();
  }

  /**
   * Deleted for good before its deletion reached the account: the account's
   * copy in its Trash goes once it has (see $lib/sync/engine)
   */
  static async queuePurge(userId: string, id: string): Promise<void> {
    const state = await this.accountSyncState(userId);
    await this.setAccountSyncState(userId, {
      ...state,
      pendingPurges: [
        ...(state.pendingPurges ?? []).filter((p) => p !== id),
        id,
      ],
    });
    this.onChange?.();
  }

  /**
   * Projects in the Trash, most recently deleted first. Ones older than
   * TRASH_DAYS (see ./trash) are deleted for good on the way. While someone is
   * signed in, another account's projects stay hidden, as in the list.
   */
  static async getTrash(): Promise<TrashedProject[]> {
    if (!this.isAvailable()) return [];
    const trash = (await get<TrashedProject[]>(PROJECTS_TRASH_KEY)) || [];
    const cutoff = trashCutoff();
    if (trash.some((t) => t.deletedAt < cutoff)) {
      await update<TrashedProject[]>(PROJECTS_TRASH_KEY, (current = []) =>
        current.filter((t) => t.deletedAt >= cutoff),
      );
    }
    const owner = this.syncOwner();
    return trash
      .filter((t) => t.deletedAt >= cutoff)
      .filter(
        ({ item }) => !owner || !item.sync || item.sync.ownerUserId === owner,
      )
      .sort((a, b) => b.deletedAt - a.deletedAt);
  }

  /**
   * Put a project from the Trash back where it was
   */
  static async restoreFromTrash(id: string): Promise<void> {
    const trash = (await get<TrashedProject[]>(PROJECTS_TRASH_KEY)) || [];
    const trashed = trash.find((t) => t.item.id === id);
    if (!trashed) return;
    // Saved again since (opened from its link): keep that newer copy
    if (!(await this.getById(id))) await this.restore(trashed);
    await this.deleteForever(id);
  }

  /**
   * Delete a project in the Trash for good
   */
  static async deleteForever(id: string): Promise<void> {
    await update<TrashedProject[]>(PROJECTS_TRASH_KEY, (trash = []) =>
      trash.filter((t) => t.item.id !== id),
    );
    changed();
  }

  /**
   * Delete every project in the Trash for good (only the signed-in account's
   * and this browser's, while someone is signed in)
   */
  static async emptyTrash(): Promise<void> {
    const owner = this.syncOwner();
    await update<TrashedProject[]>(PROJECTS_TRASH_KEY, (trash = []) =>
      owner
        ? trash.filter(
            ({ item }) => item.sync && item.sync.ownerUserId !== owner,
          )
        : [],
    );
    changed();
  }

  /**
   * When an account leaves this browser: its projects in the Trash go too, or,
   * with `keep`, stay as this browser's own
   */
  static async leaveAccountTrash(userId: string, keep: boolean) {
    await update<TrashedProject[]>(PROJECTS_TRASH_KEY, (trash = []) =>
      trash.flatMap((t) => {
        if (t.item.sync?.ownerUserId !== userId) return [t];
        if (!keep) return [];
        const { sync: _, ...item } = t.item;
        return [{ ...t, item }];
      }),
    );
    changed();
  }

  /**
   * Get project index item by its HREF
   */
  static async getIndexItemByHref(
    href: string,
  ): Promise<StoredProjectIndexItem | null> {
    const index = await this.getIndex();
    return index.find((i) => i.meta.href === href) || null;
  }

  /**
   * Get full project by its HREF
   */
  static async getByHref(href: string): Promise<StoredProject | null> {
    const indexItem = await this.getIndexItemByHref(href);
    if (!indexItem) return null;
    return this.getById(indexItem.id);
  }

  /**
   * Get all projects for display (reversed)
   */
  static async getProjectsForDisplay(): Promise<StoredProjectIndexItem[]> {
    const index = await this.getIndex();
    // While someone is signed in, another account's projects stay hidden (a
    // shared browser). Signed out, everything shows, including projects of an
    // account whose session ended.
    const owner = this.syncOwner();
    return sortByRecent(
      index.filter((i) => !owner || !i.sync || i.sync.ownerUserId === owner),
    );
  }

  /**
   * Remove project by its HREF
   */
  static async removeByHref(href: string): Promise<void> {
    const indexItem = await this.getIndexItemByHref(href);
    if (!indexItem) return;
    await this.removeById(indexItem.id);
  }

  /**
   * Get full project by its timestamp
   */
  static async getByTimestamp(
    timestamp: string,
  ): Promise<StoredProject | null> {
    const index = await this.getIndex();
    const indexItem = index.find((i) => {
      const url = new URL(i.meta.href);
      return url.searchParams?.get('t') === timestamp;
    });
    if (!indexItem) return null;
    return this.getById(indexItem.id);
  }

  /**
   * If the current window href matches a project in storage, load it into the current project state.
   */
  static async load() {
    if (!ProjectStorage.isAvailable()) return;

    const href = project.onLoaded.href;
    if (!href) return;
    const pageURL = new URL(href);
    const id = pageURL.searchParams.get('project');
    if (!id) return;

    // Which saved version this page opens, so autosave can tell when a sync
    // brings in a newer one from another device
    const indexItem = (await this.getIndex()).find((i) => i.id === id);
    ProjectStorage.opened = {
      id,
      updatedAt: indexItem?.sync?.updatedAt ?? null,
    };

    const matchedProject = await ProjectStorage.getById(id);
    if (!matchedProject) return;

    // Keep the original creation date so re-saving never re-stamps it
    if (matchedProject.createdAt) project.createdAt = matchedProject.createdAt;

    // Set weather source
    const weatherSource: WeatherSourceOptions = matchedProject.weatherSource;
    if (weatherSource) {
      const { name, useSecondary } = weatherSource;
      if (name) weather.source.name = name;
      weather.source.useSecondary = useSecondary;
      if (weatherSource?.settings)
        weather.source.settings = weatherSource.settings;
      weather.source.wasLoadedFromStorage = true;
    }

    // Set isCustomWeather
    weather.isUserEdited = matchedProject.isCustomWeatherData === true;

    // Set location data
    if (matchedProject.locations && matchedProject.locations.length) {
      locations.load({
        locations: matchedProject.locations,
        source: 'storage',
      });
    }

    // Set weather data and convert dates to Date objects
    const weatherLocalStorage = matchedProject.weatherData;
    if (!weatherLocalStorage || !weatherLocalStorage.length) return;

    const newWeatherUngrouped = weatherLocalStorage.map((n) => {
      const dateStr =
        typeof n.date === 'string' ? n.date : dateToISO8601String(n.date);
      const date = stringToDate(dateStr as TISO8601DateString);
      const moon = n.moon || getMoonPhase(date);
      return { ...n, date, moon };
    });

    // Check if there are any days in the project past the day the project was created
    const createdAtTime = projectCreatedAtTime({
      createdAt: matchedProject.createdAt,
      id,
    });

    // User-edited weather can't be fetched again, so always load it.
    // Otherwise, if the creation date is unknown the stored weather may be incomplete, so don't load it.
    if (createdAtTime === null && !matchedProject.isCustomWeatherData) return;

    if (createdAtTime !== null) {
      const latestDay = new Date(
        Math.max(...newWeatherUngrouped.map((n) => n.date.getTime())),
      ).getTime();

      let daysInFuture = 0;
      if (latestDay >= createdAtTime)
        daysInFuture = numberOfDays(createdAtTime, latestDay);

      // If there are days in the future and the weather is not custom, do not load weather from local storage
      if (daysInFuture > 0 && !matchedProject.isCustomWeatherData) return;
    }

    // Set the weather data and indicate that it was loaded from storage
    weather.setRawData(newWeatherUngrouped);
    weather.wasLoadedFromStorage = true;
  }

  /**
   * Creates a project object to store the current project in local storage.
   */
  private static project = (): StoredProject => {
    const date = formatDateTime(new Date());

    const isCustomWeatherData = weather.isUserEdited || false;
    const _title = locations.projectTitle || '';
    const href = project.url.href;

    const weatherData = $state.snapshot(weather.rawData).map((day) => {
      return {
        ...day,
        date: dateToISO8601String(day.date),
      };
    });

    const weatherSource: WeatherSourceOptions = $state.snapshot(weather.source);

    const locationsDetails = locations.all.map((location) => {
      return {
        duration: location.duration,
        from: location.from,
        to: location.to,
        id: location.id,
        lat: location.lat,
        lng: location.lng,
        elevation: location.elevation,
        fclName: location.fclName,
        population: location.population,
        label: location.label,
        flagIcon: location.flagIcon,
        result: location.result,
      };
    });

    return {
      createdAt: project.createdAt,
      date,
      isCustomWeatherData,
      href,
      locations: locationsDetails,
      title: _title,
      weatherData: weatherData as unknown as WeatherDay[],
      weatherSource: weatherSource as unknown as WeatherSourceOptions,
    };
  };
}
