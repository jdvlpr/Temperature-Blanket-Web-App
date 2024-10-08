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

import { version } from '$app/environment';
import { settings as daytimeGaugeSettings } from '$lib/components/gauges/DaytimeGauge.svelte';
import { settings as rainGaugeSettings } from '$lib/components/gauges/RainGauge.svelte';
import { settings as snowGaugeSettings } from '$lib/components/gauges/SnowGauge.svelte';
import { settings as temperatureGaugeSettings } from '$lib/components/gauges/TemperatureGauge.svelte';
import { load as loadClnr } from '$lib/components/previews/CalendarSettings.svelte';
import { load as loadChev } from '$lib/components/previews/ChevronsSettings.svelte';
import { load as loadCosq } from '$lib/components/previews/ContinuousSquareSettings.svelte';
import { load as loadCrnr } from '$lib/components/previews/CornerToCornerSettings.svelte';
import { load as loadTsun } from '$lib/components/previews/DaytimeRowsSettings.svelte';
import { load as loadMrws } from '$lib/components/previews/MonthRowsSettings.svelte';
import { load as loadMsqs } from '$lib/components/previews/MonthSquaresSettings.svelte';
import { load as loadRows } from '$lib/components/previews/RowsSettings.svelte';
import { load as loadSmsq } from '$lib/components/previews/SplitMonthSquaresSettings.svelte';
import { load as loadSqrs } from '$lib/components/previews/SquaresSettings.svelte';
import {
  CHARACTERS_FOR_URL_HASH,
  DAYS_OF_THE_WEEK,
  LOADED_APP_VERSION,
  NO_DATA_SRTM3,
} from '$lib/constants';
import {
  defaultWeatherSource,
  gaugeProperties,
  gaugesState,
  locations,
  units,
  useSecondaryWeatherSources,
  weatherGrouping,
  weatherMonthGroupingStartDay,
} from '$lib/stores';
import type { GaugeSettings } from '$lib/types';
import {
  celsiusToFahrenheit,
  displayGeoNamesErrorMessage,
  exists,
  getColorsFromInput,
  getProjectParametersFromURLHash,
  millimetersToInches,
  dateToISO8601String,
  upToDate,
  yearFrom,
} from '$lib/utils';
import { get } from 'svelte/store';

