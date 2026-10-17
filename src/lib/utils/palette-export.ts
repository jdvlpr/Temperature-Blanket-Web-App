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

// A palette's exports: an image, color codes, or its yarn colorway names.
// From the Yarn page's Palette menu (Download) and the planner's Project menu,
// whose Palettes group has a screen of them for each gauge.

import ExportPaletteImage from '#lib/components/modals/ExportPaletteImage.svelte';
import ImportExportPalette from '#lib/components/modals/ImportExportPalette.svelte';
import type { PaletteImageRange } from '#lib/features/palette-image/layout.js';
import { dialog } from '#lib/state/page-state.svelte.js';
import { preferences } from '#lib/storage/preferences.svelte.js';
import type { Color } from '#lib/types/yarn-types.js';
import { getPaletteFallbackName } from '#lib/utils/color-utils.js';

export type PaletteExport = 'image' | 'html' | 'colorway';

export const PALETTE_EXPORT_TITLES: Record<PaletteExport, string> = {
  image: 'Palette Image',
  html: 'Color Codes',
  colorway: 'Yarn Colorway Names',
};

/** Colorway names can only be copied when some colors are yarn colorways */
export const hasColorwayNames = (colors: Color[]) =>
  colors.some((color) => color.name);

interface RangedGauge {
  ranges?: { label?: string; from?: number; to?: number }[];
  unit: {
    type: string;
    label?: Record<string, string>;
  };
}

/** Each color's range, as a project's gauge shows it, like 50 → 59 °F */
export function getGaugeRangeLabels(
  gauge: RangedGauge,
): PaletteImageRange[] | undefined {
  if (!gauge.ranges?.length) return undefined;
  const unit = gauge.unit.label?.[preferences.value.units ?? 'metric'] ?? '';
  return gauge.ranges.map((range) =>
    gauge.unit.type === 'category' || range.label
      ? { label: range.label ?? '' }
      : {
          from: range.from ?? 0,
          to: range.to ?? 0,
          unit,
          raised: gauge.unit.type === 'temperature',
        },
  );
}

/** Opens one; from a side panel's screen, in its place, with Back to it */
export function openPaletteExport(
  type: PaletteExport,
  {
    colors,
    ranges,
    name,
  }: {
    colors: Color[];
    ranges?: PaletteImageRange[];
    /** The palette's title, if it has one */
    name?: string;
  },
) {
  const title = PALETTE_EXPORT_TITLES[type];
  if (type === 'image') {
    dialog.trigger({
      type: 'component',
      component: {
        ref: ExportPaletteImage,
        props: {
          colors,
          ranges,
          title: name?.trim() || getPaletteFallbackName(colors),
        },
      },
      options: { size: 'xlarge', title },
    });
    return;
  }
  dialog.trigger({
    type: 'component',
    component: {
      ref: ImportExportPalette,
      props: { colors, exportType: type },
    },
    options: { title },
  });
}
