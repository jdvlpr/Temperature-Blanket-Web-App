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
import { gauges, locations, previews, weather } from '$lib/state';
import { preferences } from '$lib/storage/preferences.svelte';
import { seasonsToUrlHash } from '$lib/utils/seasons-utils.svelte';

export class HistoryStateClass {
  stack: string[] = $state([]);

  currentIndex: number = $state(-1);

  length = $derived(this.stack.length);

  isFirst = $derived(this.currentIndex === 0 || this.length === 0);

  isLast = $derived(this.currentIndex === this.length - 1 || this.length === 0);

  current = $derived.by(() => {
    if (this.length < 1 || this.currentIndex < 0) return null;
    return this.stack[this.currentIndex];
  });

  previous = $derived.by(() => {
    if (this.isFirst) return null;
    return this.stack[this.currentIndex - 1];
  });

  next = $derived.by(() => {
    if (this.isLast) return null;
    return this.stack[this.currentIndex + 1];
  });

  isUpdating = $state(false);

  push(value: string) {
    // If it's the same as the previous value, don't add it, or if it's not on the last stack item
    if (this.previous === value || !this.isLast) return;
    this.stack.push(value);
    this.currentIndex = this.length - 1;
  }

  undo() {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  redo() {
    if (this.currentIndex < this.stack.length) this.currentIndex++;
  }
}

type ProjectStatusType = {
  saved: boolean;
  loading: boolean;
  error: {
    code: 1 | null; // 1 = unable to save to local storage
    message: string;
  };
  temporaryProjectsBackup: any[]; // A temporary backup of projects in case migration fails
  temporaryUid: string;
  temporaryError: any;
};

class ProjectClass {
  // *****************
  // Constant Properties
  // *****************
  loaded = {
    version: browser
      ? new URL(window.location).searchParams.get('v') || version
      : '',
    href: browser ? new URL(window.location).href : '',
  };

  // Timestamp identifying when the app was initialized, used as a kind of unique ID for the project (though technically may not be unique if two users initialize at the exact same time).
  // It doesn't have any real meaning apart from an identifier for a project.
  timeStampId = browser
    ? new URL(window.location).searchParams.get('project') ||
      new Date().getTime()?.toString()
    : '';

  geolocationAvailable = $state(
    browser ? (!navigator.geolocation ? false : true) : false,
  );

  // *****************
  // History State Property
  // *****************
  history = new HistoryStateClass();

  // *****************
  // Derived URL Properties
  // *****************
  url = $derived.by(() => {
    let hash = '';
    hash += locations.urlHash;
    hash += gauges.urlHash;
    hash += previews.hash;
    if (weather.source.name === 'Meteostat') hash += '&s=0';
    else if (weather.source.name === 'Open-Meteo') hash += '&s=1';
    if (!weather.source.useSecondary) hash += '0';
    else if (weather.source.useSecondary) hash += '1';
    if (
      weather.source.name === 'Open-Meteo' &&
      weather.source.settings?.openMeteo.model !== 'auto'
    ) {
      // If openMeteo model is anything but 'auto' (the default), set the model id here
      if (weather.source.settings?.openMeteo.model === 'era5_land') hash += 'l';
      if (weather.source.settings?.openMeteo.model === 'era5') hash += 'e';
    }

    if (
      weather.source.name === 'Meteostat' &&
      !weather.source.settings?.meteoStat.model
    )
      // If Meteostat model setting is not the default `true`, set `0` here
      hash += '0';

    if (weather.grouping === 'week')
      hash += `&w=${weather.monthGroupingStartDay}`; // Set Weather Grouping to Weeks with the starting Day of Week

    // Add seasons hash if seasons are enabled
    if (previews.active && previews.active.settings.useSeasonTargets) {
      hash += `&n=${seasonsToUrlHash(preferences.value.seasons)}`;
    }

    // Add units hash
    hash += preferences.value.units === 'metric' ? '&u=m' : '&u=i';

    let href = '';
    const base = browser ? window.location.origin + '/' : '';
    const query = `?project=${this.timeStampId}&v=${version}`;
    href = !locations.allValid ? base : base + query + '#' + hash;

    return {
      hash,
      href,
    };
  });

  status = $state<ProjectStatusType>({
    saved: false,
    loading: true,
    error: {
      code: null,
      message: '',
    },
    temporaryProjectsBackup: [],
    temporaryUid: '',
    temporaryError: null,
  });

  gallery = $state({
    href: '',
    title: '',
  });

  // *****************
  // Methods
  // *****************
  toggleUnits(): void {
    preferences.value.units =
      preferences.value.units === 'imperial' ? 'metric' : 'imperial';
  }
}

export const project = new ProjectClass();
