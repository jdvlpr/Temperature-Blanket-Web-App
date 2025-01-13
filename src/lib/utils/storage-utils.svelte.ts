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
import {
  skeletonTheme,
  skeletonThemes,
} from '$lib/components/ThemeSwitcher.svelte';
import {
  defaultWeatherSource,
  initialLayout,
  isCustomWeather,
  layout,
  locationsState,
  projectStatus,
  theme,
  useSecondaryWeatherSources,
  wasWeatherLoadedFromLocalStorage,
  weatherUngrouped,
} from '$lib/state';
import type {
  PageLayout,
  SavedProject,
  WeatherSourceOptions,
} from '$lib/types';
import { dateToISO8601String, numberOfDays, stringToDate } from '$lib/utils';
import { get } from 'svelte/store';

export const setupLocalStorageTheme = () => {
  // Check if theme is set, or match the system's theme
  if (
    !('theme' in localStorage) &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
    setTheme('system');
  else if (!('theme' in localStorage)) setTheme('system');
  else setTheme(localStorage.theme);
  // Listen for change in color scheme
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (theme.value === 'system') setTheme('system');
    });

  skeletonTheme.subscribe((id) => {
    if (skeletonThemes.map((theme) => theme.id).includes(id))
      document.getElementsByTagName('body')[0].dataset.theme = id;
  });
};

/**
 * Sets up the local storage 'layout' for the Temperature Blanket web app.
 * Retrieves the stored 'layout' from local storage and sets it as the initial value of the 'layout' variable.
 * Subscribes to changes in the 'layout' variable and updates the local storage whenever the value changes.
 */
export const setupLocalStorageLayout = () => {
  const viewStored = localStorage.getItem('view') as PageLayout;
  if (viewStored === 'grid' || viewStored === 'list') layout.value = viewStored;
  $effect(() => {
    if (layout.value === 'grid' || layout.value === 'list')
      localStorage.setItem('layout', layout.value);
    else localStorage.setItem('layout', initialLayout);
  });
};

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
  const matchedProject = localProjects.filter(
    (project) => project.href === window.location.href,
  )?.[0];
  if (!matchedProject) return;

  // Set weather source
  const weatherSource = matchedProject.weatherSource;
  if (weatherSource) {
    const { name, useSecondary } = weatherSource;
    if (name) defaultWeatherSource.value = name;
    useSecondaryWeatherSources.set(useSecondary);
  }

  // Set isCustomWeather
  const _isCustomWeather = matchedProject.isCustomWeatherData;
  if (_isCustomWeather === true) isCustomWeather.set(true);
  else if (_isCustomWeather === false) isCustomWeather.set(false);

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
  weatherUngrouped.data = newWeatherUngrouped;
  wasWeatherLoadedFromLocalStorage.set(true);
};

/**
 * Set the page theme
 *
 * @param   {string}  value  'light', 'dark', or 'system'
 *
 */
export const setTheme = (value) => {
  // Whenever the user explicitly chooses light mode
  if (value === 'light') localStorage.theme = 'light';

  // Whenever the user explicitly chooses dark mode
  if (value === 'dark') localStorage.theme = 'dark';

  // Whenever the user explicitly chooses to respect the OS preference
  if (value === 'system') localStorage.removeItem('theme');

  // On page load or when changing themes, best to add inline in `head` to avoid FOUC
  if (
    localStorage.theme === 'dark' ||
    (!('theme' in localStorage) &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  ) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  theme.value = value;
};

export const setLocalStorageLayout = () => {
  if (!browser) return;
  if (typeof window.localStorage === 'undefined') return;
  const _layout = layout.value;
  if (_layout !== 'grid' && _layout !== 'list') return;
  localStorage.layout = _layout;
};

export const setLocalStorageProject = () => {
  if (!browser || typeof window.localStorage === 'undefined') return;

  const localProjects = JSON.parse(localStorage.getItem('projects'));

  const projectIDs = localProjects?.map((project) =>
    new URL(project.href).searchParams.get('project'),
  );

  const thisID = new URL(projectStatus.state.liveURL).searchParams.get(
    'project',
  );

  if (!thisID) return;

  const index = projectIDs?.indexOf(thisID);

  if (index > -1) {
    // project is already in the storage, so delete it
    localProjects.splice(index, 1);
  }

  const project = createProjectLocalStorageProjectObject();

  const newProjects = localProjects ? [...localProjects, project] : [project];

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

  const isCustomWeatherData = get(isCustomWeather) || false;

  const _title = locationsState.projectTitle || '';

  const href = projectStatus.state.liveURL;

  const weatherData =
    weatherUngrouped.data?.map((day) => {
      return {
        ...day,
        date: dateToISO8601String(day.date),
      };
    }) || [];

  const weatherSource: WeatherSourceOptions = {
    name: defaultWeatherSource.value,
    useSecondary: get(useSecondaryWeatherSources),
  };

  const project: SavedProject = {
    date,
    isCustomWeatherData,
    href,
    title: _title,
    weatherData,
    weatherSource,
  };

  return project;
};
