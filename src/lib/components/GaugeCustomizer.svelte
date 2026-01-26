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
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import ViewToggle from '$lib/components/buttons/ViewToggle.svelte';
  import ColorRange from '$lib/components/ColorRange.svelte';
  import DaysInRange from '$lib/components/DaysInRange.svelte';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { dialog, gauges, showDaysInRange } from '$lib/state';
  import { preferences } from '$lib/storage/preferences.svelte';
  import type { Color } from '$lib/types';
  import { getTextColor } from '$lib/utils';
  import {
    LayoutPanelTopIcon,
    MoveIcon,
    SearchIcon,
    ShoppingCartIcon,
    Trash2Icon,
  } from '@lucide/svelte';
  import { Popover, Portal } from '@skeletonlabs/skeleton-svelte';
  import { dragHandle, dragHandleZone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import RangeOptionsButton from './buttons/RangeOptionsButton.svelte';

  const flipDurationMs = 150;

  const isProjectPlannerPage = page.route.id === '/';

  let { gauge = $bindable() } = $props();

  let isStaticGauge = $state(gauge.isStatic);

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

  // Handle color change from ChangeColor modal
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

  // Handle drag and drop events
  function handleConsider(e: any) {
    sortableColors = e.detail.items;
  }

  // On drag end, update the gauge colors
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
  }

  // Prepare sortable colors with IDs for svelte-dnd-action
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
    Purchases via links with a shopping cart icon <ShoppingCartIcon
      class="relative -top-px inline size-4"
    /> support the developer of this site at no extra cost to you.
  </p>
{/if}

<div class={['mt-4 flex flex-wrap justify-center gap-4']}>
  {#if isProjectPlannerPage}
    <div class={[gauges.activeGauge?.isStatic && 'hidden']}>
      <RangeOptionsButton />
    </div>
    <Popover>
      <Popover.Trigger
        class="btn hover:preset-tonal"
        aria-label="View Options"
        title="View Options"
      >
        <LayoutPanelTopIcon />
        View
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            class="card bg-surface-200-800 z-49 w-72 max-w-(--breakpoint-sm) p-2 shadow-xl"
          >
            {#snippet element(attributes)}
              {#if !attributes.hidden}
                <div {...attributes} in:safeSlide>
                  <Popover.Description class="flex flex-col gap-4 p-2">
                    <div class="w-fit"><ViewToggle /></div>
                    <div class="w-fit">
                      <ToggleSwitch
                        bind:checked={showDaysInRange.value}
                        label={`Show number of days in ranges`}
                      />
                    </div>
                  </Popover.Description>
                  <Popover.Arrow
                    style="--arrow-size: calc(var(--spacing) * 4); --arrow-background: var(--color-surface-200-800);"
                  >
                    <Popover.ArrowTip />
                  </Popover.Arrow>
                </div>
              {/if}
            {/snippet}
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover>
  {:else}
    <ViewToggle />
  {/if}
</div>

<div
  class="rounded-container mt-4 mb-2 overflow-hidden lg:mb-4 {preferences.value
    .layout === 'grid'
    ? 'grid grid-cols-2 gap-1 lg:grid-cols-3 xl:grid-cols-4'
    : 'flex flex-col'}"
  use:dragHandleZone={{
    items: sortableColors,
    flipDurationMs,
    type: 'gaugeCustomizer',
  }}
  onconsider={handleConsider}
  onfinalize={handleFinalize}
>
  {#each sortableColors as { hex, name, brandId, yarnId, brandName, yarnName, variant_href, affiliate_variant_href, id }, index (id)}
    <div
      class="color flex flex-wrap items-center justify-around gap-2 p-2 {preferences
        .value.layout === 'grid'
        ? 'rounded-container flex-auto basis-1/3  sm:basis-1/4 md:basis-1/5'
        : `${isProjectPlannerPage ? numberOfColumns < 5 && 'lg:grid lg:grid-cols-[1fr_3fr_1fr]' : 'lg:grid lg:grid-cols-[1fr_1.4fr_1fr]'}`}"
      style="background:{hex};color:{getTextColor(hex)}"
      animate:flip={{ duration: flipDurationMs }}
    >
      <!-- The following empty div is necessary to center content in list view -->
      <div></div>

      <div class="flex flex-auto flex-wrap items-center justify-around gap-2">
        <div class="flex flex-wrap items-center gap-2">
          {#if movable && !isStaticGauge}
            <button
              title="Remove Color"
              class="btn hover:preset-tonal flex flex-wrap items-center justify-center gap-1"
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
              <Trash2Icon size="18" />
            </button>
          {/if}

          <button
            title="Move Color"
            tabindex="-1"
            aria-label="Crag handle for color {index + 1}"
            class="btn-icon hover:preset-tonal handle p-2"
            use:dragHandle
          >
            <MoveIcon />
          </button>
        </div>

        {#if isProjectPlannerPage}
          {#if gauge?.unit.type === 'category'}
            <p class="min-w-[140px] p-2 text-left">
              {gauge.ranges[index].label}
            </p>
          {:else}
            <div
              class={[
                'flex gap-2',
                preferences.value.layout === 'grid' ? '' : '',
              ]}
            >
              {#key index}
                <ColorRange {index} />
              {/key}
            </div>
          {/if}
        {/if}

        <div class={[preferences.value.layout === 'list' && 'flex-auto']}>
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
                  size: 'large',
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
            <ShoppingCartIcon />
            <span class="underline">Buy</span>
          </a>
        {/if}

        {#if isProjectPlannerPage}
          {#if showDaysInRange.value}
            <div
              class="bg-surface-900/10 rounded-container number-of-days-in-range flex w-fit flex-wrap items-center justify-center overflow-hidden shadow-inner"
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

      <!-- The following empty div is necessary to center content in list view -->
      <div></div>
    </div>
  {/each}
</div>
