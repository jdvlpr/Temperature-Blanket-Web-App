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

import { hash as clnrHash } from '$lib/components/previews/CalendarSettings.svelte';
import { hash as chevHash } from '$lib/components/previews/ChevronsSettings.svelte';
import { hash as cosqHash } from '$lib/components/previews/ContinuousSquareSettings.svelte';
import { hash as crnrHash } from '$lib/components/previews/CornerToCornerSettings.svelte';
import { hash as rsunHash } from '$lib/components/previews/DaytimeRowsSettings.svelte';
import { hash as mrwsHash } from '$lib/components/previews/MonthRowsSettings.svelte';
import { hash as msqsHash } from '$lib/components/previews/MonthSquaresSettings.svelte';
import { previews } from '$lib/components/previews/previews';
import { hash as rowsHash } from '$lib/components/previews/RowsSettings.svelte';
import { hash as smsqHash } from '$lib/components/previews/SplitMonthSquaresSettings.svelte';
import { hash as sqrsHash } from '$lib/components/previews/SquaresSettings.svelte';
import { weather } from '$lib/stores';
import type { Preview } from '$lib/types';
import { get, writable } from 'svelte/store';

export const previewWeatherTargets = $state({ value: [] });

class ActivePreviewClass {
  rowsIndex = previews.findIndex((n) => n.id === 'rows'); // default preview is "rows"
  current: Preview = $state(previews[this.rowsIndex]);
  setId(id) {
    previews
      .filter((n) => n.id !== id)
      .forEach((n) => {
        n.svg = null;
      });

    this.current = previews.find((preview) => preview.id === id);
  }
}
export const preview = new ActivePreviewClass();

class PreviewURLHashClass {
  value = $derived.by(() => {
    if (!weather.data) return ''; // Is this necessary?
    switch (preview.current.id) {
      case 'chev':
        return get(chevHash);
      case 'clnr':
        return get(clnrHash);
      case 'cosq':
        return get(cosqHash);
      case 'crnr':
        return get(crnrHash);
      case 'smsq':
        return get(smsqHash);
      case 'mrws':
        return get(mrwsHash);
      case 'msqs':
        return get(msqsHash);
      case 'rows':
        return get(rowsHash);
      case 'rsun':
        return get(rsunHash);
      case 'sqrs':
        return get(sqrsHash);
      default:
        return '';
    }
  });
}

export const previewURLHash = new PreviewURLHashClass();
