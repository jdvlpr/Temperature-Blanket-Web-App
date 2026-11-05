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

// Opens the beta's warning (modals/BetaWarning.svelte) on the first page of a
// visit, from AppShell: once a tab (Session Storage; and once a page load,
// since each page mounts its own AppShell), and never while another dialog is
// open. A dialog the page opens on load (an old project's notice) replaces it.

import BetaWarning from '#lib/components/modals/BetaWarning.svelte';
import { dialog } from '#lib/state/page-state.svelte.js';
import { isThumbnailFrame } from '#lib/storage/thumbnails.js';
import {
  BETA_WARNING_KEY,
  BETA_WARNING_SHOWN_KEY,
  showsBetaWarning,
} from '#lib/utils/beta-warning.js';

let checked = false;

export function openBetaWarning(pathname: string) {
  if (!__SITE_BETA__ || checked) return;
  if (!showsBetaWarning(pathname)) return;
  checked = true;
  if (isThumbnailFrame()) return;
  try {
    if (localStorage.getItem(BETA_WARNING_KEY) === 'true') return;
    if (sessionStorage.getItem(BETA_WARNING_SHOWN_KEY)) return;
  } catch {
    // Storage blocked: show it
  }
  // After the first page's effects: opened in the same pass as the dialog's
  // first, it would be marked open without ever showing
  setTimeout(() => {
    if (dialog.opened) return;
    try {
      sessionStorage.setItem(BETA_WARNING_SHOWN_KEY, '1');
    } catch {
      // Storage blocked: shown again next time
    }
    dialog.trigger({
      type: 'component',
      component: { ref: BetaWarning },
      options: { title: 'This Is a Beta Version', size: 'small' },
    });
  });
}
