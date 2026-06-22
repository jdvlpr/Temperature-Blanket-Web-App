<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script lang="ts">
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import PreviewInfo from '$lib/components/PreviewInfo.svelte';
  import SpanYarnColorSelectIcon from '$lib/components/SpanYarnColorSelectIcon.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import { gauges } from '$lib/state/gauges-state.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import { pluralize } from '$lib/utils/string-utils';
  import { capitalizeFirstLetter } from '$lib/utils/other-utils';
  import { twelvePointStarPreview } from './state.svelte';
  import { Slider } from '@skeletonlabs/skeleton-svelte';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());

  const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  let monthsWithPadding = $derived(
    twelvePointStarPreview.weatherByMonth
      .map((days, i) => ({
        name: MONTH_NAMES[i],
        days: days.length,
        padding: twelvePointStarPreview.maxDaysInMonth - days.length,
      }))
      .filter((m) => m.days > 0 && m.padding > 0),
  );
</script>

<PreviewInfo previewTitle={twelvePointStarPreview.name}>
  {#snippet description()}
    Each of the 12 points represents a month (January at top, clockwise).
    Each chevron row within a point represents one {weather.grouping}'s weather
    data, radiating outward from the center.
  {/snippet}

  {#snippet details()}
    {#if twelvePointStarPreview.weatherByMonth.some((m) => m.length > 0)}
      There are <span class="font-semibold"
        >{weather.data.length}
        {pluralize(weather.grouping, weather.data.length)}</span
      >
      of weather data across
      <span class="font-semibold"
        >{twelvePointStarPreview.weatherByMonth.filter((m) => m.length > 0).length}
        {pluralize(
          'month',
          twelvePointStarPreview.weatherByMonth.filter((m) => m.length > 0)
            .length,
        )}</span
      >, with up to
      <span class="font-semibold"
        >{twelvePointStarPreview.maxDaysInMonth} rows</span
      > per point.
      {#if monthsWithPadding.length > 0}
        <p class="mt-1 text-sm italic">
          Months with fewer than {twelvePointStarPreview.maxDaysInMonth}
          {pluralize(
            weather.grouping,
            twelvePointStarPreview.maxDaysInMonth,
          )} have extra rows filled with the accent color.
        </p>
      {/if}
    {/if}
  {/snippet}
</PreviewInfo>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Star Settings</p>

  <div class="w-full max-w-sm text-left px-4 mb-4">
    <Slider defaultValue={[twelvePointStarPreview.settings.sharpness]} min={0} max={4} step={1} onValueChange={({value}) => twelvePointStarPreview.settings.sharpness = value[0]}>
    <Slider.Label>Star Sharpness</Slider.Label>
    <Slider.Control>
      <Slider.Track>
        <Slider.Range />
      </Slider.Track>
      <Slider.Thumb index={0}>
        <Slider.HiddenInput />
      </Slider.Thumb>
    </Slider.Control>
    <Slider.MarkerGroup>
      <Slider.Marker value={0}>Circular</Slider.Marker>
      <Slider.Marker value={4}>Pointy</Slider.Marker>
    </Slider.MarkerGroup>
  </Slider>
  </div>

  <label class="label">
    <span class="label-text">Center Size</span>
    <select
      class="select w-fit min-w-[60px]"
      bind:value={twelvePointStarPreview.settings.centerSize}
    >
      {#each Array(11), i}
        {@const value = i + 1}
        <option {value}>
          {value}
        </option>
      {/each}
    </select>
  </label>

  <button
    class="btn hover:preset-tonal-surface text-left whitespace-pre-wrap"
    title="Choose a Color"
    onclick={() =>
      dialog.trigger({
        type: 'component',
        component: {
          ref: ChangeColor,
          props: {
            hex: twelvePointStarPreview.settings.additionalRoundsColor,
            onChangeColor: ({ hex }) => {
              twelvePointStarPreview.settings.additionalRoundsColor = hex;
              dialog.close();
            },
          },
        },
        options: {
          size: 'large',
        },
      })}
  >
    <SpanYarnColorSelectIcon
      color={twelvePointStarPreview.settings.additionalRoundsColor}
    />
    Accent Color (center star and padding rows)
  </button>
</div>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Row Settings</p>

  <label class="label">
    <span class="label-text"
      >Color Each Row Using the {capitalizeFirstLetter(
        weather.grouping,
      )}'s</span
    >
    <select
      class="select w-fit"
      id="twsr-param"
      bind:value={twelvePointStarPreview.settings.selectedTarget}
    >
      {#each targets as { id, label, icon }}
        <option value={id}>{icon} {label} </option>
      {/each}
    </select>
  </label>
</div>
