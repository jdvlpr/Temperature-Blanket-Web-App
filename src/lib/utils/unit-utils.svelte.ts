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

import { WEATHER_DATA_DECIMALS } from '$lib/constants/weather-constants';
import { windowLanguage } from '$lib/state/page-state.svelte';
import { preferences } from '$lib/storage/preferences.svelte';
import type { Unit } from '$lib/types/weather-types';
import { displayNumber } from '$lib/utils/number-utils';
import { exists } from '$lib/utils/other-utils';
import { pluralize } from '$lib/utils/string-utils';
/**
 * [description]
 */
export const fahrenheitToCelsius = (
  value: number | null,
  decimals: number = WEATHER_DATA_DECIMALS,
): number | null =>
  value === null ? null : displayNumber((+value - 32) * (5 / 9), decimals);
/**
 * [description]
 */
export const celsiusToFahrenheit = (
  value: number | null,
  decimals: number = WEATHER_DATA_DECIMALS,
): number | null =>
  value === null ? null : displayNumber((+value * 9) / 5 + 32, decimals);

export const millimetersToInches = (
  value: number | null,
  decimals: number = WEATHER_DATA_DECIMALS,
): number | null =>
  value === null ? null : displayNumber(+value / 25.4, decimals);

export const inchesToMillimeters = (
  value: number | null,
  decimals: number = WEATHER_DATA_DECIMALS,
): number | null =>
  value === null ? null : displayNumber(+value * 25.4, decimals);

export const hoursToMinutes = (
  value: number,
  decimals: number = WEATHER_DATA_DECIMALS,
): number => displayNumber(value * 60, decimals);

/**
 * [convertTime description]
 *
 * @param   {[Number]}  value  [value description]
 *
 * @return  {[String]}         [return description]
 */
export const convertTime = (
  value: number | null,
  props: {
    displayUnits?: boolean;
    padStart?: boolean;
    forceUnits?: Unit | null;
  } = { displayUnits: true, padStart: false, forceUnits: null },
): string => {
  let hours: number | string, minutes: number | string;
  const { displayUnits = true, padStart = false, forceUnits = null } = props;
  const _units = forceUnits || preferences.value.units;
  const _value = value ?? 0;
  if (_units === 'metric') {
    hours = Math.floor(_value / 60);
    minutes = _value % 60;
  } else {
    hours = Math.floor(_value);
    minutes = (_value * 60) % 60;
  }

  hours = displayNumber(hours);
  minutes = displayNumber(minutes, 0);
  if (padStart) {
    hours = String(hours).padStart(2, '0');
    minutes = String(minutes).padStart(2, '0');
  }

  if (displayUnits)
    return (
      hours +
      (pluralize('hr', Number(hours)) ?? '') +
      ' ' +
      minutes +
      (pluralize('min', Number(minutes)) ?? '')
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
