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

import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
import type { Location } from '$lib/types';
import { stringToDate, numberOfDays } from '$lib/utils';
import { derived, writable, type Writable } from 'svelte/store';

function createLocationsStore() {
  const { subscribe, set, update } = writable([{ index: 0 }]);

  return {
    subscribe,
    clearAutocompleteData: (index) =>
      update((locations) => {
        delete locations[index].id;
        delete locations[index].lat;
        delete locations[index].lng;
        return locations;
      }),
    set: (value) => set(value),
    update,
  };
}
export const locations: Writable<Location[]> = createLocationsStore();

export const valid = derived(locations, ($locations) =>
  $locations?.every((location) => location.valid === true),
);

export const gettingLocationWeather = writable('Searching...');

export const gettingLocationWeatherIndex = writable(0);

export const locationsFutureDays = derived(locations, ($locations) => {
  if (!$locations?.length || !$locations?.every((n) => n.from && n.to)) return;
  return $locations.map((n) => {
    const from = stringToDate(n.from);
    const to = stringToDate(n.to);
    let today = new Date(new Date().setHours(24, 0, 0, 0));
    today = today.setDate(today.getDate() - 1); // why this way??
    if (from >= today) return numberOfDays(from, to) - 1;
    if (to >= today) return numberOfDays(today, to) - 1;
    return 0;
  });
});

// Controller and signal for when searching for locations
export const controller = writable(null);
export const signal = derived(controller, ($controller) =>
  $controller ? $controller.signal : null,
);

// Locations Hash Param
export const locationsURLHash = derived(locations, ($locations) => {
  // Every location must be valid
  if (!$locations.every((location) => location.valid === true)) return '';

  // Each location's Id, From, and To date gets encoded in the URL hash
  // After the 'l=' key
  let content = 'l=';
  $locations.forEach((location) => {
    // Format the From date as 'YYYYMMDD' instead of 'YYYY-MM-DD'
    const from = location?.from?.replace(/-/g, '') || '';

    let to;
    if (location?.duration === 'y') {
      // If the duration is one year, symbolize the To date as '!'
      to = '!';
    } else {
      // Otherwise, the duration is custom
      // and the To date should be formatted as 'YYYYMMDD'
      to = location?.to?.replace(/-/g, '') || '';
    }

    content += location?.id + CHARACTERS_FOR_URL_HASH.separator + from + to;
  });

  return content;
});
