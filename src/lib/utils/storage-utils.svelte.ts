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
import { locations, preferences, project, weather } from '$lib/state';
import type {
  PageLayout,
  SavedProject,
  WeatherSourceOptions,
} from '$lib/types';
import { dateToISO8601String, numberOfDays, stringToDate } from '$lib/utils';

export function initializeLocalStorage() {
  // ****************
  // Handle Legacy Local Storage Items
  // ****************

  // 'layout' item has been incorporated into the 'preferences' object
  if (localStorage.getItem('layout')) {
    preferences.value.layout = localStorage.getItem('layout') as PageLayout;
    localStorage.removeItem('layout');
  }

  // 'disable_toast_analytics' item has been incorporated into the 'preferences' object
  const disableToastAnalytics = localStorage.getItem('disable_toast_analytics');
  if (disableToastAnalytics === 'true' || disableToastAnalytics === 'false') {
    let value = JSON.parse(disableToastAnalytics);
    preferences.value.disableToastAnalytics = value;
    localStorage.removeItem('disable_toast_analytics');
  }

  // 'theme' item has been incorporated into the 'preferences' object
  const theme = localStorage.getItem('theme');
  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    preferences.value.theme.mode = theme;
    localStorage.removeItem('theme');
  }

  // 'skeletonTheme' item has been incorporated into the 'preferences' object
  const skeletonTheme = localStorage.getItem('skeletonTheme');
  if (skeletonTheme) {
    const parsedSkeletonTheme = JSON.parse(skeletonTheme); // themes were stored as "example" (included the quotes), so we need to parse them
    if (skeletonThemes.map((theme) => theme.id).includes(parsedSkeletonTheme)) {
      console.log({ parsedSkeletonTheme });
      preferences.value.theme.id = parsedSkeletonTheme;
      localStorage.removeItem('skeletonTheme');
    }
  }

  // ****************
  // Setup Theme Listeners
  // ****************

  // Change the theme when the system preferences changes, if the user has chosen 'system'
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', (e) => {
      if (preferences.value.theme.mode === 'system') {
        if (e.matches) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
    });

  $effect.root(() => {
    $effect(() => {
      // Update the body data-theme attribute when the user changes the skeleton theme
      if (
        skeletonThemes
          .map((theme) => theme.id)
          .includes(preferences.value.theme.id)
      )
        document.getElementsByTagName('body')[0].dataset.theme =
          preferences.value.theme.id;
    });

    $effect(() => {
      // Update the dark or light mode when the user changes the theme mode
      if (
        preferences.value.theme.mode === 'dark' ||
        (!('preferences' in localStorage) &&
          window.matchMedia('(prefers-color-scheme: dark)').matches)
      ) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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
  const weatherSource = matchedProject.weatherSource;
  if (weatherSource) {
    const { name, useSecondary } = weatherSource;
    if (name) weather.defaultSource = name;
    weather.useSecondarySources = useSecondary;
  }

  // Set isCustomWeather
  const _isCustomWeather = matchedProject.isCustomWeatherData;
  if (_isCustomWeather === true) weather.isUserEdited = true;
  else if (_isCustomWeather === false) weather.isUserEdited = false;

  // Set weather data and convert dates to Date objects
  const weatherLocalStorage = matchedProject.weatherData;
  if (!weatherLocalStorage) return;
  const newWeatherUngrouped = weatherLocalStorage.map((n) => {
    return {
      ...n,
      date: stringToDate(n.date),
    };
  });

  // Check if there are any days in the project past the day the project was created
  let url = new URL(matchedProject.href);
  const timestamp = new URLSearchParams(url.search).get('project');
  if (timestamp === null || typeof +timestamp !== 'number') return;
  const dateCreated = new Date(+timestamp).getTime();
  const latestDay = new Date(
    Math.max(...newWeatherUngrouped.map((n) => n.date)),
  ).getTime();
  let daysInFuture = 0;
  if (latestDay >= dateCreated)
    daysInFuture = numberOfDays(dateCreated, latestDay);
  // If there are days in the future and the weather is not custom, do not load weather from local storage
  if (daysInFuture > 0 && !matchedProject.isCustomWeatherData) return;

  // Set the weather data and indicate that it was loaded from local storage
  weather.rawData = newWeatherUngrouped;

  weather.isFromLocalStorage = true;
};

export const setLocalStorageProject = () => {
  if (!browser || typeof window.localStorage === 'undefined') return;

  const localProjects = JSON.parse(localStorage.getItem('projects'));

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

  const newProjects = localProjects.length
    ? [...localProjects, localProject]
    : [localProject];

  localStorage.setItem('projects', JSON.stringify(newProjects));
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
    _date.toLocaleDateString() +
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

  const weatherSource: WeatherSourceOptions = {
    name: weather.defaultSource,
    useSecondary: weather.useSecondarySources,
  };

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
