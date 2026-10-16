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
// Dev only: brings changes made on Ravelry here now (photos, notes, yarns,
// deleted projects), instead of at most every few hours when My Projects is
// opened. Reload My Projects or the gallery page afterwards to see them.

import { requireDevRoutes } from '#lib/server/platform.js';
import type { RequestHandler } from './$types';
import { getPlatform } from '#lib/server/cloudflare.js';

export const prerender = false;

export const POST: RequestHandler = async (event) => {
  requireDevRoutes(getPlatform());
  const { withRavelry, NO_STORE } =
    await import('#lib/server/ravelry/index.js');
  const { syncLinks } = await import('#lib/server/ravelry/sync.js');
  return withRavelry(event, async (session) =>
    Response.json(
      { changed: await syncLinks(session, { force: true }) },
      { headers: NO_STORE },
    ),
  );
};
