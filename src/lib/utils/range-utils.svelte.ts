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
import { preferences } from '$lib/storage/preferences.svelte';
import type {
  GaugeAttributes,
  GaugeRange,
  GaugeRangeCategory,
  GaugeRangeOptions,
} from '$lib/types/gauge-types';
import type { WeatherDay } from '$lib/types/weather-types';
import { displayNumber } from '$lib/utils/number-utils';

export const getStart = (
  rangeOptions: GaugeRangeOptions | undefined,
): number | undefined => {
  if (rangeOptions?.mode === 'auto') {
    if (rangeOptions?.direction === 'high-to-low')
      return rangeOptions?.auto.start.high;
    else return rangeOptions?.auto.start.low;
  } else return rangeOptions?.manual.start;
};

export const getIncrement = (
  rangeOptions: GaugeRangeOptions | undefined,
  autoRangeOptions: GaugeRangeOptions | undefined,
): number | undefined => {
  if (rangeOptions?.mode === 'auto') {
    if (rangeOptions.direction === 'high-to-low')
      return autoRangeOptions ? -autoRangeOptions.auto.increment : undefined;
    else return autoRangeOptions?.auto.increment;
  } else {
    if (rangeOptions?.direction === 'high-to-low')
      return -rangeOptions.manual.increment;
    else return rangeOptions?.manual.increment;
  }
};

/**
 * Returns an array of objects containing the "from" and "to" values for a given number of ranges
 * based on the weather data provided. The ranges are evenly distributed and each range has an
 * equal number of days. The weather data is sorted in the specified gauge direction. If roundIncrement
 * is true, the values are rounded to the nearest integer. If includeFrom and includeTo are true,
 * the "from" and "to" values are inclusive. If only includeFrom is true, the "from" value is inclusive
 * and the "to" value is exclusive. If only includeTo is true, the "from" value is exclusive and the
 * "to" value is inclusive. If neither includeFrom nor includeTo are true, both values are exclusive.
 *
 * @param {Object} options - An object containing the following properties:
 *   @param {Array<Object>} options.weatherData - An array of weather data objects.
 *   @param {number} options.numRanges - The number of ranges to create.
 *   @param {string} options.prop - The property of the weather data object to use for sorting and range creation.
 *   @param {string} options.gaugeDirection - The direction of the gauge. Can be "low-to-high" or "high-to-low".
 *   @param {boolean} options.roundIncrement - Whether to round the values to the nearest integer.
 *   @param {boolean} options.includeFrom - Whether to include the "from" value in the range.
 *   @param {boolean} options.includeTo - Whether to include the "to" value in the range.
 * @return {Array<Object>} An array of objects containing the "from" and "to" values for each range.
 */
