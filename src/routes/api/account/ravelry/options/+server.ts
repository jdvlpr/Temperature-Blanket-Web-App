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

import type { RequestHandler } from './$types';
import type { RavelryNamed } from '#lib/server/ravelry/api.js';

export const prerender = false;

// The same for everyone, and rarely changed: kept for the isolate's life
let cached: { crafts: RavelryNamed[]; statuses: RavelryNamed[] } | undefined;

/** Ravelry's crafts and project statuses, for the Post dialog. */
export const GET: RequestHandler = async (event) => {
  const { withRavelry, NO_STORE } =
    await import('#lib/server/ravelry/index.js');
  return withRavelry(event, async ({ api }) => {
    cached ??= await Promise.all([api.crafts(), api.projectStatuses()]).then(
      ([crafts, statuses]) => ({ crafts, statuses }),
    );
    return Response.json(cached, { headers: NO_STORE });
  });
};
