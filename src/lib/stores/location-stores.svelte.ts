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
import type { Location, WeatherSource } from '$lib/types';
import { numberOfDays, stringToDate } from '$lib/utils';
import { getContext, setContext } from 'svelte';
import { derived, writable, type Writable } from 'svelte/store';
import { weatherUngrouped } from './weather-state.svelte';

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

export class LocationClass implements Location {
  index: number;
  valid?: boolean;
  duration?: 'c' | 'y';
  from?: string;
  to?: string;
  label?: string;
  result?: string;
  id?: number;
  lat?: string;
  lng?: string;
  elevation?: number;
  stations?: null | any[];
  source?: WeatherSource;
  wasLoadedFromSavedProject?: boolean;

  constructor(value: number) {
    this.index = value;
  }
}

export class LocationsState {
  locations = $state<Location[]>([]);

  constructor() {
    const location = new LocationClass(0);
    this.locations = [{ ...location }];
  }

  add(): void {
    if (weatherUngrouped.data) weatherUngrouped.data = null;
    const index = this.locations.length;
    const newLocation = new LocationClass(index);
    this.locations.push({ ...newLocation });
  }

  remove(index: number) {
    this.locations = this.locations.filter(
      (location) => location.index !== index,
    );
  }

  clearAutocomplete(index: number) {
    if (index === -1) return;
    delete this.locations[index].id;
    delete this.locations[index].lat;
    delete this.locations[index].lng;
  }

  totalDays = $derived.by(() => {
    const arrayOfDayCount = this.locations.map((n) => {
      if (!n.from || !n.to) return null;
      const from = new Date(n.from.replace(/-/g, '/'));
      const to = new Date(n.to.replace(/-/g, '/'));
      if (!from || !to) return null;
      return numberOfDays(from, to);
    });
    const sum = arrayOfDayCount.reduce((accumulator, value) => {
      return accumulator + value;
    }, 0);
    return sum;
  });

  allValid = $derived.by(() => {
    return this.locations.every((location) => location.valid === true);
  });
}

const LOCATIONS_KEY = Symbol('LOCATIONS');

export function setLocationsState() {
  return setContext(LOCATIONS_KEY, new LocationsState());
}

export function getLocationsState() {
  return getContext<ReturnType<typeof setLocationsState>>(LOCATIONS_KEY);
}

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
