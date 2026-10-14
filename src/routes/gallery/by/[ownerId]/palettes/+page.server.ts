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

// The owner's yarn palettes.

import type { PageServerLoad } from './$types';
import { fetchPalettes, type OwnerPalette } from '../owner-gallery.js';

export const prerender = false;

export const load: PageServerLoad = async ({ parent }) => {
  const { paletteIds } = await parent();
  // Asked for only with IDs: an empty `in` matches everything
  return {
    palettes: paletteIds.length
      ? await fetchPalettes(paletteIds)
      : ([] as OwnerPalette[]),
  };
};
