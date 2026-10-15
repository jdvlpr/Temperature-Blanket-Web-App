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
 * A one-use token for the browser to upload a photo straight to Ravelry
 * (upload/image needs no other credentials), then add it with POST photos
 * { uploadToken }.
 */
export const POST: RequestHandler = async (event) => {
  const { withRavelry, ravelryError, NO_STORE } =
    await import('#lib/server/ravelry/index.js');
  const { getProjectLink } = await import('#lib/server/ravelry/store.js');
  const { RAVELRY_UPLOAD_URL } = await import('#lib/server/ravelry/photos.js');
  const { PROJECT_ID_PATTERN } = await import('#lib/server/sync/store.js');
  const projectId = event.params.projectId;
  if (!PROJECT_ID_PATTERN.test(projectId))
    return ravelryError(400, 'INVALID_REQUEST', 'Bad project ID');

  return withRavelry(event, async (session) => {
    const link = await getProjectLink(session.db, session.userId, projectId);
    if (!link)
      return ravelryError(404, 'NOT_LINKED', 'Post it to Ravelry first');
    return Response.json(
      {
        uploadToken: await session.api.uploadToken(),
        uploadUrl: RAVELRY_UPLOAD_URL,
      },
      { headers: NO_STORE },
    );
  });
};
