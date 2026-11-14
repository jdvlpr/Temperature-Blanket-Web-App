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

/**
 * Yarn ids that once held a dash, by brand id, mapped to their id now.
 * Brand and yarn ids never hold a dash, since links and palette codes join
 * them as `brandId-yarnId` (`colorways.svelte.test.ts` checks). Links, palette
 * codes and saved settings made before a rename still carry the old id.
 * Never remove an entry. The gallery plugin mirrors this list
 * (`tempblanket_legacy_yarn_ids()`); add to both when renaming one.
 */
export const LEGACY_YARN_IDS: Record<string, Record<string, string>> = {
  drops: { 'baby-merino': 'baby_merino' },
  herrschners: { 'worsted-8': 'worsted_8' },
  loops_and_threads: {
    'luxe-merino': 'luxe_merino',
    'superwash-merino': 'superwash_merino',
  },
};

/** A yarn id as it is now, given one that may be from before a rename. */
export const currentYarnId = (brandId: string, yarnId: string): string =>
  LEGACY_YARN_IDS[brandId]?.[yarnId] ?? yarnId;
