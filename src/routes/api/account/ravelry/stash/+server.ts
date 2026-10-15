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

const MAX_PAGES = 5;

/** The account's Ravelry stash: one entry per stashed yarn and colorway. */
export const GET: RequestHandler = async (event) => {
  const { withRavelry, NO_STORE } =
    await import('#lib/server/ravelry/index.js');
  return withRavelry(event, async ({ api, username }) => {
    const entries = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const result = await api.stash(username, page);
      entries.push(...result.stash);
      if (!result.paginator || page >= result.paginator.page_count) break;
    }
    return Response.json(
      {
        stash: entries.map((entry) => ({
          id: entry.id,
          brand: entry.yarn?.yarn_company_name ?? '',
          yarn: entry.yarn?.name ?? entry.name ?? '',
          colorway: entry.colorway_name ?? '',
          colorFamily: entry.color_family_name ?? '',
          weight:
            entry.yarn?.yarn_weight?.name ??
            entry.personal_yarn_weight?.name ??
            '',
          ravelryYarnId: entry.yarn?.id ?? null,
          photo: entry.first_photo
            ? {
                small: entry.first_photo.small_url ?? null,
                medium: entry.first_photo.medium_url ?? null,
              }
            : null,
          url: `https://www.ravelry.com/people/${encodeURIComponent(username)}/stash/${encodeURIComponent(entry.permalink)}`,
        })),
      },
      { headers: NO_STORE },
    );
  });
};
