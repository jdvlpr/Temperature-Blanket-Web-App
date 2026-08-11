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

import { SCHEMES } from '$lib/constants/color-constants';
import { toast } from '$lib/state/page-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import { preferences } from '$lib/storage/preferences.svelte';
import type { Color } from '$lib/types/yarn-types';
import type {
  GaugeAttributes,
  GaugeRange,
  GaugeRangeCategory,
  GaugeRangeOptions,
  GaugeSettingsType,
  GaugeStateInterface,
  WeatherParam,
} from '$lib/types/gauge-types';
import { displayNumber } from '$lib/utils/number-utils';
import {
  getDaysInRange,
  getDaysPercent,
  getEvenlyDistributedRangeValuesWithEqualDayCount,
} from '$lib/utils/range-utils.svelte';
import { pluralize } from '$lib/utils/string-utils';
import chroma from 'chroma-js';

export function getRanges({
  rangeOptions,
  ranges,
  start,
  increment,
  colors,
  includeFromAndTo,
  dontIncludeFromAndTo,
  gaugeId = '',
}: {
  rangeOptions: GaugeRangeOptions;
  ranges: GaugeRange[];
  start: number | undefined;
  increment: number | undefined;
  colors: Color[];
  includeFromAndTo: boolean;
  dontIncludeFromAndTo: boolean;
  gaugeId?: 'temp' | 'prcp' | 'snow' | 'dayt' | '';
}): {
  ranges: GaugeRange[];
  mustUpdateCustomRanges: boolean;
  mode: GaugeRangeOptions['mode'];
  isCustomRanges: boolean;
} {
  let newRanges: GaugeRange[];
  let mustUpdateCustomRanges = false;
  let mode = rangeOptions.mode;
  let isCustomRanges = rangeOptions.isCustomRanges;
  if (rangeOptions.isCustomRanges) {
    // If 'manual' range calculations are used
    // newRanges = customRanges;

    if (colors.length === ranges.length) newRanges = ranges;
    else {
      let prop: 'tmax' | 'tavg' | 'tmin' | 'prcp' | 'snow' | 'dayt' | 'ranges' =
        rangeOptions.auto.optimization;
      if (prop === 'ranges') {
        // Only temp gauges have multiple props (tmax, tavg, tmin)
        // So if it's not a temp gauge, use the gauge id (e.g. prcp, snow)
        if (gaugeId !== 'temp' && gaugeId !== '') prop = gaugeId;
        // Otherwise if it is a temp gauge, use tmax as default
        else prop = 'tmax';
      }

      newRanges = getEvenlyDistributedRangeValuesWithEqualDayCount({
        weatherData: weather.data,
        numRanges: colors.length,
        prop,
        gaugeDirection: rangeOptions.direction,
        roundIncrement: rangeOptions.auto.roundIncrement,
        includeFrom: rangeOptions.includeFromValue,
        includeTo: rangeOptions.includeToValue,
      });
      mode === 'auto';
      isCustomRanges = false;
      toast.trigger({
        message: `Updated ranges automatically. Custom ranges overridden`,
        category: 'success',
        timeout: 10000,
      });
    }
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
    let _start = start ?? 0;
    const _increment = increment ?? 0;

    newRanges = colors.map((n, i) => {
      const isLastRange = i === colors.length - 1;

      let from = _start;
      let to = _start + _increment;

      if (!isLastRange && rangeOptions.mode !== 'manual')
        to += includeFromAndTo ? 0.01 : dontIncludeFromAndTo ? -0.01 : 0;

      _start += _increment;

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

  return { ranges: newRanges, mustUpdateCustomRanges, mode, isCustomRanges };
}

export const createGaugeColors = ({
  schemeId,
  numberOfColors,
  colors,
}: {
  schemeId: NonNullable<GaugeSettingsType['schemeId']>;
  numberOfColors: number;
  colors: Color[];
}): Color[] => {
  if (schemeId === 'Custom') {
    if (numberOfColors > colors.length) {
      const diff = numberOfColors - colors.length;

      if (diff === 1) {
        // Generate a single random color and add it to the colors array
        colors.push({ hex: chroma.random().hex() as Color['hex'] });
      } else {
        // Generate an array of random colors and add them to the colors array
        const randomColors = Array.from({ length: diff }, () => ({
          hex: chroma.random().hex() as Color['hex'],
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
      .scale(schemeId as chroma.BrewerPaletteName)
      .colors(numberOfColors)
      .map((n) => ({ hex: n as Color['hex'] }));
  }

  return colors;
};

export const getWPGauge = (
  gauge: GaugeStateInterface,
): Record<string, unknown>[] => {
  const content: Record<string, unknown>[] = [];

  if (!gauge.colors || !gauge.ranges) return content;
  const { colors, ranges } = gauge;

  colors.forEach((color, i) => {
    const details = gauge.targets.map((item, index, self) => {
      const count = getDaysInRange({
        id: item.id,
        range: ranges[i],
        direction: gauge?.rangeOptions?.direction,
        includeFromValue: gauge?.rangeOptions?.includeFromValue,
        includeToValue: gauge?.rangeOptions?.includeToValue,
        gaugeUnitType: gauge.unit.type,
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
    let range;
    if (gauge.unit.type === 'category') {
      const r = ranges[i] as GaugeRangeCategory;
      range = {
        value: r.value,
        label: r.label,
      };
    } else {
      const r = ranges[i] as GaugeRange;
      range = {
        from:
          r.from + ' ' + gauge.unit.label[preferences.value.units ?? 'metric'],
        to: r.to + ' ' + gauge.unit.label[preferences.value.units ?? 'metric'],
      };
    }
    content.push({
      color: color.hex,
      ...range,
      details,
    });
  });
  return content;
};

export const getTargetParentGaugeId = (
  targetId: WeatherParam['id'],
): GaugeAttributes['id'] => {
  return targetId === 'tmax' || targetId === 'tavg' || targetId === 'tmin'
    ? 'temp'
    : targetId;
};

export const getSchemeName = (id: string): string => {
  if (SCHEMES.some((n) => n.value === id))
    return SCHEMES.filter((scheme) => scheme.value === id)[0].label;
  return 'Custom';
};
