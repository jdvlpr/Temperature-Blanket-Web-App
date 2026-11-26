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

import { isHttpError } from '@sveltejs/kit';
import { describe, expect, it } from 'vitest';
import { DEFAULT_LIMIT, MAX_LIMIT, readLimit } from './yarn-colorways-api';

const limitOf = (query: string) => readLimit(new URLSearchParams(query));

function statusOf(query: string) {
  try {
    limitOf(query);
  } catch (e) {
    if (isHttpError(e)) return e.status;
    throw e;
  }
}

describe('readLimit', () => {
  it('defaults to 50 and allows up to 250', () => {
    expect(DEFAULT_LIMIT).toBe(50);
    expect(MAX_LIMIT).toBe(250);
    expect(limitOf('')).toBe(50);
    expect(limitOf('limit=0')).toBe(0); // just the total, as before
    expect(limitOf('limit=1')).toBe(1);
    expect(limitOf('limit=250')).toBe(250);
  });

  it('turns away anything else with a 400', () => {
    for (const bad of ['251', '500', '-5', '2.5', 'abc', 'Infinity'])
      expect(statusOf(`limit=${bad}`)).toBe(400);
  });
});
