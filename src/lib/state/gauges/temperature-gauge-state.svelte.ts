import { weather } from '$lib/state';
import type { GaugeAttributes, GaugeStateInterface } from '$lib/types';
import {
  displayNumber,
  getEvenlyDistributedRangeValuesWithEqualDayCount,
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
    Object.assign(this, gaugeAttributes);
  }
  // All the high temperatures, without missing values
  #maxes = $derived(weather.params?.tmax?.filter((n) => n !== null));

  // All the low temperatures, without missing values
  #mins = $derived(weather.params?.tmin?.filter((n) => n !== null));

  // Set the max value to above the highest integer based on the weather data
  #max = $derived(
    Number.isInteger(Math.max(...this.#maxes))
      ? Math.max(...this.#maxes) + 1
      : Math.ceil(Math.max(...this.#maxes)),
  );

  // Set the min value to below the lowest integer based on the weather data
  #min = $derived(
    Number.isInteger(Math.max(...this.#mins))
      ? Math.max(...this.#mins) - 1
      : Math.floor(Math.max(...this.#mins)),
  );

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
      increment: this.#min,
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
      start: this.rangeOptions.manual.start,
      increment: this.rangeOptions.manual.increment,
    },
    direction: this.rangeOptions.direction,
    includeFromValue: this.rangeOptions.includeFromValue,
    includeToValue: this.rangeOptions.includeToValue,
    linked: this.rangeOptions.linked,
    mode: this.rangeOptions.mode, // equal range increments ('auto') | equal days ('jenks') | 'manua'
    isCustomRanges: this.rangeOptions.isCustomRanges,
  });

  autoRanges = $derived(
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

  calculating = $state(false);

  schemeId = $state('Spectral');
  updateColors({ colors }) {
    console.log('updating');
    this.calculating = true;
    this.colors = colors;
    this.ranges = this.autoRanges;
    this.rangeOptions = this.autoRangeOptions;
    this.numberOfColors = this.colors.length;
    console.log(this.ranges);

    this.calculating = false;
  }
}
