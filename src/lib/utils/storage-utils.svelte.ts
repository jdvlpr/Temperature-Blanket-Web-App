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
  initialLayout,
  layout,
  locations,
  project,
  theme,
  weather,
} from '$lib/state';
import type {
  PageLayout,
  SavedProject,
  WeatherSourceOptions,
} from '$lib/types';
import { dateToISO8601String, numberOfDays, stringToDate } from '$lib/utils';

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

  $effect.root(() => {
    $effect(() => {
      if (skeletonThemes.map((theme) => theme.id).includes(skeletonTheme.value))
        document.getElementsByTagName('body')[0].dataset.theme =
          skeletonTheme.value;
    });
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

type Serializer<T> = {
  parse: (text: string) => T;
  stringify: (object: T) => string;
};

type StorageType = 'local' | 'session';

interface Options<T> {
  storage?: StorageType;
  serializer?: Serializer<T>;
  syncTabs?: boolean;
  onWriteError?: (error: unknown) => void;
  onParseError?: (error: unknown) => void;
  beforeRead?: (value: T) => T;
  beforeWrite?: (value: T) => T;
}

function getStorage(type: StorageType) {
  return type === 'local' ? localStorage : sessionStorage;
}

export function persistedState<T>(
  key: string,
  initialValue: T,
  options: Options<T> = {},
) {
  const {
    storage = 'local',
    serializer = JSON,
    syncTabs = true,
    onWriteError = console.error,
    onParseError = console.error,
    beforeRead = (v: T) => v,
    beforeWrite = (v: T) => v,
  } = options;

  const browser =
    typeof window !== 'undefined' && typeof document !== 'undefined';
  const storageArea = browser ? getStorage(storage) : null;

  let storedValue: T;

  try {
    const item = storageArea?.getItem(key);
    storedValue = item ? beforeRead(serializer.parse(item)) : initialValue;
  } catch (error) {
    onParseError(error);
    storedValue = initialValue;
  }

  let state = $state(storedValue);

  function updateStorage(value: T) {
    try {
      const valueToStore = beforeWrite(value);
      storageArea?.setItem(key, serializer.stringify(valueToStore));
    } catch (error) {
      onWriteError(error);
    }
  }

  if (syncTabs && typeof window !== 'undefined' && storage === 'local') {
    window.addEventListener('storage', (event) => {
      if (event.key === key && event.storageArea === localStorage) {
        try {
          const newValue = event.newValue
            ? serializer.parse(event.newValue)
            : initialValue;
          state = beforeRead(newValue);
        } catch (error) {
          onParseError(error);
        }
      }
    });
  }

  $effect.root(() => {
    $effect(() => {
      updateStorage(state);
    });

    return () => {};
  });

  return {
    get value() {
      return state;
    },
    set value(newValue: T) {
      state = newValue;
    },
    reset() {
      state = initialValue;
    },
  };
}
