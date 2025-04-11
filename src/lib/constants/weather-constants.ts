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

import type { MoonPhasesName } from '$lib/types';

export const OPEN_METEO_DELAY_DAYS = 6;

export const METEOSTAT_DELAY_DAYS = 8;

export const WEATHER_DATA_DECIMALS = 2;

export const HOURS_PER_DAY = 24;

export const MONTHS = [
  {
    value: 1,
    name: 'January',
    shortName: 'Jan',
  },
  {
    value: 2,
    name: 'February',
    shortName: 'Feb',
  },
  {
    value: 3,
    name: 'March',
    shortName: 'Mar',
  },
  {
    value: 4,
    name: 'April',
    shortName: 'Apr',
  },
  {
    value: 5,
    name: 'May',
    shortName: 'May',
  },
  {
    value: 6,
    name: 'June',
    shortName: 'Jun',
  },
  {
    value: 7,
    name: 'July',
    shortName: 'Jul',
  },
  {
    value: 8,
    name: 'August',
    shortName: 'Aug',
  },
  {
    value: 9,
    name: 'September',
    shortName: 'Sep',
  },
  {
    value: 10,
    name: 'October',
    shortName: 'Oct',
  },
  {
    value: 11,
    name: 'November',
    shortName: 'Nov',
  },
  {
    value: 12,
    name: 'December',
    shortName: 'Dec',
  },
];

export const DAYS_OF_THE_WEEK = [
  {
    value: 6,
    label: 'Saturday',
  },
  {
    value: 0,
    label: 'Sunday',
  },
  {
    value: 1,
    label: 'Monday',
  },
  {
    value: 2,
    label: 'Tuesday',
  },
  {
    value: 3,
    label: 'Wednesday',
  },
  {
    value: 4,
    label: 'Thursday',
  },
  {
    value: 5,
    label: 'Friday',
  },
];

// Labels for weather units
export const UNIT_LABELS = {
  temperature: {
    metric: '°C',
    imperial: '°F',
  },
  height: {
    metric: 'mm',
    imperial: 'in',
  },
  time: {
    metric: 'minutes',
    imperial: 'hours',
  },
  text: {
    metric: '',
    imperial: '',
  },
};

export const MOON_PHASE_NAMES: MoonPhasesName[] = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Third Quarter',
  'Waning Crescent',
];
