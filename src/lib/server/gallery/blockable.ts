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

import { getPlatform } from '#lib/server/cloudflare.js';

/** Whether the page was published from an account, so its publisher can be blocked. */
export async function getBlockable(id: number): Promise<boolean> {
  const env = getPlatform()?.env;
  if (env?.ACCOUNTS_ENABLED !== 'true' || !env.DB || !Number.isSafeInteger(id))
    return false;
  try {
    const { postHasPublisher } = await import('#lib/server/gallery/store.js');
    return await postHasPublisher(env.DB, id);
  } catch (e) {
    console.error('Could not look up gallery page publisher', e);
    return false;
  }
}
