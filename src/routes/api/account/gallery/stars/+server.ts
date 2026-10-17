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

// The signed-in user's stars: gallery pages they starred to find again. List
// them (GET), star one (PUT { postId, kind }) or unstar it (DELETE { postId }).
// Private, and one D1 request each: never WordPress, never a view.

import type { RequestHandler } from './$types';

export const prerender = false;

const PRIVATE = { 'Cache-Control': 'private, no-store' };

/** The page ID from the body, or null when it isn't one. */
function postIdFrom(value: unknown) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

export const GET: RequestHandler = async (event) => {
  const { requireGallery } = await import('#lib/server/gallery/index.js');
  const { listStars } = await import('#lib/server/gallery/stars.js');
  const gallery = await requireGallery(event);
  if (gallery instanceof Response) return gallery;

  const stars = await listStars(gallery.db, gallery.userId);
  return Response.json({ stars }, { headers: PRIVATE });
};

export const PUT: RequestHandler = async (event) => {
  const { requireGallery, galleryError } =
    await import('#lib/server/gallery/index.js');
  const { addStar, STAR_LIMIT } = await import('#lib/server/gallery/stars.js');
  const gallery = await requireGallery(event);
  if (gallery instanceof Response) return gallery;

  const body = await event.request.json().catch(() => null);
  const postId = postIdFrom(body?.postId);
  const kind = body?.kind;
  if (!postId || (kind !== 'project' && kind !== 'palette'))
    return galleryError(400, 'INVALID_REQUEST', 'Invalid gallery page');

  const result = await addStar(gallery.db, gallery.userId, postId, kind);
  if (result === 'star-limit')
    return galleryError(
      409,
      'STAR_LIMIT',
      `You can star up to ${STAR_LIMIT} gallery pages. Unstar some in My Library first`,
    );
  if (result === 'own-page')
    return galleryError(409, 'OWN_PAGE', 'This is your own gallery page');
  return new Response(null, { status: 204, headers: PRIVATE });
};

export const DELETE: RequestHandler = async (event) => {
  const { requireGallery, galleryError } =
    await import('#lib/server/gallery/index.js');
  const { removeStar } = await import('#lib/server/gallery/stars.js');
  const gallery = await requireGallery(event);
  if (gallery instanceof Response) return gallery;

  const body = await event.request.json().catch(() => null);
  const postId = postIdFrom(body?.postId);
  if (!postId)
    return galleryError(400, 'INVALID_REQUEST', 'Invalid gallery page');

  await removeStar(gallery.db, gallery.userId, postId);
  return new Response(null, { status: 204, headers: PRIVATE });
};
