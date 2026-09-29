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

// Removes one of the signed-in user's gallery pages (WordPress moves it to the trash).

import type { RequestHandler } from './$types';

export const prerender = false;

export const DELETE: RequestHandler = async (event) => {
  const { requireGallery, galleryError } = await import('$lib/server/gallery');
  const { ownsPost, forgetPost } = await import('$lib/server/gallery/store');
  const gallery = await requireGallery(event);
  if (gallery instanceof Response) return gallery;

  const postId = Number(event.params.postId);
  if (!Number.isSafeInteger(postId) || postId < 1)
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
