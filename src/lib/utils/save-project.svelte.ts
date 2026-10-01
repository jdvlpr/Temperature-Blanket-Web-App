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

// Saving from the top bar (and Ctrl+S): right away, with a toast to say where
// it went. There's no Save dialog; the Project menu has the rest.

import {
  isDesktop,
  openProjectMenu,
  toast,
} from '$lib/state/page-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import {
  autosave,
  saveNow,
  saveOpenProject,
} from '$lib/storage/autosave.svelte';

export async function saveProject() {
  if (!weather.data.length) {
    toast.trigger({
      message: 'To save a project, first get weather data.',
      category: 'info',
    });
    return;
  }

  // Saving by itself: a problem is explained in the Project menu
  if (autosave.on) {
    if (autosave.state === 'conflict' || autosave.state === 'error')
      openProjectMenu();
    else await saveNow();
    return;
  }

  const firstSave = !autosave.stored;
  const item = await saveOpenProject();
  if (!item) {
    toast.trigger({
      message: 'There was a problem saving your project. Try again.',
      category: 'error',
    });
    return;
  }

  toast.trigger({
    message: !autosave.on
      ? 'Saved'
      : autosave.account
        ? 'Saved to your account. Changes now save by themselves.'
        : 'Saved in this browser. Changes now save by themselves.',
    category: 'success',
    // A new project: naming it is the likely next step. Wider screens show
    // its name in the top bar to click instead.
    ...(firstSave &&
      !item.meta.name &&
      !isDesktop.current && {
        action: {
          label: 'Name it',
          response: () => openProjectMenu({ rename: true }),
        },
      }),
  });
}
