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

import { locations, localState } from '$lib/state';
import type {
  GaugeAttributes,
  WeatherDay,
  WeatherParam,
  WeatherSource,
  WeatherSourceOptions,
} from '$lib/types';
import {
  createWeeksProperty,
  displayNumber,
  getWeatherTargets,
} from '$lib/utils';

class WeatherClass {
  // ***************
  //    Weather Data
  // ***************
  rawData: WeatherDay[] = $state([]);

  // ***************
  //    Derived Weather Data
  // ***************
  goupedByWeek: WeatherDay[] | null = $derived.by(() => {
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

    if (this.grouping === 'week' && this.goupedByWeek.length)
      return this.goupedByWeek;
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

    tmin = this.data.map((day) => day.tmin[localState.value.units]);
    tavg = this.data.map((day) => day.tavg[localState.value.units]);
    tmax = this.data.map((day) => day.tmax[localState.value.units]);
    prcp = this.data.map((day) => day.prcp[localState.value.units]);
    snow = this.data.map((day) => day.snow[localState.value.units]);
    dayt = this.data.map((day) => day.dayt[localState.value.units]);
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
    useSecondary: true,
    settings: {
      openMeteo: {
        model: 'auto',
      },
      meteoStat: {
        model: true,
      },
    },
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

  isFromLocalStorage: boolean = $state(false);

  pdfOptions: {
    gauges: GaugeAttributes['id'][];
    weatherDataParams: WeatherParam['id'][];
  } = $state({
    gauges: ['temp'],
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
}
export const weather = new WeatherClass();
