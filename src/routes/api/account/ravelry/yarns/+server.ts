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

/** Ravelry yarns matching ?q= (a TB brand and yarn), for confirming a match. */
export const GET: RequestHandler = async (event) => {
  const { withRavelry, ravelryError, NO_STORE } =
    await import('#lib/server/ravelry/index.js');
  const query = (event.url.searchParams.get('q') ?? '').trim().slice(0, 120);
  if (!query)
    return ravelryError(400, 'INVALID_REQUEST', 'Nothing to search for');
  return withRavelry(event, async ({ api }) => {
    const yarns = await api.yarnSearch(query);
    return Response.json(
      {
        yarns: yarns.map((yarn) => ({
          id: yarn.id,
          name: yarn.name,
          company: yarn.yarn_company_name ?? '',
          weight: yarn.yarn_weight?.name ?? '',
          discontinued: !!yarn.discontinued,
          photoUrl: yarn.first_photo?.square_url ?? null,
        })),
      },
      { headers: NO_STORE },
    );
  });
};
