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
  defaults as rainGaugeDefaults,
} from '$lib/state/gauges/rain-gauge-state.svelte';
import {
  TemperatureGauge,
  gaugeAttributes as tempGaugeAttributes,
  defaults as tempGaugeDefaults,
} from '$lib/state/gauges/temperature-gauge-state.svelte';
import type {
  Color,
  GaugeAttributes,
  GaugeRange,
  GaugeStateInterface,
} from '$lib/types';
import {
  colorsToYarnDetails,
  displayNumber,
  getIncrement,
  getRanges,
  getStart,
} from '$lib/utils';
import { weather } from './weather-state.svelte';

export let showDaysInRange: { value: boolean } = $state({ value: true });

// function getInitialRanges({
//   rangeOptions,
//   start,
//   increment,
//   colors,
//   includeFromAndTo,
//   dontIncludeFromAndTo,
// }) {
//   const { ranges } = getRanges({
//     rangeOptions,
//     ranges: [],
//     start,
//     increment,
//     colors,
//     includeFromAndTo,
//     dontIncludeFromAndTo,
//   });
//   return ranges;
// }

// class GaugeState implements GaugeStateInterface {
//   constructor({
//     attributes,
//     defaults,
//   }: {
//     attributes: GaugeAttributes;
//     defaults: {
//       colors: Color[];
//       optimization: string;
//       schemeId: string;
//       maxes: string;
//       mins: string;
//     };
//   }) {
//     // Assign the gauge attributes as properties
//     Object.assign(this, attributes);

//     this.#maxesParam = defaults.maxes;
//     this.#minsParam = defaults.mins;

//     this.rangeOptions.auto.optimization = defaults.optimization;

//     this.colors = defaults.colors;

//     this.numberOfColors = defaults.colors.length;

//     this.schemeId = defaults.schemeId;

//     // Since rangeOptions needs to be $state that the user can update,
//     // it doesn't benefit from the derived auto properties which are used to calculate the rangeOptions
//     // So we need to set up an $effect to update the rangeOptions with the default derived values when the project loads
//     $effect.root(() => {
//       $effect(() => {
//         if (!Number.isFinite(this.rangeOptions?.auto.increment))
//           this.rangeOptions.auto.increment =
//             this.autoRangeOptions.auto.increment;

//         if (!Number.isFinite(this.rangeOptions?.auto.start.high))
//           this.rangeOptions.auto.start.high =
//             this.autoRangeOptions.auto.start.high;

//         if (!Number.isFinite(this.rangeOptions?.auto.start.low))
//           this.rangeOptions.auto.start.low =
//             this.autoRangeOptions.auto.start.low;

//         if (!Number.isFinite(this.rangeOptions?.manual.start))
//           this.rangeOptions.manual.start = this.autoRangeOptions?.manual.start;

//         if (!Number.isFinite(this.rangeOptions?.manual.increment))
//           this.rangeOptions.manual.increment =
//             this.autoRangeOptions?.manual.increment;
//       });
//     });

//     // Manually set up #maxes and #mins to be like #derived()
//     // because I couldn't get it working with $derived().
//     $effect.root(() => {
//       $effect(() => {
//         weather.rawData;
//         if (weather.data.length && !this.#maxes.length) {
//           // All the high values, without missing values

//           this.#maxes =
//             weather.params[this.#maxesParam].filter((n) => n !== null) || [];
//         }

//         if (weather.data.length && !this.#mins.length) {
//           // All the low values, without missing values

//           this.#mins =
//             weather.params[this.#minsParam].filter((n) => n !== null) || [];
//         }
//       });
//     });
//   }

//   // *************************
//   // Derived properties from weather data
//   // Used for auto calculating ranges
//   // *************************

//   #maxesParam = $state<string>();
//   #minsParam = $state<string>();

//   // All the high values, without missing values
//   #maxes = $state([]);
//   // All the low values, without missing values
//   #mins = $state([]);

//   // Set the max value to above the highest integer based on the weather data
//   #max = $derived.by(() => {
//     return Number.isInteger(Math.max(...this.#maxes))
//       ? Math.max(...this.#maxes) + 1
//       : Math.ceil(Math.max(...this.#maxes));
//   });

//   // Set the min value to below the lowest integer based on the weather data
//   #min = $derived.by(() => {
//     return Number.isInteger(Math.min(...this.#mins))
//       ? Math.min(...this.#mins) - 1
//       : Math.floor(Math.min(...this.#mins));
//   });

