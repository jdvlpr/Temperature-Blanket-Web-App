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

import {
  CHARACTERS_FOR_URL_HASH,
  MAXIMUM_DAYS_PER_LOCATION,
} from '$lib/constants';
import type {
  LocationType,
  LocationStateType,
  WeatherSource,
  LocationsStateType,
} from '$lib/types';
import { getLocationTitle, getToday, numberOfDays } from '$lib/utils';
import { derived, writable, type Writable } from 'svelte/store';
import { weatherUngrouped } from './weather-state.svelte';
import { getContext, setContext } from 'svelte';

export class LocationClass implements LocationType {
  uuid: string = $state();
  index: number = $state();
  duration?: 'c' | 'y' = $state();
  from?: string = $state();
  to?: string = $state();
  label?: string = $state();
  result?: string = $state();
  id?: number = $state();
  lat?: string = $state();
  lng?: string = $state();
  elevation?: number = $state();
  stations?: null | any[] = $state();
  source?: WeatherSource = $state();
  wasLoadedFromSavedProject?: boolean = $state();
}
export class LocationState extends LocationClass implements LocationStateType {
  constructor() {
    super();
    this.uuid = crypto.randomUUID();
  }

  isValid = $derived(!!this.id && this.#fromDate < this.#today);

  #fromDate = $derived.by(() => {
    if (!this.from) return null;
    return new Date(this.from.replace(/-/g, '/'));
  });

  #toDate = $derived.by(() => {
    if (!this.to) return null;
    return new Date(this.to.replace(/-/g, '/'));
  });

  days = $derived(numberOfDays(this.#fromDate, this.#toDate));

  #today = getToday();

  daysInFuture = $derived.by(() => {
    if (this.#toDate >= this.#today)
      return numberOfDays(this.#today, this.#toDate);
    else return 0;
  });

  errorMessage = $derived.by(() => {
    if (this.#fromDate >= this.#today)
      return 'The starting date must be at least one day in the past.';

    if (this.days > MAXIMUM_DAYS_PER_LOCATION)
      return `Please select a maximum of ${MAXIMUM_DAYS_PER_LOCATION} days. You've selected ${this.days} days.`;

    if (this.days < 1)
      return `It looks like the selected end date comes before the selected start date. Please select an end date which comes after the start date.`;

    return '';
  });
}

export class LocationsState implements LocationsStateType {
  locations = $state([]);

  constructor() {
    const location = new LocationState();
    location.index = this.locations.length;
    this.locations.push(location);
  }

  add(): void {
    if (weatherUngrouped.data) weatherUngrouped.data = null;
    const newLocation = new LocationState();
    newLocation.index = this.locations.length;
    this.locations.push(newLocation);
  }

  remove(uuid: string) {
    this.locations = this.locations.filter(
      (location) => location.uuid !== uuid,
    );
    this.locations.map((location, i) => {
      location.index = i;
    });
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

  allValid = $derived(
    this.locations.every((location) => location.isValid === true),
  );

  urlHash = $derived.by(() => {
    // Every location must be valid
    if (!this.allValid) return '';

    // Each location's Id, From, and To date gets encoded in the URL hash
    // After the 'l=' key
    let content = 'l=';
    this.locations.forEach((location) => {
      // Format the From date as 'YYYYMMDD' instead of 'YYYY-MM-DD'
      const from = location?.from?.replace(/-/g, '') || '';

      let to;
      if (location?.duration === 'y') {
        // If the duration is one year, symbolize the To date as '!'
        to = '!';
      } else {
        // Otherwise, the duration is custom
        // and the To date should be formatted as 'YYYYMMDD'
        to = location.to?.replace(/-/g, '') || '';
      }

      content += location.id + CHARACTERS_FOR_URL_HASH.separator + from + to;
    });

    return content;
  });

  projectFilename = $derived.by(() => {
    if (!this.locations.length) return false;
    let filename = '';
    this.locations.forEach((location) => {
      filename += `${location?.label}-from-${location?.from}-to-${location?.to}`;
    });
    return filename;
  });

  projectTitle = $derived.by(() => {
    if (
      !this.locations.length ||
      !this.locations?.every((item) => item?.label && item?.from && item?.to)
    )
      return '';
    let titles = [];
    this.locations.forEach((location, index) => {
      if (location?.from && location?.to)
        titles.push(getLocationTitle({ location }));
    });
    if (titles.length === 0) return;
    let title = titles.join('; ');
    return title;
  });
}

export const locationsState = new LocationsState();

// const LOCATIONS_KEY = Symbol('LOCATIONS');

// export function setLocationsState() {
//   return setContext(LOCATIONS_KEY, new LocationsState());
// }

// export function getLocationsState() {
//   return getContext<ReturnType<typeof setLocationsState>>(LOCATIONS_KEY);
// }

// Controller and signal for when searching for locations
export const controller = writable(null);
export const signal = derived(controller, ($controller) =>
  $controller ? $controller.signal : null,
);
