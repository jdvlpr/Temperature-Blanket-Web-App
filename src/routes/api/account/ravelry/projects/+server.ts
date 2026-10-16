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

/**
 * The account's projects linked to Ravelry, with their kept photos. Afterwards,
 * in the background, changes made on Ravelry are brought here (at most every
 * few hours, and only the projects that changed: see syncLinks), so the next
 * look shows them, here and on gallery pages.
 */
export const GET: RequestHandler = async (event) => {
  const { requireRavelry, ravelrySession, NO_STORE } =
    await import('#lib/server/ravelry/index.js');
  const { syncLinks } = await import('#lib/server/ravelry/sync.js');
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

  const waitUntil = getPlatform()?.ctx?.waitUntil;
  if (links.length && waitUntil)
    waitUntil(
      (async () => {
        // Reconnecting or Ravelry down: what's kept stays, and it's tried on a later look
        const session = await ravelrySession(ctx).catch(() => null);
        if (!session) return;
        await syncLinks(session).catch((e) =>
          console.error('Could not bring Ravelry changes here', e),
        );
      })(),
    );
  return Response.json({ projects }, { headers: NO_STORE });
};
