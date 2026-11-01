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

import HelpView from '#lib/components/docs/HelpView.svelte';
import { dialog } from '#lib/state/page-state.svelte.js';

/**
 * Yarn Sources (the help topic), searched for `search` (a yarn, from
 * `yarnSourcesSearch`) or showing every yarn. Over an open dialog it shows
 * in that dialog's place with Back, so nothing chosen there is lost: from a
 * colorway's ⋮ menu, which sits outside the dialog's element (in a portal),
 * as from anything in it, since nothing behind a dialog can be clicked.
 */
export function openYarnSources({
  search = '',
  opener = null,
}: { search?: string; opener?: HTMLElement | null } = {}) {
  if (dialog.opened && dialog.type === 'component')
    dialog.showHelp('yarn-sources', opener, { search });
  else
    dialog.trigger({
      type: 'component',
      component: {
        ref: HelpView,
        props: { topic: 'yarn-sources', props: { search } },
      },
      options: { title: 'Yarn Sources', size: 'medium' },
    });
}
