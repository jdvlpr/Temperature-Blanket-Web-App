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
  WeatherSourceOptions,
} from '$lib/types';
import {
  dateToISO8601String,
  getMoonPhase,
  numberOfDays,
  stringToDate,
} from '$lib/utils';

export function initializeLocalStorage() {
  // ****************
  // Handle Legacy Local Storage Items
  // Clean up old local storage items which are no longer used
  // New in version 5.0.0
  // Probably can remove these in version 6x
  // ****************

  // 'layout' item has been incorporated into the 'localState' object
  if (localStorage.getItem('layout')) {
    localState.value.layout = localStorage.getItem('layout') as PageLayout;
    localStorage.removeItem('layout');
  }

  // 'disable_toast_analytics' item has been incorporated into the 'localState' object
  const disableToastAnalytics = localStorage.getItem('disable_toast_analytics');
  if (disableToastAnalytics === 'true' || disableToastAnalytics === 'false') {
    let value = JSON.parse(disableToastAnalytics);
    localState.value.disableToastAnalytics = value;
    localStorage.removeItem('disable_toast_analytics');
  }

  // 'theme' item has been incorporated into the 'localState' object
  const theme = localStorage.getItem('theme');
  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    localState.value.theme.mode = theme;
    localStorage.removeItem('theme');
  }

  // 'skeletonTheme' item has been incorporated into the 'localState' object
  const skeletonTheme = localStorage.getItem('skeletonTheme');
  if (skeletonTheme) {
    const parsedSkeletonTheme = JSON.parse(skeletonTheme); // themes were stored as "example" (included the quotes), so we need to parse them
    if (skeletonThemes.map((theme) => theme.id).includes(parsedSkeletonTheme)) {
      localState.value.theme.id = parsedSkeletonTheme;
      localStorage.removeItem('skeletonTheme');
    }
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
  const localProjects = JSON.parse(localStorage.getItem('projects'));
  if (!localProjects) return;
  const matchedProject = localProjects.find((localProject) => {
    return localProject.href === window.location.href;
  });

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

  const localProjects = JSON.parse(localStorage.getItem('projects')) || [];

  const projectIDs = localProjects?.map((_project) =>
    new URL(_project.href).searchParams.get('project'),
  );

  const thisID = new URL(project.url.href).searchParams.get('project');

  if (!thisID) return;

  const index = projectIDs?.indexOf(thisID);

  if (index > -1) {
    // project is already in the storage, so delete it
    localProjects.splice(index, 1);
  }

  const localProject = createProjectLocalStorageProjectObject();

  localProjects.push(localProject);

  localStorage.setItem('projects', JSON.stringify(localProjects));
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
