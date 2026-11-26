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

// An owner's public gallery for the iPhone app, as /gallery/by/<id> lists it:
// { name, postIds, paletteIds } (the pages they included on it; the app reads
// each page from the gallery). Public, like that page; 404 when there's no
// such owner, or without accounts.

import { getPlatform } from '#lib/server/cloudflare.js';
import type { RequestHandler } from './$types';

export const prerender = false;

// As the owner's page: more than anyone is likely to publish
const MAX_PAGES = 100;

export const GET: RequestHandler = async ({ params }) => {
  const env = getPlatform()?.env;
  const { ownerPage, PUBLIC_ID_PATTERN } =
    await import('#lib/server/gallery/store.js');
  if (
    env?.ACCOUNTS_ENABLED !== 'true' ||
    !env.DB ||
    !PUBLIC_ID_PATTERN.test(params.ownerId)
  )
    return Response.json({ message: 'Not found' }, { status: 404 });

  const owner = await ownerPage(env.DB, params.ownerId);
  if (!owner) return Response.json({ message: 'Not found' }, { status: 404 });

  return Response.json(
    {
      name: owner.name,
      postIds: owner.postIds.slice(0, MAX_PAGES),
      paletteIds: owner.paletteIds.slice(0, MAX_PAGES),
    },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
};
