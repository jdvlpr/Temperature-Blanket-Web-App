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

import { CHARACTERS_FOR_URL_HASH } from '$lib/constants/page-constants';
import {
  RainGauge,
  gaugeAttributes as rainGaugeAttributes,
} from '$lib/state/gauges/rain-gauge-state.svelte';
import {
  SnowGauge,
  gaugeAttributes as snowGaugeAttributes,
} from '$lib/state/gauges/snow-gauge-state.svelte';
import {
  TemperatureGauge,
  gaugeAttributes as tempGaugeAttributes,
} from '$lib/state/gauges/temperature-gauge-state.svelte';
import {
  DayTimeGauge,
  gaugeAttributes as daytGaugeAttributes,
} from '$lib/state/gauges/daytime-gauge-state.svelte';
import type {
  GaugeAttributes,
  GaugeRange,
  GaugeRangeCategory,
  GaugeStateInterface,
} from '$lib/types/gauge-types';
import { colorsToYarnDetails } from '$lib/utils/color-utils';
import { displayNumber } from '$lib/utils/number-utils';
import {
  MoonPhaseGauge,
  gaugeAttributes as moonGaugeAttributes,
} from './gauges/moon-phase-gauge-state.svelte';

export const showDaysInRange: { value: boolean } = $state({ value: true });

type AnyGauge =
  TemperatureGauge | RainGauge | SnowGauge | DayTimeGauge | MoonPhaseGauge;

class GaugesState {
  allCreated: AnyGauge[] = $state([]);

  allAvailable: {
    id: GaugeAttributes['id'];
    label: GaugeAttributes['label'];
  }[] = $state([]);

  activeGaugeId: GaugeAttributes['id'] | '' = $state('');

  activeGauge = $derived(
    this.allCreated.find((gauge) => gauge.id === this.activeGaugeId),
  );

  // Set this to true so that the active gauge button is scrolled to when the gauge is added. This is only necessary for the first time a gauge is added, and is reset to false after the active gauge button is scrolled to. It is necessary in order to prevent unwanted scrolling when editing an existing gauge, since the scroll behavior is triggered by an effect.
  allowScrollToActiveGaugeButton = $state(true);

  urlHash = $derived.by(() => {
    let hash = '';
    this.allCreated.forEach((gauge) => {
      const { rangeOptions, colors, ranges } = gauge;

      if (
        (!rangeOptions || !colors || !ranges) &&
        gauge.unit.type !== 'category'
      )
        return hash;

      if (ranges?.length !== colors?.length) return hash;

      hash += '&';
      hash += `${gauge.id}=`;
      hash += gauge.schemeId === 'Custom' ? '' : `${gauge.schemeId}~`;

      if (gauge.unit.type !== 'category') {
        if (!rangeOptions || !colors || !ranges) return hash;

        colors.forEach((color, index) => {
          if (!color.hex) return;
          const code = color.hex.substring(color.hex.indexOf('#') + 1);
          const range = ranges[index] as GaugeRange;
          hash += encodeURIComponent(
            `${code}(${range.from + CHARACTERS_FOR_URL_HASH.separator + range.to})`,
          );
        });

        hash += '!';
        hash += rangeOptions.mode === 'auto' ? 'a' : 'm'; // Manual or auto ranges
        hash += rangeOptions.linked === true ? 'l' : 'u'; // linked or unlinked ranges
        hash += rangeOptions.direction === 'high-to-low' ? 'h' : 'l'; // high-to-low or low-to-high direction

        // Include From or To values included in v1.808
        if (rangeOptions.includeFromValue && !rangeOptions.includeToValue)
          hash += '0';
        else if (!rangeOptions.includeFromValue && rangeOptions.includeToValue)
          hash += '1';
        else if (rangeOptions.includeFromValue && rangeOptions.includeToValue)
          hash += '2';
        else if (!rangeOptions.includeFromValue && !rangeOptions.includeToValue)
          hash += '3';

        hash += rangeOptions.isCustomRanges === true ? 't' : 'f'; // Save custom ranges setting

        if (
          rangeOptions.mode === 'manual' &&
          rangeOptions.isCustomRanges === false
        ) {
          // If manual ranges, include integer and starting value '10'100'
          hash += `${displayNumber(rangeOptions.manual.increment)}${CHARACTERS_FOR_URL_HASH.separator}${displayNumber(rangeOptions.manual.start)}`;
        }

        // Save range Balance Auto Focus mode for temperature gauges
        // Added in version 2.5.0
        if (
          gauge.id === 'temp' &&
          rangeOptions.mode === 'auto' &&
          !rangeOptions.isCustomRanges
        ) {
          if (rangeOptions.auto.optimization === 'ranges') hash += '_r';
          if (rangeOptions.auto.optimization === 'tmax') hash += '_h';
          else if (rangeOptions.auto.optimization === 'tavg') hash += '_a';
          else if (rangeOptions.auto.optimization === 'tmin') hash += '_l';
        }
      } else {
        // if the gauge is a 'category' type
        if (!colors || !ranges) return hash;

        // must include the settings `!` for parsing purposes, but doesn't need to have real data following the '!'
        // so only include the '!'

        colors.forEach((color, index) => {
          if (!color.hex) return;
          const code = color.hex.substring(color.hex.indexOf('#') + 1);
          const range = ranges[index] as GaugeRangeCategory;

          hash += encodeURIComponent(`${code}(${range.value})`);
        });
        hash += '!';
      }

      if (colors?.some((color) => color?.brandId && color?.yarnId)) {
        hash +=
          '!' +
          colorsToYarnDetails({
            colors,
          });
      }
    });

    return hash;
  });

