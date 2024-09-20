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
import { ALL_COLORWAYS, ALL_YARN_WEIGHTS } from '$lib/constants';
import { error, json } from '@sveltejs/kit';
import chroma from 'chroma-js';

export async function GET({ url, params, request }) {
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

  const { searchParams } = url;
  let { color } = params;
  color = decodeURIComponent(color);

  if (!color || !chroma.valid(color))
    return error(400, {
      message: "Parameter 'color' is not a valid color",
    });

  let colorways = ALL_COLORWAYS;

  if (searchParams.has('brand')) {
    let brand = searchParams.get('brand');
    if (!brand)
      return error(400, {
        message: "Parameter 'brand' is empty",
      });

    brand = decodeURIComponent(brand).toLowerCase();
    if (brand?.includes(',')) {
      let brands = brand.split(',');
      colorways = colorways.filter(
        (colorway) =>
          brands.includes(colorway.brandId) ||
          brands.includes(colorway.brandName.toLowerCase()),
      );
    } else
      colorways = colorways.filter(
        (colorway) =>
          colorway.brandId.toLowerCase() === brand ||
          colorway.brandName.toLowerCase() === brand,
      );
  }

  if (searchParams.has('yarn')) {
    let yarn = searchParams.get('yarn');
    if (!yarn)
      return error(400, {
        message: "Parameter 'yarn' is empty",
      });
    yarn = decodeURIComponent(yarn).toLowerCase();
    if (yarn?.includes(',')) {
      const yarns = yarn.split(',');
      colorways = colorways.filter(
        (colorway) =>
          yarns.includes(colorway.yarnId) ||
          yarns.includes(colorway.yarnName.toLowerCase()),
      );
    } else
      colorways = colorways.filter(
        (colorway) =>
          colorway.yarnId.toLowerCase() === yarn ||
          colorway.yarnName.toLowerCase() === yarn,
      );
  }

  if (searchParams.has('weight')) {
    let weight = searchParams.get('weight');
    if (!weight)
      return error(400, {
        message: "Parameter 'weight' is empty",
      });

    const yarnWeightIds = ALL_YARN_WEIGHTS.map((n) => n.id);
    const yarnWeightNames = ALL_YARN_WEIGHTS.map((n) => n.name.toLowerCase());

    if (yarnWeightIds.includes(weight)) {
      colorways = colorways.filter(
        (colorway) => colorway.yarnWeightId === weight,
      );
    } else if (yarnWeightNames.includes(weight.toLowerCase())) {
      colorways = colorways.filter((colorway) => {
        const yarnWeightId = ALL_YARN_WEIGHTS.find(
          (n) => n.name.toLowerCase() === weight.toLowerCase(),
        )?.id;
        return colorway.yarnWeightId === yarnWeightId;
      });
    } else {
      return error(400, {
        message: "Parameter 'weight' is not a valid yarn weight",
      });
    }
  }

  const hex = chroma(color).hex();
  colorways = colorways
    .map((n) => {
      const delta = chroma.deltaE(hex, n.hex);
      return {
        ...n,
        delta,
        percentMatch: Math.floor(100 - delta),
      };
    })
    .sort((a, b) => a.delta - b.delta);

  // Default threshold value is 75
  let threshold = 75;
  if (searchParams.has('threshold')) {
    threshold = Number(searchParams.get('threshold'));
    if (isNaN(threshold))
      return error(400, {
        message: "Parameter 'threshold' must be a number",
      });
  }

  colorways = colorways.filter(
    (colorway) => colorway.percentMatch >= threshold,
  );

  const numberOfResults = colorways.length;

  let offset = 0; // maximum 500
  if (searchParams.has('offset')) {
    offset = Number(searchParams.get('offset'));
    if (isNaN(offset))
      return error(400, {
        message: "Parameter 'offset' must be a number",
      });
  }

  colorways = colorways.slice(offset);

  let limit = 50; // default number of results is 50, maximum is 500
  if (searchParams.has('limit')) {
    limit = Number(searchParams.get('limit'));
    if (isNaN(limit))
      return error(400, {
        message: "Parameter 'limit' must be a number",
      });
    if (limit > 500)
      return error(400, {
        message: "Parameter 'limit' must be less than 501",
      });
  }
  if (colorways.length > limit) colorways.length = limit;

  return json({
    meta: {
      limit,
      offset,
      total: numberOfResults,
    },
    data: colorways,
  });
}
