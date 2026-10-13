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

import { describe, expect, it } from 'vitest';
import { getColorsFromInput } from '#lib/utils/color-utils.js';
import {
  withoutVersion,
  withoutWww,
  yarnLinkSearch,
  yarnLinksOf,
} from './gallery-link-utils';
import { postsWithColors } from './gallery-match-utils';

const link = (s: string) => `https://temperature-blanket.com/yarn?s=${s}`;
const colorsOf = (s: string) => getColorsFromInput({ string: link(s) }) || [];
const post = (
  databaseId: number,
  s: string,
  extra: { date?: string; sourceProjectId?: number | null } = {},
) => ({
  databaseId,
  yarnUrls: JSON.stringify([link(s)]),
  ...extra,
});

describe('cleaning links', () => {
  it('drops only v=', () => {
    expect(withoutVersion('https://x.com/yarn?v=6.3.2&s=aa&f=b(0)')).toBe(
      'https://x.com/yarn?s=aa&f=b(0)',
    );
    expect(withoutVersion('https://x.com/yarn?s=aa&v')).toBe(
      'https://x.com/yarn?s=aa',
    );
    expect(withoutVersion('https://x.com/yarn')).toBe('https://x.com/yarn');
  });

  it('drops www.', () => {
    expect(withoutWww('https://www.temperature-blanket.com/yarn?s=aa')).toBe(
      'https://temperature-blanket.com/yarn?s=aa',
    );
  });

  it('searches for the query, without v= or www.', () => {
    expect(
      yarnLinkSearch(
        'https://www.temperature-blanket.com/yarn?v=6.0&s=aabbcc&f=x(0)',
      ),
    ).toBe('s=aabbcc&f=x(0)');
    expect(yarnLinkSearch('https://temperature-blanket.com/yarn')).toBeNull();
  });

  it('reads yarnUrls, or none', () => {
    expect(yarnLinksOf('["a","b"]')).toEqual(['a', 'b']);
    expect(yarnLinksOf('not json')).toEqual([]);
    expect(yarnLinksOf(null)).toEqual([]);
  });
});

describe('postsWithColors', () => {
  const colors = colorsOf('aaaaaabbbbbb');

  it('leaves out a post whose link only contains the search', () => {
    // "s=aaaaaabbbbbb" is part of "s=aaaaaabbbbbbcccccc": the gallery's search
    // finds it, but its colors differ
    const found = postsWithColors(colors, [
      post(1, 'aaaaaabbbbbbcccccc'),
      post(2, 'aaaaaabbbbbb'),
    ]);
    expect(found.map((p) => p.databaseId)).toEqual([2]);
  });

  it('puts the source project’s page first, then the oldest', () => {
    const found = postsWithColors(
      colors,
      [
        post(3, 'aaaaaabbbbbb', { date: '2026-01-02T00:00:00' }),
        post(4, 'aaaaaabbbbbb', { date: '2026-01-01T00:00:00' }),
        post(5, 'aaaaaabbbbbb', {
          date: '2026-02-01T00:00:00',
          sourceProjectId: 99,
        }),
      ],
      99,
    );
    expect(found.map((p) => p.databaseId)).toEqual([5, 4, 3]);
  });

  it('finds a post holding the colors in any of its links', () => {
    const found = postsWithColors(colors, [
      {
        databaseId: 6,
        yarnUrls: JSON.stringify([link('cccccc'), link('aaaaaabbbbbb')]),
      },
    ]);
    expect(found).toHaveLength(1);
  });

  it('finds nothing for no colors', () => {
    expect(postsWithColors([], [post(1, 'aaaaaa')])).toEqual([]);
  });
});
