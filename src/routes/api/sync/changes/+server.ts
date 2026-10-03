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

// What changed in the signed-in account's projects since a revision (see $lib/sync/protocol).

import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async (event) => {
  const { requireSync, syncError } = await import('$lib/server/sync');
  const { listChanges, MAX_CHANGES_PAGE } =
    await import('$lib/server/sync/store');
  const { parseRev } = await import('$lib/server/sync/request');

  const sync = await requireSync(event);
  if (sync instanceof Response) return sync;

  const since = parseRev(event.url.searchParams.get('since') ?? '0');
  const limit = parseRev(event.url.searchParams.get('limit') ?? '100');
  if (since === null || !limit)
    return syncError(400, 'INVALID_REQUEST', 'Invalid since or limit');

  const result = await listChanges(
    sync.db,
    sync.userId,
    since,
    Math.min(limit, MAX_CHANGES_PAGE),
  );
  return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
};
