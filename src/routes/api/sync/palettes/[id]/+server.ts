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

// Saving one palette to the account (see $lib/sync/protocol). Palettes come
// back to devices in the changes feed.

import type { RequestHandler } from './$types';

export const prerender = false;

export const PUT: RequestHandler = async (event) => {
  const { requireSync, syncError, cleanUpAfterWrite } =
    await import('$lib/server/sync');
  const store = await import('$lib/server/sync/store');
  const { isProjectId, parsePaletteInput } =
    await import('$lib/server/sync/request');

  const sync = await requireSync(event);
  if (sync instanceof Response) return sync;
  if (!isProjectId(event.params.id))
    return syncError(400, 'INVALID_REQUEST', 'Invalid palette ID');

  const input = parsePaletteInput(await event.request.json().catch(() => null));
  if (!input.ok) return syncError(input.status, input.code, input.message);

  const result = await store.savePalette(
    sync.db,
    sync.userId,
    event.params.id,
    input.value,
  );
  if (result.status === 'quota')
    return syncError(
      413,
      'QUOTA_EXCEEDED',
      `Accounts can sync up to ${store.MAX_PALETTES_PER_USER} palettes`,
    );

  cleanUpAfterWrite(sync);
  return Response.json(
    { palette: result.palette, applied: result.status === 'saved' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
