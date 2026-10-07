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

// What goes in a project's PDF, and how it looks

import type { WeatherParam } from '$lib/types/gauge-types';

export const PDF_PAGE_SIZES = ['a4', 'letter'] as const;
export type PdfPageSize = (typeof PDF_PAGE_SIZES)[number];

/** As the View menu's list and grid */
export type PdfLayout = 'list' | 'grid';

export type PdfSettings = {
  /** A row for each color, or a grid of cards; starts as the View menu's */
  layout: PdfLayout;
  /** Each color's card or row takes its color; starts as View › Fill with color */
  fill: boolean;
  /** Days (or weeks) in each range; starts as View › Days in ranges */
  showDaysInRange: boolean;
  /** Each color's HTML color code */
  hex: boolean;
  pageSize: PdfPageSize;
  /** A first page with the project, its preview and its palettes */
  summary: boolean;
  /** The preview's border and accent colors */
  additionalColors: boolean;
  /** The weather table's columns; none leaves the table out */
  weatherDataParams: WeatherParam['id'][];
};

/** What's remembered for next time: the rest starts as the View menu has it */
export type SavedPdfSettings = Omit<
  PdfSettings,
  'layout' | 'fill' | 'showDaysInRange'
>;

/** Where paper is mostly Letter size; A4 everywhere else */
const LETTER_REGIONS = ['US', 'CA', 'MX', 'PH', 'CL', 'CO', 'VE', 'CR', 'GT'];

export function defaultPageSize(locale?: string): PdfPageSize {
  const region = locale?.split(/[-_]/)[1]?.toUpperCase();
  return region && LETTER_REGIONS.includes(region) ? 'letter' : 'a4';
}

export const DEFAULT_PDF_SETTINGS: Omit<SavedPdfSettings, 'pageSize'> = {
  hex: false,
  summary: true,
  additionalColors: true,
  weatherDataParams: ['tmax', 'tavg', 'tmin'],
};