export const getEvenlyDistributedRangeValuesWithEqualDayCount = ({
  weatherData,
  numRanges,
  prop,
  gaugeDirection,
  roundIncrement,
  includeFrom,
  includeTo,
}: {
  weatherData: WeatherDay[] | undefined;
  numRanges: number;
  prop: keyof Pick<
    WeatherDay,
    'tmax' | 'tavg' | 'tmin' | 'prcp' | 'snow' | 'dayt'
  >;
  gaugeDirection: GaugeRangeOptions['direction'];
  roundIncrement: boolean;
  includeFrom: boolean;
  includeTo: boolean;
}): GaugeRange[] => {
  if (!weatherData) weatherData = weather.data;

  const _units = preferences.value.units ?? 'metric';

  let _weatherData = [...weatherData];
  _weatherData = _weatherData.filter((day) => day[prop][_units] !== null); // filter out any missing values

  // With no days to distribute there are no meaningful ranges, and the min/max below
  // would be ±Infinity, which the `currentTo === currentFrom` loop can never separate.
  // This is the normal state at module init, before any weather has been fetched.
  if (_weatherData.length === 0) return [];

  // day[prop][_units] is guaranteed non-null for every remaining day by the filter above
  if (gaugeDirection === 'low-to-high')
    _weatherData.sort((a, b) => a[prop][_units]! - b[prop][_units]!); // Sort the weather data lowest to highest
  else if (gaugeDirection === 'high-to-low')
    _weatherData.sort((a, b) => b[prop][_units]! - a[prop][_units]!); // Sort the weather data highest to lowest

  // Calculate the number of days in each range (rounded down).
  let daysPerRange = Math.ceil(_weatherData.length / numRanges);
  if (daysPerRange < 2) daysPerRange = 2;

  // Create a list to store the from and to values for each range.
  const rangeValues: GaugeRange[] = [];
  let startValue: number;
  const maxValue = Math.max(
    ..._weatherData
      .map((day) => day.tmax[_units])
      .filter((n): n is number => n !== null),
  );
  const minValue = Math.min(
    ..._weatherData
      .map((day) => day.tmin[_units])
      .filter((n): n is number => n !== null),
  );
  if (roundIncrement && gaugeDirection === 'high-to-low')
    startValue = Math.ceil(maxValue + 0.01);
  else if (roundIncrement && gaugeDirection === 'low-to-high')
    startValue = Math.floor(minValue - 0.01);
  else if (!roundIncrement && gaugeDirection === 'high-to-low')
    startValue = maxValue + 0.01;
  else startValue = minValue - 0.01;

  let currentFrom = startValue;
  let currentTo = currentFrom;
  for (let i = 0; i < numRanges; i++) {
    // Find the to value for the current range.
    const weatherIndex = (i + 1) * (daysPerRange - 1);
    if (i === numRanges - 1) {
      // It's the last range, so use the highest or lowest value possible in order to include every day
      let endValue: number;
      if (roundIncrement && gaugeDirection === 'high-to-low')
        endValue = Math.floor(minValue - 0.01);
      else if (roundIncrement && gaugeDirection === 'low-to-high')
        endValue = Math.ceil(maxValue + 0.01);
      else if (!roundIncrement && gaugeDirection === 'high-to-low')
        endValue = minValue - 0.01;
      else endValue = maxValue + 0.01;
      currentTo = endValue;
    } else if (weatherIndex >= _weatherData.length) {
      // there are more ranges than days of weather, so just add one.
      currentTo += gaugeDirection === 'high-to-low' ? -1 : 1;
    } else {
      currentTo = roundIncrement
        ? Math.round(_weatherData[weatherIndex][prop][_units]!)
        : _weatherData[weatherIndex][prop][_units]!;
    }

    // If the from and to values are the same, add or subtract one until they are not
    // equal. Stop if ±1 can no longer change the value (±Infinity, or magnitudes past
    // the safe-integer range), which would otherwise loop forever.
    while (currentTo === currentFrom) {
      const next =
        gaugeDirection === 'high-to-low' ? currentTo - 1 : currentTo + 1;
      if (next === currentTo) break;
      currentTo = next;
    }

    rangeValues.push({
      from: displayNumber(currentFrom),
      to: displayNumber(currentTo),
    });

    if (includeFrom && !includeTo) currentFrom = currentTo;
    else if (!includeFrom && includeTo) currentFrom = currentTo;
    else if (!includeFrom && !includeTo) currentFrom = currentTo + 0.01;
    else if (includeFrom && includeTo) currentFrom = currentTo - 0.01;
  }

  return rangeValues;
};

/**
 * [getDaysCount description]
 *
 * @param   {[String]}  id         Id of weather type to get (tmax, tmin, prcp...)
 * @param   {[Object]}  range      {from: Number, to: Number}
 * @param   {[String]}  direction  high-to-low or low-to-high
 * @param   {[Boolean]}  includeFromValue true or false
 * @param   {[Boolean]}  includeToValue true or false
 *
 * @return  {[Number]}             Number of days in the range
 */