export const setProjectSettings = async (
  hash = window.location.hash.substring(1),
) => {
  const params = getProjectParametersFromURLHash(hash);

  // Load Units
  if (exists(params.u)) {
    if (params.u.value === 'i') units.set('imperial');
    if (params.u.value === 'm') units.set('metric');
  }

  // Load Locations
  if (exists(params.l)) await parseLocationURLHash(params.l.value);

  // Load Gauges
  get(gaugeProperties).forEach((gauge) => {
    if (!exists(params[gauge.id])) return;
    switch (gauge.id) {
      case 'temp': {
        const settings = parseGaugeURLHash(
          params[gauge.id].value,
          get(temperatureGaugeSettings),
        );
        temperatureGaugeSettings.set(settings);
        break;
      }
      case 'prcp': {
        const settings = parseGaugeURLHash(
          params[gauge.id].value,
          get(rainGaugeSettings),
        );
        rainGaugeSettings.set(settings);
        break;
      }
      case 'snow': {
        const settings = parseGaugeURLHash(
          params[gauge.id].value,
          get(snowGaugeSettings),
        );
        snowGaugeSettings.set(settings);
        break;
      }
      case 'dayt': {
        const settings = parseGaugeURLHash(
          params[gauge.id].value,
          get(daytimeGaugeSettings),
        );
        daytimeGaugeSettings.set(settings);
        break;
      }
      default:
        break;
    }
    gaugesState.addCreated(gauge.id);
  });

  // Load Preview
  if (exists(params.rows)) loadRows(params.rows.value);
  else if (exists(params.rsun)) loadTsun(params.rsun.value);
  else if (exists(params.chev)) loadChev(params.chev.value);
  else if (exists(params.cosq)) loadCosq(params.cosq.value);
  else if (exists(params.crnr)) loadCrnr(params.crnr.value);
  else if (exists(params.smsq)) loadSmsq(params.smsq.value);
  else if (exists(params.mrws)) loadMrws(params.mrws.value);
  else if (exists(params.msqs)) loadMsqs(params.msqs.value);
  else if (exists(params.sqrs)) loadSqrs(params.sqrs.value);
  else if (exists(params.clnr)) loadClnr(params.clnr.value);

  // Load Weather Source (added in v1.823)
  if (exists(params.s)) {
    const sourceCode = params.s.value.substring(0, 1);
    if (sourceCode === '0') defaultWeatherSource.set('Meteostat');
    else if (sourceCode === '1') defaultWeatherSource.set('Open-Meteo');

    const secondaryCode = params.s.value.substring(1, 2);
    if (secondaryCode === '0') useSecondaryWeatherSources.set(false);
    else if (secondaryCode === '1') useSecondaryWeatherSources.set(true);
  } else {
    // Projects before v1.823 didn't have this param, and only used Meteostat as a weather source
    defaultWeatherSource.set('Meteostat');
    useSecondaryWeatherSources.set(true);
  }

  // Load Weather Grouping Setting if present
  if (exists(params.w)) {
    weatherGrouping.set('week');
    const value = +params.w?.value;
    if (DAYS_OF_THE_WEEK.map((n) => n.value).includes(value))
      weatherMonthGroupingStartDay.set(value);
  } else {
    // Otherwise set to the default 'day'
    weatherGrouping.set('day');
  }
};

const parseLocationURLHash = async (hashString) => {
  // First, get all the positions of the separator character(s)
  // This determines the number of locations
  const separatorIndices = [];
  for (let i = 0; i < hashString.length; i++) {
    if (
      hashString[i] === CHARACTERS_FOR_URL_HASH.separator ||
      hashString[i] === CHARACTERS_FOR_URL_HASH.separator_alt
    )
      separatorIndices.push(i);
  }

  let currentPosition = 0;

  let $locations = get(locations);

  // The number of locations is the number of separator characters present after the 'l=' key in the URL hash
  for (let i = 0; i < separatorIndices.length; i++) {
    // The position of the separator character for this location
    const separatorPosition = separatorIndices[i];

    if ($locations.length - 1 < i) {
      // There needs to be another location, so create it
      $locations = [...$locations, { index: i }];
      locations.set($locations);
    }

    $locations[i].label = 'Loading...';

    const id = hashString.substring(currentPosition, separatorPosition); // from start to separator

    // 9 is the length of the dates string for One Year Duration: for example 'YYYYMMDD!'
    const durationOneYearStringLength = 9;

    // 16 is the length of the dates string for Custom Duration: for example 'YYYYMMDDYYYYMMDD'
    const durationCustomStringLength = 16;

    // The location's string contains '!'
    const isDurationOneYear = hashString
      .substring(
        separatorPosition + 1,
        separatorPosition + durationOneYearStringLength + 1,
      )
      .includes('!');

    // The location's from and to dates
    let from, to;

    // The from date always follows the same format:
    // 8 characters after the separator character 'YYYYMMDD'
    const _from = hashString.substring(
      separatorPosition + 1,
      separatorPosition + 8 + 1,
    );

    // TODO: check to make sure the _from string is a valid date in the form of 'YYYYMMDD'

    // Insert hyphens into the date string ('YYYYMMDD' => 'YYYY-MM-DD')
    from = `${_from.substring(0, 4)}-${_from.substring(4, 6)}-${_from.substring(6, 8)}`;

    let thisLocationStringLength = 0;

    if (isDurationOneYear) {
      // This short format for year duration was added in version 1.730
      $locations[i].duration = 'y';

      thisLocationStringLength =
        separatorPosition + durationOneYearStringLength - currentPosition;

      const yearFromFromDate = yearFrom(from);

      to = dateToISO8601String(yearFromFromDate);
    } else {
      // Custom duration
      // All projects before 1.730 used this format
      $locations[i].duration = 'c';

      thisLocationStringLength =
        separatorPosition + durationCustomStringLength - currentPosition;

      to = hashString.substring(
        separatorPosition + 1 + 8,
        separatorPosition + 1 + durationCustomStringLength,
      ); // from 8 to 16 characters after separator
      to = `${to.substring(0, 4)}-${to.substring(4, 6)}-${to.substring(6, 8)}`; // YYYYMMDD => YYYY-MM-DD
    }

    // Move the current position to the beginning of the next location
    currentPosition += thisLocationStringLength + 1;

    // Set the location's from date
    $locations[i].from = from;

    // Set the location's to date
    $locations[i].to = to;

    // Set this to true so that certain functions on the Project Planner page know to run when this location is loaded
    $locations[i].wasLoadedFromSavedProject = true;

    // Get  data from GeoNames using the location's id
    try {
      const response = await fetch(`/api/location/${id}`);

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      // Set the location's id
      $locations[i].id = id;

      // Set the location's latitude
      $locations[i].lat = data.lat;

      // Set the location's longitude
      $locations[i].lng = data.lng;

      // Set the location's elevation
      if (data.srtm3 !== NO_DATA_SRTM3) $locations[i].elevation = data.srtm3;

      // Set the location's label
      const label = `${data.name}, ${data.adminName1}, ${data.countryName}`;
      $locations[i].label = label;

      // Set the location's result (used for displaying the location with country flag icon in various places)
      $locations[i].result =
        `<span class="fflag fflag-${data.countryCode?.toUpperCase()}"></span>${label}`;
    } catch (e) {
      throw displayGeoNamesErrorMessage(e);
    }
  }

  locations.set($locations);
};

