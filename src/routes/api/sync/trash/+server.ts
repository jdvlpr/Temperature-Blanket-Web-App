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

// The account's Trash: deleted projects whose data is still kept (see
// $lib/sync/protocol). Restoring one is an ordinary save over the deletion.

import type { RequestHandler } from './$types';

export const prerender = false;

const NO_STORE = { 'Cache-Control': 'no-store' };

export const GET: RequestHandler = async (event) => {
  const { requireSync } = await import('$lib/server/sync');
  const { listTrash } = await import('$lib/server/sync/store');
  const sync = await requireSync(event);
  if (sync instanceof Response) return sync;

  const projects = await listTrash(sync.db, sync.userId);
  return Response.json({ projects }, { headers: NO_STORE });
};

/** Empty Trash: deletes everything in it for good, in one request. */
export const DELETE: RequestHandler = async (event) => {
  const { requireSync } = await import('$lib/server/sync');
  const { purgeTrash } = await import('$lib/server/sync/store');
  const sync = await requireSync(event);
  if (sync instanceof Response) return sync;

  const purged = await purgeTrash(sync.db, sync.bucket, sync.userId, null);
  return Response.json({ purged }, { headers: NO_STORE });
};
