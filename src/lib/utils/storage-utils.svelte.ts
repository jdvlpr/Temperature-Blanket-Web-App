// Copyright (c) 2024, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

import { browser } from '$app/environment';
import { skeletonThemes } from '$lib/components/ThemeSwitcher.svelte';
import { DEFAULT_SEASONS } from '$lib/constants';
import { localState, locations, project, weather } from '$lib/state';
import type { PageLayout, WeatherDay, WeatherSourceOptions } from '$lib/types';
import {
  dateToISO8601String,
  getMoonPhase,
  numberOfDays,
  stringToDate,
} from '$lib/utils';
import { get, set, del, entries } from 'idb-keyval';

type LocalStorageProjectIndexItem = {
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

const PROJECT_INDEX_KEY = 'projects_index';
const PROJECT_PREFIX = 'p_';

/**
 * Check if IndexedDB is available in the current browser environment
 */
function isIndexedDBAvailable(): boolean {
  if (!browser) return false;
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

function parseProjectIdFromHref(href: string | null) {
  if (!href) return null;
  try {
    return new URL(href).searchParams.get('project');
  } catch {
    return null;
  }
}

/**
 * Get projects index from IndexedDB
 */
async function getProjectsIndex(): Promise<LocalStorageProjectIndexItem[]> {
  if (!isIndexedDBAvailable()) {
    throw new Error('IndexedDB is not available');
  }
  try {
    const index = await get<LocalStorageProjectIndexItem[]>(PROJECT_INDEX_KEY);
    return index || [];
  } catch {
    return [];
  }
}

/**
 * Set projects index in IndexedDB
 */
async function setProjectsIndex(
  index: LocalStorageProjectIndexItem[],
): Promise<void> {
  if (!isIndexedDBAvailable()) {
    throw new Error('IndexedDB is not available');
  }
  await set(PROJECT_INDEX_KEY, index);
}

/**
 * Get full project by ID from IndexedDB
 */
async function getFullProjectById(
  id: string | null,
): Promise<LocalStorageProject | null> {
  if (!id || !isIndexedDBAvailable()) return null;
  try {
    const project = await get<LocalStorageProject>(`${PROJECT_PREFIX}${id}`);
    return project || null;
  } catch {
    return null;
  }
}

/**
 * Remove project by ID from IndexedDB
 */
async function removeProjectById(id: string | null): Promise<void> {
  if (!id || !isIndexedDBAvailable()) return;
  await del(`${PROJECT_PREFIX}${id}`);
  const index = await getProjectsIndex();
  const newIndex: LocalStorageProjectIndexItem[] = index.filter(
    (i: LocalStorageProjectIndexItem) => i.id !== id,
  );
  await setProjectsIndex(newIndex);
}

// ***********
// Migrate projects from localStorage to IndexedDB
// This migrates from the legacy 'projects' localStorage key to IndexedDB
// Added in version 5.36.0
// ***********
async function migrateProjectsFromLocalStorageToIndexedDB(): Promise<void> {
  if (!isIndexedDBAvailable()) {
    throw new Error('IndexedDB is not available. Cannot migrate projects.');
  }

  const LEGACY_PROJECTS_KEY = 'projects';

  // Check if migration has already occurred
  const existingIndex = await getProjectsIndex();
  if (existingIndex.length > 0) {
    // Migration has already occurred, clean up legacy localStorage keys
    // Remove the legacy 'projects' key
    if (localStorage.getItem(LEGACY_PROJECTS_KEY)) {
      localStorage.removeItem(LEGACY_PROJECTS_KEY);
    }
    // Remove any old per-key project storage (p_* keys)
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PROJECT_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
    // Remove old projects_index from localStorage if it exists
    if (localStorage.getItem(PROJECT_INDEX_KEY)) {
      localStorage.removeItem(PROJECT_INDEX_KEY);
    }
    return;
  }

  // Check for legacy 'projects' key in localStorage
  const raw = localStorage.getItem(LEGACY_PROJECTS_KEY);
  if (!raw) {
    // No legacy data to migrate
    return;
  }

  let parsed: LocalStorageProject[];
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Invalid JSON, skip migration
    return;
  }

  if (!Array.isArray(parsed) || !parsed.length || !parsed[0]) {
    // Empty or invalid data, clean up and return
    localStorage.removeItem(LEGACY_PROJECTS_KEY);
    return;
  }

  // Backup projects for error recovery
  if (!project.status.temporaryProjectsBackup.length) {
    project.status.temporaryProjectsBackup = parsed;
  }

  // Migrate projects to IndexedDB
  const newIndex: LocalStorageProjectIndexItem[] = [];
  for (const legacyProject of parsed) {
    const id =
      parseProjectIdFromHref(legacyProject.href) ||
      `${Date.now()}_${Math.random()}`;

    // Check if project already exists in IndexedDB
    const existingProject = await getFullProjectById(id);
    if (!existingProject) {
      // Store the full project in IndexedDB
      await set(`${PROJECT_PREFIX}${id}`, legacyProject);
    }

    // Add the project to the index, if it doesn't already exist
    if (!newIndex.find((i: LocalStorageProjectIndexItem) => i.id === id)) {
      newIndex.push({
        id,
        meta: {
          date: legacyProject.date,
          href: legacyProject.href,
          title: legacyProject.title || '',
          isCustomWeatherData: legacyProject.isCustomWeatherData || false,
        },
      });
    }
  }

  // Save the index to IndexedDB
  await setProjectsIndex(newIndex);

  // Clean up localStorage after successful migration
  localStorage.removeItem(LEGACY_PROJECTS_KEY);
  // Remove any old per-key project storage (p_* keys)
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PROJECT_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
  // Remove old projects_index from localStorage if it exists
  if (localStorage.getItem(PROJECT_INDEX_KEY)) {
    localStorage.removeItem(PROJECT_INDEX_KEY);
  }
}

// ****************
// Cleans up old local storage keys which are no longer used or which have been migrated to different locations
// Added in version 5.0.0
// Updated in version 5.36.0 to migrate projects to IndexedDB
// ****************
async function handleLegacyLocalStorageKeys() {
  // Migrate projects from localStorage to IndexedDB
  try {
    await migrateProjectsFromLocalStorageToIndexedDB();
  } catch (e) {
    console.error(
      'Failed to migrate projects from localStorage to IndexedDB',
      e,
    );
    // If IndexedDB is not available, throw error to trigger LegacyMigrationError dialog
    if (!isIndexedDBAvailable()) {
      throw new Error(
        'IndexedDB is not available. Projects cannot be stored in this browser.',
      );
    }
    // For other errors, rethrow to trigger error handling in +layout.svelte
    throw e;
  }

  // 'layout' is now 'preferences.layout'
  if (localStorage.getItem('layout')) {
    localState.value.layout = localStorage.getItem('layout') as PageLayout;
    localStorage.removeItem('layout');
  }

  // 'disable_toast_analytics' is now 'preferences.disableToastAnalytics'
  const disableToastAnalytics = localStorage.getItem('disable_toast_analytics');
  if (disableToastAnalytics === 'true' || disableToastAnalytics === 'false') {
    let value = JSON.parse(disableToastAnalytics);
    localState.value.disableToastAnalytics = value;
    localStorage.removeItem('disable_toast_analytics');
  }

  // 'theme' is now 'preferences.theme.mode'
  const theme = localStorage.getItem('theme');
  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    localState.value.theme.mode = theme;
    localStorage.removeItem('theme');
  }

  // 'skeletonTheme' is now 'preferences.theme.id'
  const skeletonTheme = localStorage.getItem('skeletonTheme');
  if (skeletonTheme) {
    let parsedSkeletonTheme;
    try {
      parsedSkeletonTheme = JSON.parse(skeletonTheme); // themes were stored as "example" (included the quotes), so we need to parse them
    } catch {
      parsedSkeletonTheme = null;
    }
    if (
      parsedSkeletonTheme &&
      skeletonThemes.some((theme) => theme.id === parsedSkeletonTheme)
    ) {
      localState.value.theme.id = parsedSkeletonTheme;
      localStorage.removeItem('skeletonTheme');
    }
  }
}

