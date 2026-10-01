import { browser } from '$app/environment';
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

const PROJECTS_INDEX_KEY = 'projects_index';
const PROJECT_PREFIX = 'p_';
const PROJECTS_TRASH_KEY = 'projects_trash';

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

    let _project = localProject || this.project();

    // Re-saving from the planner keeps the name given on My Projects
    if (_project.name === undefined) {
      const name = (await this.getById(_id))?.name;
      if (name) _project = { ..._project, name };
    }

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

    const indexItem: StoredProjectIndexItem = {
      id: _id,
      meta: {
        date: _project.date,
        href: _project.href,
        title: _project.title || '',
        ...(_project.name && { name: _project.name }),
        isCustomWeatherData: _project.isCustomWeatherData || false,
      },
    };

    if (existingIndex > -1) {
      index[existingIndex] = indexItem;
    } else {
      index.push(indexItem);
    }

    await this.setIndex(index);
    changed();

    return indexItem;
  }

  /**
   * Remove project by ID from IndexedDB
   */
  static async removeById(id: string | null): Promise<void> {
    if (!id || !this.isAvailable()) return;

    await del(`${PROJECT_PREFIX}${id}`);

    const index = await this.getIndex();
    const newIndex = index.filter((i) => i.id !== id);
    if (newIndex.length !== index.length) {
      await this.setIndex(newIndex);
    }
    changed();
  }

  /**
   * Name a saved project, or clear its name with an empty string
   */
  static async rename(id: string, name: string): Promise<void> {
    const stored = await this.getById(id);
    if (!stored) return;
    const trimmed = name.trim().slice(0, MAX_SAVED_PROJECT_NAME_LENGTH);
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
    await this.setIndex(index);
    changed();
  }

  /**
   * Put back a project that was just removed, at its old place in the list
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
    await set(`${PROJECT_PREFIX}${item.id}`, stored);
    const index = (await this.getIndex()).filter((i) => i.id !== item.id);
    index.splice(Math.min(position, index.length), 0, item);
    await this.setIndex(index);
    changed();
  }

  /**
   * Move a saved project to the Trash
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
   * Projects in the Trash, most recently deleted first. Ones older than
   * TRASH_DAYS (see ./trash) are deleted for good on the way.
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
    return trash
      .filter((t) => t.deletedAt >= cutoff)
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
   * Delete every project in the Trash for good
   */
  static async emptyTrash(): Promise<void> {
    await set(PROJECTS_TRASH_KEY, []);
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
    return index.slice().reverse();
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
