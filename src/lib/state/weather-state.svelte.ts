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

import { API_SERVICES } from '$lib/constants/api-constants';
import { MOON_PHASE_NAMES } from '$lib/constants/weather-constants';
import { showDaysInRange } from '$lib/state/gauges-state.svelte';
import { locations, signal } from '$lib/state/location-state.svelte';
import { preferences } from '$lib/storage/preferences.svelte';
import type { GaugeAttributes, WeatherParam } from '$lib/types/gauge-types';
import type { LocationType } from '$lib/types/location-types';
import type {
  MoonPhasesId,
  WeatherDay,
  WeatherSourceOptions,
} from '$lib/types/weather-types';
import { getColorInfo } from '$lib/utils/color-utils';
import {
  createWeeksProperty, dateToISO8601String,
  getLocalISODateString,
  numberOfDays,
  stringToDate
} from '$lib/utils/date-utils';
import { displayNumber, getAverage } from '$lib/utils/number-utils';
import { pluralize } from '$lib/utils/string-utils';
import {
  celsiusToFahrenheit,
  convertTime,
  hoursToMinutes,
  millimetersToInches,
} from '$lib/utils/unit-utils.svelte';
import { getWeatherTargets } from '$lib/utils/weather-utils.svelte';
import * as SunCalc from 'suncalc';

class WeatherClass {
  // ***************
  //    Weather Data
  // ***************
  rawData: WeatherDay[] = $state([]);

  // ***************
  //    Derived Weather Data
  // ***************
  groupedByWeek: WeatherDay[] | null = $derived.by(() => {
    if (!this.rawData.length) return [];

    const _rawData = $state.snapshot(this.rawData);

    // Check if every location is from Meteostat as the data source
    // Used because Meteostat handle's snow data differently than Open-Meteo
    const isEveryDayFromMeteostat = locations.all?.every(
      (n) => n.source === 'Meteostat',
    );

    // Create weeks property for the weather data
    const _weatherWithWeek = createWeeksProperty({
      weatherData: _rawData,
    });

    // Get unique week IDs
    const _weatherGrouped = [
      ...new Set(_weatherWithWeek.map((day) => day.weekId)),
    ];

    // Group the weather data by week
    const _weather = _weatherGrouped.map((weekId) => {
      const daysInWeek = _weatherWithWeek.filter(
        (day) => day.weekId === weekId,
      );
      const weekData = { ...daysInWeek[0] };

      // Calculate aggregated values for the week
      daysInWeek.forEach((day, i) => {
        if (i === 0) return; // Skip the first day because it is the weekData object

        // Update max temperature for the week if a higher value is found
        if (day.tmax.metric > weekData.tmax.metric)
          weekData.tmax.metric = day.tmax.metric;
        if (day.tmax.imperial > weekData.tmax.imperial)
          weekData.tmax.imperial = day.tmax.imperial;

        // Calculate average temperature for the week
        weekData.tavg.metric += day.tavg.metric;
        weekData.tavg.imperial += day.tavg.imperial;

        // Update min temperature for the week if a lower value is found
        if (day.tmin.metric < weekData.tmin.metric)
          weekData.tmin.metric = day.tmin.metric;
        if (day.tmin.imperial < weekData.tmin.imperial)
          weekData.tmin.imperial = day.tmin.imperial;

        // Calculate aggregated precipitation for the week
        weekData.prcp.metric += day.prcp.metric;
        weekData.prcp.imperial += day.prcp.imperial;

        // Update snowfall for the week if every day is from Meteostat
        if (isEveryDayFromMeteostat) {
          if (day.snow.metric > weekData.snow.metric)
            weekData.snow.metric = day.snow.metric;
          if (day.snow.imperial > weekData.snow.imperial)
            weekData.snow.imperial = day.snow.imperial;
        } else {
          // Calculate aggregated snowfall for the week
          weekData.snow.metric += day.snow.metric;
          weekData.snow.imperial += day.snow.imperial;
        }

        // Calculate average daylight for the week
        weekData.dayt.metric += day.dayt.metric;
        weekData.dayt.imperial += day.dayt.imperial;
      });

      // Calculate average temperature for the week
      weekData.tavg.metric =
        typeof weekData.tavg.metric === 'number'
          ? displayNumber(weekData.tavg.metric / daysInWeek.length)
          : null;
      weekData.tavg.imperial =
        typeof weekData.tavg.imperial === 'number'
          ? displayNumber(weekData.tavg.imperial / daysInWeek.length)
          : null;

      // Format precipitation values
      weekData.prcp.metric =
        typeof weekData.prcp.metric === 'number'
          ? displayNumber(weekData.prcp.metric)
          : null;
      weekData.prcp.imperial =
        typeof weekData.prcp.imperial === 'number'
          ? displayNumber(weekData.prcp.imperial)
          : null;

      // Format snowfall values if not every day is from Meteostat
      if (!isEveryDayFromMeteostat) {
        weekData.snow.metric =
          typeof weekData.snow.metric === 'number'
            ? displayNumber(weekData.snow.metric)
            : null;
        weekData.snow.imperial =
          typeof weekData.snow.imperial === 'number'
            ? displayNumber(weekData.snow.imperial)
            : null;
      }

      // Calculate average daylight for the week
      weekData.dayt.metric =
        typeof weekData.dayt.metric === 'number'
          ? displayNumber(weekData.dayt.metric / daysInWeek.length)
          : null;
      weekData.dayt.imperial =
        typeof weekData.dayt.imperial === 'number'
          ? displayNumber(weekData.dayt.imperial / daysInWeek.length)
          : null;

      return {
        ...weekData,
      };
    });

    return _weather;
  });

