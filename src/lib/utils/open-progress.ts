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

import ProgressEditor from '#lib/components/modals/ProgressEditor.svelte';
import { dialog } from '#lib/state/page-state.svelte.js';
import type { TISO8601DateString } from '#lib/types/weather-types.js';

/**
 * The Progress dialog, the one place progress is set: everything else (the
 * preview's progress, a made day's ✓ in the weather table, a day's status
 * in its details) only shows it and opens this. From a day, it offers Made
 * Through that day. Opened from a returnable dialog (a day's details), Back
 * returns to it.
 */
export function openProgress(day?: TISO8601DateString | null) {
  dialog.trigger({
    type: 'component',
    component: { ref: ProgressEditor, props: { day: day ?? null } },
    options: { title: 'Progress' },
  });
}
