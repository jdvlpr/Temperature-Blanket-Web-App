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

import { allGaugesAttributes, gauges } from '#lib/state/gauges-state.svelte.js';
import { locations } from '#lib/state/location-state.svelte.js';
import { getTargetParentGaugeId } from '#lib/utils/gauge-utils.svelte.js';
import {
  CHIP,
  colorChipLabel,
  dateRangeLabel,
  inDateRange,
  type GridFilter,
} from '#lib/utils/weather-grid.js';
import type { WeatherParam } from '#lib/types/gauge-types.js';
import { SvelteSet } from 'svelte/reactivity';
import type { SwatchColor } from './grid-color.svelte.js';
import { paramLabel } from './weather-columns.js';

/** How a table reads its rows, for the filters it offers (each one only
 * with its reader) */
export type DayReader<Row> = {
  key: (row: Row) => string;
  date: (row: Row) => string;
  location: (row: Row) => number;
  /** Any value shown is missing */
  missing?: (row: Row) => boolean;
  /** Made or not (null: progress doesn't say) */
  made?: (row: Row) => boolean | null;
  /** Its values may still change */
  recent?: (row: Row) => boolean;
  kept?: (row: Row) => boolean;
  /** Changed in the draft (Edit Weather Data) */
  edited?: (row: Row) => boolean;
  /** A value's color, for the color chip; with the values it can be */
  color?: {
    of: (row: Row, param: WeatherParam['id']) => SwatchColor;
    params: readonly WeatherParam['id'][];
  };
};

/** The color chip's setting: a gauge's color, in one of its values or any */
export type ColorSetting = {
  gaugeId: string;
  param: WeatherParam['id'] | 'any';
  index: number;
  /** The days to show until it's changed: a range's days as counted where
   * it was opened (GaugeCustomizer, whose ranges may not be saved yet) */
  seed?: ReadonlySet<string>;
};

const targetsOf = (gaugeId: string) =>
  allGaugesAttributes.find((g) => g.id === gaugeId)?.targets ?? [];

/**
 * The filters a weather days table offers (Missing, Made, Not made, May
 * change, Edited, Kept, the dates, a location, a color), with what's on and
 * their settings, kept while it's open
 */
export class DayFilters<Row> {
  on = new SvelteSet<string>();
  from = $state('');
  to = $state('');
  place = $state(0);
  color = $state<ColorSetting | null>(null);

  #reader: () => DayReader<Row>;
  #rows: () => readonly Row[];

  constructor(rows: () => readonly Row[], reader: () => DayReader<Row>) {
    this.#rows = rows;
    this.#reader = reader;
  }

  /** The first and last dates among the rows */
  span = $derived.by(() => {
    const reader = this.#reader();
    let first = '';
    let last = '';
    for (const row of this.#rows()) {
      const date = reader.date(row);
      if (!first || date < first) first = date;
      if (!last || date > last) last = date;
    }
    return { first, last };
  });

