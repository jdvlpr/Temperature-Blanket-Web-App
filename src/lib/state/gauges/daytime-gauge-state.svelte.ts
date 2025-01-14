import type { GaugeSettingsType } from '$lib/types';
import chroma from 'chroma-js';

export const defaultGaugeSettings: GaugeSettingsType = {
  colors: chroma
    .scale('YlOrBr')
    .colors(5)
    .map((n) => {
      return { hex: n };
    }),
  id: 'dayt',
  numberOfColors: 5,
  rangeOptions: {
    auto: {
      optimization: 'ranges', // 'ranges | 'dayt'
      start: {
        high: null,
        low: null,
      },
      increment: null,
      roundIncrement: false,
    },
    manual: {
      start: null,
      increment: null,
    },
    direction: 'high-to-low',
    includeFromValue: true,
    includeToValue: false,
    linked: true,
    mode: 'auto', // auto | manual
    isCustomRanges: false,
  },
  schemeId: 'YlOrBr',
};

export const gaugeAttributes: GaugeAttributes = {
  id: 'dayt',
  label: 'Daytime Gauge',
  unit: {
    type: 'time',
    label: {
      metric: 'min',
      imperial: 'hr',
    },
  },
  targets: [
    {
      id: 'dayt',
      label: 'Daytime',
      type: 'time',
      gaugeLabel: 'Daytime',
      shortLabel: 'Daytime',
      pdfHeader: {
        metric: 'Sun (h:m)',
        imperial: 'Sun (h:m)',
      },
      icon: '☼',
    },
  ],
};

import { weather } from '$lib/state';
import type { GaugeAttributes } from '$lib/types';
import { displayNumber } from '$lib/utils';

$: maxes = weather.params.dayt.filter((n) => n !== null);
$: mins = weather.params.dayt.filter((n) => n !== null);

$: max = Number.isInteger(Math.max(...maxes))
  ? Math.max(...maxes) + 1
  : Math.ceil(Math.max(...maxes));
$: min = Number.isInteger(Math.min(...mins))
  ? Math.min(...mins) - 1
  : Math.floor(Math.min(...mins));

$: $defaultGaugeSettings.rangeOptions.auto.increment = displayNumber(
  (max - min) / $defaultGaugeSettings.colors.length,
  2,
);
$: $defaultGaugeSettings.rangeOptions.auto.start.high = max;
$: $defaultGaugeSettings.rangeOptions.auto.start.low = min;

$: if ($defaultGaugeSettings.rangeOptions.manual.increment === null)
  $defaultGaugeSettings.rangeOptions.manual.increment =
    $defaultGaugeSettings.rangeOptions.auto.increment;

$: if ($defaultGaugeSettings.rangeOptions.manual.start === null)
  $defaultGaugeSettings.rangeOptions.manual.start =
    $defaultGaugeSettings.rangeOptions.auto.start.high;

$: if (!$defaultGaugeSettings.ranges.length) {
  let start = max;
  let increment = $defaultGaugeSettings.rangeOptions.auto.increment;
  if (increment * $defaultGaugeSettings.colors.length > start) {
    $defaultGaugeSettings.colors.length = start;
    $defaultGaugeSettings.numberOfColors = start;
  }
  $defaultGaugeSettings.ranges = $defaultGaugeSettings.colors.map((n, i) => {
    let item = {
      from: displayNumber(start),
      to: displayNumber(start - increment),
    };
    start -= increment;
    return item;
  });
}
