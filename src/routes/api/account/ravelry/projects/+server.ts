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

export const prerender = false;

/** At most this many linked projects' photos are read again per listing */
const REFRESH_PER_LIST = 3;
const REFRESH_AFTER = 24 * 60 * 60 * 1000;

/**
 * The account's projects linked to Ravelry, with their kept photos. Afterwards,
 * in the background, the photos of the few read longest ago (over a day) are
 * read from Ravelry again, so ones added there show here and on gallery pages.
 */
export const GET: RequestHandler = async (event) => {
  const { requireRavelry, ravelrySession, NO_STORE } =
    await import('#lib/server/ravelry/index.js');
  const { refreshPhotos } = await import('#lib/server/ravelry/photos.js');
  const { getPlatform } = await import('#lib/server/cloudflare.js');
  const { listProjectLinks, listPhotos, linkForClient } =
    await import('#lib/server/ravelry/store.js');
  const ctx = await requireRavelry(event);
  if (ctx instanceof Response) return ctx;
  const links = await listProjectLinks(ctx.db, ctx.userId);
  const projects = await Promise.all(
    links.map(async (link) =>
      linkForClient(link, await listPhotos(ctx.db, ctx.userId, link.projectId)),
    ),
  );

  const now = Date.now();
  const stale = links
    .filter((link) => (link.photosRefreshedAt ?? 0) < now - REFRESH_AFTER)
    .sort((a, b) => (a.photosRefreshedAt ?? 0) - (b.photosRefreshedAt ?? 0))
    .slice(0, REFRESH_PER_LIST);
  const waitUntil = getPlatform()?.ctx?.waitUntil;
  if (stale.length && waitUntil)
    waitUntil(
      (async () => {
        // Reconnecting, Ravelry down, or a project gone there: the kept
        // photos stay
        const session = await ravelrySession(ctx).catch(() => null);
        if (!session) return;
        for (const link of stale)
          await refreshPhotos(session, link).catch((e) =>
            console.error('Could not refresh Ravelry photos', e),
          );
      })(),
    );
  return Response.json({ projects }, { headers: NO_STORE });
};
