// Copyright (c) 2024, Thomas (https://github.com/jdvlpr)
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

import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
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
import type { GaugeAttributes, GaugeStateInterface } from '$lib/types';
import { colorsToYarnDetails, displayNumber } from '$lib/utils';

export const showDaysInRange: { value: boolean } = $state({ value: true });

class GaugesState {
  allCreated: GaugeStateInterface[] = $state([]);

  allAvailable: {
    id: GaugeAttributes['id'];
    label: GaugeAttributes['label'];
  }[] = $state([]);

  activeGaugeId = $state('');

  activeGauge = $derived(
    this.allCreated.find((gauge) => gauge.id === this.activeGaugeId),
  );

  urlHash = $derived.by(() => {
    let hash = '';
    this.allCreated.forEach((gauge) => {
      if (!gauge.rangeOptions || !gauge.colors || !gauge.ranges) return hash;
      if (gauge.ranges?.length !== gauge.colors?.length) return hash;
      hash += '&';
      hash += `${gauge.id}=`;
      hash += gauge.schemeId === 'Custom' ? '' : `${gauge.schemeId}~`;
      gauge.colors.forEach((color, index) => {
        const code = color.hex.substring(color.hex.indexOf('#') + 1);
        hash += encodeURIComponent(
          `${code}(${gauge.ranges[index].from + CHARACTERS_FOR_URL_HASH.separator + gauge.ranges[index].to})`,
        );
      });
      hash += '!';
      hash += gauge.rangeOptions.mode === 'auto' ? 'a' : 'm'; // Manual or auto ranges
      hash += gauge.rangeOptions.linked === true ? 'l' : 'u'; // linked or unlinked ranges
      hash += gauge.rangeOptions.direction === 'high-to-low' ? 'h' : 'l'; // high-to-low or low-to-high direction

      // Include From or To values included in v1.808
      if (
        gauge.rangeOptions.includeFromValue &&
        !gauge.rangeOptions.includeToValue
      )
        hash += '0';
      else if (
        !gauge.rangeOptions.includeFromValue &&
        gauge.rangeOptions.includeToValue
      )
        hash += '1';
      else if (
        gauge.rangeOptions.includeFromValue &&
        gauge.rangeOptions.includeToValue
      )
        hash += '2';
      else if (
        !gauge.rangeOptions.includeFromValue &&
        !gauge.rangeOptions.includeToValue
      )
        hash += '3';

      hash += gauge.rangeOptions.isCustomRanges === true ? 't' : 'f'; // Save custom ranges setting

      if (
        gauge.rangeOptions.mode === 'manual' &&
        gauge.rangeOptions.isCustomRanges === false
      ) {
        // If manual ranges, include integer and starting value '10'100'
        hash += `${displayNumber(gauge.rangeOptions.manual.increment)}${CHARACTERS_FOR_URL_HASH.separator}${displayNumber(gauge.rangeOptions.manual.start)}`;
      }

      // Save range Balance Auto Focus mode for temperature gauges
      // Added in version 2.5.0
      if (
        gauge.id === 'temp' &&
        gauge.rangeOptions.mode === 'auto' &&
        !gauge.rangeOptions.isCustomRanges
      ) {
        if (gauge.rangeOptions.auto.optimization === 'ranges') hash += '_r';
        if (gauge.rangeOptions.auto.optimization === 'tmax') hash += '_h';
        else if (gauge.rangeOptions.auto.optimization === 'tavg') hash += '_a';
        else if (gauge.rangeOptions.auto.optimization === 'tmin') hash += '_l';
      }

      if (gauge.colors.some((color) => color?.brandId && color?.yarnId)) {
        hash +=
          '!' +
          colorsToYarnDetails({
            colors: gauge.colors,
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

    let newGauge;

    if (id === 'temp') newGauge = new TemperatureGauge();
    if (id === 'prcp') newGauge = new RainGauge();
    if (id === 'snow') newGauge = new SnowGauge();
    if (id === 'dayt') newGauge = new DayTimeGauge();

    // if (id === 'prcp') newGauge = new RainGauge();
    // else newGauge = new GaugeState({ attributes, settings });

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
  getSnapshot(id) {
    const rangeOptions = this.allCreated.find(
      (gauge) => gauge.id === id,
    )?.rangeOptions;
    const ranges = this.allCreated.find((gauge) => gauge.id === id)?.ranges;

    const colors = this.allCreated.find((gauge) => gauge.id === id)?.colors;

    const gauge = this.allCreated.find((gauge) => gauge.id === id);

    return { ...gauge, rangeOptions, ranges, colors };
  }
}

// Create the gaugesState object with the default temperature gauge
export const gauges = new GaugesState();

export const allGaugesAttributes = [
  tempGaugeAttributes,
  rainGaugeAttributes,
  snowGaugeAttributes,
  daytGaugeAttributes,
];
