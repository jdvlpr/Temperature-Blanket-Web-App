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

// The signed-in person's blocks (src/lib/server/gallery/blocks.ts): list them
// by the page each was made from (GET { blocks, postIds }: postIds are the
// pages they hide), block a page's publisher (POST { postId }), add a guest's
// blocks on sign-in (POST { postIds }) or unblock (DELETE { postId }). Pages
// published without an account can't be blocked (409 NO_PUBLISHER).

import type { RequestHandler } from './$types';

export const prerender = false;

const PRIVATE = { 'Cache-Control': 'private, no-store' };

const postIdOf = (value: unknown) =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0
    ? value
    : null;

async function answer(
  db: import('@cloudflare/workers-types').D1Database,
  userId: string,
) {
  const { listBlocks, hiddenPostIds } =
    await import('#lib/server/gallery/blocks.js');
  const [blocks, postIds] = await Promise.all([
    listBlocks(db, userId),
    hiddenPostIds(db, { userId }),
  ]);
  return Response.json({ blocks, postIds }, { headers: PRIVATE });
}

export const GET: RequestHandler = async (event) => {
  const { requireGallery } = await import('#lib/server/gallery/index.js');
  const gallery = await requireGallery(event);
  if (gallery instanceof Response) return gallery;
  return answer(gallery.db, gallery.userId);
};

export const POST: RequestHandler = async (event) => {
  const { requireGallery, galleryError } =
    await import('#lib/server/gallery/index.js');
  const { blockFromPost, mergeBlocks, BLOCK_LIMIT } =
    await import('#lib/server/gallery/blocks.js');
  const gallery = await requireGallery(event);
  if (gallery instanceof Response) return gallery;

  const body = await event.request.json().catch(() => null);
  if (Array.isArray(body?.postIds)) {
    const ids = (body.postIds as unknown[])
      .map(postIdOf)
      .filter((id): id is number => id !== null);
    await mergeBlocks(gallery.db, gallery.userId, ids);
    return answer(gallery.db, gallery.userId);
  }
  const postId = postIdOf(body?.postId);
  if (!postId)
    return galleryError(400, 'INVALID_REQUEST', 'Invalid gallery page');
  const result = await blockFromPost(gallery.db, gallery.userId, postId);
  if (result === 'no-publisher')
    return galleryError(
      409,
      'NO_PUBLISHER',
      'This page was published without an account, so it can be reported but not blocked',
    );
  if (result === 'own-page')
    return galleryError(409, 'OWN_PAGE', 'This is your own gallery page');
  if (result === 'block-limit')
    return galleryError(
      409,
      'BLOCK_LIMIT',
      `You can block up to ${BLOCK_LIMIT} people. Unblock some in Preferences first`,
    );
  return answer(gallery.db, gallery.userId);
};

export const DELETE: RequestHandler = async (event) => {
  const { requireGallery, galleryError } =
    await import('#lib/server/gallery/index.js');
  const { unblockFromPost } = await import('#lib/server/gallery/blocks.js');
  const gallery = await requireGallery(event);
  if (gallery instanceof Response) return gallery;

  const body = await event.request.json().catch(() => null);
  const postId = postIdOf(body?.postId);
  if (!postId)
    return galleryError(400, 'INVALID_REQUEST', 'Invalid gallery page');
  await unblockFromPost(gallery.db, gallery.userId, postId);
  return answer(gallery.db, gallery.userId);
};
