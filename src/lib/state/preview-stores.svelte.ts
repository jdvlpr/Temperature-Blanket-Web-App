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

import { previewsData } from '$lib/components/previews/previews.svelte';
import type { Preview } from '$lib/types';

export const previewWeatherTargets = $state({ value: [] });

class ActivePreviewClass {
  rowsIndex = previewsData.findIndex((n) => n.id === 'rows'); // default preview is "rows"
  current: Preview = $state(previewsData[this.rowsIndex]);
  setId(id) {
    previewsData
      .filter((n) => n.id !== id)
      .forEach((n) => {
        n.svg = null;
      });

    this.current = previewsData.find((preview) => preview.id === id);
  }
}
export const preview = new ActivePreviewClass();

class PreviewsState {
  all = $state([]);

  activeId = $state();

  active = $derived(this.all.find((n) => n.id === this.activeId));

  hash = $derived(this.active?.hash || '');

  add(preview) {
    this.all.push(preview);
    this.activeId = preview.id;
  }
}

export const previews = new PreviewsState();
