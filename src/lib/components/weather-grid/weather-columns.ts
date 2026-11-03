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

import { UNIT_LABELS } from '#lib/constants/weather-constants.js';
import { allGaugesAttributes } from '#lib/state/gauges-state.svelte.js';
import type { WeatherParam } from '#lib/types/gauge-types.js';
import type { Unit } from '#lib/types/weather-types.js';
import type { GridColumn } from './grid-styles.js';

const targets = allGaugesAttributes.flatMap((gauge) => gauge.targets);

/** Every weather value, in order: the View menu's Values */
export const ALL_VALUES = targets.map(
  (target) => target.id as WeatherParam['id'],
);

/** A weather value's name in a grid: "High", "Rain", "Daytime" */
export const paramLabel = (param: WeatherParam['id']) =>
  targets.find((t) => t.id === param)?.gaugeLabel ?? param;

/** A weather value's units: °C, mm, h:m; none for the moon */
export function paramUnit(param: WeatherParam['id'], units: Unit): string {
  if (param === 'dayt') return 'h:m';
  if (param === 'moon') return '';
  const type = targets.find((t) => t.id === param)?.type;
  if (type === 'temperature') return UNIT_LABELS.temperature[units];
  if (type === 'height') return UNIT_LABELS.height[units];
  return '';
}

/** A weather value's column, the same in every table */
export const weatherColumn = (
  param: WeatherParam['id'],
  units: Unit,
  extra: Partial<GridColumn> = {},
): GridColumn => ({
  id: param,
  label: paramLabel(param),
  unit: paramUnit(param, units),
  ...(param === 'moon' && { width: 'minmax(9rem, 1fr)' }),
  ...extra,
});