export const getDaysInRange = ({
  id,
  range,
  direction,
  includeFromValue,
  includeToValue,
  gaugeUnitType,
}: {
  id: keyof Pick<
    WeatherDay,
    'tmax' | 'tavg' | 'tmin' | 'prcp' | 'snow' | 'dayt' | 'moon'
  >;
  range: GaugeRange | GaugeRangeCategory;
  direction: GaugeRangeOptions['direction'] | undefined;
  includeFromValue: boolean | undefined;
  includeToValue: boolean | undefined;
  gaugeUnitType: GaugeAttributes['unit']['type'];
}): WeatherDay[] => {
  if (!weather.data) return [];

  if (gaugeUnitType === 'category') {
    const days = weather.data.filter((day, i) => {
      const value = weather.getWeatherValue({ dayIndex: i, param: id });
      if (value === null) return false;
      return 'value' in range && range.value === value;
    });

    return days;
  }

  if (
    !direction ||
    typeof includeFromValue === 'undefined' ||
    typeof includeToValue === 'undefined' ||
    !('from' in range)
  )
    return [];

  const days = weather.data.filter((day, i) => {
    const value = weather.getWeatherValue({ dayIndex: i, param: id });
    return isValueInRange({
      value,
      range,
      direction,
      includeFromValue,
      includeToValue,
    });
  });
  return days;
};

export const isValueInRange = ({
  value,
  range,
  direction,
  includeFromValue,
  includeToValue,
}: {
  value: number | null;
  range: GaugeRange;
  direction: GaugeRangeOptions['direction'] | undefined;
  includeFromValue: boolean | undefined;
  includeToValue: boolean | undefined;
}): boolean => {
  if (value === null) return false;
  if (direction === 'high-to-low') {
    if (includeFromValue && includeToValue)
      return value >= range.to && value <= range.from;
    if (includeFromValue && !includeToValue)
      return value > range.to && value <= range.from; // default
    if (!includeFromValue && includeToValue)
      return value >= range.to && value < range.from;
    return value > range.to && value < range.from;
  } else {
    if (includeFromValue && includeToValue)
      return value >= range.from && value <= range.to;
    if (includeFromValue && !includeToValue)
      return value >= range.from && value < range.to; // default
    if (!includeFromValue && includeToValue)
      return value > range.from && value <= range.to;
    return value > range.from && value < range.to;
  }
};

/**
 * [getDaysPercent description]
 *
 * @param   {Number}  daysCount
 *
 * @return  {Number}             Percentage (supply your own sign %)
 */
export const getDaysPercent = (daysCount: number): number => {
  const weatherLength = weather.data.length;
  let round = displayNumber((daysCount / weatherLength) * 100);
  if (daysCount > 0 && round === 0) {
    round = 1;
  }
  return round;
};

/**
 * Sets one range's From or To. With linked ranges, the neighbor that shares
 * that edge moves too: the previous range's To, or the next range's From.
 * Callers should then mark the ranges custom, so they aren.t regenerated.
 *
 * @returns new ranges, and the index of the neighbor that moved, if any
 */
export const setRangeValue = ({
  ranges,
  rangeOptions,
  index,
  edge,
  value,
}: {
  ranges: GaugeRange[];
  rangeOptions: Pick<GaugeRangeOptions, 'linked'>;
  index: number;
  edge: 'from' | 'to';
  value: number;
}): { ranges: GaugeRange[]; neighbor: number | null } => {
  const next = ranges.map((range) => ({ ...range }));
  next[index][edge] = value;
  let neighbor: number | null = null;
  if (rangeOptions.linked) {
    const n = edge === 'from' ? index - 1 : index + 1;
    if (n >= 0 && n < next.length) {
      const other = edge === 'from' ? 'to' : 'from';
      if (next[n][other] !== value) neighbor = n;
      next[n][other] = value;
    }
  }
  return { ranges: next, neighbor };
};