  // The currently used weather data
  data: WeatherDay[] = $derived.by(() => {
    this.currentIndex = 0;

    if (this.grouping === 'week' && this.groupedByWeek.length)
      return this.groupedByWeek;
    else return this.rawData;
  });

  tableWeatherTargets = $derived.by(() => {
    return getWeatherTargets({
      weatherParameters: this.table.showParameters,
    });
  });

  params = $derived.by(() => {
    let tmin, tavg, tmax, prcp, snow, dayt, moon;

    if (!this.data)
      return {
        tmin,
        tavg,
        tmax,
        prcp,
        snow,
        dayt,
        moon,
      };

    tmin = this.data.map((day) => day.tmin[preferences.value.units]);
    tavg = this.data.map((day) => day.tavg[preferences.value.units]);
    tmax = this.data.map((day) => day.tmax[preferences.value.units]);
    prcp = this.data.map((day) => day.prcp[preferences.value.units]);
    snow = this.data.map((day) => day.snow[preferences.value.units]);
    dayt = this.data.map((day) => day.dayt[preferences.value.units]);
    moon = this.data.map((day) => day.moon);

    return {
      tmin,
      tavg,
      tmax,
      prcp,
      snow,
      dayt,
      moon,
    };
  });

  // ***************
  //    User Settings
  // ***************

  source: WeatherSourceOptions = $state({
    name: 'Open-Meteo',
    /* In the project URL hash, this is '0' for 'false' or '1' for 'true' */
    useSecondary: false,
    settings: {
      openMeteo: {
        model: 'auto',
      },
      meteoStat: {
        model: true,
      },
    },
    wasLoadedFromStorage: false,
    wasLoadedFromURLHash: false,
  });

  grouping: 'day' | 'week' = $state('day');

  monthGroupingStartDay: number = $state(1);

  // ***************
  // Derived From Settings
  // ***************
  groupingHeading = $derived(this.grouping === 'week' ? 'Week of' : 'Day');

  // ***************
  // Other State
  // ***************
  currentIndex = $state(0);

  isUserEdited: boolean = $state(false);

  wasLoadedFromStorage: boolean = $state(false);

  pdfOptions: {
    gauges: GaugeAttributes['id'][];
    showDaysInRange: boolean;
    weatherDataParams: WeatherParam['id'][];
  } = $derived({
    gauges: ['temp'],
    showDaysInRange: showDaysInRange.value,
    weatherDataParams: ['tmax', 'tavg', 'tmin'],
  });

  // ***************
  // Table
  // ***************
  table: {
    showParameters: { [key: string]: boolean };
    rowsPerPage: number;
    page: number;
  } = $state({
    rowsPerPage: 10,
    page: 1,
    showParameters: {
      tmin: true,
      tavg: true,
      tmax: true,
      prcp: true,
      snow: true,
      dayt: true,
      moon: false,
    },
  });

  // ***************
  // Methods (formerly in weather-utils.svelte.ts)
  // ***************

