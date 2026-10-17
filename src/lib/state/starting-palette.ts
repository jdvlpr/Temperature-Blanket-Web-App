// Copyright (c) 2026, Thomas (https://github.com/jdvlpr)
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

// A new project started from a palette (the Yarn page's Start a Project with
// It): its link has the palette, as the Yarn page's own link, in ?palette=.
// It's taken from the address once, so a reload doesn't use it again, and goes
// on the Temperature gauge when that's made, after the weather comes in.

import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
import type { Color } from '#lib/types/yarn-types.js';
import { getColorsFromInput } from '#lib/utils/color-utils.js';

export const STARTING_PALETTE_PARAM = 'palette';

/** Colors waiting for the new project's Temperature gauge */
export const startingPalette: { colors: Color[] | null } = { colors: null };

/** The planner's search for a new project with the colors of a full Yarn page link */
export const startingPaletteSearch = (yarnPageLink: string) =>
  `?${STARTING_PALETTE_PARAM}=${encodeURIComponent(yarnPageLink)}`;

/** Takes the palette from the address, if the link has one */
export async function takeStartingPalette() {
  const url = new URL(window.location.href);
  const link = url.searchParams.get(STARTING_PALETTE_PARAM);
  if (link === null) return;
  url.searchParams.delete(STARTING_PALETTE_PARAM);
  history.replaceState(history.state, '', url);
  await ensureYarnData();
  const colors = getColorsFromInput({ string: link });
  startingPalette.colors = colors && colors.length ? colors : null;
}

/** The palette waiting, once: the Temperature gauge was just made */
export function useStartingPalette() {
  const colors = startingPalette.colors;
  startingPalette.colors = null;
  return colors;
}
