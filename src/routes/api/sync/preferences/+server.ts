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

// Saving preferences to the account (see $lib/sync/preferences). Each one is
// taken in only if it's newer than the account's; they come back to devices in
// the changes feed.

import { parsePreferencesUpload } from '$lib/sync/preferences';
import type { RequestHandler } from './$types';

export const prerender = false;

export const PUT: RequestHandler = async (event) => {
  const { requireSync, syncError, cleanUpAfterWrite } =
    await import('$lib/server/sync');
  const { savePreferences } = await import('$lib/server/sync/store');

  const sync = await requireSync(event);
  if (sync instanceof Response) return sync;

  const body = await event.request.json().catch(() => null);
  const upload = parsePreferencesUpload(body?.preferences, Date.now());
  if (!upload) return syncError(400, 'INVALID_REQUEST', 'No valid preferences');

  const preferences = await savePreferences(sync.db, sync.userId, upload);

  cleanUpAfterWrite(sync);
  return Response.json(
    { preferences },
    { headers: { 'Cache-Control': 'no-store' } },
  );
};
