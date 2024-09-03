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

import { WEATHER_DATA_DECIMALS } from '$lib/constants';

export const getRandomNumber = (min, max) => {
  // min and max included
  return Math.floor(Math.random() * (max - min + 1) + min);
};

/**
 * Calculates the average of an array of numbers.
 *
 * @param {number[]} array - The array of numbers.
 * @param {object} [props] - Optional properties.
 * @param {number} [props.decimals] - The number of decimal places to round the average to.
 * @returns {number} - The average of the array.
 */
export const getAverage = (
  array,
  props = { decimals: WEATHER_DATA_DECIMALS },
) => {
  const { decimals } = props;
  const reducer = (total, currentValue) => total + currentValue;
  const sum = array.reduce(reducer);
  return displayNumber(sum / array.length, decimals);
};

/**
 * Returns the minimum value among three numbers.
 *
 * @param {number|null} min - The minimum value.
 * @param {number|null} avg - The average value or null.
 * @param {number|null} max - The maximum value or null.
 * @returns {number|null} - The minimum value among the three numbers, or null if all values are null.
 */
export const getMinOfThree = (min, avg, max) => {
  if (min === null) return min;
  if (avg === null && max === null) return min;
  if (avg === null && max !== null) {
    return min > max ? max : min;
  }
  if (avg !== null && max === null) {
    return min > avg ? avg : min;
  }
  const nextLowest = Math.min(avg, max);
  if (min > nextLowest) return nextLowest;
  return min;
};

/**
 * Calculates the average of three numbers, taking into account optional minimum and maximum values.
 *
 * @param {number|null} min - The minimum value (optional).
 * @param {number|null} avg - The average value.
 * @param {number|null} max - The maximum value (optional).
 * @returns {number|null} - The calculated average, or null if the average is null or both the minimum and maximum are null.
 */
export const getAvgOfThree = (min, avg, max) => {
  if (avg === null) return avg;
  if (min === null && max === null) return avg;
  if (min === null && max !== null) {
    return avg > max ? max : avg;
  }
  if (min !== null && max === null) {
    return avg < min ? min : avg;
  }
  const nextLowest = Math.min(min, max);
  const nextHighest = Math.max(min, max);
  if (avg < nextLowest) return nextLowest;
  if (avg > nextHighest) return nextHighest;
  return avg;
};

/**
 * Returns the maximum value among three numbers.
 *
 * @param {number|null} min - The minimum value.
 * @param {number|null} avg - The average value.
 * @param {number|null} max - The maximum value.
 * @returns {number|null} - The maximum value among the three numbers, or null if all values are null
 */
export const getMaxOfThree = (min, avg, max) => {
  if (max === null) return max;
  if (avg === null && min === null) return max;
  if (avg === null && min !== null) {
    return max < min ? min : max;
  }
  if (avg !== null && min === null) {
    return max < avg ? avg : max;
  }
  const nextHighest = Math.max(min, max);
  if (max < nextHighest) return nextHighest;
  return max;
};

/**
 * Formats a number for display with a specified number of decimal places.
 * If the input is not a number, it logs an error and returns 0.
 *
 * @param {number} number - The number to be formatted.
 * @param {number} [decimals=decimalsOfWeatherNumbers] - The number of decimal places to display. Defaults to the value of `decimalsOfWeatherNumbers`.
 * @returns {number} - The formatted number.
 */
export const displayNumber = (number, decimals = WEATHER_DATA_DECIMALS) => {
  if (typeof number !== 'number') {
    console.error('NaN', number);
    number = 0;
  }
  return parseFloat(number.toFixed(decimals));
};

/**
 * Returns a random element from the given array.
 *
 * @param {{ array: any[] }} options - The options object.
 * @returns {object | undefined} The randomly selected element from the array.
 */
export const pickRandomFromArray = ({ array }) => {
  if (!array || !array.length) {
    return;
  }

  const minIndex = 0;
  const maxIndex = array.length - 1;

  // Use Math.floor instead of Math.round for more even distribution of random indexes
  const index = Math.floor(
    Math.random() * (maxIndex - minIndex + 1) + minIndex,
  ); // includes min and max

  return array[index];
};

export const getMiddleValueOfArray = (arr) => {
  return arr[Math.ceil((arr.length - 1) / 2)];
};
