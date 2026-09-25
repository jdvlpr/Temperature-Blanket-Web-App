// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
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
import { gauges } from '$lib/state/gauges-state.svelte';
import { locations } from '$lib/state/location-state.svelte';
import { previews } from '$lib/state/preview-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import { preferences } from '$lib/storage/preferences.svelte';
import { timestampFromLegacyProjectId } from '$lib/utils/project-id-utils';
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
    if (this.current === value) return;
    // Pushing from a mid-history position (after an Undo not followed by a
    // matching Redo) discards the stale "redo" branch, like a standard
    // undo/redo stack.
    if (!this.isLast) this.stack.splice(this.currentIndex + 1);
    this.stack.push(value);
    this.currentIndex = this.length - 1;
  }

  undo() {
    if (this.currentIndex > 0) this.currentIndex--;
  }

  redo() {
    if (!this.isLast) this.currentIndex++;
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
  wasLoaded: boolean;
};

class ProjectClass {
  // *****************
  // Constant Properties
  // *****************
  onLoaded = {
    version: browser
      ? new URL(window.location.href).searchParams.get('v') || version
      : '',
    href: browser ? new URL(window.location.href) : null,
    isProject: browser
      ? new URL(window.location.href).searchParams.has('project')
      : false,
  };

  // Opaque string identifying the project, carried in the URL as ?project=<id>.
  // It's currently the millisecond timestamp of when the app was first loaded, but don't read a date from it: use createdAt.
  id = browser
    ? new URL(window.location.href).searchParams.get('project') ||
      new Date().getTime()?.toString()
    : '';

  // When the project was first created (ISO 8601, UTC). Kept across saves, never re-stamped.
  // For legacy timestamp IDs this is the time encoded in the ID; ProjectStorage.load() replaces it with the stored value.
  createdAt = browser
    ? new Date(
        timestampFromLegacyProjectId(this.id) ?? Date.now(),
      ).toISOString()
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
    hash += previews.extraColorsHash;
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
    const query = `?project=${this.id}&v=${version}`;
    href = !locations.allValid ? base : base + query + '#' + hash;

    return {
      hash,
      href,
    };
  });

  status = $state<ProjectStatusType>({
    error: {
      code: null,
      message: '',
    },
    loading: true,
    saved: false,
    temporaryProjectsBackup: [],
    temporaryUid: '',
    wasLoaded: false,
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
