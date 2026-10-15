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

import type { RequestHandler } from './$types';

export const prerender = false;

/**
 * Adds a photo (multipart "file") to the linked Ravelry project. With
 * picture=1 it's the project's picture from the app, replacing the last one.
 */
export const POST: RequestHandler = async (event) => {
  const { withRavelry, ravelryError, NO_STORE } =
    await import('#lib/server/ravelry/index.js');
  const { getProjectLink } = await import('#lib/server/ravelry/store.js');
  const { addPhoto, PHOTO_TYPES, MAX_PHOTO_BYTES } =
    await import('#lib/server/ravelry/photos.js');
  const { PROJECT_ID_PATTERN } = await import('#lib/server/sync/store.js');
  const projectId = event.params.projectId;
  if (!PROJECT_ID_PATTERN.test(projectId))
    return ravelryError(400, 'INVALID_REQUEST', 'Bad project ID');

  return withRavelry(event, async (session) => {
    const link = await getProjectLink(session.db, session.userId, projectId);
    if (!link)
      return ravelryError(404, 'NOT_LINKED', 'Post it to Ravelry first');

    const form = await event.request.formData().catch(() => null);
    const file = form?.get('file');
    if (!(file instanceof Blob) || !PHOTO_TYPES.has(file.type))
      return ravelryError(
        400,
        'INVALID_PHOTO',
        'Choose a PNG, JPEG or HEIC photo',
      );
    if (file.size > MAX_PHOTO_BYTES)
      return ravelryError(413, 'PHOTO_TOO_BIG', 'Choose a photo under 20 MB');

    const result = await addPhoto(session, link, file, {
      picture: form?.get('picture') === '1',
    });
    return Response.json(result, { headers: NO_STORE });
  });
};
