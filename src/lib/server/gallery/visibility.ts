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

// A project or palette and its gallery page go together: moving one to the Trash
// hides its page (WordPress's trash), restoring it brings the same page back,
// and deleting it forever forgets the page. Run by the sync routes after a
// change reaches the account, so it holds whichever device made it.

import type { D1Database } from '@cloudflare/workers-types';
import {
  forgetPost,
  postsForItem,
  setPostHidden,
  type GalleryPostKind,
} from './store';
import type { GalleryApi } from './wordpress';

/** Where the item is now. */
export type ItemState = 'live' | 'trash' | 'purged';

export async function matchGalleryToItem(
  db: D1Database,
  api: GalleryApi,
  userId: string,
  kind: GalleryPostKind,
  itemId: string,
  state: ItemState,
  now = Date.now(),
) {
  const posts = await postsForItem(db, userId, kind, itemId);
  for (const { postId, hidden } of posts) {
    if (state === 'live') {
      if (!hidden) continue;
      // Emptied from WordPress's trash meanwhile: the item comes back unpublished
      if ((await api.restore(postId, userId)) === 'gone')
        await forgetPost(db, userId, postId);
      else await setPostHidden(db, userId, postId, null);
      continue;
    }
    if (!hidden) {
      // Hidden only once WordPress has it in its trash, so a failure here
      // never leaves a live page the app thinks is hidden
      const result = await api.trash(postId, userId);
      if (result === 'gone' || state === 'purged') {
        await forgetPost(db, userId, postId);
        continue;
      }
      await setPostHidden(db, userId, postId, now);
    } else if (state === 'purged') await forgetPost(db, userId, postId);
  }
}

/**
 * Projects deleted forever: their pages stay in WordPress's trash and are
 * forgotten here, and so are their Ravelry links (the Ravelry projects stay).
 */
export async function forgetPurgedProjects(
  db: D1Database,
  api: GalleryApi,
  userId: string,
  projectIds: string[],
) {
  const { forgetProjectLink } = await import('#lib/server/ravelry/store.js');
  for (const projectId of projectIds) {
    await matchGalleryToItem(db, api, userId, 'project', projectId, 'purged');
    await forgetProjectLink(db, userId, projectId);
  }
}
