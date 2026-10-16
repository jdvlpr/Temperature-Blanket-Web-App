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

// Opens a saved project's Ravelry dialog, from the Ravelry section of its
// Share dialog.

import { ravelryLinks } from '#lib/accounts/ravelry-links.svelte.js';
import { account } from '#lib/accounts/summary.svelte.js';
import { dialog, toast } from '#lib/state/page-state.svelte.js';
import type { StoredProjectIndexItem } from '#lib/storage/projects.svelte.js';
import { escapeHtml } from '#lib/utils/string-utils.js';

const nameOf = (item: StoredProjectIndexItem) =>
  item.meta.name || item.meta.title || 'Untitled Project';

/** Whether the project is in the account, which posting to Ravelry needs. */
export const inAccount = (item: StoredProjectIndexItem) =>
  !!item.sync && item.sync.ownerUserId === account.summary?.id;

/** Post to Ravelry, or Update on Ravelry (details, yarns and photos) once it's posted. */
export async function openRavelryPost(item: StoredProjectIndexItem) {
  if (!inAccount(item)) {
    toast.trigger({
      message: `Add “${escapeHtml(nameOf(item))}” to your account first, then post it to Ravelry.`,
    });
    return;
  }
  const { default: RavelryPost } =
    await import('#lib/components/modals/RavelryPost.svelte');
  const updating = ravelryLinks.links.has(item.id);
  dialog.trigger({
    type: 'component',
    component: {
      ref: RavelryPost,
      props: { projectId: item.id, href: item.meta.href, name: nameOf(item) },
    },
    options: {
      size: 'medium',
      title: updating ? 'Update on Ravelry' : 'Post to Ravelry',
    },
  });
}
