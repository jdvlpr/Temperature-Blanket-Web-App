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

// Who published each of a page of gallery cards (GET ?ids=1,2,3, at most
// 100): { owners: { [postId]: { name, publicId } } }, only for pages showing
// their owner's name, as their gallery pages do. Public, like those pages;
// empty without accounts.

import { json } from '@sveltejs/kit';
import { getPlatform } from '#lib/server/cloudflare.js';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async ({ url }) => {
  const ids = (url.searchParams.get('ids') ?? '')
    .split(',')
    .map(Number)
    .filter((id) => Number.isSafeInteger(id) && id > 0)
    .slice(0, 100);
  const env = getPlatform()?.env;
  let owners = {};
  if (ids.length && env?.ACCOUNTS_ENABLED === 'true' && env.DB) {
    try {
      const { ownersForPosts } = await import('#lib/server/gallery/store.js');
      owners = await ownersForPosts(env.DB, ids);
    } catch (e) {
      // D1 unavailable: cards show without names
      console.error('Could not look up gallery card owners', e);
    }
  }
  // A rename shows on cards within a few minutes
  return json(
    { owners },
    { headers: { 'Cache-Control': 'public, max-age=300' } },
  );
};
