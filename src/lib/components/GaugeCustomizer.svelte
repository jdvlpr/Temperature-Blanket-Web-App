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
  import { page } from '$app/state';
  import ColorRange from '$lib/components/ColorRange.svelte';
  import DaysInRange from '$lib/components/DaysInRange.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import ViewToggle from '$lib/components/buttons/ViewToggle.svelte';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import { localState, modal, showDaysInRange } from '$lib/state';
  import type { Color } from '$lib/types';
  import { getTextColor } from '$lib/utils';
  import {
    MoveIcon,
    SearchIcon,
    ShoppingBagIcon,
    Trash2Icon,
  } from '@lucide/svelte';
  import { dragHandle, dragHandleZone, SOURCES } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  let { gauge = $bindable() } = $props();

  let dragDisabled = $state(false);

  const flipDurationMs = 90;

  const isProjectPlannerPage = page.route.id === '/';

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
    gauge.schemeId = 'Custom';

    const _colors = [];
    gauge.colors.forEach((color, i) => {
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
      gauge.colors = _colors;
    });

    sortableColors = getSortableColors();
    modal.close();
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

    gauge.colors = sortableColors.map((color) => {
      delete color.id;
      return color;
    });

    gauge.schemeId = 'Custom';
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

  let movable = $derived(gauge.colors?.length > 1);

  let hasAnyAffiliateURLs = $derived(
    checkForAffiliateURLs({ colors: gauge.colors }),
  );

  let sortableColors: Color[] = $state(getSortableColors());

  function getSortableColors() {
    const _sortableColors = [];
    gauge.colors.forEach((color, i) => {
      _sortableColors.push({ ...color, id: i });
    });
    return _sortableColors;
  }
</script>

{#if hasAnyAffiliateURLs}
  <p class="mt-4 px-2 text-sm">
    Items purchased through links with a shopping bag icon
    <ShoppingBagIcon class="inline size-4" />
    help support this site by earning the developer a percentage of each sale, at
    no additional cost to you.
  </p>
{/if}

<div class="grid grid-cols-12 gap-2 pt-2">
  {#if isProjectPlannerPage}
    <div
      class="col-span-full flex w-fit flex-col items-start gap-1 text-left md:col-span-8"
    >
      <ToggleSwitch
        bind:checked={showDaysInRange.value}
        label={`Show number of days in ranges`}
        details="Applies to the view below and PDF file"
      />
    </div>
  {/if}

  <div
    class="col-span-full my-2 flex flex-wrap justify-center {isProjectPlannerPage
      ? 'md:cols-start-9 md:col-span-4 md:justify-end'
      : ''}"
  >
    <ViewToggle />
  </div>
</div>

<div
  class="rounded-container mt-2 mb-2 overflow-hidden lg:mb-4 {localState.value
    .layout === 'grid'
    ? 'grid grid-cols-2 gap-1 md:grid-cols-3 xl:grid-cols-4'
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
      class="color flex flex-wrap items-center justify-around gap-2 p-2 {localState
        .value.layout === 'grid'
        ? 'rounded-container flex-auto basis-1/3 sm:basis-1/4 md:basis-1/5'
        : ''}"
      style="background:{hex};color:{getTextColor(hex)}"
      animate:flip={{ duration: flipDurationMs }}
    >
      {#if movable}
        <button
          title="Remove Color"
          class="btn hover:preset-tonal flex flex-wrap items-center justify-center"
          onclick={() => {
            gauge.updateColors({
              colors: gauge.colors.filter((_, i) => i !== index),
            });
            sortableColors = getSortableColors();
            gauge.schemeId = 'Custom';
          }}
        >
          <span class="text-xs">{index + 1}</span>
          <Trash2Icon />
        </button>
      {/if}

      <button
        title="Move Color"
        tabindex="-1"
        aria-label="Crag handle for color {index + 1}"
        class="btn-icon hover:preset-tonal handle p-2 {dragDisabled
          ? 'cursor-grabbing'
          : 'cursor-grab'}"
        onmousedown={startDrag}
        ontouchstart={startDrag}
        use:dragHandle
      >
        <MoveIcon />
      </button>

      <button
        class="btn hover:preset-tonal h-auto"
        title="Choose a Color"
        onclick={() =>
          modal.trigger({
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
            options: {
              size: 'medium',
            },
          })}
      >
        <SearchIcon />
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
          class="btn hover:preset-tonal"
          href={affiliate_variant_href}
          target="_blank"
          rel="noreferrer nofollow"
        >
          <ShoppingBagIcon />
          <span class="underline">Buy</span>
        </a>
      {/if}

      {#if isProjectPlannerPage}
        <div class="flex gap-2">
          {#key index}
            <ColorRange {index} />
          {/key}
        </div>

        {#if showDaysInRange.value}
          <div
            class="bg-surface-900/10 rounded-container flex w-fit flex-wrap items-center justify-center overflow-hidden shadow-inner"
          >
            <DaysInRange
              range={gauge.ranges[index]}
              rangeOptions={gauge.rangeOptions}
              targets={gauge.targets}
            />
          </div>
        {/if}
      {/if}
    </div>
  {/each}
</div>
