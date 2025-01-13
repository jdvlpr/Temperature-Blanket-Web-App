import type { GaugeAttributes, GaugeStateInterface } from '$lib/types';
import chroma from 'chroma-js';
import { weather, weatherParametersData } from '$lib/state';
import {
  displayNumber,
  getEvenlyDistributedRangeValuesWithEqualDayCount,
} from '$lib/utils';

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

export class TemperatureGauge implements GaugeStateInterface {
  constructor() {
    Object.assign(this, gaugeAttributes);
  }
  // All the high temperatures, without missing values
  #maxes = $derived(weatherParametersData?.tmax?.filter((n) => n !== null));

  // All the low temperatures, without missing values
  #mins = $derived(weatherParametersData?.tmin?.filter((n) => n !== null));

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

  rangeOptions = $state({
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
  });

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
}