  /**
   * Calculates the sum of a specific parameter from the weather data.
   * If the parameter is not available for a specific day, it calculates the average of that parameter.
   * If the parameter is "tmax", "tavg", "tmin", "prcp", "snow", or "dayt", it calculates the average of the corresponding parameter.
   * The calculated sum is the absolute value of the parameter, unless it is zero, in which case it is set to 1.
   * @param {string} param - The parameter to calculate the sum for.
   * @returns {number} - The sum of the specified parameter.
   */
  sum(param) {
    return this.data
      .map((n) => {
        let value = n[param];
        if (typeof value !== 'undefined' && value !== null)
          value = value[preferences.value.units];
        else {
          if (param === 'tmax') return getAverage(this.params.tmax);
          if (param === 'tavg') return getAverage(this.params.tavg);
          if (param === 'tmin') return getAverage(this.params.tmin);
          if (param === 'prcp') return getAverage(this.params.prcp);
          if (param === 'snow') return getAverage(this.params.snow);
          if (param === 'dayt') return getAverage(this.params.dayt);
        }
        value = Math.abs(value);
        value = value === 0 ? 1 : value;
        return displayNumber(value);
      })
      .reduce((sum, a) => sum + a, 0);
  }

  /**
   * Calculates the count of missing days in the weather data.
   * A day is considered missing if all temperature and precipitation values are null.
   *
   * @returns {number} The count of missing days.
   */
  missingDaysCount() {
    const _units = preferences.value.units;
    const missingDays = this.data.filter(
      (day) =>
        day?.tavg[_units] === null &&
        day?.tmin[_units] === null &&
        day?.tmax[_units] === null &&
        day?.snow[_units] === null &&
        day?.prcp[_units] === null,
    );
    return missingDays.length;
  }

  getWeatherValue({
    dayIndex,
    param,
  }: {
    dayIndex: number;
    param: WeatherParam['id'];
  }) {
    if (param === 'moon') return this.data[dayIndex][param];
    return this.data[dayIndex][param][preferences.value.units];
  }

