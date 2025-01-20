import { project, weather } from '$lib/state';
import type { GaugeAttributes, GaugeStateInterface } from '$lib/types';
import {
  displayNumber,
  getEvenlyDistributedRangeValuesWithEqualDayCount,
  getIncrement,
  getRanges,
  getStart,
} from '$lib/utils';
import chroma from 'chroma-js';

export const gaugeAttributes: GaugeAttributes = {
  id: 'temp',
  label: 'Temperature Gauge',
  unit: {
    type: 'temperature',
    label: {
      metric: '°C',
      imperial: '°F',
    },
  },
  targets: [
    {
      id: 'tmax',
      label: 'High Temperature',
      type: 'temperature',
      gaugeLabel: 'High',
      shortLabel: 'High Temp',
      pdfHeader: {
        metric: 'High (°C)',
        imperial: 'High (°F)',
      },
      icon: '↑',
    },
    {
      id: 'tavg',
      label: 'Average Temperature',
      type: 'temperature',
      gaugeLabel: 'Average',
      shortLabel: 'Average Temp',
      pdfHeader: {
        metric: 'Avg (°C)',
        imperial: 'Avg (°F)',
      },
      icon: '~',
    },
    {
      id: 'tmin',
      label: 'Low Temperature',
      type: 'temperature',
      gaugeLabel: 'Low',
      shortLabel: 'Low Temp',
      pdfHeader: {
        metric: 'Low (°C)',
        imperial: 'Low (°F)',
      },
      icon: '↓',
    },
  ],
};

export class TemperatureGauge {
  constructor() {
    // Assign the gauge attributes as properties
    Object.assign(this, gaugeAttributes);

    // Since rangeOptions needs to be $state that the user can update,
    // it doesn't benefit from the derived auto properties which are used to calculate the rangeOptions
    // So we need to set up an $effect to update the rangeOptions with the default derived values when the project loads
    $effect.root(() => {
      $effect(() => {
        if (!Number.isFinite(this.rangeOptions?.auto.increment))
          this.rangeOptions.auto.increment =
            this.autoRangeOptions?.auto.increment;

        if (!Number.isFinite(this.rangeOptions?.auto.start.high))
          this.rangeOptions.auto.start.high =
            this.autoRangeOptions?.auto.start.high;

        if (!Number.isFinite(this.rangeOptions?.auto.start.low))
          this.rangeOptions.auto.start.low =
            this.autoRangeOptions?.auto.start.low;

        if (!Number.isFinite(this.rangeOptions?.manual.start))
          this.rangeOptions.manual.start = this.autoRangeOptions?.manual.start;

        if (!Number.isFinite(this.rangeOptions?.manual.increment))
          this.rangeOptions.manual.increment =
            this.autoRangeOptions?.manual.increment;
      });
    });
  }

  // *************************
  // Derived properties from weather data
  // Used for auto calculating ranges
  // *************************

  // All the high temperatures, without missing values
  #maxes = $derived.by(() => {
    weather.params?.tmax;
    const tmaxes = weather.params.tmax;
    return tmaxes?.filter((n) => n !== null) || [];
  });

  // All the low temperatures, without missing values
  #mins = $derived(weather.params?.tmin?.filter((n) => n !== null));

  // Set the max value to above the highest integer based on the weather data
  #max = $derived.by(() => {
    return Number.isInteger(Math.max(...this.#maxes))
      ? Math.max(...this.#maxes) + 1
      : Math.ceil(Math.max(...this.#maxes));
  });

  // Set the min value to below the lowest integer based on the weather data
  #min = $derived.by(() => {
    return Number.isInteger(Math.min(...this.#mins))
      ? Math.min(...this.#mins) - 1
      : Math.floor(Math.min(...this.#mins));
  });

  // *************************
  // Properties
  // User can update these
  // *************************

  colors = $state(
    chroma
      .scale('Spectral')
      .colors(10)
      .map((n) => {
        return { hex: n };
      }),
  );

  numberOfColors = $state(10);

  rangeOptions = {
    auto: {
      optimization: 'tmax',
      start: {
        high: this.#max,
        low: this.#min,
      },
      increment: displayNumber((this.#max - this.#min) / this.colors.length, 2),
      roundIncrement: true,
    },
    manual: {
      start: this.#max,
      increment: displayNumber((this.#max - this.#min) / this.colors.length, 2),
    },
    direction: 'high-to-low',
    includeFromValue: true,
    includeToValue: false,
    linked: true,
    mode: 'auto', // equal range increments ('auto') | equal days ('jenks') | 'manua'
    isCustomRanges: false,
  };

  ranges = $state(
    getEvenlyDistributedRangeValuesWithEqualDayCount({
      weatherData: weather.data,
      numRanges: this.colors.length,
      prop: this.rangeOptions.auto.optimization,
      gaugeDirection: this.rangeOptions.direction,
      roundIncrement: this.rangeOptions.auto.roundIncrement,
      includeFrom: this.rangeOptions.includeFromValue,
      includeTo: this.rangeOptions.includeToValue,
    }),
  );

  schemeId = $state('Spectral');

  calculating = $state(false);

  // *************************
  // Derived properties from ranges
  // Used for auto calculating ranges
  // *************************

  autoRangeOptions = $derived({
    auto: {
      optimization: this.rangeOptions.auto.optimization,
      start: {
        high: this.#max,
        low: this.#min,
      },
      increment: displayNumber((this.#max - this.#min) / this.colors.length, 2),
      roundIncrement: this.rangeOptions.auto.roundIncrement,
    },
    manual: {
      start: this.#max,
      increment: this.#min,
    },
    direction: this.rangeOptions.direction,
    includeFromValue: this.rangeOptions.includeFromValue,
    includeToValue: this.rangeOptions.includeToValue,
    linked: this.rangeOptions.linked,
    mode: this.rangeOptions.mode, // equal range increments ('auto') | equal days ('jenks') | 'manua'
    isCustomRanges: this.rangeOptions.isCustomRanges,
  });

  #start = $derived.by(() => {
    this.rangeOptions.mode;
    this.rangeOptions?.direction;
    this.rangeOptions?.manual.start;
    return getStart(this.rangeOptions);
  });

  #increment = $derived.by(() => {
    this.rangeOptions.mode;
    this.rangeOptions?.direction;
    this.rangeOptions?.isCustomRanges;
    this.rangeOptions.manual.increment;
    return getIncrement(this.rangeOptions);
  });

  #dontIncludeFromAndTo = $derived(
    !this.rangeOptions.includeFromValue && !this.rangeOptions.includeToValue,
  );

  #includeFromAndTo = $derived(
    this.rangeOptions.includeFromValue && this.rangeOptions.includeToValue,
  );

  // *************************
  // Mothods
  // *************************
  updateColors({ colors }) {
    this.calculating = true;
    this.colors = colors;
    const { ranges } = getRanges({
      rangeOptions: this.rangeOptions,
      ranges: this.ranges,
      start: this.#start,
      increment: this.#increment,
      colors: this.colors,
      includeFromAndTo: this.#includeFromAndTo,
      dontIncludeFromAndTo: this.#dontIncludeFromAndTo,
    });
    this.ranges = ranges;
    this.rangeOptions = this.rangeOptions;
    this.numberOfColors = this.colors.length;
    this.calculating = false;
  }
}
