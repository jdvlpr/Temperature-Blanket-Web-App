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

// One of the signed-in user's gallery pages: update it in place (PUT: a project
// with the same payload as publishing, a palette with { title, yarnUrl }; 501
// UPDATE_UNSUPPORTED with a gallery plugin before 1.9.0), include it on their public gallery
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

export const PUT: RequestHandler = async (event) => {
  const {
    requireGallery,
    galleryError,
    publishFromAccount,
    updatePaletteFromAccount,
  } = await import('#lib/server/gallery/index.js');
  const { postKind } = await import('#lib/server/gallery/store.js');
  const gallery = await requireGallery(event, { publishing: true });
  if (gallery instanceof Response) return gallery;

  const postId = postIdFrom(event.params.postId);
  if (!postId)
    return galleryError(400, 'INVALID_REQUEST', 'Invalid gallery page');
  const kind = await postKind(gallery.db, gallery.userId, postId);
  if (kind === 'palette')
    return updatePaletteFromAccount(
      gallery,
      postId,
      await event.request.json().catch(() => null),
      event.url.origin,
    );
  if (kind === 'project')
    // As sent, so the payload goes to WordPress exactly as the browser built it
    return publishFromAccount(gallery, await event.request.text(), { postId });
  return galleryError(404, 'NOT_FOUND', 'No such gallery page');
};

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
  // A project on Ravelry links to this page from its notes, under the owner's
  // Ravelry name: it can't be anonymous unless it's unlinked first
  if (!body.showOwner) {
    const { ravelryProjectForPost, forgetProjectLink } =
      await import('#lib/server/ravelry/store.js');
    const linked = await ravelryProjectForPost(
      gallery.db,
      gallery.userId,
      postId,
    ).catch(() => null);
    if (linked && body.unlinkRavelry !== true)
      return galleryError(
        409,
        'RAVELRY_LINKED',
        'Unlink it from Ravelry to make its page anonymous',
      );
    if (linked) await forgetProjectLink(gallery.db, gallery.userId, linked);
  }
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
  // Its Ravelry project would link to a page that's gone: unlinked too (it stays on Ravelry)
  const { ravelryProjectForPost, forgetProjectLink } =
    await import('#lib/server/ravelry/store.js');
  const linked = await ravelryProjectForPost(
    gallery.db,
    gallery.userId,
    postId,
  ).catch(() => null);
  if (linked) await forgetProjectLink(gallery.db, gallery.userId, linked);
  await forgetPost(gallery.db, gallery.userId, postId);
  return new Response(null, { status: 204 });
};
