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

import { calendarPreview } from '$lib/components/previews/calendar/state.svelte';
import { chevronsPreview } from '$lib/components/previews/chevrons/state.svelte';
import { rowsPreview } from '$lib/components/previews/rows/state.svelte';

export const previewWeatherTargets = $state({ value: [] });

class PreviewsState {
  all = $state([calendarPreview, chevronsPreview, rowsPreview]);

  activeId = $state();

  active = $derived(this.all.find((n) => n.id === this.activeId));

  hash = $derived(this.active?.hash || '');

  add(preview) {
    this.all.push(preview);
    this.activeId = preview.id;
  }
}

export const previews = new PreviewsState();