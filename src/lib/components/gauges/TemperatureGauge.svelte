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

<script module lang="ts">
  import type { GaugeSettings } from '$lib/types';
  import chroma from 'chroma-js';

  export const gaugeSettings: Writable<GaugeSettings> = writable({
    colors: chroma
      .scale('Spectral')
      .colors(10)
      .map((n) => {
        return { hex: n };
      }),
    id: 'temp',
    numberOfColors: 10,
    ranges: [],
    rangeOptions: {
      auto: {
        optimization: 'tmax',
        start: {
          high: 100,
          low: 0,
        },
        increment: 10,
        roundIncrement: true,
      },
      manual: {
        start: 100,
        increment: 10,
      },
      direction: 'high-to-low',
      includeFromValue: true,
      includeToValue: false,
      linked: true,
      mode: 'auto', // equal range increments ('auto') | equal days ('jenks') | 'manual'
      isCustomRanges: false,
    },
    schemeId: 'Spectral',
  });

  export const gaugeAttributes: GaugeAttributes = {
    id: 'temp',
    label: 'Temperature Gauge',
    unit: {
      type: 'temperature',
      label: {
        metric: '°C',
        imperial: '°F',
      },
    },
    targets: [
      {
        id: 'tmax',
        label: 'High Temperature',
        type: 'temperature',
        gaugeLabel: 'High',
        shortLabel: 'High Temp',
        pdfHeader: {
          metric: 'High (°C)',
          imperial: 'High (°F)',
        },
        icon: '↑',
      },
      {
        id: 'tavg',
        label: 'Average Temperature',
        type: 'temperature',
        gaugeLabel: 'Average',
        shortLabel: 'Average Temp',
        pdfHeader: {
          metric: 'Avg (°C)',
          imperial: 'Avg (°F)',
        },
        icon: '~',
      },
      {
        id: 'tmin',
        label: 'Low Temperature',
        type: 'temperature',
        gaugeLabel: 'Low',
        shortLabel: 'Low Temp',
        pdfHeader: {
          metric: 'Low (°C)',
          imperial: 'Low (°F)',
        },
        icon: '↓',
      },
    ],
  };
</script>

<script>
  import Gauge from '$lib/components/Gauge.svelte';
  import { tmax, tmin } from '$lib/stores';
  import type { GaugeAttributes } from '$lib/types/gauge-types';
  import {
    displayNumber,
    getEvenlyDistributedRangeValuesWithEqualDayCount,
  } from '$lib/utils';
  import { run } from 'svelte/legacy';
  import { writable, type Writable } from 'svelte/store';

  let maxes = $derived($tmax.filter((n) => n !== null));
  let mins = $derived($tmin.filter((n) => n !== null));

  let max = $derived(
    Number.isInteger(Math.max(...maxes))
      ? Math.max(...maxes) + 1
      : Math.ceil(Math.max(...maxes)),
  );

  let min = $derived(
    Number.isInteger(Math.min(...mins))
      ? Math.min(...mins) - 1
      : Math.floor(Math.min(...mins)),
  );

  run(() => {
    $gaugeSettings.rangeOptions.auto.increment = displayNumber(
      (max - min) / $gaugeSettings.colors.length || 10,
      2,
    );
  });

  run(() => {
    $gaugeSettings.rangeOptions.auto.start.high = max;
  });

  run(() => {
    $gaugeSettings.rangeOptions.auto.start.low = min;
  });

  run(() => {
    if ($gaugeSettings.rangeOptions.manual.increment === null)
      $gaugeSettings.rangeOptions.manual.increment =
        $gaugeSettings.rangeOptions.auto.increment;
  });

  run(() => {
    if ($gaugeSettings.rangeOptions.manual.start === null)
      $gaugeSettings.rangeOptions.manual.start =
        $gaugeSettings.rangeOptions.auto.start.high;
  });

  run(() => {
    if (!$gaugeSettings.ranges.length) {
      let start = max;
      let increment = $gaugeSettings.rangeOptions.auto.increment;
      if (
        $gaugeSettings.rangeOptions?.auto?.optimization !== 'ranges' &&
        $gaugeSettings.rangeOptions?.mode === 'auto'
      ) {
        const newRanges = getEvenlyDistributedRangeValuesWithEqualDayCount({
          weatherData: null,
          numRanges: $gaugeSettings.colors.length,
          prop: $gaugeSettings.rangeOptions.auto.optimization,
          gaugeDirection: $gaugeSettings.rangeOptions.direction,
          roundIncrement: $gaugeSettings.rangeOptions.auto.roundIncrement,
          includeFrom: $gaugeSettings.rangeOptions.includeFromValue,
          includeTo: $gaugeSettings.rangeOptions.includeToValue,
        });
        $gaugeSettings.ranges = newRanges;
      } else {
        $gaugeSettings.ranges = $gaugeSettings?.colors.map((n, i) => {
          let item = {
            from: displayNumber(start, 0),
            to: displayNumber(start - increment, 0),
          };
          start -= increment;
          return item;
        });
      }
    }
  });
</script>

<Gauge
  {gaugeAttributes}
  bind:numberOfColors={$gaugeSettings.numberOfColors}
  bind:schemeId={$gaugeSettings.schemeId}
  bind:ranges={$gaugeSettings.ranges}
  bind:rangeOptions={$gaugeSettings.rangeOptions}
  bind:colors={$gaugeSettings.colors}
/>
