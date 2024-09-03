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

import { locations, units } from '$lib/stores';
import type { WeatherDay, WeatherSource } from '$lib/types';
import { createWeeksProperty, displayNumber } from '$lib/utils';
import { derived, writable, type Readable, type Writable } from 'svelte/store';

export const defaultWeatherSource: Writable<WeatherSource> =
  writable('Open-Meteo');

/* In the project URL hash, this is '0' for 'false' or '1' for 'true' */
export const useSecondaryWeatherSources: Writable<boolean> = writable(true);

export const weatherGrouping: Writable<'day' | 'week'> = writable('day');

export const weatherItemHeading = derived(
  [weatherGrouping],
  ([$weatherGrouping]) => ($weatherGrouping === 'week' ? 'Week of' : 'Day'),
);

export const weatherMonthGroupingStartDay = writable(1);

export const weatherUngrouped: Writable<WeatherDay[] | null> = writable(null);

export const weatherGroupedByWeek = derived(
  [weatherUngrouped, locations],
  ([$weatherUngrouped, $locations]) => {
    if (!$weatherUngrouped) return null;

    // Create a deep copy of the ungrouped weather array
    let copy = JSON.parse(JSON.stringify($weatherUngrouped));

    // Recreate date objects
    copy = copy.map((n) => {
      return { ...n, date: new Date(n.date) };
    });

    // Check if every location is from Meteostat as the data source
    // Used because Meteostat handle's snow data differently than Open-Meteo
    const isEveryDayFromMeteostat = $locations?.every(
      (n) => n.source === 'Meteostat',
    );

    // Create weeks property for the weather data
    const _weatherWithWeek = createWeeksProperty({
      weatherData: copy,
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
  },
);

export const weather: Readable<WeatherDay[]> = derived(
  [weatherUngrouped, weatherGroupedByWeek, weatherGrouping],
  ([$weatherUngrouped, $weatherGroupedByWeek, $weatherGrouping], set) => {
    switch ($weatherGrouping) {
      case 'day':
        activeWeatherElementIndex.set(0);
        set($weatherUngrouped);
        break;

      case 'week':
        activeWeatherElementIndex.set(0);
        if (!$weatherGroupedByWeek) {
          set(null);
          break;
        }

        set($weatherGroupedByWeek);
        break;

      default:
        set($weatherUngrouped);
        break;
    }
  },
);

// All the minimum temperatures
export const tmin = derived([weather, units], ([$weather, $units], set) => {
  if (!$weather) return null;
  set($weather.map((day) => day.tmin[$units]));
});

// All the average temperatures
export const tavg = derived([weather, units], ([$weather, $units], set) => {
  if (!$weather) return null;
  set($weather.map((day) => day.tavg[$units]));
});

// All the maximum temperatures
export const tmax = derived([weather, units], ([$weather, $units], set) => {
  if (!$weather) return null;
  set($weather.map((day) => day.tmax[$units]));
});

// All the precipitation values
export const prcp = derived([weather, units], ([$weather, $units], set) => {
  if (!$weather) return null;
  set($weather.map((day) => day.prcp[$units]));
});

// All the snow values
export const snow = derived([weather, units], ([$weather, $units], set) => {
  if (!$weather) return null;
  set($weather.map((day) => day.snow[$units]));
});

// All the daytime values
export const dayt = derived([weather, units], ([$weather, $units], set) => {
  if (!$weather) return null;
  set($weather.map((day) => day.dayt[$units]));
});

export const activeWeatherElementIndex = writable(0);

export const weatherView: Writable<'table' | 'range'> = writable('table');

export const isCustomWeather: Writable<null | boolean> = writable(null);

export const wasWeatherLoadedFromLocalStorage = writable(false);

export const isWeatherValid = writable(false);

export const tablePage = writable(1);

export const tableRowsPerPage = writable(10);

export const tableSort = writable({});

export const weatherParametersInView = writable({
  tmin: true,
  tavg: true,
  tmax: true,
  prcp: true,
  snow: true,
  dayt: true,
});