export async function initializeLocalStorage() {
  try {
    await handleLegacyLocalStorageKeys();
  } catch (e) {
    throw e;
  }

  localState.value.theme.id = localState.value.theme.id || 'classic';

  localState.value.theme.mode = localState.value.theme.mode || 'system';

  localState.value.seasons = localState.value.seasons || DEFAULT_SEASONS;

  // ****************
  // Setup Theme Listeners
  // ****************

  // Change the theme when the system preferences changes, if the user has chosen 'system'
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      if (localState.value.theme.mode === 'system') {
        if (e.matches) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
    });

  $effect.root(() => {
    $effect(() => {
      // Update the body data-theme attribute when the user changes the skeleton theme or mode

      const theme = localState.value.theme.id || 'classic';
      const mode = localState.value.theme.mode || 'system';

      if (skeletonThemes.map((theme) => theme.id).includes(theme)) {
        document.documentElement.setAttribute(
          'data-theme',
          localState.value.theme.id,
        );

        // Set theme cookies, in order to read them when loading the page (to avoid flash of content)
        fetch('/api/preferences/theme', {
          method: 'POST',
          body: JSON.stringify({
            theme,
            mode,
          }),
        });
      }
    });

    $effect(() => {
      // Update the dark or light mode when the user changes the theme mode
      document.documentElement.classList.toggle(
        'dark',
        localState.value.theme.mode === 'dark' ||
          (localState.value.theme.mode === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches),
      );
    });
  });
}

/**
 * Retrieves the project data from storage and sets the necessary values.
 * - Retrieves the project data based on the current URL.
 * - Sets the weather source, isCustomWeather, and weather data based on the retrieved project data.
 * - Converts the weather data dates from strings to Date objects.
 * - Checks if there are any days in the project past the day the project was created.
 * - Sets the weather data and indicates that it was loaded from storage.
 */
