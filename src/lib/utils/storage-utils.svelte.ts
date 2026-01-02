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
import { DEFAULT_SEASONS } from '$lib/constants/seasons-constants';
import { localState, locations, project, weather } from '$lib/state';
import type {
  PageLayout,
  SavedProject,
  WeatherDay,
  WeatherSourceOptions,
} from '$lib/types';
import {
  dateToISO8601String,
  getMoonPhase,
  numberOfDays,
  stringToDate,
} from '$lib/utils';

type LocalStorageProjectIndexItem = {
  id: string;
  meta: {
    date: string;
    href: string;
    title: string;
    isCustomWeatherData: boolean;
  };
};

type LocalStorageProject = {
  date: string;
  href: string;
  isCustomWeatherData: boolean;
  title: string;
  weatherData: WeatherDay[];
  weatherSource: WeatherSourceOptions;
};

const PROJECT_INDEX_KEY = 'projects_index';
const PROJECT_PREFIX = 'p_';

function parseProjectIdFromHref(href: string | null) {
  if (!href) return null;
  try {
    return new URL(href).searchParams.get('project');
  } catch {
    return null;
  }
}

function getProjectsIndex() {
  try {
    const raw = localStorage.getItem(PROJECT_INDEX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setProjectsIndex(index: LocalStorageProjectIndexItem[]) {
  localStorage.setItem(PROJECT_INDEX_KEY, JSON.stringify(index));
}

function getFullProjectById(id: string | null) {
  if (!id) return null;
  try {
    const raw = localStorage.getItem(`${PROJECT_PREFIX}${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function removeProjectById(id: string | null) {
  if (!id) return;
  localStorage.removeItem(`${PROJECT_PREFIX}${id}`);
  const index = getProjectsIndex();
  const newIndex: LocalStorageProjectIndexItem[] = index.filter(
    (i: LocalStorageProjectIndexItem) => i.id !== id,
  );
  setProjectsIndex(newIndex);
}

// ***********
// The 'projects' localStorage key is now split into multiple keys, one for each project
// The old single-key ran up against quota limits if too many projects were stored (for example more than 40 projects with weather data)
// Added in version 5.33.0
// ***********
function migrateProjectsToPerKey() {
  const LEGACY_PROJECTS_KEY = 'projects';

  const projectsIndex = getProjectsIndex();
  if (projectsIndex.length > 0) {
    // Migration has already occurred, since the 'projects_index' key exists
    // TODO: Uncomment the line below after confirming successful deployment of the project key migration. Keep commented out for now to be safe, since this contains users' projects.
    // localStorage.removeItem(LEGACY_PROJECTS_KEY);
    return;
  }

  const raw = localStorage.getItem(LEGACY_PROJECTS_KEY);

  if (!raw) return;

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return;
  }

  // Migrate the projects, if there are any
  if (Array.isArray(parsed) && parsed.length && parsed[0]) {
    const newIndex: LocalStorageProjectIndexItem[] = [];
    parsed.forEach((project: LocalStorageProject) => {
      const id =
        parseProjectIdFromHref(project.href) || new Date().getTime().toString();

      // Store the full project under its own key, if it doesn't already exist
      if (!localStorage.getItem(`${PROJECT_PREFIX}${id}`))
        localStorage.setItem(`${PROJECT_PREFIX}${id}`, JSON.stringify(project));

      // Add the project to the index, if it doesn't already exist
      if (!newIndex.find((i: LocalStorageProjectIndexItem) => i.id === id))
        newIndex.push({
          id,
          meta: {
            date: project.date,
            href: project.href,
            title: project.title || '',
            isCustomWeatherData: project.isCustomWeatherData || false,
          },
        });
    });
    setProjectsIndex(newIndex);
  }
}

// ****************
// Cleans up old local storage keys which are no longer used or which have been migrated to different locations
// Added in version 5.0.0
// ****************
function handleLegacyLocalStorageKeys() {
  migrateProjectsToPerKey();

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
    const parsedSkeletonTheme = JSON.parse(skeletonTheme); // themes were stored as "example" (included the quotes), so we need to parse them
    if (skeletonThemes.map((theme) => theme.id).includes(parsedSkeletonTheme)) {
      localState.value.theme.id = parsedSkeletonTheme;
      localStorage.removeItem('skeletonTheme');
    }
  }
}

export function initializeLocalStorage() {
  handleLegacyLocalStorageKeys();

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
 * Retrieves the project data from local storage and sets the necessary values.
 * - Retrieves the project data based on the current URL.
 * - Sets the weather source, isCustomWeather, and weather data based on the retrieved project data.
 * - Converts the weather data dates from strings to Date objects.
 * - Checks if there are any days in the project past the day the project was created.
 * - Sets the weather data and indicates that it was loaded from local storage.
 */
export const checkForProjectInLocalStorage = async () => {
  // Retrieve project data from local storage based on the current URL
  if (typeof window.localStorage === 'undefined') return;
  const id = new URL(window.location).searchParams.get('project');
  if (!id) return;
  const matchedProject = getFullProjectById(id);

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

  if (!weatherLocalStorage) return;
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
  let timestamp: string | number = new URLSearchParams(url.search).get(
    'project',
  );
  if (timestamp === null || typeof +timestamp !== 'number') return;

  timestamp = +timestamp;

  const latestDay = new Date(
    Math.max(...newWeatherUngrouped.map((n) => n.date)),
  ).getTime();

  let daysInFuture = 0;
  if (latestDay >= +timestamp)
    daysInFuture = numberOfDays(timestamp, latestDay);

  // If there are days in the future and the weather is not custom, do not load weather from local storage
  if (daysInFuture > 0 && !matchedProject.isCustomWeatherData) return;

  // Set the weather data and indicate that it was loaded from local storage
  weather.rawData = newWeatherUngrouped;
  weather.isFromLocalStorage = true;
};

export const setLocalStorageProject = () => {
  if (!browser || typeof window.localStorage === 'undefined') return;

  const localProjectsIndex = getProjectsIndex();

  const projectIDs = localProjectsIndex?.map((_project) => _project.id);

  const thisID = new URL(project.url.href).searchParams.get('project');

  if (!thisID) return;

  const index = projectIDs?.indexOf(thisID);

  if (index > -1) {
    // project is already in the index, so delete the existing index entry
    localProjectsIndex.splice(index, 1);
    // Remove old full project key (we'll overwrite it below)
    localStorage.removeItem(`${PROJECT_PREFIX}${thisID}`);
  }

  const localProject = createProjectLocalStorageProjectObject();

  // Store the full project under its own key
  localStorage.setItem(
    `${PROJECT_PREFIX}${thisID}`,
    JSON.stringify(localProject),
  );

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

  setProjectsIndex(localProjectsIndex);
};

/**
 * Creates a project object to store the current project in local storage.
 *
 * @return {SavedProject} The project object containing the date, weather data, weather source,
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

  const weatherData =
    weather.rawData.map((day) => {
      return {
        ...day,
        date: dateToISO8601String(day.date),
      };
    }) || [];

  const weatherSource: WeatherSourceOptions = weather.source;

  const localProject: SavedProject = {
    date,
    isCustomWeatherData,
    href,
    title: _title,
    weatherData,
    weatherSource,
  };

  return localProject;
};

// ----------------------
// Helper functions for per-key project storage
// ----------------------
export function getSavedProjectMetaByHref(href: string) {
  const index = getProjectsIndex();
  return index.find((i: any) => i.meta.href === href) || null;
}

export function getSavedProjectByHref(href: string) {
  const meta = getSavedProjectMetaByHref(href);
  if (!meta) return null;
  return getFullProjectById(meta.id);
}

export function getProjectsListForDisplay() {
  // Return reversed index (most recent last -> first for display)
  return getProjectsIndex().slice().reverse();
}

export function removeProjectByHref(href: string) {
  const meta = getSavedProjectMetaByHref(href);
  if (!meta) return;
  removeProjectById(meta.id);
}
