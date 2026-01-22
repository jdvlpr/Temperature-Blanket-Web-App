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
  CHARACTERS_FOR_URL_HASH,
  MAXIMUM_DAYS_PER_LOCATION,
} from '$lib/constants';
import { weather } from '$lib/state';
import type {
  LocationsStateType,
  LocationStateType,
  LocationType,
  WeatherSource,
} from '$lib/types';
import { getToday, numberOfDays, stringToDate } from '$lib/utils';

export class LocationClass implements LocationType {
  uuid: string = $state('');
  index: number = $state(0);
  duration?: 'c' | 'y' = $state('y');
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
    this.uuid =
      browser && crypto && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Math.random() * 100}-${Math.random() * 100}-${Math.random() * 100}`;
    this.#today = browser ? getToday() : null; // caused a build error without the browser check...
  }

  #fromDate = $derived.by(() => {
    if (!this.from) return null;
    return stringToDate(this.from);
  });

  #toDate = $derived.by(() => {
    if (!this.to) return null;
    return stringToDate(this.to);
  });

  days = $derived(numberOfDays(this.#fromDate, this.#toDate));

  #today = $state();

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

  isValid = $derived(
    typeof this.id !== 'undefined' && this.errorMessage === '',
  );
}

export class LocationsState implements LocationsStateType {
  constructor() {
    const location = new LocationState();
    location.index = this.all.length;
    this.all.push(location);
  }

  all = $state([]);

  totalDays = $derived.by(() => {
    const arrayOfDayCount = this.all.map((n) => {
      if (!n.from || !n.to) return null;
      const from = stringToDate(n.from);
      const to = stringToDate(n.to);

      if (!from || !to) return null;
      return numberOfDays(from, to);
    });
    const sum = arrayOfDayCount.reduce((accumulator, value) => {
      return accumulator + value;
    }, 0);
    return sum;
  });

  allValid = $derived(this.all.every((location) => location.isValid === true));

  urlHash = $derived.by(() => {
    // Every location must be valid
    if (!this.allValid) return '';

    // Each location's Id, From, and To date gets encoded in the URL hash
    // After the 'l=' key
    let content = 'l=';
    this.all.forEach((location) => {
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
    if (!this.all.length) return false;
    let filename = '';
    this.all.forEach((location) => {
      filename += `${location?.label}-from-${location?.from}-to-${location?.to}`;
    });
    return filename;
  });

  projectTitle = $derived.by(() => {
    if (
      !this.all.length ||
      !this.all?.every((item) => item?.label && item?.from && item?.to)
    )
      return '';
    let titles = [];
    this.all.forEach((location) => {
      if (location?.from && location?.to) {
        let from = stringToDate(location.from).toLocaleDateString(undefined, {
          timeZone: 'UTC',
        });
        let to = stringToDate(location.to).toLocaleDateString(undefined, {
          timeZone: 'UTC',
        });
        let title = `${location.label} from ${from} to ${to}`;
        titles.push(title);
      }
    });
    if (titles.length === 0) return;
    let title = titles.join('; ');
    return title;
  });

  add(): void {
    if (weather.rawData.length > 0) weather.rawData = [];
    const newLocation = new LocationState();
    newLocation.index = this.all.length;
    this.all.push(newLocation);
  }

  remove(uuid: string) {
    this.all = this.all.filter((location) => location.uuid !== uuid);
    this.all.map((location, i) => {
      location.index = i;
    });
  }
}

export const locations = new LocationsState();

// Controller and signal for when searching for locations
export const controller = $state({ value: null });

class SignalClass {
  value = $derived(controller.value?.signal || null);
}
export const signal = new SignalClass();

export const gettingWeatherData = $state({ value: false });
