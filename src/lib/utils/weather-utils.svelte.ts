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

import { API_SERVICES } from '$lib/constants';
import {
  allGaugesAttributes,
  locations,
  signal,
  project,
  weather,
  controller,
  gauges,
  modal,
} from '$lib/state';
import type { WeatherDay } from '$lib/types';
import {
  celsiusToFahrenheit,
  dateToISO8601String,
  delay,
  displayNumber,
  getAverage,
  getToday,
  goToProjectSection,
  hoursToMinutes,
  millimetersToInches,
  numberOfDays,
  pluralize,
  stringToDate,
} from '$lib/utils';
import SunCalc from 'suncalc';

/**
 * Calculates the sum of a specific parameter from the weather data.
 * If the parameter is not available for a specific day, it calculates the average of that parameter.
 * If the parameter is "tmax", "tavg", "tmin", "prcp", "snow", or "dayt", it calculates the average of the corresponding parameter.
 * The calculated sum is the absolute value of the parameter, unless it is zero, in which case it is set to 1.
 * @param {string} param - The parameter to calculate the sum for.
 * @returns {number} - The sum of the specified parameter.
 */
export const sum = (param) => {
  return weather.data
    .map((n) => {
      let value = n[param];
      if (typeof value !== 'undefined' && value !== null)
        value = value[project.units];
      else {
        if (param === 'tmax') return getAverage(weather.params.tmax);
        if (param === 'tavg') return getAverage(weather.params.tavg);
        if (param === 'tmin') return getAverage(weather.params.tmin);
        if (param === 'prcp') return getAverage(weather.params.prcp);
        if (param === 'snow') return getAverage(weather.params.snow);
        if (param === 'dayt') return getAverage(weather.params.dayt);
      }
      value = Math.abs(value);
      value = value === 0 ? 1 : value;
      return displayNumber(value);
    })
    .reduce((sum, a) => sum + a, 0);
};

/**
 * Calculates the count of missing days in the weather data.
 * A day is considered missing if all temperature and precipitation values are null.
 *
 * @returns {number} The count of missing days.
 */
export const missingDaysCount = () => {
  const _units = project.units;
  const missingDays = weather.data.filter(
    (day) =>
      day?.tavg[_units] === null &&
      day?.tmin[_units] === null &&
      day?.tmax[_units] === null &&
      day?.snow[_units] === null &&
      day?.prcp[_units] === null,
  );
  return missingDays.length;
};