  async getOpenMeteo({ location }: { location: LocationType }) {
    let allData: WeatherDay[] = [];
    let totalDaysInFuture = 0;

    const todayStr = getLocalISODateString();
    let _to = location.to;

    // If the end date is in the future, set it instead to yesterday
    // The reason for this is because Open-Meteo does not accept end dates in the future
    if (_to >= todayStr) {
      // get today as a date (UTC 00:00 representation of Local Date)
      const todayStrToDate = stringToDate(todayStr);

      // set the number of days which are in the future, including today
      totalDaysInFuture = numberOfDays(todayStrToDate, stringToDate(_to));

      // set the _to end date to yesterday, the last day which should be included in the request for weather data
      // We do this by creating a UTC date from the Local String, subtracting 1 day, then formatting back to ISO
      const yesterday = new Date(todayStrToDate);
      yesterday.setUTCDate(todayStrToDate.getUTCDate() - 1);
      _to = dateToISO8601String(yesterday);
    }

    let url = API_SERVICES.openMeteo.baseURL;
    url += `?latitude=${location.lat}&longitude=${location.lng}`;
    url += `&start_date=${location.from}`;
    url += `&end_date=${_to}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'auto';
    url += `&daily=temperature_2m_max,temperature_2m_min,rain_sum,snowfall_sum&timezone=${timezone}`;

    if (
      this.source?.settings &&
      this.source.settings.openMeteo.model !== 'auto'
    )
      url += `&models=${this.source.settings.openMeteo.model}`;

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

        let today = getLocalISODateString();

        let daysInFuture = null;
        if (location.to >= today) {
          daysInFuture = numberOfDays(stringToDate(today), to);
        }

        let content = '<p class="font-bold text-xl my-4">Dates Out of Range</p>';

        if (daysInFuture) {
          content += `It looks like ${daysInFuture} ${pluralize('day', daysInFuture)} ${pluralize({ singular: 'is', plural: 'are' }, daysInFuture)} not in the past.`;
          content += ' Change the dates so that all days are in the past.';
        }

        if (from < new Date('1940-01-01')) {
          content += 'There may not be weather data for dates before 1940.';
        }

        content += `<p class="italic text-sm mt-4">Error status code: ${response.status}</p>`;

        throw new Error(content);
      }
    }

    if (!response.ok) {
      // Request Failed with HTTP code ${response.status}
      throw new Error(
        `<p class="font-bold text-xl my-4">Something Went Wrong</p>
      <p>A search request for weather data from <span class="font-bold">${
        location.label
      }</span> (${stringToDate(location.from).toLocaleDateString(undefined, {
        timeZone: 'UTC',
      })} - ${stringToDate(location.to).toLocaleDateString(undefined, {
        timeZone: 'UTC',
      })}) was sent to <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" class="link">Open-Meteo.com</a>, but the response returned an error.</p>
                            <p class="my-4">Try again with a different location or dates.</p>
                            <p class="italic text-sm">Error status code: ${response.status}</p>`,
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
      const tmin = tmins[index];
      const tmax = tmaxs[index];
      const tavg =
        tmin === null || tmax === null ? null : displayNumber((tmin + tmax) / 2);
      const snow = snows[index];
      const prcp = prcps[index];

      const date = stringToDate(times[index]);

      const dayTime = getDayTime({
        date,
        lat: location.lat,
        lng: location.lng,
      });

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
        moon: getMoonPhase(date),
      };

      allData = [...allData, dayData];
    }

    // Add future days with null values if needed
    if (totalDaysInFuture > 0) {
      const todayStrToDate = stringToDate(todayStr);

      for (let index = 0; index < totalDaysInFuture; index += 1) {
        const _date = new Date(todayStrToDate);
        _date.setUTCDate(_date.getUTCDate() + index);
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
          moon: getMoonPhase(_date),
        };

        allData = [...allData, _day];
      }
    }

    return allData;
  }

  /**
   * Retrieves the details of weather data sources based on the locations.
   * @returns {Array<object>} An array of weather data sources with their names and URLs.
   */
  getWeatherSourceDetails() {
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

    if (this.isUserEdited) {
      sources.push({
        name: 'custom weather data',
      });
    }

    return sources;
  }

  getTableData() {
    return [
      ...this.data.map((n, i) => {
        let _weather = {};
        _weather.color = {};
        this.tableWeatherTargets.forEach((target) => {
          const value = this.getWeatherValue({ dayIndex: i, param: target.id });
          const colorInfo = getColorInfo({
            param: target.id,
            value,
          });
          _weather.color[target.id] = colorInfo;

          if (target.id === 'dayt') {
            // make sure daytime is always in the same hr:mn format
            _weather = {
              ..._weather,
              [target.id]: convertTime(n[target.id][preferences.value.units], {
                displayUnits: false,
                padStart: true,
              }),
            };
          } else if (target.id === 'moon') {
            let value =
              n[target.id] !== null ? MOON_PHASE_NAMES[n[target.id]] : '-';
            _weather = {
              ..._weather,
              [target.id]: value,
            };
          } else {
            let value =
              n[target.id][preferences.value.units] !== null
                ? n[target.id][preferences.value.units]
                : '-';
            _weather = {
              ..._weather,
              [target.id]: value,
            };
          }
        });

        return {
          date: dateToISO8601String(n.date),
          location: n.location,
          ..._weather,
        };
      }),
    ];
  }
}
export const weather = new WeatherClass();

// ***************
// Pure utility functions (no state coupling)
// ***************

/**
 * Calculates the moon phase name for a given date.
 * Reasonably accurate for dates from ~1940 onwards.
 * Based on simple approximation using average synodic period.
 *
 * @param {Date} date The date for which to calculate the moon phase.
 * @returns {MoonPhasesId} The index id of the moon phase (e.g., "0" for "New Moon", "1" for "Waxing Crescent").
 */
export const getMoonPhase = (date: Date): MoonPhasesId => {
  // Ensure input is a Date object
  if (!(date instanceof Date) || isNaN(date)) {
    throw new Error('Invalid Date object provided.');
  }

  // Known New Moon: January 6, 2000, 18:14:00 UTC
  // We use milliseconds since Unix epoch (Jan 1, 1970)
  const knownNewMoonMs = 947182440000;

  // Average Synodic Period (days between new moons)
  const synodicPeriodDays = 29.530588853;
  const synodicPeriodMs = synodicPeriodDays * 24 * 60 * 60 * 1000;

  // Get the time difference in milliseconds from the known new moon (UTC)
  const dateMs = date.getTime();
  const diffMs = dateMs - knownNewMoonMs;

  // Calculate the position in the cycle (0 to 1)
  // (diffMs % synodicPeriodMs) gives remainder in ms
  // Add synodicPeriodMs and take modulo again to handle negative diffMs correctly
  const cyclePosMs =
    ((diffMs % synodicPeriodMs) + synodicPeriodMs) % synodicPeriodMs;
  const normalizedPhase = cyclePosMs / synodicPeriodMs; // Value between 0 and 1

  // Calculate an index from 0 to 7, slightly offset to center phases
  const phaseIndex = Math.floor((normalizedPhase * 8 + 0.5) % 8);

  return phaseIndex;
};

export const getDayTime = ({ date, lat, lng }) => {
  console.log('Calculating day time for date:', date, 'lat:', lat, 'lng:', lng);
  const times = SunCalc.getTimes(date, lat, lng);
  console.log('SunCalc times:', times);
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
