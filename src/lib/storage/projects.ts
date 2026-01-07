import { browser } from '$app/environment';
import { del, get, set } from 'idb-keyval';
import type { WeatherDay, WeatherSourceOptions } from '$lib/types';

export type LocalStorageProjectIndexItem = {
  id: string;
  meta: {
    date: string;
    href: string;
    title: string;
    isCustomWeatherData: boolean;
  };
};

export type LocalStorageProject = {
  date: string;
  href: string;
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
  static async getIndex(): Promise<LocalStorageProjectIndexItem[]> {
    if (!this.isAvailable()) return [];
    try {
      const index =
        await get<LocalStorageProjectIndexItem[]>(PROJECTS_INDEX_KEY);
      return index || [];
    } catch {
      return [];
    }
  }

  /**
   * Set projects index in IndexedDB
   */
  static async setIndex(index: LocalStorageProjectIndexItem[]): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('IndexedDB is not available');
    }
    await set(PROJECTS_INDEX_KEY, index);
  }

  /**
   * Get full project by ID from IndexedDB
   */
  static async getById(id: string | null): Promise<LocalStorageProject | null> {
    if (!id || !this.isAvailable()) return null;
    try {
      const project = await get<LocalStorageProject>(`${PROJECT_PREFIX}${id}`);
      return project || null;
    } catch {
      return null;
    }
  }

  /**
   * Save project to IndexedDB
   */
  static async save(id: string, project: LocalStorageProject): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('IndexedDB is not available');
    }

    // Atomic-like update: set the project data first
    await set(`${PROJECT_PREFIX}${id}`, project);

    // Verify written data (Safety check)
    const verified = await this.getById(id);
    if (!verified) {
      throw new Error(`Failed to verify project storage for ID: ${id}`);
    }

    // Then update index
    const index = await this.getIndex();
    const existingIndex = index.findIndex((i) => i.id === id);

    const indexItem: LocalStorageProjectIndexItem = {
      id,
      meta: {
        date: project.date,
        href: project.href,
        title: project.title || '',
        isCustomWeatherData: project.isCustomWeatherData || false,
      },
    };

    if (existingIndex > -1) {
      index[existingIndex] = indexItem;
    } else {
      index.push(indexItem);
    }

    await this.setIndex(index);
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
  ): Promise<LocalStorageProjectIndexItem | null> {
    const index = await this.getIndex();
    return index.find((i) => i.meta.href === href) || null;
  }

  /**
   * Get full project by its HREF
   */
  static async getByHref(href: string): Promise<LocalStorageProject | null> {
    const indexItem = await this.getIndexItemByHref(href);
    if (!indexItem) return null;
    return this.getById(indexItem.id);
  }

  /**
   * Get all projects for display (reversed)
   */
  static async getProjectsForDisplay(): Promise<
    LocalStorageProjectIndexItem[]
  > {
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
}
