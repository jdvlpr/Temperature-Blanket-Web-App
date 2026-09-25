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
  numberOfDays,
  stringToDate,
} from '$lib/utils/date-utils';
import { getMoonPhase } from '$lib/state/weather-state.svelte';
import { projectCreatedAtTime } from '$lib/utils/project-id-utils';
import type {
  AccountSyncState,
  LocalStore,
  ProjectSyncState,
} from '$lib/sync/engine';
import { unchangedSince } from '$lib/sync/seen';
import { del, get, set } from 'idb-keyval';

export type StoredProjectIndexItem = {
  id: string;
  meta: {
    date: string;
    href: string;
    title: string;
    isCustomWeatherData: boolean;
  };
  /** Present once the project belongs to an account (see $lib/sync) */
  sync?: ProjectSyncState;
};

export type StoredProject = {
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

const PROJECTS_INDEX_KEY = 'projects_index';
const PROJECT_PREFIX = 'p_';
const SYNC_ACCOUNT_PREFIX = 'sync_account_';

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

    const _project = localProject || this.project();

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
    return index
      .filter((i) => !owner || !i.sync || i.sync.ownerUserId === owner)
      .reverse();
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
    const _date = new Date();
    const date =
      _date.toLocaleDateString(undefined, { timeZone: 'UTC' }) +
      ' at ' +
      _date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

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
