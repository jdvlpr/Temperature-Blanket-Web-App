import { browser } from '$app/environment';
import { locations, project, weather } from '$lib/state';
import type {
  LocationType,
  WeatherDay,
  WeatherSourceOptions,
} from '$lib/types';
import {
  dateToISO8601String,
  getMoonPhase,
  numberOfDays,
  stringToDate,
} from '$lib/utils';
import { del, get, set } from 'idb-keyval';

export type StoredProjectIndexItem = {
  id: string;
  meta: {
    date: string;
    href: string;
    title: string;
    isCustomWeatherData: boolean;
  };
};

export type StoredProject = {
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
        isCustomWeatherData: _project.isCustomWeatherData || false,
      },
    };

    if (existingIndex > -1) {
      index[existingIndex] = indexItem;
    } else {
      index.push(indexItem);
    }

    await this.setIndex(index);

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

    const pageURL = new URL(project.onLoaded.href);
    const id = pageURL.searchParams.get('project');
    if (!id) return;

    const matchedProject = await ProjectStorage.getById(id);
    if (!matchedProject) return;

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
      const date = stringToDate(n.date);
      const moon = n.moon || getMoonPhase(date);
      return { ...n, date, moon };
    });

    // Check if there are any days in the project past the day the project was created
    let url = new URL(matchedProject.href);
    let timestamp: string | number | null = new URLSearchParams(url.search).get(
      'project',
    );

    if (timestamp === null || !Number.isFinite(+timestamp)) return;

    timestamp = Number(timestamp);
    const latestDay = new Date(
      Math.max(...newWeatherUngrouped.map((n) => n.date.getTime())),
    ).getTime();

    let daysInFuture = 0;
    if (latestDay >= timestamp)
      daysInFuture = numberOfDays(timestamp, latestDay);

    // If there are days in the future and the weather is not custom, do not load weather from local storage
    if (daysInFuture > 0 && !matchedProject.isCustomWeatherData) return;

    // Set the weather data and indicate that it was loaded from storage
    weather.rawData = newWeatherUngrouped;
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
