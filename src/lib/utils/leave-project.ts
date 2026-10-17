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

// Leaving the open project for another (a new one, a saved one, or a copy of
// a gallery page) in this tab, from the Project menu and its Open screen. A
// change waiting to save saves first; changes that would be lost, or a
// project never saved, ask first.

import SaveFirst from '#lib/components/modals/SaveFirst.svelte';
import { locations } from '#lib/state/location-state.svelte.js';
import { dialog } from '#lib/state/page-state.svelte.js';
import { weather } from '#lib/state/weather-state.svelte.js';
import {
  autosave,
  leaveOnPurpose,
  saveNow,
  unsavedWork,
} from '#lib/storage/autosave.svelte.js';
import { saveProject } from '#lib/utils/save-project.svelte.js';

/** Opens `href` in this tab in the open project's place, asking first when
 * that would lose changes */
export async function leaveFor(href: string) {
  const problem =
    autosave.on &&
    (autosave.state === 'conflict' || autosave.state === 'error');
  if (autosave.on && !problem) await saveNow();
  const go = () => {
    leaveOnPurpose();
    window.location.assign(href);
  };
  // One never saved asks too, even unchanged: its location and weather
  // would be gone
  const neverSaved =
    weather.data.length > 0 && locations.allValid && !autosave.stored;
  if (!unsavedWork() && !neverSaved) {
    go();
    return;
  }
  dialog.trigger({
    type: 'component',
    component: {
      ref: SaveFirst,
      props: problem
        ? {
            message:
              'This project’s latest changes couldn’t be saved. Leave without them?',
            ongo: go,
          }
        : {
            message:
              'Save this project first? Saved, you can come back to it from My Projects.',
            saveLabel: 'Save and Continue',
            onsave: async () => {
              if (!(await saveProject())) throw new Error('Not saved');
            },
            ongo: go,
          },
    },
    options: { title: 'Save Project?' },
  });
}

/** A link's click, opened here by leaveFor; Cmd, Ctrl or Shift-click and the
 * middle button still open it in a new tab */
export function openHere(event: MouseEvent, href: string) {
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  event.preventDefault();
  void leaveFor(href);
}
