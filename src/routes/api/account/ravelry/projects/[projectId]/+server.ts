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

import type { RequestEvent } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const prerender = false;

async function load() {
  const [ravelry, store, sync] = await Promise.all([
    import('#lib/server/ravelry/index.js'),
    import('#lib/server/ravelry/store.js'),
    import('#lib/server/sync/store.js'),
  ]);
  return { ...ravelry, ...store, ...sync };
}

/** The project ID from the path, if it's one a saved project can have. */
async function projectIdOf(event: RequestEvent<{ projectId: string }>) {
  const { PROJECT_ID_PATTERN } = await import('#lib/server/sync/store.js');
  const id = event.params.projectId;
  return PROJECT_ID_PATTERN.test(id) ? id : null;
}

/** The link, with its photos refreshed from Ravelry. */
export const GET: RequestHandler = async (event) => {
  const m = await load();
  const { refreshPhotos } = await import('#lib/server/ravelry/photos.js');
  const projectId = await projectIdOf(event);
  if (!projectId)
    return m.ravelryError(400, 'INVALID_REQUEST', 'Bad project ID');
  return m.withRavelry(event, async (session) => {
    const link = await m.getProjectLink(session.db, session.userId, projectId);
    if (!link)
      return m.ravelryError(404, 'NOT_LINKED', 'Not posted to Ravelry');
    const photos = await refreshPhotos(session, link);
    return Response.json(
      { project: m.linkForClient(link, photos) },
      { headers: m.NO_STORE },
    );
  });
};

/** Posts the project to Ravelry, or updates the Ravelry project it was posted as. */
export const POST: RequestHandler = async (event) => {
  const m = await load();
  const { readProjectPost, createData, updateData } =
    await import('#lib/server/ravelry/project.js');
  const projectId = await projectIdOf(event);
  if (!projectId)
    return m.ravelryError(400, 'INVALID_REQUEST', 'Bad project ID');

  return m.withRavelry(event, async (session) => {
    // Only a project in the account: its link then works on every device
    const meta = await m.getProjectMeta(session.db, session.userId, projectId);
    if (!meta || meta.deleted)
      return m.ravelryError(
        404,
        'NOT_IN_ACCOUNT',
        'Add this project to your account first',
      );

    const post = readProjectPost(
      await event.request.json().catch(() => null),
      event.url.origin,
      projectId,
    );
    if (typeof post === 'string')
      return m.ravelryError(400, 'INVALID_REQUEST', post);

    let link = await m.getProjectLink(session.db, session.userId, projectId);
    if (!link) {
      const project = await session.api.createProject(
        session.username,
        createData(post),
      );
      link = {
        projectId,
        ravelryProjectId: project.id,
        ravelryUsername: session.username,
        permalink: project.permalink,
        picturePhotoId: null,
        postedAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else {
      const current = await session.api.showProject(
        link.ravelryUsername,
        link.ravelryProjectId,
      );
      const project = await session.api.updateProject(
        link.ravelryUsername,
        link.ravelryProjectId,
        updateData(post, current.notes),
      );
      link = { ...link, permalink: project.permalink, updatedAt: Date.now() };
    }
    await m.saveProjectLink(session.db, session.userId, link);
    const photos = await m.listPhotos(session.db, session.userId, projectId);
    return Response.json(
      { project: m.linkForClient(link, photos) },
      { headers: m.NO_STORE },
    );
  });
};

/** Unlinks the project here; the Ravelry project and its photos stay on Ravelry. */
export const DELETE: RequestHandler = async (event) => {
  const m = await load();
  const projectId = await projectIdOf(event);
  if (!projectId)
    return m.ravelryError(400, 'INVALID_REQUEST', 'Bad project ID');
  const ctx = await m.requireRavelry(event);
  if (ctx instanceof Response) return ctx;
  await m.forgetProjectLink(ctx.db, ctx.userId, projectId);
  return Response.json({ unlinked: true }, { headers: m.NO_STORE });
};
