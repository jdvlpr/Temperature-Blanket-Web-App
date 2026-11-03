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

import type { WeatherParam } from '#lib/types/gauge-types.js';
import { getColorInfo, type ColorInfo } from '#lib/utils/color-utils.js';
import type { GridColor } from '#lib/utils/weather-grid.js';
import { preferences } from '#lib/storage/preferences.svelte.js';
import { gauges } from '#lib/state/gauges-state.svelte.js';
import { getTargetParentGaugeId } from '#lib/utils/gauge-utils.svelte.js';
import { getContext, setContext } from 'svelte';

/** A value's color in a weather grid (a gauge's, `'outside'`, or null) */
export type SwatchColor = GridColor<ColorInfo>;

/**
 * A value's color in the project's gauges now. Read where it's shown, so it
 * follows the gauges as they change (nothing is kept).
 */
export function gridColor(
  param: WeatherParam['id'],
  value: number | null,
): SwatchColor {
  const color = getColorInfo({ param, value });
  if (typeof color.index === 'number') return color as SwatchColor;
  // A value with a gauge but in none of its ranges, so no yarn
  if (value !== null && typeof color.gaugeLength === 'number') return 'outside';
  return null;
}

/** Whether a gauge colors a value (else it has no swatch) */
export const hasGauge = (param: WeatherParam['id']) => {
  const id = getTargetParentGaugeId(param);
  return gauges.allCreated.some((gauge) => gauge.id === id);
};

/**
 * The same, kept as found: for a grid open while the gauges can't change
 * (Edit Weather Data, a dialog over them)
 */
export function cachedGridColor() {
  // A cache, never shown
  // eslint-disable-next-line svelte/prefer-svelte-reactivity
  const cache = new Map<string, SwatchColor>();
  return (param: WeatherParam['id'], value: number | null) => {
    const key = `${param}|${value}`;
    if (!cache.has(key)) cache.set(key, gridColor(param, value));
    return cache.get(key) as SwatchColor;
  };
}

/** Show Colors, one setting for every weather table, kept on this device */
export const showColors = {
  get value() {
    return !!preferences.value.weatherShowColors;
  },
  set value(on: boolean) {
    preferences.value.weatherShowColors = on;
  },
};

// ***************
// A swatch's details (brand · yarn · name · Color 3 of 8), one popover per grid
// ***************

export class SwatchDetails {
  anchor = $state<HTMLElement | null>(null);
  color = $state<ColorInfo | null>(null);
  /** What the value is, for the popover's heading ("Jan 4 · High") */
  title = $state('');
  /** Opened by hovering (closes on leaving), not by a press */
  byHover = $state(false);

  open(anchor: HTMLElement, color: ColorInfo, title: string, byHover = false) {
    this.anchor = anchor;
    this.color = color;
    this.title = title;
    this.byHover = byHover;
  }

  close() {
    this.anchor = null;
    this.color = null;
  }
}

const KEY = Symbol('swatch-details');

export const setSwatchDetails = (details: SwatchDetails) =>
  setContext(KEY, details);

export const getSwatchDetails = () =>
  getContext<SwatchDetails | undefined>(KEY);