export const checkForProjectInStorage = async () => {
  // Retrieve project data from IndexedDB based on the current URL
  if (!isIndexedDBAvailable()) return;
  const id = new URL(window.location.href).searchParams.get('project');
  if (!id) return;

  const matchedProject = await getFullProjectById(id);

  if (!matchedProject) return;

  // Set weather source
  const weatherSource: WeatherSourceOptions = matchedProject.weatherSource;
  if (weatherSource) {
    const { name, useSecondary } = weatherSource;
    if (name) weather.source.name = name;
    weather.source.useSecondary = useSecondary;
    if (weatherSource?.settings)
      weather.source.settings = weatherSource.settings;
  }

  // Set isCustomWeather
  const _isCustomWeather = matchedProject.isCustomWeatherData;
  if (_isCustomWeather === true) weather.isUserEdited = true;
  else if (_isCustomWeather === false) weather.isUserEdited = false;

  // Set weather data and convert dates to Date objects
  const weatherLocalStorage = matchedProject.weatherData;

  if (!weatherLocalStorage || !weatherLocalStorage.length) return;

  const newWeatherUngrouped = weatherLocalStorage.map((n) => {
    const date = stringToDate(n.date);

    const moon = n.moon || getMoonPhase(date);

    return {
      ...n,
      date,
      moon,
    };
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
  weather.isFromLocalStorage = true;
};

/**
 * Legacy export name for backwards compatibility
 * @deprecated Use checkForProjectInStorage instead
 */
export const checkForProjectInLocalStorage = checkForProjectInStorage;

export const setProjectInStorage = async () => {
  if (!browser || !isIndexedDBAvailable()) {
    if (!isIndexedDBAvailable()) {
      throw new Error(
        'IndexedDB is not available. Projects cannot be stored in this browser.',
      );
    }
    return;
  }

  const localProjectsIndex = await getProjectsIndex();

  const projectIDs = localProjectsIndex?.map((_project) => _project.id);

  const thisID = new URL(project.url.href).searchParams.get('project');

  if (!thisID) return;

  const index = projectIDs?.indexOf(thisID);

  if (index > -1) {
    // project is already in the index, so delete the existing index entry
    localProjectsIndex.splice(index, 1);
    // Remove old full project key (we'll overwrite it below)
    await del(`${PROJECT_PREFIX}${thisID}`);
  }

  const localProject = createProjectLocalStorageProjectObject();

  // Store the full project in IndexedDB
  await set(`${PROJECT_PREFIX}${thisID}`, localProject);

  // Save minimal metadata in the projects index
  const projectIndex = {
    id: thisID,
    meta: {
      date: localProject.date,
      href: localProject.href,
      title: localProject.title || '',
      isCustomWeatherData: localProject.isCustomWeatherData || false,
    },
  };

  localProjectsIndex.push(projectIndex);

  await setProjectsIndex(localProjectsIndex);
};

/**
 * Legacy export name for backwards compatibility
 * @deprecated Use setProjectInStorage instead
 */
export const setLocalStorageProject = setProjectInStorage;

/**
 * Creates a project object to store the current project in local storage.
 *
 * @return {LocalStorageProject} The project object containing the date, weather data, weather source,
 *                       and other project details.
 */
const createProjectLocalStorageProjectObject = () => {
  const _date = new Date();

  const date =
    _date.toLocaleDateString(undefined, {
      timeZone: 'UTC',
    }) +
    ' at ' +
    _date.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });

  const isCustomWeatherData = weather.isUserEdited || false;

  const _title = locations.projectTitle || '';

  const href = project.url.href;

  const weatherData = weather.rawData.map((day) => {
    return {
      ...day,
      date: dateToISO8601String(day.date),
    };
  });

  const weatherSource: WeatherSourceOptions = weather.source;

  const localProject: LocalStorageProject = {
    date,
    isCustomWeatherData,
    href,
    title: _title,
    weatherData: weatherData as unknown as WeatherDay[],
    weatherSource,
  };

  return localProject;
};

// ----------------------
// Helper functions for IndexedDB project storage
// ----------------------
export async function getSavedProjectMetaByHref(
  href: string,
): Promise<LocalStorageProjectIndexItem | null> {
  if (!isIndexedDBAvailable()) return null;
  const index = await getProjectsIndex();
  return index.find((i: any) => i.meta.href === href) || null;
}

export async function getSavedProjectByHref(
  href: string,
): Promise<LocalStorageProject | null> {
  if (!isIndexedDBAvailable()) return null;
  const meta = await getSavedProjectMetaByHref(href);
  if (!meta) return null;
  return await getFullProjectById(meta.id);
}

export async function getProjectsListForDisplay(): Promise<
  LocalStorageProjectIndexItem[]
> {
  if (!isIndexedDBAvailable()) return [];
  // Return reversed index (most recent last -> first for display)
  const index = await getProjectsIndex();
  return index.slice().reverse();
}

export async function removeProjectByHref(href: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  const meta = await getSavedProjectMetaByHref(href);
  if (!meta) return;
  await removeProjectById(meta.id);
}
