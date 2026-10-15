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

/** Deletes one of the linked project's photos, on Ravelry too. */
export const DELETE: RequestHandler = async (event) => {
  const { withRavelry, ravelryError, NO_STORE } =
    await import('#lib/server/ravelry/index.js');
  const { getProjectLink, listPhotos } =
    await import('#lib/server/ravelry/store.js');
  const { refreshPhotos } = await import('#lib/server/ravelry/photos.js');
  const { PROJECT_ID_PATTERN } = await import('#lib/server/sync/store.js');
  const { projectId } = event.params;
  const photoId = Number(event.params.photoId);
  if (!PROJECT_ID_PATTERN.test(projectId) || !Number.isSafeInteger(photoId))
    return ravelryError(400, 'INVALID_REQUEST', 'Bad project or photo ID');

  return withRavelry(event, async (session) => {
    const link = await getProjectLink(session.db, session.userId, projectId);
    // Only a photo of this account's linked project
    const kept = link
      ? await listPhotos(session.db, session.userId, projectId)
      : [];
    if (!link || !kept.some((p) => p.photoId === photoId))
      return ravelryError(404, 'NOT_FOUND', 'No such photo');
    await session.api.deletePhoto(photoId);
    return Response.json(
      { photos: await refreshPhotos(session, link) },
      { headers: NO_STORE },
    );
  });
};