export const getOpenMeteo = async ({ location }) => {
  let allData: WeatherDay[] = [];
  let totalDaysInFuture = 0;

  let today = getToday();
  let _to = location.to;

  // If the end date is in the future, set it instead to yesterday
  // The reason for this is because Open-Meteo does not accept end dates in the future
  if (stringToDate(_to) >= today) {
    // get today as a date
    const _today = new Date();
    _today.setHours(0, 0, 0, 0);

    // set the number of days which are in the future, including today
    totalDaysInFuture = numberOfDays(_today, stringToDate(_to));

    // set the _to end date to yesterday, the last day which should be included in the request for weather data
    const yesterday = new Date(_today.getTime() - 24 * 60 * 60 * 1000);
    _to = dateToISO8601String(yesterday);
  }

  let url = API_SERVICES.openMeteo.baseURL;
  url += `?latitude=${location.lat}&longitude=${location.lng}`;
  url += `&start_date=${location.from}`;
  url += `&end_date=${_to}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto';
  url += `&daily=temperature_2m_max,temperature_2m_min,rain_sum,snowfall_sum&timezone=${timezone}`;

  const response = await fetch(url, { signal: signal.value });

  if (response.status === 503) {
    // Service Temporarily Unavailable
    throw new Error(
      '<p class="font-bold text-xl my-4">Service Temporarily Unavailable</p><p class="mt-4">Please try again.</p>',
    );
  }

  const data = await response.json();

  if (data?.error === true) {
    // Example Reason: "Parameter 'start_date' is out of allowed range from 1959-01-01 to 2023-02-01"
    if (data?.reason.includes('is out of allowed range')) {
      const from = stringToDate(location.from);
      const to = stringToDate(location.to);

      let today = getToday();

      let daysInFuture = null;
      if (to >= today) {
        daysInFuture = numberOfDays(today, to);
      }

      let content = '<p class="font-bold text-xl my-4">Dates Out of Range</p>';

      if (daysInFuture) {
        content += `It looks like ${daysInFuture} ${pluralize('day', daysInFuture)} ${pluralize({ singular: 'is', plural: 'are' }, daysInFuture)} not in the past.`;
        content += ' Change the dates so that all days are in the past.';
      }

      if (from < new Date('1940-01-01')) {
        content += 'There may not be weather data for dates before 1940.';
      }

      content += `<p class="italic text-sm mt-4">Error status code: ${response.status}</p>
                  <p class="mt-4 text-5xl font-ornament">i</p>`;

      throw new Error(content);
    }
  }

  if (!response.ok) {
    // Request Failed with HTTP code ${response.status}
    throw new Error(
      `<p class="font-bold text-xl my-4">Something Went Wrong</p>
      <p>A search request for weather data from <span class="font-bold">${
        location.label
      }</span> (${stringToDate(location.from).toLocaleDateString()} - ${stringToDate(location.to).toLocaleDateString()}) was sent to <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" class="link">Open-Meteo.com</a>, but the response returned an error.</p>
                            <p class="my-4">Try again with a different location or dates.</p>
                            <p class="italic text-sm">Error status code: ${response.status}</p>
                            <p class="mt-4 text-5xl font-ornament">i</p>`,
    );
  }

  if (!data?.daily) {
    // No data returned from Open-Meteo
    throw new Error(
      '<p class="font-bold text-xl my-4">Something Went Wrong</p><p class="mt-4">There appears to be insufficient weather data, please try a different location or dates.</p>',
    );
  }

  if (data.daily?.temperature_2m_max.every((value) => value === null)) {
    // Empty data
    throw new Error(
      '<p class="font-bold text-xl my-4">Something Went Wrong</p><p class="mt-4">There appears to be insufficient weather data, please try a different location or dates.</p>',
    );
  }

  location.stations = null; // No station details from Open-Meteo, only from Meteostat

  const times = data.daily.time;
  const tmaxs = data.daily.temperature_2m_max;
  const tmins = data.daily.temperature_2m_min;
  const prcps = data.daily.rain_sum;
  const snows = data.daily.snowfall_sum;

  for (let index = 0; index < times.length; index += 1) {
    // const day = data.data[index];
    const tmin = tmins[index];
    const tmax = tmaxs[index];
    const tavg =
      tmin === null || tmax === null ? null : displayNumber((tmin + tmax) / 2); // Calculate average temp based on max and min temps
    const snow = snows[index];
    const prcp = prcps[index];

    const date = stringToDate(location.from);
    date.setDate(date.getDate() + index);

    const dayTime = getDayTime({ date, lat: location.lat, lng: location.lng });

    const dayData: WeatherDay = {
      location: location.index,
      date,
      tavg: {
        metric: tavg,
        imperial: celsiusToFahrenheit(tavg),
      },
      tmin: {
        metric: tmin,
        imperial: celsiusToFahrenheit(tmin),
      },
      tmax: {
        metric: tmax,
        imperial: celsiusToFahrenheit(tmax),
      },
      prcp: {
        metric: prcp,
        imperial: millimetersToInches(prcp),
      },
      snow: {
        metric: snow === null ? null : displayNumber(snow * 10),
        imperial: snow === null ? null : millimetersToInches(snow * 10),
      },
      dayt: {
        metric: dayTime.metric,
        imperial: dayTime.imperial,
      },
    };

    // Other possible parameters from Open-Meteo, not used
    // dayData.wdir = day.wdir; // Wind Direction degrees (unused)
    // dayData.wspd = day.wspd; // WindSpeed km/hr (unused)
    // dayData.wpgt = day.wpgt; //T he peak wind gust in km/h (unused)
    // dayData.pres = day.pres; // The average sea-level air pressure in hPa (unused)
    // dayData.tsun = day.tsun; // The daily sunshine total in minutes (m) (unused)

    allData = [...allData, dayData];
  }

  if (totalDaysInFuture > 0) {
    for (let index = 0; index < totalDaysInFuture; index += 1) {
      const _date = stringToDate(_to);
      _date.setDate(_date.getDate() + index + 1);
      const _dayTime = getDayTime({
        date: _date,
        lat: location.lat,
        lng: location.lng,
      });

      const _day: WeatherDay = {
        location: location.index,
        date: _date,
        tavg: {
          metric: null,
          imperial: null,
        },
        tmin: {
          metric: null,
          imperial: null,
        },
        tmax: {
          metric: null,
          imperial: null,
        },
        prcp: {
          metric: null,
          imperial: null,
        },
        snow: {
          metric: null,
          imperial: null,
        },
        dayt: {
          metric: _dayTime.metric,
          imperial: _dayTime.imperial,
        },
      };
      allData = [...allData, _day];
    }
  }

  return allData;
};

/**
 * Retrieves the details of weather data sources based on the locations.
 * @returns {Array<object>} An array of weather data sources with their names and URLs.
 */
export const getWeatherSourceDetails = () => {
  const _locations = locations.all;

  if (!_locations) return;

  const hasMeteostatData = _locations.some((n) => n.source === 'Meteostat');
  const hasOpenMeteoData = _locations.some((n) => n.source === 'Open-Meteo');

  const sources = [];

  if (hasMeteostatData) {
    sources.push({
      name: 'Meteostat',
      url: 'https://meteostat.net',
    });
  }

  if (hasOpenMeteoData) {
    sources.push({
      name: 'Open-Meteo',
      url: 'https://open-meteo.com',
    });
  }

  if (weather.isUserEdited) {
    sources.push({
      name: 'custom weather data',
    });
  }

  return sources;
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

export const getWeatherTargets = ({ weatherParameters }) => {
  const props = allGaugesAttributes?.flatMap((gauge) => gauge.targets);
  return props.filter((n) => weatherParameters?.[n.id]);
};

export const getDayTime = ({ date, lat, lng }) => {
  const times = SunCalc.getTimes(date, lat, lng);
  const isValidSunset =
    times.sunset instanceof Date && !isNaN(times.sunset.getTime());
  const isValidSunRise =
    times.sunrise instanceof Date && !isNaN(times.sunrise.getTime());
  if (isValidSunset && isValidSunRise) {
    const daytime = parseFloat(
      ((times.sunset - times.sunrise) / 1000 / 60 / 60).toFixed(6),
    );
    return {
      metric: hoursToMinutes(daytime, 4),
      imperial: displayNumber(daytime, 4),
    }; // Convert metric to minutes because of Weather chart scale
  } else {
    return {
      metric: null,
      imperial: null,
    };
  }
};
