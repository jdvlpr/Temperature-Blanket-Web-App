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

import { dialog } from '#lib/state/page-state.svelte.js';
import PaletteMenu from './PaletteMenu.svelte';

/** Opens the Palette menu, as openProjectMenu does the Project menu */
export function openPaletteMenu(onsave: () => void) {
  // Already showing: nothing to open
  if (dialog.opened && dialog.contentComponent.ref === PaletteMenu) return;
  // Fresh, not on top of a screen it opened
  dialog.close();
  dialog.trigger({
    type: 'component',
    component: { ref: PaletteMenu, props: { onsave } },
    options: { placement: 'side', returnable: true, title: 'Palette' },
  });
}
