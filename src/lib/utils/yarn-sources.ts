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

// Yarn Sources: where each yarn's colors came from, by brand, for the Yarn
// Sources help (a dialog, and inline on Data Sources & Credits)

import type { Brand, Yarn } from '#lib/types/yarn-types.js';
import { matchesSearch } from '#lib/utils/collection-filter.js';

/** The search that shows just this yarn (or brand) in Yarn Sources */
export function yarnSourcesSearch(
  brandName: string | null | undefined,
  yarnName?: string | null,
): string {
  return [brandName, yarnName].filter(Boolean).join(' ');
}

/** Whether none of a yarn's colorway links work anymore */
export function isYarnUnavailable(yarn: Yarn): boolean {
  return yarn.colorways.every((colorway) => !!colorway.source?.unavailable);
}

/**
 * The brands with the yarns matching the search: every word in the brand's
 * name, the yarn's or a site its colors came from. A brand whose name
 * matches keeps all its yarns. No search keeps every brand.
 */
export function yarnSourceGroups(brands: readonly Brand[], search: string) {
  return brands
    .map((brand) => ({
      ...brand,
      yarns: brand.yarns.filter((yarn) =>
        matchesSearch(search, [
          brand.name,
          yarn.name,
          ...yarn.colorways.map((colorway) => colorway.source?.name),
        ]),
      ),
    }))
    .filter((brand) => brand.yarns.length);
}
