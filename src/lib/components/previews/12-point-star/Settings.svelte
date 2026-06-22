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
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import ToggleSwitchGroup from '$lib/components/buttons/ToggleSwitchGroup.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import { gauges } from '$lib/state/gauges-state.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import { pluralize } from '$lib/utils/string-utils';
  import { capitalizeFirstLetter } from '$lib/utils/other-utils';
  import { twelvePointStarPreview } from './state.svelte';
  import { Slider } from '@skeletonlabs/skeleton-svelte';
  import { MONTHS } from '$lib/constants/weather-constants';
  import { displayNumber } from '$lib/utils/number-utils';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());

  const MONTH_NAMES = MONTHS.map((m) => m.name);

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
    Each of the 12 points represents a month (starting with January at the top, moving clockwise).
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
      >, with
      <span class="font-semibold"
        >{twelvePointStarPreview.maxDaysInMonth} rows</span
      > per point.
      {#if monthsWithPadding.length > 0}
          Months with fewer than {twelvePointStarPreview.maxDaysInMonth}
          {pluralize(
            weather.grouping,
            twelvePointStarPreview.maxDaysInMonth,
          )} have extra rows filled with the accent color.
      {/if}
      <div class="mt-4">
        <p class="text-sm font-semibold">Important Note:</p>
        <p class="text-sm text-surface-600-400 mt-1 leading-relaxed">
          The 12-Point Star works best with exactly 12 complete months of weather data (January to December). If there are fewer than 12 months, points representing missing months will remain completely filled with the accent color. If there are more than 12 months, days from the same calendar month across multiple years are stacked together in the same point, resulting in longer points.
        </p>
      </div>
    {/if}
  {/snippet}
</PreviewInfo>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Star Settings</p>

  <div class="w-full max-w-md text-left mb-4">
    <Slider defaultValue={[twelvePointStarPreview.settings.sharpness]} min={0} max={15} step={1} onValueChange={({value}) => twelvePointStarPreview.settings.sharpness = value[0]}>
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
      <Slider.Marker class="inset-s-auto! translate-x-0! translate-y-0!" value={0}>Flat</Slider.Marker>
      {#each Array(12).keys() as i}
        {@const value = i + 2}
        <Slider.Marker class="opacity-30" value={value}>{displayNumber((i + 2) / 15 * 100, 0)}%</Slider.Marker>
      {/each}
      <Slider.Marker  class="inset-s-[calc(100%-48px)]! translate-x-0! translate-y-0!" value={4}>Sharp</Slider.Marker>
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
        {@const value = i}
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
    Accent Color (for center star and padding rows)
  </button>

  <div>

    <ToggleSwitch
    bind:checked={twelvePointStarPreview.settings.showBorder}
    label="Outer Border"
  />
  </div>

  {#if twelvePointStarPreview.settings.showBorder}
    <label class="label">
      <span class="label-text">Border Size</span>
      <select
        class="select w-fit min-w-[80px]"
        bind:value={twelvePointStarPreview.settings.borderThickness}
      >
        {#each Array(10), i}
          {@const value = i + 1}
          <option {value}>
            {value} {pluralize('round', value)}
          </option>
        {/each}
      </select>
    </label>

    <button
      class="btn hover:preset-tonal-surface text-left whitespace-pre-wrap"
      title="Choose a Border Color"
      onclick={() =>
        dialog.trigger({
          type: 'component',
          component: {
            ref: ChangeColor,
            props: {
              hex: twelvePointStarPreview.settings.borderColor,
              onChangeColor: ({ hex }) => {
                twelvePointStarPreview.settings.borderColor = hex;
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
        color={twelvePointStarPreview.settings.borderColor}
      />
      Border Color
    </button>
  {/if}
</div>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Row Settings</p>

  <ToggleSwitchGroup
    groupLabel={`Color Each Row Using the ${capitalizeFirstLetter(weather.grouping)}'s`}
    {targets}
    bind:value={twelvePointStarPreview.settings.selectedTargets}
  />
</div>