  /** The locations among the rows */
  places = $derived.by(() => {
    const reader = this.#reader();
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a temporary set
    return [...new Set(this.#rows().map((row) => reader.location(row)))].sort(
      (a, b) => a - b,
    );
  });

  /** The gauges that color the table's values, for the color chip */
  colorGauges = $derived.by(() => {
    const params = this.#reader().color?.params ?? [];
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a temporary set
    const ids = [...new Set(params.map((p) => getTargetParentGaugeId(p)))];
    return gauges.allCreated.filter((g) => ids.includes(g.id));
  });

  /** The values of a gauge the table shows */
  paramsOf = (gaugeId: string) => {
    const params = this.#reader().color?.params ?? [];
    return targetsOf(gaugeId)
      .map((t) => t.id as WeatherParam['id'])
      .filter((id) => params.includes(id));
  };

  filters: GridFilter<Row>[] = $derived.by(() => {
    const reader = this.#reader();
    const list: GridFilter<Row>[] = [];
    if (reader.missing)
      list.push({
        id: 'missing',
        label: CHIP.missing,
        matches: reader.missing,
        counted: true,
      });
    if (reader.made) {
      const made = reader.made;
      list.push(
        {
          id: 'made',
          label: CHIP.made,
          matches: (row) => made(row) === true,
          counted: true,
        },
        {
          id: 'notMade',
          label: CHIP.notMade,
          matches: (row) => made(row) === false,
          counted: true,
        },
      );
    }
    if (reader.recent)
      list.push({
        id: 'mayChange',
        label: CHIP.mayChange,
        matches: reader.recent,
        counted: true,
      });
    if (reader.edited)
      list.push({
        id: 'edited',
        label: CHIP.edited,
        matches: reader.edited,
        counted: true,
      });
    if (reader.kept)
      list.push({
        id: 'kept',
        label: CHIP.kept,
        matches: reader.kept,
        counted: true,
      });
    const { first, last } = this.span;
    list.push({
      id: 'dates',
      label: this.on.has('dates')
        ? dateRangeLabel(this.from, this.to, this.span)
        : 'Dates',
      matches: (row) => inDateRange(reader.date(row), this.from, this.to),
      available: !!first && first !== last,
      setting: true,
    });
    if (this.places.length > 1)
      list.push({
        id: 'place',
        label: this.on.has('place')
          ? locationName(this.place)
          : 'Location',
        matches: (row) => reader.location(row) === this.place,
        available: true,
        setting: true,
      });
    if (reader.color && this.colorGauges.length) {
      const of = reader.color.of;
      const setting = this.color;
      list.push({
        id: 'color',
        label:
          this.on.has('color') && setting
            ? colorChipLabel(
                setting.param === 'any' ||
                  this.paramsOf(setting.gaugeId).length < 2
                  ? this.colorGauges.length > 1
                    ? gaugeName(setting.gaugeId)
                    : null
                  : paramLabel(setting.param),
                setting.index,
              )
            : 'Color',
        matches: (row) => {
          if (!setting) return true;
          if (setting.seed) return setting.seed.has(reader.key(row));
          const params =
            setting.param === 'any'
              ? this.paramsOf(setting.gaugeId)
              : [setting.param];
          return params.some((param) => {
            const color = of(row, param);
            return !!color && color !== 'outside' && color.index === setting.index;
          });
        },
        available: true,
        setting: true,
      });
    }
    return list;
  });

  /** Turns a chip on (with its setting started) or off */
  toggle = (id: string, on: boolean) => {
    if (!on) {
      this.on.delete(id);
      return;
    }
    if (id === 'dates' && !this.from && !this.to) {
      this.from = this.span.first;
      this.to = this.span.last;
    }
    if (id === 'place' && !this.places.includes(this.place))
      this.place = this.places[0] ?? 0;
    if (id === 'color' && !this.color) {
      const gauge = this.colorGauges[0];
      if (gauge) this.color = { gaugeId: gauge.id, param: 'any', index: 0 };
    }
    this.on.add(id);
  };

  /** Shows a color's days from the start (a range's days) */
  startWithColor(setting: ColorSetting) {
    this.color = setting;
    this.on.add('color');
  }

  /** Changes the color chip's setting (no longer the days it started with) */
  setColor(change: Partial<Omit<ColorSetting, 'seed'>>) {
    if (!this.color) return;
    const next = { ...this.color, ...change, seed: undefined };
    // Another gauge: its own colors, any of its values
    if (change.gaugeId && change.gaugeId !== this.color.gaugeId) {
      next.param = 'any';
      next.index = 0;
    }
    this.color = next;
  }
}

export const locationName = (index: number) =>
  locations.all?.[index]?.label || `Location ${index + 1}`;

const gaugeName = (gaugeId: string) =>
  (gauges.allCreated.find((g) => g.id === gaugeId)?.label ?? 'Gauge').replace(
    / Gauge$/,
    '',
  );
