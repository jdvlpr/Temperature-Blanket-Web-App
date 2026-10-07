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

import type { GaugeRangeOptions } from '$lib/types/gauge-types';
import type { Color } from '$lib/types/yarn-types';
import { describe, expect, it } from 'vitest';
import { withRangeOptions } from './gauge-utils.svelte';

function options(change: Partial<GaugeRangeOptions> = {}): GaugeRangeOptions {
  return {
    auto: {
      optimization: 'ranges',
      start: { high: 30, low: 0 },
      increment: 10,
      roundIncrement: true,
    },
    manual: { start: 30, increment: 10 },
    direction: 'high-to-low',
    includeFromValue: true,
    includeToValue: false,
    linked: true,
    mode: 'auto',
    isCustomRanges: false,
    ...change,
  };
}

const colors = [
  { hex: '#ff0000' },
  { hex: '#00ff00' },
  { hex: '#0000ff' },
] as Color[];

function gauge(change: Partial<GaugeRangeOptions> = {}) {
  return {
    id: 'prcp' as const,
    rangeOptions: options(change),
    autoRangeOptions: options(),
    ranges: [
      { from: 30, to: 20 },
      { from: 20, to: 10 },
      { from: 10, to: 0 },
    ],
    colors,
  };
}

describe('withRangeOptions', () => {
  it('turns custom ranges around for a new direction', () => {
    const { rangeOptions, ranges } = withRangeOptions(
      gauge({ isCustomRanges: true }),
      { direction: 'low-to-high' },
    );
    expect(rangeOptions.direction).toBe('low-to-high');
    expect(ranges).toEqual([
      { from: 0, to: 10 },
      { from: 10, to: 20 },
      { from: 20, to: 30 },
    ]);
  });

  it('regenerates generated ranges for a new direction', () => {
    const { ranges } = withRangeOptions(gauge(), { direction: 'low-to-high' });
    expect(ranges).toEqual([
      { from: 0, to: 10 },
      { from: 10, to: 20 },
      { from: 20, to: 30 },
    ]);
  });

  it('keeps the ranges when only linking changes, without touching the gauge', () => {
    const before = gauge();
    const { rangeOptions, ranges } = withRangeOptions(before, {
      linked: false,
    });
    expect(rangeOptions.linked).toBe(false);
    expect(before.rangeOptions.linked).toBe(true);
    expect(ranges).toEqual(before.ranges);
    expect(ranges).not.toBe(before.ranges);
  });
});
