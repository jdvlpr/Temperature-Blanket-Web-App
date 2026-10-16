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

// Moving a project or palette to the Trash takes its gallery page down with
// it (restoring brings the same page back), so it asks first.

import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
import { ravelryLinks } from '#lib/accounts/ravelry-links.svelte.js';
import { account } from '#lib/accounts/summary.svelte.js';
import { dialog } from '#lib/state/page-state.svelte.js';

/** Asks whether to move it to the Trash, knowing it has a gallery page */
export const confirmTrash = ({ ravelry = false } = {}) =>
  new Promise<boolean>((resolve) =>
    dialog.trigger({
      type: 'confirm',
      title: 'Move to Trash?',
      body: `Its gallery page comes down too. Undo or Restore from the Trash brings the same page back.${
        ravelry ? ' Its Ravelry project stays on Ravelry.' : ''
      }`,
      confirmText: 'Move to Trash',
      danger: true,
      response: resolve,
    }),
  );

/**
 * For a project not listed on My Projects (the open one): asks first when it
 * has a gallery page, and answers whether to go ahead.
 */
export async function confirmTrashProject(id: string) {
  if (!__ACCOUNTS_ENABLED__ || !account.summary?.id) return true;
  await galleryPages.load();
  if (
    !galleryPages.pages.some((p) => p.kind !== 'palette' && p.projectId === id)
  )
    return true;
  await ravelryLinks.load();
  return confirmTrash({ ravelry: ravelryLinks.links.has(id) });
}
