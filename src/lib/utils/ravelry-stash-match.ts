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

// Matches Ravelry stash entries (brand, yarn and colorway names) to the app's
// yarn data, for their colors. Ravelry's names are typed by people, so it's
// forgiving: accents, case and punctuation don't count, and a colorway can be
// written with its code ("640-402 Wheat").

import type { Color } from '#lib/types/yarn-types.js';

export const normalizeName = (text: string | null | undefined) =>
  (text ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const sameOrWithin = (a: string, b: string) =>
  !!a &&
  !!b &&
  (a === b || ` ${a} `.includes(` ${b} `) || ` ${b} `.includes(` ${a} `));

export type StashNames = { brand: string; yarn: string; colorway: string };

export type StashMatch = {
  color: Color;
  /** exact: brand, yarn and colorway; close: the colorway written differently,
  or the yarn not named alike */
  quality: 'exact' | 'close';
};

/** A lookup over the app's colorways (getColorwaysWithAffiliateLinks()). */
export function stashMatcher(colorways: Color[]) {
  const byBrand = new Map<string, Color[]>();
  for (const color of colorways) {
    const brand = normalizeName(color.brandName);
    if (!brand) continue;
    let list = byBrand.get(brand);
    if (!list) byBrand.set(brand, (list = []));
    list.push(color);
  }

  return function match(entry: StashNames): StashMatch | null {
    const brand = normalizeName(entry.brand);
    const yarn = normalizeName(entry.yarn);
    const colorway = normalizeName(entry.colorway);
    if (!brand || !colorway) return null;

    const candidates = [...byBrand.entries()]
      .filter(([name]) => sameOrWithin(name, brand))
      .flatMap(([, colors]) => colors);
    if (!candidates.length) return null;

    const yarnAlike = (c: Color) =>
      sameOrWithin(normalizeName(c.yarnName), yarn);
    const colorwayIs = (c: Color) => normalizeName(c.name) === colorway;
    // Within the stash's name ("640 402 wheat" has "wheat"); short names don't count
    const colorwayWithin = (c: Color) => {
      const name = normalizeName(c.name);
      return name.length >= 3 && sameOrWithin(name, colorway);
    };

    const exact = candidates.find((c) => yarnAlike(c) && colorwayIs(c));
    if (exact) return { color: exact, quality: 'exact' };
    const close =
      candidates.find((c) => yarnAlike(c) && colorwayWithin(c)) ??
      (!yarn ? candidates.find(colorwayIs) : undefined);
    return close ? { color: close, quality: 'close' } : null;
  };
}
