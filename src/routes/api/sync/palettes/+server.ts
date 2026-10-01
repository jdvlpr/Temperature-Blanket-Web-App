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

// Saving palettes to the account, up to MAX_PALETTES_PER_UPLOAD a request (see
// $lib/sync/protocol). Each gets its own result, so one bad palette doesn't
// hold up the rest. Palettes come back to devices in the changes feed.

import {
  MAX_PALETTES_PER_UPLOAD,
  type PaletteUploadResult,
} from '$lib/sync/protocol';
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

  const body = await event.request.json().catch(() => null);
  const palettes: unknown[] = Array.isArray(body?.palettes)
    ? body.palettes
    : [];
  if (!palettes.length || palettes.length > MAX_PALETTES_PER_UPLOAD)
    return syncError(
      400,
      'INVALID_REQUEST',
      `Send 1 to ${MAX_PALETTES_PER_UPLOAD} palettes`,
    );

  const results: PaletteUploadResult[] = [];
  for (const item of palettes) {
    const id = (item as { id?: unknown })?.id;
    if (typeof id !== 'string' || !isProjectId(id)) continue;
    const input = parsePaletteInput(item);
    if (!input.ok) {
      results.push({ id, error: 'INVALID_REQUEST' });
      continue;
    }
    const result = await store.savePalette(
      sync.db,
      sync.userId,
      id,
      input.value,
    );
    results.push(
      result.status === 'quota'
        ? { id, error: 'QUOTA_EXCEEDED' }
        : { id, palette: result.palette, applied: result.status === 'saved' },
    );
  }

  cleanUpAfterWrite(sync);
  return Response.json(
    { results },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