  addById(id: GaugeAttributes['id']): void {
    if (
      this.allCreated.length &&
      this.allCreated.map((gauge) => gauge.id).includes(id)
    )
      return;

    let newGauge: AnyGauge;

    if (id === 'temp') newGauge = new TemperatureGauge();
    else if (id === 'prcp') newGauge = new RainGauge();
    else if (id === 'snow') newGauge = new SnowGauge();
    else if (id === 'dayt') newGauge = new DayTimeGauge();
    else newGauge = new MoonPhaseGauge();

    this.allowScrollToActiveGaugeButton = true;

    this.allCreated.push(newGauge);

    // This should only happen the first time, when the default temperature gauge is set up.
    if (!this.allAvailable.map((gauge) => gauge.id).includes(newGauge.id)) {
      this.allAvailable.push({ id: newGauge.id, label: newGauge.label });
    }

    this.activeGaugeId = newGauge.id;
  }

  remove(id: string): void {
    if (id === 'temp') return; // don't allow deleting the temperature gauge
    this.allCreated = this.allCreated?.filter((gauge) => gauge.id !== id);
    if (this.activeGaugeId === id) this.activeGaugeId = this.allCreated[0].id;
  }

  addToAvailable({
    id,
    label,
  }: {
    id: GaugeAttributes['id'];
    label: GaugeAttributes['label'];
  }): void {
    if (!this.allAvailable.map((gauge) => gauge.id).includes(id))
      this.allAvailable.push({ id, label });
  }

  removeFromAvailable(id: GaugeAttributes['id']): void {
    this.allAvailable = this.allAvailable.filter((gauge) => gauge.id !== id);
  }

  // I think this is necessary because a simple $state.snapshot(gauge) does not include deeply reactive objects, only the top level ones.
  // So this "freezes" what I need from the whole gauge
  getSnapshot(id: GaugeAttributes['id']): GaugeStateInterface | undefined {
    const _gauge = this.allCreated.find((gauge) => gauge.id === id);
    if (!_gauge) return undefined;

    const colors = _gauge.colors;

    if (_gauge.unit.type === 'category') return { ..._gauge, colors };

    const rangeOptions = _gauge.rangeOptions;

    const autoRangeOptions = _gauge.autoRangeOptions;

    const ranges = _gauge.ranges;

    return { ..._gauge, rangeOptions, ranges, colors, autoRangeOptions };
  }
}

// Create the gaugesState object with the default temperature gauge
export const gauges = new GaugesState();

export const allGaugesAttributes: GaugeAttributes[] = [
  tempGaugeAttributes,
  rainGaugeAttributes,
  snowGaugeAttributes,
  daytGaugeAttributes,
  moonGaugeAttributes,
];

export {
  getRanges,
  createGaugeColors,
  getWPGauge,
  getTargetParentGaugeId,
  getSchemeName,
} from '$lib/utils/gauge-utils.svelte';
