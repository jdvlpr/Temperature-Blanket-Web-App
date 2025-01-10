<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script context="module" lang="ts">
  import type { GaugeSettings } from '$lib/types';
  import chroma from 'chroma-js';
  import { writable, type Writable } from 'svelte/store';

  export const settings: Writable<GaugeSettings> = writable({
    colors: chroma
      .scale('PuBu')
      .colors(4)
      .map((n) => {
        return { hex: n };
      }),
    id: 'snow',
    numberOfColors: 4,
    ranges: [],
    rangeOptions: {
      auto: {
        optimization: 'ranges', // 'ranges' | 'snow'
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
    schemeId: 'PuBu',
  });

  export const gaugeAttributes: GaugeAttributes = {
    id: 'snow',
    label: 'Snow Gauge',
    unit: {
      type: 'height',
      label: {
        metric: 'mm',
        imperial: 'in',
      },
    },
    targets: [
      {
        id: 'snow',
        label: 'Snow',
        type: 'height',
        gaugeLabel: 'Snow',
        shortLabel: 'Snow',
        pdfHeader: {
          metric: 'Snow (mm)',
          imperial: 'Snow (in)',
        },
        icon: '∗',
      },
    ],
  };
</script>

<script>
  import Gauge from '$lib/components/Gauge.svelte';
  import { weatherParametersData } from '$lib/stores';
  import type { GaugeAttributes } from '$lib/types/gauge-types';
  import { displayNumber } from '$lib/utils';

  $: maxes = weatherParametersData.snow.filter((n) => n !== null);
  $: mins = weatherParametersData.snow.filter((n) => n !== null);

  $: max = Number.isInteger(Math.max(...maxes))
    ? Math.max(...maxes) + 1
    : Math.ceil(Math.max(...maxes));
  $: min = Number.isInteger(Math.min(...mins))
    ? Math.min(...mins) - 1
    : Math.floor(Math.min(...mins));

  $: $settings.rangeOptions.auto.increment = displayNumber(
    (max - min) / $settings.colors.length,
    2,
  );

  $: $settings.rangeOptions.auto.start.high = max;
  $: $settings.rangeOptions.auto.start.low = min;

  $: if ($settings.rangeOptions.manual.increment === null)
    $settings.rangeOptions.manual.increment =
      $settings.rangeOptions.auto.increment;

  $: if ($settings.rangeOptions.manual.start === null)
    $settings.rangeOptions.manual.start =
      $settings.rangeOptions.auto.start.high;

  $: if (!$settings.ranges.length) {
    let start = max;
    let increment = $settings.rangeOptions.auto.increment;
    $settings.ranges = $settings.colors.map((n, i) => {
      let from = displayNumber(start);
      let to = displayNumber(start - increment);
      let item = { from, to };
      start -= increment;
      return item;
    });
  }
</script>

<Gauge
  bind:numberOfColors={$settings.numberOfColors}
  bind:ranges={$settings.ranges}
  bind:colors={$settings.colors}
  bind:schemeId={$settings.schemeId}
  bind:rangeOptions={$settings.rangeOptions}
  {gaugeAttributes}
/>
