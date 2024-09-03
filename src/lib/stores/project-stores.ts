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

import { browser, version } from '$app/environment';
import { PROJECT_TIMESTAMP_ID } from '$lib/constants';
import {
  defaultWeatherSource,
  gaugesURLHash,
  locations,
  locationsURLHash,
  previewURLHash,
  units,
  useSecondaryWeatherSources,
  weatherGrouping,
  weatherMonthGroupingStartDay,
} from '$lib/stores';
import { getLocationTitle } from '$lib/utils';
import { derived, writable } from 'svelte/store';

// The current part of the project URL after #
export const liveProjectURLHash = derived(
  [
    units,
    locationsURLHash,
    gaugesURLHash,
    previewURLHash,
    weatherGrouping,
    weatherMonthGroupingStartDay,
    defaultWeatherSource,
    useSecondaryWeatherSources,
  ],
  (
    [
      $units,
      $locationsURLHash,
      $gaugesURLHash,
      $previewURLHash,
      $weatherGrouping,
      $weatherMonthGroupingStartDay,
      $defaultWeatherSource,
      $useSecondaryWeatherSources,
    ],
    set,
  ) => {
    let hash = '';
    hash += $locationsURLHash;
    hash += $gaugesURLHash;
    hash += $previewURLHash;
    if ($defaultWeatherSource === 'Meteostat') hash += '&s=0';
    else if ($defaultWeatherSource === 'Open-Meteo') hash += '&s=1';
    if (!$useSecondaryWeatherSources) hash += '0';
    else if ($useSecondaryWeatherSources) hash += '1';
    if ($weatherGrouping === 'week')
      hash += `&w=${$weatherMonthGroupingStartDay}`; // Set Weather Grouping to Weeks with the starting Day of Week
    hash += $units === 'metric' ? '&u=m' : '&u=i'; // Units
    set(hash);
  },
);

export const isProjectSaved = writable(false);

export const isProjectLoading = writable(true);

export const projectFilename = derived(locations, ($locations) => {
  if (!$locations.length) return false;
  let filename = '';
  $locations.forEach((location) => {
    filename += `${location?.label}-from-${location?.from}-to-${location?.to}`;
  });
  return filename;
});

export const projectTitle = derived(locations, ($locations) => {
  if (
    !$locations.length ||
    !$locations?.every((item) => item?.label && item?.from && item?.to)
  )
    return '';
  let titles = [];
  $locations.forEach((location, index) => {
    if (location?.from && location?.to)
      titles.push(getLocationTitle({ location }));
  });
  if (titles.length === 0) return;
  let title = titles.join('; ');
  return title;
});

export const projectGalleryLink = writable(null);

export const projectGalleryTitle = writable(null);

export const projectSaveMessage = writable({
  show: false,
  message: null,
});

export const projectStatus = derived(
  [locations, liveProjectURLHash],
  ([$locations, $liveProjectURLHash]) => {
    const isValid = $locations.every((location) => location.valid === true);
    const base = browser ? window.location.origin + '/' : '';
    const query = `?project=${PROJECT_TIMESTAMP_ID}&v=${version}`;
    const liveURL = !isValid ? base : base + query + '#' + $liveProjectURLHash;
    return {
      isValid,
      liveURL,
    };
  },
);
