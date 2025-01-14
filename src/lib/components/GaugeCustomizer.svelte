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

<script lang="ts">
  import ColorRange from '$lib/components/ColorRange.svelte';
  import DaysInRange from '$lib/components/DaysInRange.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import ViewToggle from '$lib/components/buttons/ViewToggle.svelte';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import { ICONS } from '$lib/constants';
  import { gauges, layout, modal, showDaysInRange } from '$lib/state';
  import type { Color } from '$lib/types';
  import { getTextColor } from '$lib/utils';
  import {
    dndzone,
    dragHandle,
    dragHandleZone,
    SOURCES,
  } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  let dragDisabled = $state(false);

  const flipDurationMs = 90;

  function checkForAffiliateURLs({ colors }) {
    return colors?.some((n) => n?.affiliate_variant_href);
  }

  function onChangeColor({
    index,
    hex,
    name,
    brandId,
    yarnId,
    brandName,
    yarnName,
    variant_href,
    affiliate_variant_href,
  }) {
    gauges.activeGauge.schemeId = 'Custom';

    const _colors = [];
    gauges.activeGauge.colors.forEach((color, i) => {
      if (i === index) {
        _colors.push({
          hex,
          name,
          brandId,
          yarnId,
          brandName,
          yarnName,
          variant_href,
          affiliate_variant_href,
        });
      } else {
        _colors.push(color);
      }
      gauges.activeGauge.colors = _colors;
    });

    sortableColors = getSortableColors();
  }

  function handleConsider(e) {
    dragDisabled = true;
    const {
      items: newItems,
      info: { source, trigger, id },
    } = e.detail;

    sortableColors = newItems;
  }

  function handleFinalize(e) {
    const {
      items: newItems,
      info: { source },
    } = e.detail;

    sortableColors = newItems;

    gauges.activeGauge.colors = sortableColors.map((color) => {
      delete color.id;
      return color;
    });

    gauges.activeGauge.schemeId = 'Custom';
    // Ensure dragging is stopped on drag finish via pointer (mouse, touch)
    if (source === SOURCES.POINTER) {
      dragDisabled = false;
    }
  }
  function startDrag(e) {
    // preventing default to prevent lag on touch devices (because of the browser checking for screen scrolling)
    e.preventDefault();
    dragDisabled = false;
  }

  let movable = $derived(gauges.activeGauge.colors?.length > 1);

  let hasAnyAffiliateURLs = $derived(
    checkForAffiliateURLs({ colors: gauges.activeGauge.colors }),
  );

  let sortableColors: Color[] = $state(getSortableColors());

  function getSortableColors() {
    const _sortableColors = [];
    gauges.activeGauge.colors.forEach((color, i) => {
      _sortableColors.push({ ...color, id: i });
    });
    return _sortableColors;
  }

  // $effect(() => {
  //   sortableColors = colors.map((color, i) => {
  //     color.id = i;
  //     return color;
  //   });
  // });
</script>

{#if hasAnyAffiliateURLs}
  <p class="px-2 mt-4 text-sm">
    Items purchased through links with a shopping bag icon
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="w-4 h-4 inline relative bottom-1"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
      />
    </svg>
    help support this site by earning the developer a percentage of each sale, at
    no additional cost to you.
  </p>
{/if}

<div class="grid grid-cols-12 gap-2 pt-2">
  <div
    class="flex flex-col items-start text-left gap-1 col-span-full md:col-span-8"
  >
    <ToggleSwitch
      bind:checked={showDaysInRange.value}
      label={`Show number of days in ranges`}
      details="Applies to the view below and PDF file"
    />
  </div>

  <div
    class="my-2 col-span-full flex flex-wrap justify-center md:justify-end md:col-span-4 md:cols-start-9"
  >
    <ViewToggle />
  </div>
</div>

<div
  class="rounded-container-token overflow-hidden mt-2 mb-2 lg:mb-4 {layout.value ===
  'grid'
    ? 'gap-1 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
    : 'flex flex-col'}"
  use:dragHandleZone={{
    items: sortableColors,
    flipDurationMs,
    type: 'gaugeCustomizer',
    dragDisabled,
  }}
  onconsider={handleConsider}
  onfinalize={handleFinalize}
>
  {#each sortableColors as { hex, name, brandId, yarnId, brandName, yarnName, variant_href, affiliate_variant_href, id }, index (id)}
    <div
      class="color p-2 gap-2 flex flex-wrap justify-around {layout.value ===
      'grid'
        ? 'rounded-container-token md:basis-1/5 sm:basis-1/4 basis-1/3 flex-auto'
        : ''}"
      style="background:{hex};color:{getTextColor(hex)}"
      animate:flip={{ duration: flipDurationMs }}
    >
      {#if movable}
        <button
          title="Remove Color"
          class="btn bg-secondary-hover-token flex flex-wrap justify-center items-center"
          onclick={() => {
            gauges.activeGauge.colors = gauges.activeGauge.colors.filter(
              (_, i) => i !== index,
            );
            sortableColors = getSortableColors();
            gauges.activeGauge.schemeId = 'Custom';
            gauges.activeGauge.numberOfColors =
              gauges.activeGauge.colors.length;
          }}
        >
          <span class="text-xs">{index + 1}</span>
          {@html ICONS.trash}
        </button>
      {/if}

      <button
        title="Move Color"
        tabindex="-1"
        aria-label="Crag handle for color {index + 1}"
        class="btn-icon bg-secondary-hover-token handle p-2 {dragDisabled
          ? 'cursor-grabbing'
          : 'cursor-grab'}"
        onmousedown={startDrag}
        ontouchstart={startDrag}
        use:dragHandle
      >
        {@html ICONS.arrowsPointingOut}
      </button>

      <button
        class="btn bg-secondary-hover-token flex items-center justify-start"
        title="Choose a Color"
        onclick={() =>
          modal.state.trigger({
            type: 'component',
            component: {
              ref: ChangeColor,
              props: {
                index,
                hex,
                name,
                brandId,
                yarnId,
                brandName,
                yarnName,
                variant_href,
                affiliate_variant_href,
                onChangeColor,
              },
            },
          })}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6 flex-shrink-0"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
        <span
          class="flex flex-col items-start justify-start text-left text-wrap"
        >
          <span class="text-xs">
            {#if brandName && yarnName}
              {brandName}
              -
              {yarnName}
            {:else}
              Find Matching Yarn
            {/if}
          </span>
          <span class="text-lg leading-tight"> {name || hex}</span>
        </span>
      </button>

      {#if affiliate_variant_href}
        <a
          class="btn bg-secondary-hover-token flex flex-wrap justify-center items-center"
          href={affiliate_variant_href}
          target="_blank"
          rel="noreferrer nofollow"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          <span class="underline">Buy</span>
        </a>
      {/if}

      <div class="flex gap-2">
        {#key index}
          <ColorRange {index} />
        {/key}
      </div>

      {#if showDaysInRange.value}
        <div
          class="flex flex-wrap w-fit justify-center items-center bg-surface-900/10 rounded-container-token shadow-inner"
        >
          <DaysInRange
            range={gauges.activeGauge.ranges[index]}
            rangeOptions={gauges.activeGauge.rangeOptions}
            targets={gauges.activeGauge.targets}
          />
        </div>
      {/if}
    </div>
  {/each}
</div>
