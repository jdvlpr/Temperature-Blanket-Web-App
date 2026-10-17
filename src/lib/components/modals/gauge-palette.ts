// Copyright (c) 2026, Thomas (https://github.com/jdvlpr)
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

import { gauges } from '#lib/state/gauges-state.svelte.js';
import { dialog } from '#lib/state/page-state.svelte.js';
import GaugePaletteExport from './GaugePaletteExport.svelte';
import GaugePalettes from './GaugePalettes.svelte';

/** A gauge's palette exports, in the open panel's place, with Back to it */
export function openGaugePalette(gaugeId: string, label: string) {
  dialog.trigger({
    type: 'component',
    component: { ref: GaugePaletteExport, props: { gaugeId } },
    options: { returnable: true, title: `${label} Palette` },
  });
}

/** Download / Export's Palettes: the gauges to pick from, or the one gauge's
 * exports when there's just one */
export function openGaugePalettes() {
  const all = gauges.allCreated;
  if (all.length === 1) {
    openGaugePalette(all[0].id, all[0].label);
    return;
  }
  dialog.trigger({
    type: 'component',
    component: { ref: GaugePalettes, props: null },
    options: { returnable: true, title: 'Palettes' },
  });
}
