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
import { ALL_COLORWAYS } from '$lib/constants';
import { sortColorsByName, sortColorsLightToDark } from '$lib/utils.js';
import { error, json } from '@sveltejs/kit';
import chroma from 'chroma-js';

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

  const { searchParams } = url;

  let colorways = ALL_COLORWAYS;

  if (searchParams.has('brand')) {
    let brand = searchParams.get('brand');
    if (!brand) return error(400);
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
    if (!yarn) return error(400);
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

  if (searchParams.has('color')) {
    const color = searchParams.get('color');
    if (!color) return error(400);
    if (!chroma.valid(color))
      return error(400, {
        message: "Parameter 'color' is not a valid color",
      });
    const hex = chroma(color).hex();
    colorways = colorways.filter((colorway) => colorway.hex === hex);
  }

  if (searchParams.has('name')) {
    const name = searchParams.get('name');
    colorways = colorways.filter(
      (colorway) => colorway.name.toLowerCase() === name?.toLowerCase(),
    );
  }

  const numberOfResults = colorways.length;

  if (searchParams.has('sortBy')) {
    const sortBy = searchParams.get('sortBy');
    const sortByOptions = ['default', 'lightness', 'name'];
    if (sortBy === null || !sortByOptions.includes(sortBy))
      return error(400, {
        message: "Parameter 'sortBy' must be 'default', 'lightness', or 'name'",
      });
    if (sortBy === 'lightness')
      colorways = sortColorsLightToDark({
        colors: colorways,
      });
    if (sortBy === 'name') colorways = sortColorsByName({ colors: colorways });
  }

  if (searchParams.has('direction')) {
    const direction = searchParams.get('direction');
    const directionOptions = ['ASC', 'DESC'];
    if (direction === null || !directionOptions.includes(direction))
      return error(400, {
        message: "Parameter 'direction' must be 'ASC' or 'DESC'",
      });
    if (direction === 'DESC') colorways.reverse();
  }

  let offset = 0; // maximum 500
  if (searchParams.has('offset')) {
    offset = Number(searchParams.get('offset'));
    if (isNaN(offset))
      return error(400, {
        message: "Parameter 'offset' must be a number",
      });
  }
  colorways = colorways.slice(offset);

  let limit = 50; // maximum 499
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
