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
import { windowLanguage } from '$lib/state';
import { preferences } from '$lib/storage/preferences.svelte';
import { displayNumber, exists, pluralize } from '$lib/utils';
/**
 * [description]
 */
export const fahrenheitToCelsius = (value, decimals = WEATHER_DATA_DECIMALS) =>
  value === null ? null : displayNumber((+value - 32) * (5 / 9), decimals);
/**
 * [description]
 */
export const celsiusToFahrenheit = (value, decimals = WEATHER_DATA_DECIMALS) =>
  value === null ? null : displayNumber((+value * 9) / 5 + 32, decimals);

export const millimetersToInches = (value, decimals = WEATHER_DATA_DECIMALS) =>
  value === null ? null : displayNumber(+value / 25.4, decimals);

export const inchesToMillimeters = (value, decimals = WEATHER_DATA_DECIMALS) =>
  value === null ? null : displayNumber(+value * 25.4, decimals);

export const hoursToMinutes = (value, decimals = WEATHER_DATA_DECIMALS) =>
  displayNumber(value * 60, decimals);

/**
 * [convertTime description]
 *
 * @param   {[Number]}  value  [value description]
 *
 * @return  {[String]}         [return description]
 */
export const convertTime = (
  value,
  props = { displayUnits: true, padStart: false, forceUnits: null },
) => {
  let hours, minutes;
  const { displayUnits, padStart, forceUnits } = props;
  const _units = forceUnits || preferences.value.units;
  if (_units === 'metric') {
    hours = Math.floor(value / 60);
    minutes = value % 60;
  } else {
    hours = Math.floor(value);
    minutes = (value * 60) % 60;
  }

  hours = displayNumber(hours);
  minutes = displayNumber(minutes, 0);
  if (padStart) {
    hours = String(hours).padStart(2, '0');
    minutes = String(minutes).padStart(2, '0');
  }

  if (displayUnits)
    return (
      hours + pluralize('hr', hours) + ' ' + minutes + pluralize('min', minutes)
    );

  return hours + ':' + minutes;
};

/**
 * Guess user's unit format based on window.navigator.language
 *
 * @return  {[type]}  [return description]
 */
export const setUnitsFromNavigator = () => {
  // if (loadFromURL()) return;

  // If the units are already set, don't change them
  // preferences.value.units may not be set if the user is visiting for the first time since version 5.0.0
  // (that's why theres the '?' check)
  if (preferences.value?.units && preferences.value.units !== null) return;
  const language = window.navigator.language;
  if (exists(language)) {
    const letters = language.slice(-2).toUpperCase();
    windowLanguage.value = letters;
    // Set imperial for United States, Myenmar, and Liberia
    if (letters === 'US' || letters === 'MY') {
      preferences.value.units = 'imperial';
    } else {
      preferences.value.units = 'metric';
    }
  } else {
    preferences.value.units = 'metric';
  }
};