export const parseGaugeURLHash = (
  hashString: string,
  gaugeSettings: GaugeSettings,
) => {
  // Each gauge should have a '!' which separates the gauge colors from the gauge settings
  let hashStringParts;
  if (hashString.includes('!')) hashStringParts = hashString.split('!');

  // If there's no '!' in the hash, the whole hashString is the colors, and the default gauge settings are used
  const hashStringColors = hashStringParts ? hashStringParts[0] : hashString;

  // A color's range starts with the '(' character
  const rangeFromIndices = [];

  // A color's range ends with the ')' character
  const rangeToIndices = [];

  // A color range's From and To values are separated with the default separator character "'"
  const colorSeparatorIndices = [];

  // A scheme Id begins with the '~' character
  let schemeIdSeparatorPosition: null | number = null;

  // "Walk" over the colors string and note the positions of all special characters
  for (let i = 0; i < hashStringColors.length; i++) {
    const character = hashStringColors[i];

    // The character marks a scheme ID
    if (character === '~') schemeIdSeparatorPosition = i;

    // The character marks the beginning of a color's range
    if (character === '(') rangeFromIndices.push(i);

    // The character marks the separation of a color range's From and To values
    if (
      character === CHARACTERS_FOR_URL_HASH.separator ||
      character === CHARACTERS_FOR_URL_HASH.separator_alt
    ) {
      colorSeparatorIndices.push(i);
    }

    // The character marks the end of a color's range
    if (character === ')') rangeToIndices.push(i);
  }

  // There's an equal number of From, To, and Separator characters
  const isValidColorsString =
    rangeFromIndices.length === rangeToIndices.length &&
    rangeToIndices.length === colorSeparatorIndices.length;

  // If the colors aren't formatted correctly, stop parsing the gauge's hashString.
  // All the default colors and settings will be used
  if (!isValidColorsString) return;

  // If the gauge uses a scheme instead of individual colors, set the scheme Id
  // Otherwise the schemeId is 'Custom'
  gaugeSettings.schemeId = schemeIdSeparatorPosition
    ? hashStringColors.substring(0, schemeIdSeparatorPosition)
    : 'Custom';

  // If there is a '!' character in the hashString, the hashStringSettings is the string after the '!'
  // Otherwise the settings are null
  const hashStringSettings = hashStringParts ? hashStringParts[1] : null;

  // Create a sudo-project href in order to get the colors from that using the getColorsFromInput function
  // NOTE: Could the current window.location.href be used instead? Probably, but this is the way it's set up for now
  const origin =
    window.location.origin[window.location.origin.length - 1] === ''
      ? window.location.origin
      : window.location.origin + '/';
  // If the current url doesn't have project and version parameters, add them
  const search = window.location.search.includes('project')
    ? window.location.search
    : `?project=${new Date().getTime()}&v=${version}`;
  const href = origin + search + '#&' + gaugeSettings.id + '=' + hashString;

  // Get the colors from the href string
  const colors = getColorsFromInput({ string: href });

  if (typeof colors !== 'boolean') {
    gaugeSettings.colors = colors;
    gaugeSettings.numberOfColors = colors.length;
  }

  const ranges = [];
  for (let i = 0; i < rangeFromIndices.length; i++) {
    // The color's From range value is the number from the '(' character to the "'" separator character
    let from = +hashStringColors.substring(
      rangeFromIndices[i] + 1,
      colorSeparatorIndices[i],
    );

    // The color's To range value is the number from the "'" separator character to the ')' character
    let to = +hashStringColors.substring(
      colorSeparatorIndices[i] + 1,
      rangeToIndices[i],
    );

    // Before version 1.700, all numbers were saved in metric
    // So convert the From and To values if needed
    if (!upToDate(LOADED_APP_VERSION, '1.700')) {
      if (get(units) === 'imperial') {
        switch (gaugeSettings.id) {
          case 'temp':
            from = celsiusToFahrenheit(from);
            to = celsiusToFahrenheit(to);
            break;
          case 'prcp':
          case 'snow':
            from = millimetersToInches(from);
            to = millimetersToInches(to);
            break;
          default:
            break;
        }
      }

      // I think before version 1.700, the from and to values were always in the same position, regardless of the gauge direction
      // So swap the from and to values to work with the way the Project Planner currently works
      if (!hashStringSettings || hashStringSettings.substring(2, 3) === 'h') {
        // If there's no settings string, or the gauge direction is explicitly set as high-to-low, swap from and to values
        const _hold = from;
        from = to;
        to = _hold;
      }
    }

    // Add the range to the ranges array
    ranges.push({
      from,
      to,
    });
  }

  gaugeSettings.ranges = ranges;

  // If there's no hashStringSettings (the part after '!') then just use the default gaugeSettings
  // and stop parsing the hashString
  if (!hashStringSettings) return gaugeSettings;

  gaugeSettings.rangeOptions.mode =
    hashStringSettings.substring(0, 1) === 'a' ? 'auto' : 'manual';

  gaugeSettings.rangeOptions.linked =
    hashStringSettings.substring(1, 2) === 'l';

  gaugeSettings.rangeOptions.direction =
    hashStringSettings.substring(2, 3) === 'h' ? 'high-to-low' : 'low-to-high';

  // From version v1.808, the range calculation mode is determined from these settings
  let currentCharacterPosition = 0;
  switch (hashStringSettings.substring(3, 4)) {
    case '0':
      gaugeSettings.rangeOptions.includeFromValue = true;
      gaugeSettings.rangeOptions.includeToValue = false;
      currentCharacterPosition += 1;
      break;
    case '1':
      gaugeSettings.rangeOptions.includeFromValue = false;
      gaugeSettings.rangeOptions.includeToValue = true;
      currentCharacterPosition += 1;
      break;
    case '2':
      gaugeSettings.rangeOptions.includeFromValue = true;
      gaugeSettings.rangeOptions.includeToValue = true;
      currentCharacterPosition += 1;
      break;
    case '3':
      gaugeSettings.rangeOptions.includeFromValue = false;
      gaugeSettings.rangeOptions.includeToValue = false;
      currentCharacterPosition += 1;
      break;

    default:
      gaugeSettings.rangeOptions.includeFromValue = true;
      gaugeSettings.rangeOptions.includeToValue = false;
      break;
  }

  // From version 1.700, the custom Ranges setting is determined from this character
  const customRangesSettingCharacter = hashStringSettings.substring(
    3 + currentCharacterPosition,
    4 + currentCharacterPosition,
  );
  // Make sure the character is 't' or 'f'
  const isValidCustomRangeValue =
    customRangesSettingCharacter === 't' ||
    customRangesSettingCharacter === 'f';

  if (isValidCustomRangeValue) {
    gaugeSettings.rangeOptions.isCustomRanges =
      customRangesSettingCharacter === 't';
    // Move the "cursor" to the next character
    currentCharacterPosition += 1;
  } else {
    // Otherwise the character is the next setting's character, so don't move the "cursor" forward
    gaugeSettings.rangeOptions.isCustomRanges = true;
  }

  // Find if the hashStringSettings contains a custom range increment number (the increment and start values are separated by the default separator character)
  let customRangeIncrementSeparatorPosition = hashStringSettings.indexOf(
    CHARACTERS_FOR_URL_HASH.separator,
  );

  if (customRangeIncrementSeparatorPosition === -1)
    customRangeIncrementSeparatorPosition = hashStringSettings.indexOf(
      CHARACTERS_FOR_URL_HASH.separator_alt,
    );

  const hasManualCustomRanges =
    gaugeSettings.rangeOptions.mode === 'manual' &&
    gaugeSettings.rangeOptions.isCustomRanges === false &&
    customRangeIncrementSeparatorPosition !== -1;

  const isTempGaugeWithAutoRanges =
    gaugeSettings.id === 'temp' &&
    gaugeSettings.rangeOptions.mode === 'auto' &&
    !gaugeSettings.rangeOptions.isCustomRanges;

  if (hasManualCustomRanges) {
    // from the
    let increment = +hashStringSettings.substring(
      3 + currentCharacterPosition,
      customRangeIncrementSeparatorPosition,
    );

    let start = +hashStringSettings.substring(
      customRangeIncrementSeparatorPosition + 1,
    );

    // Before version 1.700, all numbers were in metric
    // So update them if needed
    if (!upToDate(LOADED_APP_VERSION, '1.700') && get(units) === 'imperial') {
      increment = celsiusToFahrenheit(increment);
      start = celsiusToFahrenheit(start);
    }

    gaugeSettings.rangeOptions.manual.increment = increment;
    gaugeSettings.rangeOptions.manual.start = start;
  } else if (isTempGaugeWithAutoRanges) {
    // From v2.4.4, the range Balance Auto Focus mode is included in the settings string for temperature gauges
    if (hashStringSettings.includes('_h'))
      gaugeSettings.rangeOptions.auto.optimization = 'tmax';
    else if (hashStringSettings.includes('_a'))
      gaugeSettings.rangeOptions.auto.optimization = 'tavg';
    else if (hashStringSettings.includes('_l'))
      gaugeSettings.rangeOptions.auto.optimization = 'tmin';
    else gaugeSettings.rangeOptions.auto.optimization = 'ranges';
  }

  // From v2.4.4, the roundIncrement setting is determined by checking if all range From and To values are integers.
  gaugeSettings.rangeOptions.auto.roundIncrement = gaugeSettings?.ranges.every(
    (range) => Number.isInteger(range.from) && Number.isInteger(range.to),
  );

  return gaugeSettings;
};
