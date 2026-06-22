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

import { allGaugesAttributes } from '$lib/state/gauges-state.svelte';

export const getWeatherTargets = ({ weatherParameters }) => {
  const props = allGaugesAttributes?.flatMap((gauge) => gauge.targets);
  return props.filter((n) => weatherParameters?.[n.id]);
};

/**
 * Converts a CSV string to an array of objects.
 *
 * @param {Object} options - The options for CSV conversion.
 * @param {string} options.str - The CSV string to convert.
 * @param {string} [options.delimiter=','] - The delimiter used in the CSV string.
 * @returns {Array<object>} - The array of objects representing the CSV data.
 */
export const CSVtoArray = ({ str, delimiter = ',' }) => {
  // slice from start of text to the first \n index
  // use split to create an array from string by delimiter
  const headers = str.slice(0, str.indexOf('\n')).split(delimiter);
  headers.forEach((header, index, headers) => {
    if (header.includes('\r')) {
      headers[index] = header.replace('\r', '');
    }
  });

  // slice from \n index + 1 to the end of the text
  // use split to create an array of each csv value row
  const rows = str.slice(str.indexOf('\n') + 1).split('\n');
  rows.forEach((row, index, rows) => {
    if (row.includes('\r')) {
      rows[index] = row.replace('\r', '');
    }
  });

  // Map the rows
  // split values from each row into an array
  // use headers.reduce to create an object
  // object properties derived from headers:values
  // the object passed as an element of the array
  const arr = rows.map(function (row) {
    const values = row.split(delimiter);
    const el = headers.reduce(function (object, header, index) {
      object[header] = values[index];
      return object;
    }, {});
    return el;
  });

  // return the array
  return arr;
};

export const chunkArray = (array, chunkSize) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
};
