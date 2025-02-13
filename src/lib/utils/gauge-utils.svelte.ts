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

import { SCHEMES } from '$lib/constants';
import { gauges, project, weather } from '$lib/state';
import type { Color, GaugeSettingsType } from '$lib/types';
import {
  displayNumber,
  getDaysInRange,
  getDaysPercent,
  getEvenlyDistributedRangeValuesWithEqualDayCount,
  pluralize,
} from '$lib/utils';
import chroma from 'chroma-js';

export function getRanges({
  rangeOptions,
  ranges,
  start,
  increment,
  colors,
  includeFromAndTo,
  dontIncludeFromAndTo,
}) {
  let newRanges;
  let mustUpdateCustomRanges = false;
  if (rangeOptions.isCustomRanges) {
    // If 'manual' range calculations are used
    // newRanges = customRanges;

    newRanges = ranges;
  } else if (
    rangeOptions.auto.optimization !== 'ranges' &&
    rangeOptions.mode === 'auto'
  ) {
    // If 'auto' range calculations are used, and anything but 'equal ranges' is set
    newRanges = getEvenlyDistributedRangeValuesWithEqualDayCount({
      weatherData: weather.data,
      numRanges: colors.length,
      prop: rangeOptions.auto.optimization,
      gaugeDirection: rangeOptions.direction,
      roundIncrement: rangeOptions.auto.roundIncrement,
      includeFrom: rangeOptions.includeFromValue,
      includeTo: rangeOptions.includeToValue,
    });
    // customRanges = newRanges;
    mustUpdateCustomRanges = true;
  } else {
    // If 'auto' range calculations and 'equal ranges' is set
    let _start = start;

    newRanges = colors.map((n, i) => {
      const isFirstRange = i === 0;
      const isLastRange = i === colors.length - 1;

      let from = _start;
      let to = _start + increment;

      if (!isLastRange && rangeOptions.mode !== 'manual')
        to += includeFromAndTo ? 0.01 : dontIncludeFromAndTo ? -0.01 : 0;

      _start += increment;

      const decimals =
        rangeOptions.auto.roundIncrement && rangeOptions.mode !== 'manual'
          ? 0
          : 2;

      return {
        from: displayNumber(from, decimals),
        to: displayNumber(to, decimals),
      };
    });

    // customRanges = newRanges;
    mustUpdateCustomRanges = true;
  }

  return { ranges: newRanges, mustUpdateCustomRanges };
}

export const createGaugeColors = ({
  schemeId,
  numberOfColors,
  colors,
}: {
  schemeId: GaugeSettingsType['schemeId'];
  numberOfColors: GaugeSettingsType['numberOfColors'];
  colors: Color[];
}) => {
  if (schemeId === 'Custom') {
    if (numberOfColors > colors.length) {
      const diff = numberOfColors - colors.length;

      if (diff === 1) {
        // Generate a single random color and add it to the colors array
        colors.push({ hex: chroma.random().hex() });
      } else {
        // Generate an array of random colors and add them to the colors array
        const randomColors = Array.from({ length: diff }, () => ({
          hex: chroma.random().hex(),
        }));
        colors.push(...randomColors);
      }
    } else if (numberOfColors < colors.length) {
      // Remove excess colors if the numberOfColors is less than the current length
      colors.length = numberOfColors;
    }
  } else {
    // Use chroma.scale(schemeId) to generate colors based on the schemeId
    colors = chroma
      .scale(schemeId)
      .colors(numberOfColors)
      .map((n) => ({ hex: n }));
  }

  return colors;
};

export const getWPGauge = (gauge) => {
  const content = [];

  gauge.colors.forEach((color, i) => {
    const details = gauge.targets.map((item, index, self) => {
      const count = getDaysInRange({
        id: item.id,
        range: gauge.ranges[i],
        direction: gauge.rangeOptions.direction,
        includeFromValue: gauge.rangeOptions.includeFromValue,
        includeToValue: gauge.rangeOptions.includeToValue,
      }).length;
      const percentage = `(${getDaysPercent(count)}%)`;
      let label = '';
      if (self.length > 1) {
        if (index === 0) label = 'High Temperature';
        if (index === 1) label = 'Average Temperature';
        if (index === 2) label = 'Low Temperature';
      }
      return `${count} ${pluralize(weather.grouping, count)} ${percentage} ${label}`;
    });
    // details.reverse();
    content.push({
      color: color.hex,
      from: gauge.ranges[i].from + ' ' + gauge.unit.label[project.units],
      to: gauge.ranges[i].to + ' ' + gauge.unit.label[project.units],
      details,
    });
  });
  return content;
};

export const getTargetParentGaugeId = (targetId) => {
  return targetId === 'tmax' || targetId === 'tavg' || targetId === 'tmin'
    ? 'temp'
    : targetId;
};

export const getSchemeName = (id) => {
  if (SCHEMES.some((n) => n.value === id))
    return SCHEMES.filter((scheme) => scheme.value === id)[0].label;
  return 'Custom';
};

// Used to hold a temporary snapshot of a gauge when getting color info.
// This is a performance improvement; instead of having to get a new snapshot each time,
// if the gaugeId is the same as the previous one, then return the current temporary gauge.
let temporaryGaugeId = null;
let temporaryGauge = null;
export const getTemporaryGauge = (gaugeId) => {
  if (temporaryGaugeId !== gaugeId || !temporaryGauge) {
    temporaryGaugeId = gaugeId;
    temporaryGauge = gauges.getSnapshot(temporaryGaugeId);
  }
  return temporaryGauge;
};
