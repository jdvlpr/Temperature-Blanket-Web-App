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

// One synced project: download, save, delete (see $lib/sync/protocol).

import { dev } from '$app/environment';
import { SYNC_HEADERS, type ProjectMeta } from '$lib/sync/protocol';
import type { RequestHandler } from './$types';

export const prerender = false;

const NO_STORE = { 'Cache-Control': 'no-store' };

const conflict = (current: ProjectMeta | null) =>
  Response.json(
    { code: 'CONFLICT', message: 'Changed on another device', current },
    { status: 409, headers: NO_STORE },
  );

async function load(event: Parameters<RequestHandler>[0]) {
  const { requireSync, syncError, cleanUpAfterWrite } =
    await import('$lib/server/sync');
  const store = await import('$lib/server/sync/store');
  const request = await import('$lib/server/sync/request');

  const sync = await requireSync(event);
  if (sync instanceof Response) return sync;
  if (!request.isProjectId(event.params.id))
    return syncError(400, 'INVALID_REQUEST', 'Invalid project ID');
  return { sync, syncError, cleanUpAfterWrite, store, request };
}

export const GET: RequestHandler = async (event) => {
  const loaded = await load(event);
  if (loaded instanceof Response) return loaded;
  const { sync, store, syncError } = loaded;

  const data = await store.getProjectData(
    sync.db,
    sync.bucket,
    sync.userId,
    event.params.id,
  );
  if (!data) return syncError(404, 'NOT_FOUND', 'No such project');

  // Raw gzip, not Content-Encoding: the browser decompresses it itself
  return new Response(data.body as unknown as ReadableStream, {
    headers: {
      ...NO_STORE,
      'Content-Type': 'application/gzip',
      ETag: `"${data.meta.rev}"`,
      [SYNC_HEADERS.rev]: String(data.meta.rev),
      ...(data.meta.contentHash && {
        [SYNC_HEADERS.contentHash]: data.meta.contentHash,
      }),
    },
  });
};

export const PUT: RequestHandler = async (event) => {
  const loaded = await load(event);
  if (loaded instanceof Response) return loaded;
  const { sync, store, request, syncError, cleanUpAfterWrite } = loaded;

  const headers = request.parseSaveHeaders(event.request.headers);
  if (!headers.ok)
    return syncError(headers.status, headers.code, headers.message);
  if (!event.request.body)
    return syncError(411, 'LENGTH_REQUIRED', 'A body is required');

  const result = await store.saveProject(sync.db, sync.bucket, {
    ...headers.value,
    userId: sync.userId,
    projectId: event.params.id,
    // Workers stream a body of known length straight to R2; the dev server's R2
    // proxy can't take a stream, so there it's read first
    body: dev
      ? await event.request.arrayBuffer()
      : (event.request.body as never),
  });

  if (result.status === 'conflict') return conflict(result.current);
  if (result.status === 'quota')
    return syncError(
      413,
      'QUOTA_EXCEEDED',
      result.reason === 'projects'
        ? `Accounts can sync up to ${store.MAX_PROJECTS_PER_USER} projects`
        : 'This account is out of sync storage',
    );

  cleanUpAfterWrite(sync);
  return Response.json({ meta: result.meta }, { headers: NO_STORE });
};

export const DELETE: RequestHandler = async (event) => {
  const loaded = await load(event);
  if (loaded instanceof Response) return loaded;
  const { sync, store, request, syncError, cleanUpAfterWrite } = loaded;

  const baseRev = request.parseRev(event.url.searchParams.get('baseRev'));
  if (baseRev === null)
    return syncError(400, 'INVALID_REQUEST', 'baseRev is required');

  const result = await store.deleteProject(
    sync.db,
    sync.userId,
    event.params.id,
    baseRev,
  );
  if (result.status === 'not-found')
    return syncError(404, 'NOT_FOUND', 'No such project');
  if (result.status === 'conflict') return conflict(result.current);

  cleanUpAfterWrite(sync);
  return Response.json({ meta: result.meta }, { headers: NO_STORE });
};