//   colors = $state<Color[]>([]);

//   rangeOptions = {
//     auto: {
//       optimization: '',
//       start: {
//         high: this.#max,
//         low: this.#min,
//       },
//       increment: displayNumber((this.#max - this.#min) / this.colors.length, 2),
//       roundIncrement: true,
//     },
//     manual: {
//       start: this.#max,
//       increment: displayNumber((this.#max - this.#min) / this.colors.length, 2),
//     },
//     direction: 'high-to-low',
//     includeFromValue: true,
//     includeToValue: false,
//     linked: true,
//     mode: 'auto', // equal range increments ('auto') | equal days ('jenks') | 'manua'
//     isCustomRanges: false,
//   };

//   // *************************
//   // Derived properties from ranges
//   // Used for auto calculating ranges
//   // *************************

//   autoRangeOptions = $derived({
//     auto: {
//       optimization: this.rangeOptions.auto.optimization,
//       start: {
//         high: this.#max,
//         low: this.#min,
//       },
//       increment: displayNumber((this.#max - this.#min) / this.colors.length, 2),
//       roundIncrement: this.rangeOptions.auto.roundIncrement,
//     },
//     manual: {
//       start: this.#max,
//       increment: this.#min,
//     },
//     direction: this.rangeOptions.direction,
//     includeFromValue: this.rangeOptions.includeFromValue,
//     includeToValue: this.rangeOptions.includeToValue,
//     linked: this.rangeOptions.linked,
//     mode: this.rangeOptions.mode, // equal range increments ('auto') | equal days ('jenks') | 'manua'
//     isCustomRanges: this.rangeOptions.isCustomRanges,
//   });

//   #start = $derived.by(() => {
//     this.rangeOptions.mode;
//     this.rangeOptions.direction;
//     this.rangeOptions.manual.start;
//     return getStart(this.rangeOptions);
//   });

//   #increment = $derived.by(() => {
//     this.rangeOptions.mode;
//     this.rangeOptions?.direction;
//     this.rangeOptions?.isCustomRanges;
//     this.rangeOptions.manual.increment;
//     return getIncrement(this.rangeOptions);
//   });

//   #dontIncludeFromAndTo = $derived(
//     !this.rangeOptions.includeFromValue && !this.rangeOptions.includeToValue,
//   );

//   #includeFromAndTo = $derived(
//     this.rangeOptions.includeFromValue && this.rangeOptions.includeToValue,
//   );

//   numberOfColors = $state<number>();

//   schemeId = $state<string>();

//   ranges = $state<GaugeRange[]>(
//     getInitialRanges({
//       rangeOptions: this.rangeOptions,
//       start: this.#start,
//       increment: this.#increment,
//       colors: this.colors,
//       includeFromAndTo: this.#includeFromAndTo,
//       dontIncludeFromAndTo: this.#dontIncludeFromAndTo,
//     }),
//   );

//   calculating = $state(true);

//   // *************************
//   // Mothods
//   // *************************
//   updateColors({ colors }) {
//     this.calculating = true;
//     this.colors = colors;
//     const { ranges } = getRanges({
//       rangeOptions: this.rangeOptions,
//       ranges: this.ranges,
//       start: this.#start,
//       increment: this.#increment,
//       colors: this.colors,
//       includeFromAndTo: this.#includeFromAndTo,
//       dontIncludeFromAndTo: this.#dontIncludeFromAndTo,
//     });
//     this.ranges = ranges;
//     this.rangeOptions = this.rangeOptions;
//     this.numberOfColors = this.colors.length;
//     this.calculating = false;
//   }
// }

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

    if (id === 'temp') {
      newGauge = new TemperatureGauge();
    }

    if (id === 'prcp') newGauge = new RainGauge();
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
    const rangeOptions = $state.snapshot(
      this.allCreated.find((gauge) => gauge.id === id)?.rangeOptions,
    );

    const ranges = $state.snapshot(
      this.allCreated.find((gauge) => gauge.id === id)?.ranges,
    );

    const colors = $state.snapshot(
      this.allCreated.find((gauge) => gauge.id === id)?.colors,
    );

    const gauge = $state.snapshot(
      this.allCreated.find((gauge) => gauge.id === id),
    );

    return { ...gauge, rangeOptions, ranges, colors };
  }
}

// Create the gaugesState object with the default temperature gauge
export const gauges = new GaugesState();

export const allGaugesAttributes = [tempGaugeAttributes, rainGaugeAttributes];
