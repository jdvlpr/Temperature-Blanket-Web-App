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

// Dev only: marks the signed-in account's Ravelry access token expired, so the
// next Ravelry call has to refresh it (tokens otherwise last 24 hours).

import { requireDevRoutes } from '#lib/server/platform.js';
import type { RequestHandler } from './$types';
import { getPlatform } from '#lib/server/cloudflare.js';

export const prerender = false;

export const POST: RequestHandler = async (event) => {
  requireDevRoutes(getPlatform());
  const { requireRavelry, NO_STORE } =
    await import('#lib/server/ravelry/index.js');
  const ctx = await requireRavelry(event);
  if (ctx instanceof Response) return ctx;
  const { meta } = await ctx.db
    .prepare(
      `update "account" set "accessTokenExpiresAt" = ? where "userId" = ? and "providerId" = 'ravelry'`,
    )
    .bind(new Date(Date.now() - 60_000).toISOString(), ctx.userId)
    .run();
  return Response.json({ expired: meta.changes }, { headers: NO_STORE });
};
