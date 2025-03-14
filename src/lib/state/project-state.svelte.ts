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
import { gauges, localState, locations, previews, weather } from '$lib/state';
import type { Unit } from '$lib/types';

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

  updateMessage = $state('');

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
    if (weather.defaultSource === 'Meteostat') hash += '&s=0';
    else if (weather.defaultSource === 'Open-Meteo') hash += '&s=1';
    if (!weather.useSecondarySources) hash += '0';
    else if (weather.useSecondarySources) hash += '1';
    if (weather.grouping === 'week')
      hash += `&w=${weather.monthGroupingStartDay}`; // Set Weather Grouping to Weeks with the starting Day of Week
    hash += this.units === 'metric' ? '&u=m' : '&u=i'; // Units

    let href = '';
    const base = browser ? window.location.origin + '/' : '';
    const query = `?project=${this.timeStampId}&v=${version}`;
    href = !locations.allValid ? base : base + query + '#' + hash;

    return {
      hash,
      href,
    };
  });

  status = $state({
    saved: false,
    loading: true,
  });

  gallery = $state({
    href: '',
    title: '',
  });

  // *****************
  // Settings
  // *****************
  units: Unit = $state('imperial');

  // *****************
  // Methods
  // *****************
  toggleUnits(): void {
    localState.value.units =
      localState.value.units === 'imperial' ? 'metric' : 'imperial';
  }
}

export const project = new ProjectClass();
