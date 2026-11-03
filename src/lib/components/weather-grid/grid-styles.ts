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

/** A weather grid's value cell (WeatherGrid's `cell`), ValueCell inside */
export const CELL = 'border-surface-200-800 relative min-w-0 border-r';

/** Row tints over the stripes (WeatherGrid's `rowTint`) */
export const TINT = {
  /** A row picked (its checkbox on) */
  picked: 'color-mix(in oklab, var(--color-primary-500) 12%, transparent)',
  /** Values that may still change (the last few days a source has) */
  recent: 'color-mix(in oklab, var(--color-warning-500) 20%, transparent)',
} as const;

/** A cell's tint: changed (Edit Weather Data's draft), selected */
export const CELL_TINT = {
  changed: 'bg-warning-500/20',
  selected: 'bg-primary-500/20',
} as const;

/** A weather grid's column */
export type GridColumn = {
  id: string;
  label: string;
  /** Its units, small after the label */
  unit?: string;
  /** Shown faintly (a value the project doesn't show) */
  dimmed?: boolean;
  /** A CSS grid track; values share what's left by default */
  width?: string;
  /** Can be sorted by (with `sort` bound) */
  sortable?: boolean;
};
