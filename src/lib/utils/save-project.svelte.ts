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

import { openProjectMenu, toast } from '$lib/state/page-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import {
  autosave,
  saveNow,
  saveOpenProject,
} from '$lib/storage/autosave.svelte';
import { accountsIntro } from '$lib/storage/accounts-intro.svelte';
import { feedback } from '$lib/utils/feedback.svelte';

/** Saves the open project; returns whether it saved. Only for explicit saves (it plays the success sound/vibration). */
export async function saveProject(): Promise<boolean> {
  if (!weather.data.length) {
    toast.trigger({
      message: 'To save a project, first get weather data.',
      category: 'info',
    });
    return false;
  }

  // Saving by itself: a problem is explained in the Project menu
  if (autosave.on) {
    if (autosave.state === 'conflict' || autosave.state === 'error') {
      openProjectMenu();
      return false;
    }
    await saveNow();
    const saved = autosave.state === 'saved';
    if (saved) feedback('success');
    return saved;
  }

  const firstSave = !autosave.stored;
  const item = await saveOpenProject();
  if (!item) {
    toast.trigger({
      message: 'There was a problem saving your project. Try again.',
      category: 'error',
    });
    return false;
  }

  feedback('success');
  toast.trigger({
    message: !autosave.on
      ? 'Saved'
      : autosave.account
        ? 'Saved to your account. Changes now save automatically.'
        : 'Saved in this browser. Changes now save automatically.',
    category: 'success',
  });
  if (firstSave) accountsIntro.offerAfterSave();
  return true;
}
