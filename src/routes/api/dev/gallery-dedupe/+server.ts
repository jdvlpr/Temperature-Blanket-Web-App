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

import { getPlatform } from '#lib/server/cloudflare.js';
import { requireDevRoutes } from '#lib/server/platform.js';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

// Dev only (nothing was in production with versions): a project or palette now
// has one gallery page, so for the signed-in account this unpublishes every
// page but the newest of each, on WordPress too, and forgets them here.
export const POST: RequestHandler = async (event) => {
  requireDevRoutes(getPlatform());
  const { requireGallery } = await import('#lib/server/gallery/index.js');
  const { listPosts, forgetPost } =
    await import('#lib/server/gallery/store.js');
  const gallery = await requireGallery(event);
  if (gallery instanceof Response) return gallery;

  const seen = new Set<string>();
  const removed: number[] = [];
  const failed: number[] = [];
  // Newest first, so the first of each is kept
  for (const post of await listPosts(gallery.db, gallery.userId)) {
    const key = `${post.kind ?? 'project'}:${post.projectId}`;
    // Pages tied to no saved project or palette are each their own
    if (!post.projectId || !seen.has(key)) {
      seen.add(key);
      continue;
    }
    try {
      await gallery.api.trash(post.postId, gallery.userId);
      await forgetPost(gallery.db, gallery.userId, post.postId);
      removed.push(post.postId);
    } catch (e) {
      console.error('Could not remove gallery page', e);
      failed.push(post.postId);
    }
  }
  return json({ removed, failed });
};
