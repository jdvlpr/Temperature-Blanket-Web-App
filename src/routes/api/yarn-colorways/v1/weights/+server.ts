// Copyright (c) 2024, Thomas (https://github.com/jdvlpr)
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

import { dev } from '$app/environment';
import { SECRET_RAPID_API_PROXY_HEADER_KEY } from '$env/static/private';
import { ALL_YARN_WEIGHTS } from '$lib/constants.js';
import { brands } from '$lib/data/yarns/brands.js';
import { error, json } from '@sveltejs/kit';

export async function GET({ url, request }) {
  if (!dev) {
    const { headers } = request;
    if (!headers.has('X-RapidAPI-Proxy-Secret'))
      return error(401, { message: 'Not authorized' });
    if (
      headers.get('X-RapidAPI-Proxy-Secret') !==
      SECRET_RAPID_API_PROXY_HEADER_KEY
    )
      return error(401, { message: 'Not authorized' });
  }

  const results = ALL_YARN_WEIGHTS.map((weight) => {
    const yarns = brands
      .flatMap((brand) => brand.yarns)
      .filter((yarn) => {
        if (!yarn.weightId) return false;
        return yarn.weightId === weight.id;
      }).length;
    return {
      ...weight,
      yarns,
    };
  });

  return json({
    meta: {
      total: results.length,
    },
    data: results,
  });
}
