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
import { locations, project, weather } from '$lib/state';
import { preferences } from '$lib/storage/preferences.svelte';
import type { PageLayout, WeatherDay, WeatherSourceOptions } from '$lib/types';
import {
  dateToISO8601String,
  getMoonPhase,
  numberOfDays,
  stringToDate,
} from '$lib/utils';
import { MigrationManager } from './migration-manager';
import { ProjectStorage, type LocalStorageProject } from './projects';

/**
 * Cleans up old local storage keys which are no longer used or which have been migrated to different locations
 * Added in version 5.0.0
 */
async function handleLegacyLocalStorageKeys() {
  // 'layout' is now 'preferences.layout'
  if (localStorage.getItem('layout')) {
    preferences.value.layout = localStorage.getItem('layout') as PageLayout;
    localStorage.removeItem('layout');
  }

  // 'disable_toast_analytics' is now 'preferences.disableToastAnalytics'
  const disableToastAnalytics = localStorage.getItem('disable_toast_analytics');
  if (disableToastAnalytics === 'true' || disableToastAnalytics === 'false') {
    let value = JSON.parse(disableToastAnalytics);
    preferences.value.disableToastAnalytics = value;
    localStorage.removeItem('disable_toast_analytics');
  }

  // 'theme' is now 'preferences.theme.mode'
  const theme = localStorage.getItem('theme');
  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    preferences.value.theme.mode = theme;
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
      preferences.value.theme.id = parsedSkeletonTheme;
      localStorage.removeItem('skeletonTheme');
    }
  }

  // Migrate projects from localStorage to IndexedDB
  await MigrationManager.migrateFromLocalStorage();
}

export async function initializeLocalStorage() {
  preferences.value.theme.id = preferences.value.theme.id || 'classic';
  preferences.value.theme.mode = preferences.value.theme.mode || 'system';
  preferences.value.seasons = preferences.value.seasons || DEFAULT_SEASONS;

  try {
    await handleLegacyLocalStorageKeys();
  } catch (e) {
    throw e;
  }

  // Setup Theme Listeners
  if (browser) {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', (e) => {
        if (preferences.value.theme.mode === 'system') {
          if (e.matches) document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
        }
      });
  }

  $effect.root(() => {
    $effect(() => {
      const theme = preferences.value.theme.id || 'classic';
      const mode = preferences.value.theme.mode || 'system';

      if (skeletonThemes.map((theme) => theme.id).includes(theme)) {
        document.documentElement.setAttribute('data-theme', theme);
        fetch('/api/preferences/theme', {
          method: 'POST',
          body: JSON.stringify({ theme, mode }),
        });
      }
    });

    $effect(() => {
      document.documentElement.classList.toggle(
        'dark',
        preferences.value.theme.mode === 'dark' ||
          (preferences.value.theme.mode === 'system' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches),
      );
    });
  });
}

/**
 * Retrieves the project data from storage and sets the necessary values.
 */
export const loadProjectFromStorage = async () => {
  if (!ProjectStorage.isAvailable()) return;
  const id = new URL(window.location.href).searchParams.get('project');
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
    locations.load({ locations: matchedProject.locations, source: 'storage' });
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
  if (latestDay >= timestamp) daysInFuture = numberOfDays(timestamp, latestDay);

  // If there are days in the future and the weather is not custom, do not load weather from local storage
  if (daysInFuture > 0 && !matchedProject.isCustomWeatherData) return;

  // Set the weather data and indicate that it was loaded from storage
  weather.rawData = newWeatherUngrouped;
  weather.wasLoadedFromStorage = true;
};

export const setProjectInStorage = async () => {
  if (!browser || !ProjectStorage.isAvailable()) {
    if (!ProjectStorage.isAvailable()) {
      throw new Error(
        'IndexedDB is not available. Projects cannot be stored in this browser.',
      );
    }
    return;
  }

  const thisID = new URL(project.url.href).searchParams.get('project');
  if (!thisID) return;

  const localProject = createProjectLocalStorageProjectObject();
  await ProjectStorage.save(thisID, localProject);
};

/**
 * Creates a project object to store the current project in local storage.
 */
const createProjectLocalStorageProjectObject = (): LocalStorageProject => {
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
