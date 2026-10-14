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

// An owner's public gallery: those pages they included on it. The lists come
// from D1; each page asks the gallery for its own kind.

import { error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { getPlatform } from '#lib/server/cloudflare.js';
import { MAX_PAGES } from './owner-gallery.js';

export const prerender = false;

export const load: LayoutServerLoad = async (event) => {
  const env = getPlatform()?.env;
  const { ownerPage, PUBLIC_ID_PATTERN } =
    await import('#lib/server/gallery/store.js');
  if (
    env?.ACCOUNTS_ENABLED !== 'true' ||
    !env.DB ||
    !PUBLIC_ID_PATTERN.test(event.params.ownerId)
  )
    error(404, 'Not found');

  const owner = await ownerPage(env.DB, event.params.ownerId);
  if (!owner) error(404, 'Not found');

  return {
    name: owner.name,
    postIds: owner.postIds.slice(0, MAX_PAGES),
    paletteIds: owner.paletteIds.slice(0, MAX_PAGES),
  };
};
