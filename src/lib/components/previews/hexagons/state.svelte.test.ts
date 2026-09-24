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

import { weather } from '$lib/state/weather-state.svelte';
import { flushSync } from 'svelte';
import { describe, expect, it } from 'vitest';
import { HexagonsPreviewClass } from './state.svelte';

// Sets the weather data to `count` consecutive days, starting on Jan 1
const setDays = (count: number, start = '2024-01-01') => {
  weather.rawData = Array.from({ length: count }, (_, i) => {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + i);
    return { date };
  }) as unknown as typeof weather.rawData;
  flushSync();
};

// Number of hexagons in each row, from the y coordinate of each position
const getRowLengths = (preview: HexagonsPreviewClass) => {
  const rows = new Map<number, number>();
  preview.positions.forEach(({ y }) => rows.set(y, (rows.get(y) ?? 0) + 1));
  return [...rows.values()];
};

describe('HexagonsPreviewClass', () => {
  it('alternates rows with one fewer hexagon by default', () => {
    setDays(12);
    const preview = new HexagonsPreviewClass();
    preview.settings.columns = 5;

    expect(getRowLengths(preview)).toEqual([5, 4, 5]);
    expect(preview.rows).toBe(3);
    expect(preview.details.additionalHexagons).toBe(2);
  });

  it('supports rows with one more hexagon, or offset rows of the same size', () => {
    setDays(12);
    const preview = new HexagonsPreviewClass();
    preview.settings.columns = 5;

    preview.settings.rowLayout = 'more';
    expect(getRowLengths(preview)).toEqual([5, 6, 5]);

    preview.settings.rowLayout = 'offset';
    expect(getRowLengths(preview)).toEqual([5, 5, 5]);
  });

  it('adds hexagons at the beginning and between months', () => {
    setDays(60); // January and February 2024
    const preview = new HexagonsPreviewClass();
    preview.settings.hexagonsAtBeginning = 2;
    preview.settings.hexagonsBetweenMonthsCount = 3;

    expect(preview.hexagonsCreatedCount).toBe(60 + 2 + 3);
    expect(preview.additionalHexagonsIndexes.slice(0, 5)).toEqual([
      0, 1, 33, 34, 35,
    ]);
  });

  it('round-trips all settings through the url hash', () => {
    const preview = new HexagonsPreviewClass();
    preview.settings.primaryTarget = 'prcp';
    preview.settings.hexagonSize = 4;
    preview.settings.secondaryTargets = [
      { targetId: 'tmin', indexes: [0, 1] },
      { targetId: 'tavg', indexes: [3] },
    ];
    preview.settings.primaryTargetAsBackup = false;
    preview.settings.columns = 9;
    preview.settings.rowLayout = 'offset';
    preview.settings.hexagonsAtBeginning = 3;
    preview.settings.hexagonsBetweenMonthsCount = 2;
    preview.settings.additionalHexagonsColor = '#445566';
    preview.settings.joinStitches = 2;
    preview.settings.joinColor = '#112233';
    const hash = preview.hash;

    const loaded = new HexagonsPreviewClass();
    loaded.load(hash.replace('&hxgs=', ''));

    expect(loaded.settings).toEqual(preview.settings);
    expect(loaded.hash).toBe(hash);
  });

  it('uses the secondary targets for their rounds, from the center outward', () => {
    const preview = new HexagonsPreviewClass();
    preview.settings.primaryTarget = 'tmax';
    preview.settings.hexagonSize = 4;
    preview.settings.secondaryTargets = [
      { targetId: 'tmin', indexes: [0] },
      { targetId: 'tavg', indexes: [2] },
    ];

    expect(preview.roundTargetIds).toEqual(['tmin', 'tmax', 'tavg', 'tmax']);
    expect(preview.getRoundRadius(3)).toBe(preview.radius);
    expect(preview.getRoundRadius(0)).toBe(preview.radius / 4);
  });

  it('loads a hash without a border', () => {
    const preview = new HexagonsPreviewClass();
    preview.settings.joinStitches = 3;
    preview.settings.secondaryTargets = [{ targetId: 'tmin', indexes: [0] }];
    preview.load("tavg(2'7'1'0'0'f0f3f3'1)");

    expect(preview.settings.primaryTarget).toBe('tavg');
    expect(preview.settings.hexagonSize).toBe(2);
    expect(preview.settings.columns).toBe(7);
    expect(preview.settings.rowLayout).toBe('more');
    expect(preview.settings.joinStitches).toBe(0);
    expect(preview.settings.secondaryTargets).toEqual([]);
    expect(preview.settings.primaryTargetAsBackup).toBe(true);
  });

  it('sizes the image to fit every hexagon including borders', () => {
    setDays(12);
    const preview = new HexagonsPreviewClass();
    preview.settings.columns = 5;
    preview.settings.hexagonSize = 1;
    preview.settings.joinStitches = 1;

    // radius 10 + border 10
    const hexWidth = Math.sqrt(3) * 20;
    expect(preview.width).toBe(Math.ceil(5 * hexWidth));
    expect(preview.height).toBe(Math.ceil(40 + 2 * 30));

    preview.settings.rowLayout = 'offset';
    expect(preview.width).toBe(Math.ceil(5.5 * hexWidth));
  });
});
