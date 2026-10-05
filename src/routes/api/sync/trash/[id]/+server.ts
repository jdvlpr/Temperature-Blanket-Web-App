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

// One project in the account's Trash: its data, to show or restore it, or
// deleting it forever.

import { SYNC_HEADERS } from '$lib/sync/protocol';
import type { RequestHandler } from './$types';

export const prerender = false;

const NO_STORE = { 'Cache-Control': 'no-store' };

async function load(event: Parameters<RequestHandler>[0]) {
  const { requireSync, syncError } = await import('$lib/server/sync');
  const store = await import('$lib/server/sync/store');
  const { isProjectId } = await import('$lib/server/sync/request');
  const sync = await requireSync(event);
  if (sync instanceof Response) return sync;
  if (!isProjectId(event.params.id))
    return syncError(400, 'INVALID_REQUEST', 'Invalid project ID');
  return { sync, store, syncError };
}

export const GET: RequestHandler = async (event) => {
  const loaded = await load(event);
  if (loaded instanceof Response) return loaded;
  const { sync, store, syncError } = loaded;

  const data = await store.getTrashedProjectData(
    sync.db,
    sync.bucket,
    sync.userId,
    event.params.id,
  );
  if (!data) return syncError(404, 'NOT_FOUND', 'Not in the Trash');

  // Raw gzip, as for a normal download
  return new Response(data.body as unknown as ReadableStream, {
    headers: {
      ...NO_STORE,
      'Content-Type': 'application/gzip',
      [SYNC_HEADERS.rev]: String(data.rev),
    },
  });
};

export const DELETE: RequestHandler = async (event) => {
  const loaded = await load(event);
  if (loaded instanceof Response) return loaded;
  const { sync, store } = loaded;

  const purged = await store.purgeTrash(
    sync.db,
    sync.bucket,
    sync.userId,
    event.params.id,
  );
  return Response.json({ purged }, { headers: NO_STORE });
};
