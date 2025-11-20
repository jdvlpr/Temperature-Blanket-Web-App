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
  import { localState, dialog, showDaysInRange } from '$lib/state';
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

  let isStaticGauge = $state(gauge.isStatic);

  let dragDisabled = $state(false);

  const flipDurationMs = 90;

  const isProjectPlannerPage = page.route.id === '/';

  let movable = $derived(gauge.colors?.length > 1);

  let hasAnyAffiliateURLs = $derived(
    gauge.colors?.some((color: Color) => color?.affiliate_variant_href),
  );

  let sortableColors: Color[] = $state(getSortableColors());

  let numberOfColumns = $derived.by(() => {
    let cols = 4;
    if (hasAnyAffiliateURLs) cols++;
    if (sortableColors.length < 2) cols--;
    if (!isProjectPlannerPage) {
      cols--;
      return cols;
    }
    if (showDaysInRange.value) cols++;
    return cols;
  });

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
    dialog.close();
  }

  function handleConsider(e: any) {
    dragDisabled = true;
    sortableColors = e.detail.items;
  }

  function handleFinalize(e: any) {
    const {
      items: newItems,
      info: { source },
    } = e.detail;

    sortableColors = newItems;

    gauge.colors = sortableColors.map((color: Color) => {
      delete color.id;
      return color;
    });

    gauge.schemeId = 'Custom';
    // Ensure dragging is stopped on drag finish via pointer (mouse, touch)
    if (source === SOURCES.POINTER) {
      dragDisabled = false;
    }
  }
  function startDrag(e: any) {
    // preventing default to prevent lag on touch devices (because of the browser checking for screen scrolling)
    e.preventDefault();
    dragDisabled = false;
  }

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
      class="col-span-full flex w-fit flex-col items-start gap-1 text-left lg:col-span-8"
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
      ? 'lg:cols-start-9 lg:col-span-4 lg:justify-end'
      : ''}"
  >
    <ViewToggle />
  </div>
</div>

<div
  class="rounded-container mt-2 mb-2 overflow-hidden lg:mb-4 {localState.value
    .layout === 'grid'
    ? 'grid grid-cols-2 gap-1 lg:grid-cols-3 xl:grid-cols-4'
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
        ? 'rounded-container flex-auto basis-1/3  sm:basis-1/4 md:basis-1/5'
        : `${isProjectPlannerPage ? numberOfColumns < 5 && 'lg:grid lg:grid-cols-[1fr_3fr_1fr]' : 'lg:grid lg:grid-cols-[1fr_1.4fr_1fr]'}`}"
      style="background:{hex};color:{getTextColor(hex)}"
      animate:flip={{ duration: flipDurationMs }}
    >
      <div
        class={[
          'hidden',
          localState.value.layout === 'list' &&
            'lg:block lg:h-full lg:w-full lg:flex-auto',
        ]}
      ></div>
      
      <div
        class="flex flex-auto flex-wrap items-center justify-around gap-2"
      >
        <div class="flex flex-wrap items-center gap-2">
          {#if movable && !isStaticGauge}
            <button
              title="Remove Color"
              class="btn hover:preset-tonal flex flex-wrap items-center justify-center"
              onclick={() => {
                gauge.updateColors({
                  colors: gauge.colors.filter(
                    (_: Color, i: number) => i !== index,
                  ),
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
        </div>

        {#if isProjectPlannerPage}
          {#if gauge?.unit.type === 'category'}
            <p class="p-2 min-w-[140px] text-left">{gauge.ranges[index].label}</p>
          {:else}
            <div
              class={['flex gap-2', localState.value.layout === 'grid' ? '' : '']}
            >
              {#key index}
                <ColorRange {index} />
              {/key}
            </div>
          {/if}
        {/if}

        <div class={[localState.value.layout === 'list' && 'flex-auto']}>
          <button
            class={['btn hover:preset-tonal flex h-auto justify-start']}
            title="Choose a Color"
            onclick={() =>
              dialog.trigger({
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
        </div>

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
          {#if showDaysInRange.value}
            <div
              class="bg-surface-900/10 rounded-container flex w-fit flex-wrap items-center justify-center overflow-hidden shadow-inner"
            >
              <DaysInRange
                range={gauge.ranges[index]}
                rangeOptions={gauge?.rangeOptions}
                targets={gauge.targets}
                gaugeUnitType={gauge.unit.type}
              />
            </div>
          {/if}
        {/if}
      </div>
      <div
        class={[
          'hidden',
          localState.value.layout === 'list' &&
            'lg:block lg:h-full lg:w-full lg:flex-auto',
        ]}
      ></div>
    </div>
  {/each}
</div>
