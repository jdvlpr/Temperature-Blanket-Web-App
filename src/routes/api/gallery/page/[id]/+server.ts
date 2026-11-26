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

// What a project's gallery page shows from the app's own database, for the
// iPhone app (the website's page reads the same in its server load):
// { owner, made, ravelry }. `owner` is { name, publicId } when the page shows
// its owner's name; `made` how much is made (percent) when its owner shows
// that; `ravelry` its Ravelry project's link, kept photos and notes, only on a
// page showing its owner (they name the owner's Ravelry account). Public, like
// the page; each is null without accounts or when it can't be looked up.

import { getPlatform } from '#lib/server/cloudflare.js';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id < 1)
    return Response.json({ message: 'Invalid gallery page' }, { status: 400 });

  const env = getPlatform()?.env;
  const answer: {
    owner: { name: string; publicId: string } | null;
    made: number | null;
    ravelry: Awaited<
      ReturnType<
        typeof import('#lib/server/ravelry/store.js').photosForGalleryPost
      >
    >;
  } = { owner: null, made: null, ravelry: null };

  if (env?.ACCOUNTS_ENABLED === 'true' && env.DB) {
    const { ownerForPost, madeForPost } =
      await import('#lib/server/gallery/store.js');
    const [owner, made] = await Promise.all([
      ownerForPost(env.DB, id).catch((e) => {
        console.error('Could not look up gallery page owner', e);
        return null;
      }),
      madeForPost(env.DB, id).catch((e) => {
        console.error('Could not look up gallery page progress', e);
        return null;
      }),
    ]);
    answer.owner = owner;
    answer.made = made;
    if (owner) {
      try {
        const { photosForGalleryPost } =
          await import('#lib/server/ravelry/store.js');
        const found = await photosForGalleryPost(env.DB, id);
        answer.ravelry = found?.photos.length || found?.notes ? found : null;
      } catch (e) {
        console.error('Could not look up Ravelry photos', e);
      }
    }
  }

  // A rename or new photos show within a minute
  return Response.json(answer, {
    headers: { 'Cache-Control': 'public, max-age=60' },
  });
};
