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

// Dev only (nothing is in production yet): gallery pages now follow their
// project or palette into the Trash. For the signed-in account, this hides the
// pages of items deleted before that, as moving them to the Trash now would.
// Items the account never had (saved only on a device) are left alone.
export const POST: RequestHandler = async (event) => {
  requireDevRoutes(getPlatform());
  const { requireGallery } = await import('#lib/server/gallery/index.js');
  const { listPosts } = await import('#lib/server/gallery/store.js');
  const { matchGalleryToItem } =
    await import('#lib/server/gallery/visibility.js');
  const gallery = await requireGallery(event);
  if (gallery instanceof Response) return gallery;

  const hidden: number[] = [];
  const failed: number[] = [];
  for (const post of await listPosts(gallery.db, gallery.userId)) {
    const kind = post.kind ?? 'project';
    const row = await gallery.db
      .prepare(
        kind === 'project'
          ? `select "deletedAt", "blobKey" is null as "purged" from "project" where "userId" = ? and "projectId" = ?`
          : `select "deletedAt", "purgedAt" is not null as "purged" from "palette" where "userId" = ? and "paletteId" = ?`,
      )
      .bind(gallery.userId, post.projectId)
      .first<{ deletedAt: number | null; purged: number }>();
    if (!row || row.deletedAt === null) continue;
    try {
      await matchGalleryToItem(
        gallery.db,
        gallery.api,
        gallery.userId,
        kind,
        post.projectId,
        row.purged ? 'purged' : 'trash',
      );
      hidden.push(post.postId);
    } catch (e) {
      console.error('Could not hide gallery page', e);
      failed.push(post.postId);
    }
  }
  return json({ hidden, failed });
};
