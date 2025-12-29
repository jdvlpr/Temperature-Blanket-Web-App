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
import {
  CHARACTERS_FOR_URL_HASH,
  DAYS_OF_THE_WEEK,
  NO_DATA_SRTM3,
  UNIT_LABELS,
} from '$lib/constants';
import { seasonsFromUrlHash } from '$lib/utils/seasons-utils';
import {
  allGaugesAttributes,
  gauges,
  localState,
  locations,
  previews,
  project,
  toast,
  weather,
} from '$lib/state';
import { MoonPhaseGauge } from '$lib/state/gauges/moon-phase-gauge-state.svelte';
import {
  celsiusToFahrenheit,
  dateToISO8601String,
  displayGeoNamesErrorMessage,
  exists,
  formatFeatureName,
  formatLocationLabel,
  getColorsFromInput,
  getProjectParametersFromURLHash,
  millimetersToInches,
  upToDate,
  yearFrom,
} from '$lib/utils';

export const setProjectSettings = async (
  hash = window.location.hash.substring(1),
) => {
  const params = getProjectParametersFromURLHash(hash);

  // Load Units
  if (exists(params.u)) {
    const _units = $state.snapshot(localState.value.units);
    if (params.u.value === 'i') localState.value.units = 'imperial';
    if (params.u.value === 'm') localState.value.units = 'metric';
    if (_units !== localState.value.units) {
      const label =
        localState.value.units === 'metric'
          ? `${UNIT_LABELS.temperature.metric} /
	    ${UNIT_LABELS.height.metric}`
          : `${UNIT_LABELS.temperature.imperial} /
      ${UNIT_LABELS.height.imperial}`;
      toast.trigger({
        category: 'info',
        message: `Units set to ${label}`,
        timeout: 15000,
      });
    }
  }

  // Load Locations
  if (exists(params.l)) await parseLocationURLHash(params.l.value);

  // Load Gauges
  allGaugesAttributes.forEach((gauge) => {
    if (!exists(params[gauge.id])) return;
    gauges.addById(gauge.id);

    const settings = parseGaugeURLHash(
      params[gauge.id].value,
      gauges.getSnapshot(gauge.id),
    );

    const _gauge = gauges.allCreated.find((g) => g.id === gauge.id);
    if (_gauge) _gauge.updateSettings({ settings });
  });

  // Load Preview
  previews.all.forEach((p) => {
    if (exists(params[p.id])) p.load(params[p.id].value);
  });

  // Load Weather Source (added in v1.823)
  if (exists(params.s)) {
    const sourceCode = params.s.value.substring(0, 1);
    if (sourceCode === '0') weather.source.name = 'Meteostat';
    else if (sourceCode === '1') weather.source.name = 'Open-Meteo';

    const secondaryCode = params.s.value.substring(1, 2);
    if (secondaryCode === '0') weather.source.useSecondary = false;
    else if (secondaryCode === '1') weather.source.useSecondary = true;

    const lastSubstring = params.s.value.substring(2);
    if (lastSubstring && weather.source?.settings) {
      if (+lastSubstring === 0) weather.source.settings.meteoStat.model = false;
      else if (lastSubstring === 'l')
        weather.source.settings.openMeteo.model = 'era5_land';
      else if (lastSubstring === 'e')
        weather.source.settings.openMeteo.model = 'era5';
    }
  } else {
    // Projects before v1.823 didn't have this param, and only used Meteostat as a weather source
    weather.source.name = 'Meteostat';
    weather.source.useSecondary = true;
  }

  // Load Weather Grouping Setting if present
  if (exists(params.w)) {
    weather.grouping = 'week';
    const value = +params.w?.value;
    if (DAYS_OF_THE_WEEK.map((n) => n.value).includes(value))
      weather.monthGroupingStartDay = value;
  } else {
    // Otherwise set to the default 'day'
    weather.grouping = 'day';
  }

  // Load Seasons from URL (n parameter)
  if (exists(params.n)) {
    const decoded = seasonsFromUrlHash(params.n.value);
    if (decoded) {
      localState.value.seasons = decoded;
      project.useSeasons = true;
    }
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

  let _locations = locations.all;

  // The number of locations is the number of separator characters present after the 'l=' key in the URL hash
  for (let i = 0; i < separatorIndices.length; i++) {
    // The position of the separator character for this location
    const separatorPosition = separatorIndices[i];

    if (_locations.length - 1 < i) {
      // There needs to be another location, so create it
      locations.add();
    }

    _locations[i].label = 'Loading...';

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
      _locations[i].duration = 'y';

      thisLocationStringLength =
        separatorPosition + durationOneYearStringLength - currentPosition;

      const yearFromFromDate = yearFrom(from);

      to = dateToISO8601String(yearFromFromDate);
    } else {
      // Custom duration
      // All projects before 1.730 used this format
      _locations[i].duration = 'c';

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
    _locations[i].from = from;

    // Set the location's to date
    _locations[i].to = to;

    // Set this to true so that certain functions on the Project Planner page know to run when this location is loaded
    _locations[i].wasLoadedFromSavedProject = true;

    // Get  data from GeoNames using the location's id
    try {
      const response = await fetch(`/api/location/${id}`);

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      // Set the location's id
      _locations[i].id = id;

      // Set the location's latitude
      _locations[i].lat = data.lat;

      // Set the location's longitude
      _locations[i].lng = data.lng;

      // Set the location's elevation
      if (data.srtm3 !== NO_DATA_SRTM3) _locations[i].elevation = data.srtm3;

      if (data.fclName) _locations[i].fclName = formatFeatureName(data.fclName);

      if (data.population) _locations[i].population = data.population;

      // Set the location's label
      const labelText = formatLocationLabel(data);

      _locations[i].label = labelText;

      let icon = '';
      if (data.countryCode)
        icon = `<span class="fflag fflag-${data.countryCode.toUpperCase()} shrink-0"></span>`;

      _locations[i].flagIcon = icon;

      // Set the location's result (used for displaying the location with country flag icon in various places)
      const result = `${icon} ${labelText}`;
      _locations[i].result = result;
    } catch (e) {
      throw displayGeoNamesErrorMessage(e);
    }
  }

  locations.all = _locations;
};

export const parseGaugeURLHash = (hashString: string, gauge) => {
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
  if (!isValidColorsString && gauge.id !== 'moon') return;

  // If the gauge uses a scheme instead of individual colors, set the scheme Id
  // Otherwise the schemeId is 'Custom'
  gauge.schemeId = schemeIdSeparatorPosition
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
  const href = origin + search + '#&' + gauge.id + '=' + hashString;

  // Get the colors from the href string
  const colors = getColorsFromInput({ string: href });

  if (typeof colors !== 'boolean') {
    gauge.colors = colors;
    gauge.numberOfColors = colors.length;
  }

  // If it's a moon gauge, this is enough, so return the gauge and don't process any further
  if (gauge.id === 'moon') {
    const _moonGauge = new MoonPhaseGauge();
    gauge.ranges = _moonGauge.ranges;
    return gauge;
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
    if (!upToDate(project.loaded.version, '1.700')) {
      if (localState.value.units === 'imperial') {
        switch (gauge.id) {
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

  gauge.ranges = ranges;

  // If there's no hashStringSettings (the part after '!') then just use the default gauge
  // and stop parsing the hashString
  if (!hashStringSettings) return gauge;

  // when this function is run in /gallery/[id], the gauge does not have rangeOptions and doesn't need the range options to be updated,
  // so just return the gauge as it is
  if (!gauge?.rangeOptions) return gauge;

  gauge.rangeOptions.mode =
    hashStringSettings.substring(0, 1) === 'a' ? 'auto' : 'manual';

  gauge.rangeOptions.linked = hashStringSettings.substring(1, 2) === 'l';

  gauge.rangeOptions.direction =
    hashStringSettings.substring(2, 3) === 'h' ? 'high-to-low' : 'low-to-high';

  // From version v1.808, the range calculation mode is determined from these settings
  let currentCharacterPosition = 0;
  switch (hashStringSettings.substring(3, 4)) {
    case '0':
      gauge.rangeOptions.includeFromValue = true;
      gauge.rangeOptions.includeToValue = false;
      currentCharacterPosition += 1;
      break;
    case '1':
      gauge.rangeOptions.includeFromValue = false;
      gauge.rangeOptions.includeToValue = true;
      currentCharacterPosition += 1;
      break;
    case '2':
      gauge.rangeOptions.includeFromValue = true;
      gauge.rangeOptions.includeToValue = true;
      currentCharacterPosition += 1;
      break;
    case '3':
      gauge.rangeOptions.includeFromValue = false;
      gauge.rangeOptions.includeToValue = false;
      currentCharacterPosition += 1;
      break;

    default:
      gauge.rangeOptions.includeFromValue = true;
      gauge.rangeOptions.includeToValue = false;
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
    gauge.rangeOptions.isCustomRanges = customRangesSettingCharacter === 't';
    // Move the "cursor" to the next character
    currentCharacterPosition += 1;
  } else {
    // Otherwise the character is the next setting's character, so don't move the "cursor" forward
    gauge.rangeOptions.isCustomRanges = true;
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
    gauge.rangeOptions.mode === 'manual' &&
    gauge.rangeOptions.isCustomRanges === false &&
    customRangeIncrementSeparatorPosition !== -1;

  const isTempGaugeWithAutoRanges =
    gauge.id === 'temp' &&
    gauge.rangeOptions.mode === 'auto' &&
    !gauge.rangeOptions.isCustomRanges;

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
    if (
      !upToDate(project.loaded.version, '1.700') &&
      localState.value.units === 'imperial'
    ) {
      increment = celsiusToFahrenheit(increment);
      start = celsiusToFahrenheit(start);
    }

    gauge.rangeOptions.manual.increment = increment;
    gauge.rangeOptions.manual.start = start;
  } else if (isTempGaugeWithAutoRanges) {
    // From v2.4.4, the range Balance Auto Focus mode is included in the settings string for temperature gauges
    if (hashStringSettings.includes('_h'))
      gauge.rangeOptions.auto.optimization = 'tmax';
    else if (hashStringSettings.includes('_a'))
      gauge.rangeOptions.auto.optimization = 'tavg';
    else if (hashStringSettings.includes('_l'))
      gauge.rangeOptions.auto.optimization = 'tmin';
    else gauge.rangeOptions.auto.optimization = 'ranges';
  }

  // From v2.4.4, the roundIncrement setting is determined by checking if all range From and To values are integers.
  gauge.rangeOptions.auto.roundIncrement = gauge?.ranges.every(
    (range) => Number.isInteger(range.from) && Number.isInteger(range.to),
  );

  return gauge;
};
