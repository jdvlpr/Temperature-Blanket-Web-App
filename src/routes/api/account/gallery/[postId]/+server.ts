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

// One of the signed-in user's gallery pages: include it on their public gallery
// or take it off (PATCH { showOwner }), rename a palette's in place (PATCH
// { title }; 501 RENAME_UNSUPPORTED with an older gallery plugin), move a
// palette's pages to another saved palette (PATCH { paletteId }: saved again
// after the first was deleted for good), or remove it (DELETE: WordPress moves
// it to the trash).

import type { RequestHandler } from './$types';

export const prerender = false;

/** The page ID from the URL, or null when it isn't one. */
function postIdFrom(param: string) {
  const postId = Number(param);
  return Number.isSafeInteger(postId) && postId > 0 ? postId : null;
}

export const PATCH: RequestHandler = async (event) => {
  const {
    requireGallery,
    galleryError,
    renamePaletteFromAccount,
    SAVED_PALETTE_ID,
  } = await import('#lib/server/gallery/index.js');
  const { setPostShowOwner, getSettings, relinkPalettePages } =
    await import('#lib/server/gallery/store.js');
  const gallery = await requireGallery(event);
  if (gallery instanceof Response) return gallery;

  const postId = postIdFrom(event.params.postId);
  const body = await event.request.json().catch(() => null);
  if (postId && body && 'title' in body)
    return renamePaletteFromAccount(gallery, postId, body.title);
  // Only in the app: WordPress doesn't know which saved palette a page is of
  if (postId && body && 'paletteId' in body) {
    if (
      typeof body.paletteId !== 'string' ||
      !SAVED_PALETTE_ID.test(body.paletteId)
    )
      return galleryError(400, 'INVALID_REQUEST', 'Invalid palette');
    if (
      !(await relinkPalettePages(
        gallery.db,
        gallery.userId,
        postId,
        body.paletteId,
      ))
    )
      return galleryError(404, 'NOT_FOUND', 'No such palette page');
    return Response.json(
      { paletteId: body.paletteId },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }
  if (!postId || typeof body?.showOwner !== 'boolean')
    return galleryError(400, 'INVALID_REQUEST', 'Nothing to change');
  // Only in the app: WordPress never has the owner's name, so there's nothing to tell it
  if (
    !(await setPostShowOwner(
      gallery.db,
      gallery.userId,
      postId,
      body.showOwner,
    ))
  )
    return galleryError(404, 'NOT_FOUND', 'No such gallery page');

  const { publicId } = await getSettings(gallery.db, gallery.userId);
  return Response.json(
    { showOwner: body.showOwner, publicId },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};

export const DELETE: RequestHandler = async (event) => {
  const { requireGallery, galleryError } =
    await import('#lib/server/gallery/index.js');
  const { ownsPost, forgetPost } = await import('#lib/server/gallery/store.js');
  const gallery = await requireGallery(event);
  if (gallery instanceof Response) return gallery;

  const postId = postIdFrom(event.params.postId);
  if (!postId)
    return galleryError(400, 'INVALID_REQUEST', 'Invalid gallery page');
  // Ownership from the session, checked here before WordPress checks it again
  if (!(await ownsPost(gallery.db, gallery.userId, postId)))
    return galleryError(404, 'NOT_FOUND', 'No such gallery page');

  try {
    // 'gone' too: already removed on WordPress, so there's nothing left to link
    await gallery.api.trash(postId, gallery.userId);
  } catch (e) {
    console.error('Could not remove gallery page', e);
    return galleryError(
      502,
      'GALLERY_UNAVAILABLE',
      'The gallery couldn’t be reached. Try again later.',
    );
  }
  await forgetPost(gallery.db, gallery.userId, postId);
  return new Response(null, { status: 204 });
};
