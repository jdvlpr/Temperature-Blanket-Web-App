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
 * Puts the linked project's photos in this order on Ravelry (JSON { photoIds });
 * the first is its main photo. Only its own photos, as kept here.
 */
export const POST: RequestHandler = async (event) => {
  const { withRavelry, ravelryError, NO_STORE } =
    await import('#lib/server/ravelry/index.js');
  const { getProjectLink, listPhotos } =
    await import('#lib/server/ravelry/store.js');
  const { refreshPhotos } = await import('#lib/server/ravelry/photos.js');
  const { PROJECT_ID_PATTERN } = await import('#lib/server/sync/store.js');
  const projectId = event.params.projectId;
  if (!PROJECT_ID_PATTERN.test(projectId))
    return ravelryError(400, 'INVALID_REQUEST', 'Bad project ID');

  return withRavelry(event, async (session) => {
    const link = await getProjectLink(session.db, session.userId, projectId);
    if (!link)
      return ravelryError(404, 'NOT_LINKED', 'Post it to Ravelry first');
    const body = (await event.request.json().catch(() => null)) as {
      photoIds?: unknown;
    } | null;
    const kept = new Set(
      (await listPhotos(session.db, session.userId, projectId)).map(
        (p) => p.photoId,
      ),
    );
    const photoIds = Array.isArray(body?.photoIds)
      ? body.photoIds.filter(
          (id): id is number => typeof id === 'number' && kept.has(id),
        )
      : [];
    if (!photoIds.length)
      return ravelryError(400, 'INVALID_REQUEST', 'No photos to order');
    await session.api.reorderPhotos(
      link.ravelryUsername,
      link.ravelryProjectId,
      photoIds,
    );
    const photos = await refreshPhotos(session, link);
    return Response.json({ photos }, { headers: NO_STORE });
  });
};
