// Copyright (c) 2026, Thomas (https://github.com/jdvlpr)
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

// POST { blockedPostIds?: number[] }: the gallery pages this person blocked,
// as { postIds }, for leaving them out of the gallery, the globe and Popular
// (which come straight from WordPress). Signed in, from the account's blocks;
// a guest sends the pages they blocked from (kept on their device). Never says
// who published a page. Private: every person's answer is their own.

import type { RequestHandler } from './$types';

export const prerender = false;

const PRIVATE = { 'Cache-Control': 'private, no-store' };

export const POST: RequestHandler = async (event) => {
  const { getPlatform } = await import('#lib/server/cloudflare.js');
  const env = getPlatform()?.env;
  const body = await event.request.json().catch(() => null);
  const guestPostIds = Array.isArray(body?.blockedPostIds)
    ? (body.blockedPostIds as unknown[]).filter(
        (id): id is number =>
          typeof id === 'number' && Number.isSafeInteger(id) && id > 0,
      )
    : [];
  if (!env?.DB || env.ACCOUNTS_ENABLED !== 'true')
    return Response.json({ postIds: [] }, { headers: PRIVATE });

  const { optionalAccount } = await import('#lib/server/auth/index.js');
  const user = await optionalAccount(event);
  if (!user && !guestPostIds.length)
    return Response.json({ postIds: [] }, { headers: PRIVATE });
  const { hiddenPostIds } = await import('#lib/server/gallery/blocks.js');
  const postIds = await hiddenPostIds(env.DB, {
    userId: user?.id,
    guestPostIds,
  });
  return Response.json({ postIds }, { headers: PRIVATE });
};
