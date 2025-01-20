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

import { project, weather } from '$lib/state';
import { displayNumber } from '$lib/utils';

export const getStart = (rangeOptions) => {
  if (rangeOptions?.mode === 'auto') {
    if (rangeOptions?.direction === 'high-to-low')
      return rangeOptions?.auto.start.high;
    else return rangeOptions?.auto.start.low;
  } else return rangeOptions?.manual.start;
};

export const getIncrement = (rangeOptions) => {
  if (rangeOptions?.mode === 'auto') {
    if (rangeOptions.direction === 'high-to-low')
      return -rangeOptions?.auto.increment;
    else return rangeOptions?.auto.increment;
  } else {
    if (rangeOptions.direction === 'high-to-low')
      return -rangeOptions.manual.increment;
    else return rangeOptions.manual.increment;
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
}) => {
  if (!weatherData) weatherData = weather.data;

  const _units = project.units;

  let _weatherData = [...weatherData];
  _weatherData = _weatherData.filter((day) => day[prop][_units] !== null); // filter out any missing values

  if (gaugeDirection === 'low-to-high')
    _weatherData.sort((a, b) => a[prop][_units] - b[prop][_units]); // Sort the weather data lowest to highest
  else if (gaugeDirection === 'high-to-low')
    _weatherData.sort((a, b) => b[prop][_units] - a[prop][_units]); // Sort the weather data highest to lowest

  // Calculate the number of days in each range (rounded down).
  let daysPerRange = Math.ceil(_weatherData.length / numRanges);
  if (daysPerRange < 2) daysPerRange = 2;

  // Create a list to store the from and to values for each range.
  const rangeValues = [];
  let startValue;
  const maxValue = Math.max(..._weatherData.map((day) => day.tmax[_units]));
  const minValue = Math.min(..._weatherData.map((day) => day.tmin[_units]));
  if (roundIncrement && gaugeDirection === 'high-to-low')
    startValue = Math.ceil(maxValue + 0.01);
  else if (roundIncrement && gaugeDirection === 'low-to-high')
    startValue = Math.floor(minValue - 0.01);
  else if (!roundIncrement && gaugeDirection === 'high-to-low')
    startValue = maxValue + 0.01;
  else if (!roundIncrement && gaugeDirection === 'low-to-high')
    startValue = minValue - 0.01;

  let currentFrom = startValue;
  let currentTo;
  for (let i = 0; i < numRanges; i++) {
    // Find the to value for the current range.
    let weatherIndex = (i + 1) * (daysPerRange - 1);
    if (i === numRanges - 1) {
      // It's the last range, so use the highest or lowest value possible in order to include every day
      weatherIndex = _weatherData.length - 1;
      let endValue;
      if (roundIncrement && gaugeDirection === 'high-to-low')
        endValue = Math.floor(minValue - 0.01);
      else if (roundIncrement && gaugeDirection === 'low-to-high')
        endValue = Math.ceil(maxValue + 0.01);
      else if (!roundIncrement && gaugeDirection === 'high-to-low')
        endValue = minValue - 0.01;
      else if (!roundIncrement && gaugeDirection === 'low-to-high')
        endValue = maxValue + 0.01;
      currentTo = endValue;
    } else if (weatherIndex >= _weatherData.length) {
      // there are more ranges than days of weather, so just add one.
      currentTo += gaugeDirection === 'high-to-low' ? -1 : 1;
    } else {
      currentTo = roundIncrement
        ? Math.round(_weatherData[weatherIndex][prop][_units])
        : _weatherData[weatherIndex][prop][_units];
    }

    // If the from and to values are the same, add or subtract one until they are not equal
    while (currentTo === currentFrom)
      gaugeDirection === 'high-to-low' ? currentTo-- : currentTo++;

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
}) => {
  const _weather = weather.data;
  if (
    !direction ||
    !_weather ||
    typeof includeFromValue === 'undefined' ||
    typeof includeToValue === 'undefined'
  )
    return [];
  const _units = project.units;
  const days = _weather.filter((day) => {
    return isValueInRange({
      value: day[id][_units],
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
}) => {
  if (value === null) return false;
  if (direction === 'high-to-low') {
    if (includeFromValue && includeToValue)
      return value >= range.to && value <= range.from;
    if (includeFromValue && !includeToValue)
      return value > range.to && value <= range.from; // default
    if (!includeFromValue && includeToValue)
      return value >= range.to && value < range.from;
    if (!includeFromValue && !includeToValue)
      return value > range.to && value < range.from;
  } else {
    if (includeFromValue && includeToValue)
      return value >= range.from && value <= range.to;
    if (includeFromValue && !includeToValue)
      return value >= range.from && value < range.to; // default
    if (!includeFromValue && includeToValue)
      return value > range.from && value <= range.to;
    if (!includeFromValue && !includeToValue)
      return value > range.from && value <= range.to;
  }
};

/**
 * [getDaysPercent description]
 *
 * @param   {Number}  daysCount
 *
 * @return  {Number}             Percentage (supply your own sign %)
 */
export const getDaysPercent = (daysCount) => {
  const weatherLength = weather.data.length;
  let round = Math.round((daysCount / weatherLength) * 100);
  if (daysCount > 0 && round === 0) {
    round = 1;
  }
  return round;
};

export const getRangeExample = ({
  direction,
  includeFromValue,
  includeToValue,
}) => {
  if (direction === 'high-to-low') {
    if (includeFromValue && !includeToValue)
      return '<span class="">From</span> <span class="">≥ Range &#62;</span> <span class="">To</span>';
    if (!includeFromValue && includeToValue)
      return '<span class="">From</span> <span class="">&#62; Range ≥</span> <span class="">To</span>';
    if (includeFromValue && includeToValue)
      return '<span class="">From</span> <span class="">≥ Range ≥</span> <span class="">To</span>';
    if (!includeFromValue && !includeToValue)
      return '<span class="">From</span> <span class="">&#62; Range &#62;</span> <span class="">To</span>';
  } else {
    if (includeFromValue && !includeToValue)
      return '<span class="">From</span> <span class="">≤ Range &#60;</span> <span class="">To</span>';
    if (!includeFromValue && includeToValue)
      return '<span class="">From</span> <span class="">&#60; Range ≤</span> <span class="">To</span>';
    if (includeFromValue && includeToValue)
      return '<span class="">From</span> <span class="">≤ Range ≤</span> <span class="">To</span>';
    if (!includeFromValue && !includeToValue)
      return '<span class="">From</span> <span class="">&#60; Range &#60;</span> <span class="">To</span>';
  }
};
