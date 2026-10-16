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

/**
 * The link, read from Ravelry again: its photos, and what's on Ravelry now
 * (name, dates, status, notes without the link line, yarns) for Update.
 */
export const GET: RequestHandler = async (event) => {
  const m = await load();
  const { readLinkedProject } = await import('#lib/server/ravelry/sync.js');
  const { withoutLinkLine } = await import('#lib/server/ravelry/project.js');
  const projectId = await projectIdOf(event);
  if (!projectId)
    return m.ravelryError(400, 'INVALID_REQUEST', 'Bad project ID');
  return m.withRavelry(event, async (session) => {
    const link = await m.getProjectLink(session.db, session.userId, projectId);
    if (!link)
      return m.ravelryError(404, 'NOT_LINKED', 'Not posted to Ravelry');
    const read = await readLinkedProject(session, link);
    if (!read) return gone(m);
    const { project } = read;
    return Response.json(
      {
        project: m.linkForClient(read.link, read.photos),
        details: {
          name: project.name,
          craftId: project.craft_id ?? null,
          statusId: project.project_status_id ?? null,
          started: project.started ?? null,
          finishBy: project.finish_by ?? null,
          completed: project.completed ?? null,
          progress: project.progress ?? null,
          notes: withoutLinkLine(project.notes),
          packs: read.packs,
        },
      },
      { headers: m.NO_STORE },
    );
  });
};

/** Deleted on Ravelry, so unlinked here */
const gone = (m: Awaited<ReturnType<typeof load>>) =>
  m.ravelryError(
    404,
    'RAVELRY_GONE',
    'That project was deleted on Ravelry, so it’s unlinked here',
  );

/**
 * Posts the project to Ravelry, or changes the Ravelry project it was posted
 * as: only the fields sent that differ, and yarns added or (only ones this app
 * added) removed. Its notes link to the project's gallery page, which has to
 * show its owner's name: the Ravelry project names them anyway.
 */
export const POST: RequestHandler = async (event) => {
  const m = await load();
  const { readProjectPost, createData, updateData, packFor } =
    await import('#lib/server/ravelry/project.js');
  const { keepProject } = await import('#lib/server/ravelry/sync.js');
  const { projectPage } = await import('#lib/server/gallery/store.js');
  const { RavelryApiError } = await import('#lib/server/ravelry/api.js');
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
    const page = await projectPage(session.db, session.userId, projectId);
    if (!page)
      return m.ravelryError(
        409,
        'NEEDS_GALLERY_PAGE',
        'Publish it to the gallery first',
      );
    if (!page.showOwner)
      return m.ravelryError(
        409,
        'NEEDS_NAME_SHOWN',
        'Show your name on its gallery page first',
      );
    const pageUrl = `${event.url.origin}/gallery/${page.postId}`;

    let link = await m.getProjectLink(session.db, session.userId, projectId);
    const post = readProjectPost(await event.request.json().catch(() => null), {
      create: !link,
    });
    if (typeof post === 'string')
      return m.ravelryError(400, 'INVALID_REQUEST', post);

    if (!link) {
      const project = await session.api.createProject(
        session.username,
        createData(post, pageUrl),
      );
      const now = Date.now();
      link = {
        projectId,
        ravelryProjectId: project.id,
        ravelryUsername: session.username,
        permalink: project.permalink,
        picturePhotoId: null,
        postedAt: now,
        updatedAt: now,
      };
      await m.saveProjectLink(session.db, session.userId, link);
      const kept = await keepProject(session, link, project, {
        ours: (project.packs ?? []).map((p) => p.id),
      });
      return Response.json(
        { project: m.linkForClient(kept.link, kept.photos) },
        { headers: m.NO_STORE },
      );
    }

    let current;
    try {
      current = await session.api.showProject(
        link.ravelryUsername,
        link.ravelryProjectId,
      );
    } catch (e) {
      if (e instanceof RavelryApiError && e.status === 404) {
        await m.forgetProjectLink(session.db, session.userId, projectId);
        return gone(m);
      }
      throw e;
    }
    const data = updateData(post, pageUrl, current);
    if (Object.keys(data).length)
      await session.api.updateProject(
        link.ravelryUsername,
        link.ravelryProjectId,
        data,
      );

    // Yarns: only ones this app added can be removed
    const ours = new Set(
      m
        .readPacks(link.packs)
        .filter((p) => p.ours)
        .map((p) => p.packId),
    );
    const added: number[] = [];
    for (const packId of post.packs?.remove ?? [])
      if (ours.has(packId))
        await session.api.deletePack(packId).catch((e) => {
          if (!(e instanceof RavelryApiError && e.status === 404)) throw e;
        });
    for (const yarn of post.packs?.add ?? [])
      added.push(
        (await session.api.createPack(link.ravelryProjectId, packFor(yarn))).id,
      );

    const changed =
      Object.keys(data).length || added.length || post.packs?.remove.length;
    if (changed) {
      link = { ...link, updatedAt: Date.now() };
      await m.saveProjectLink(session.db, session.userId, link);
    }
    // What Ravelry has now, kept here
    const project = changed
      ? await session.api.showProject(
          link.ravelryUsername,
          link.ravelryProjectId,
        )
      : current;
    const kept = await keepProject(session, link, project, { ours: added });
    return Response.json(
      { project: m.linkForClient(kept.link, kept.photos) },
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
