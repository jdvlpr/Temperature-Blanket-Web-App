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

// The Yarn Colorways API's `limit` parameter: how many colorways one
// response can hold (/colorways and /match, v1 and v3). The plans on RapidAPI
// promise this maximum, and the API docs (/api/yarn-colorways) state it.

import { error } from '@sveltejs/kit';

export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 250;

/** The `limit` asked for, or the default; a 400 when it isn't 1–250 */
export function readLimit(searchParams: URLSearchParams): number {
  if (!searchParams.has('limit')) return DEFAULT_LIMIT;
  const limit = Number(searchParams.get('limit'));
  if (isNaN(limit)) error(400, "Parameter 'limit' must be a number");
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT)
    error(
      400,
      `Parameter 'limit' must be a whole number from 1 to ${MAX_LIMIT}`,
    );
  return limit;
}
