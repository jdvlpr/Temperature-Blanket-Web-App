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

<script module>
  export let isDragging = $state({ value: false });
</script>

<script lang="ts">
  import Tooltip from '$lib/components/Tooltip.svelte';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import { ICONS } from '$lib/constants';
  import { modal } from '$lib/stores';
  import type { Color } from '$lib/types';
  import { getTextColor } from '$lib/utils';
  import { SOURCES, TRIGGERS, dndzone } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';

  interface Props {
    colors?: Color[];
    schemeName?: string;
    canUserEditColor?: boolean;
    canUserDeleteColor?: boolean;
    showSchemeName?: boolean;
    roundedBottom?: boolean;
    typeId?: string;
    onchanged?: any;
  }

  let {
    colors = $bindable([]),
    schemeName = 'Palette Preview',
    canUserEditColor = true,
    canUserDeleteColor = true,
    showSchemeName = true,
    roundedBottom = true,
    typeId = 'palettePreview',
    onchanged = null,
  }: Props = $props();

  const flipDurationMs = 200;

  let sortableColors = $state(getSortableColors());

  let activeColorIndex: number | null = $state(null);

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
    colors[index] = {
      hex,
      name,
      brandId,
      yarnId,
      brandName,
      yarnName,
      variant_href,
      affiliate_variant_href,
    };

    sortableColors = getSortableColors();
    activeColorIndex = null;
  }

  function getSortableColors() {
    const _sortableColors = [];
    colors.forEach((color, i) => {
      _sortableColors.push({ ...color, id: i });
    });
    return _sortableColors;
  }

  function handleConsider(e) {
    isDragging.value = true;

    const {
      items: newItems,
      info: { source, trigger },
    } = e.detail;

    sortableColors = newItems;

    // Ensure dragging is stopped on drag finish via keyboard
    if (source === SOURCES.KEYBOARD && trigger === TRIGGERS.DRAG_STOPPED) {
      isDragging.value = false;
    }
  }

  function handleFinalize(e) {
    const {
      items: newItems,
      info: { source },
    } = e.detail;

    sortableColors = newItems;

    colors = $state.snapshot(sortableColors).map((color) => {
      delete color.id;
      return color;
    });

    // Ensure dragging is stopped on drag finish via pointer (mouse, touch)
    if (source === SOURCES.POINTER) {
      isDragging.value = false;
    }

    if (onchanged) onchanged();
  }
  function startDrag(e) {
    // preventing default to prevent lag on touch devices (because of the browser checking for screen scrolling)
    e.preventDefault();
    isDragging.value = true;
  }

  function handleKeyDown(e) {
    if ((e.key === 'Enter' || e.key === ' ') && !isDragging.value)
      isDragging.value = true;
  }

  function transformDraggedElement(draggedEl, data, index) {
    const tooltipElement = draggedEl.querySelector('.tooltip');

    if (tooltipElement) tooltipElement.style.display = 'none';

    // draggedEl.style.minWidth = '24px';
    // draggedEl.querySelector('.dragicon').style.display = 'block';
  }

  $effect(() => {
    if (schemeName === 'Custom') schemeName = 'Color Palette';
  });
</script>

<svelte:window
  onclick={(e) => {
    if (!(e.target as Element).closest('.palette-item'))
      activeColorIndex = null;
  }}
/>

<div class="flex flex-col text-left gap-y-1 w-full">
  <div
    class="w-full inline-flex h-[70px]"
    use:dndzone={{
      items: sortableColors,
      flipDurationMs,
      type: typeId,
      centreDraggedOnCursor: true,
      dropFromOthersDisabled: true,
      transformDraggedElement,
    }}
    onconsider={handleConsider}
    onfinalize={handleFinalize}
  >
    {#each sortableColors as color, index (color.id)}
      {@const {
        hex,
        name,
        brandId,
        yarnId,
        brandName,
        yarnName,
        variant_href,
        affiliate_variant_href,
      } = color}
      {@const isLocked = typeof color.locked !== undefined && color?.locked}
      <button
        class="first:rounded-tl-container-token first:overflow-hidden last:rounded-tr-container-token last:overflow-hidden w-full h-[70px] group palette-item {roundedBottom
          ? 'first:rounded-bl-container-token last:rounded-br-container-token'
          : ''}"
        animate:flip={{ duration: flipDurationMs }}
        onclick={() => {
          if (activeColorIndex !== index) activeColorIndex = index;
          else if (activeColorIndex === index) activeColorIndex = null;
          else activeColorIndex = index;
        }}
      >
        <Tooltip
          tooltipStyle="background:{hex};"
          tooltipBg=""
          fullWidth={true}
          classNames="w-full h-[70px]"
          minWidth="260px"
          showTooltip={activeColorIndex === index && !isDragging.value}
        >
          <div
            class="flex-auto flex flex-col justify-center items-center h-[70px]"
            title={brandName && yarnName && name
              ? `${brandName} - ${yarnName}: ${name}`
              : hex}
            style="background:{hex};color:{getTextColor(hex)}"
          >
            {#if isLocked}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                class="w-4 h-4 opacity-40 group-hover:hidden group-focus:hidden"
              >
                <path
                  fill-rule="evenodd"
                  d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11.5 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z"
                  clip-rule="evenodd"
                />
              </svg>
            {:else}
              <div
                role="button"
                tabindex="0"
                class="group-hover:hidden group-focus:hidden h-2 w-2 rounded-full opacity-20"
                class:hidden={sortableColors.length > 30 ||
                  (activeColorIndex === index && !isDragging.value)}
                class:sm:block={sortableColors.length > 30 &&
                  sortableColors.length <= 50}
                class:xl:block={sortableColors.length > 50}
                style="background:{getTextColor(hex)}"
              ></div>
            {/if}
            <div
              role="button"
              tabindex="0"
              aria-label="drag-handle"
              class="w-fit dragicon {activeColorIndex === index &&
              !isDragging.value
                ? ''
                : 'hidden group-hover:block group-focus:block'}"
              class:group-hover:inline-block={isDragging.value}
              style="color:{getTextColor(hex)}; {isDragging.value
                ? 'cursor: grabbing'
                : 'cursor: grab'}"
              onmousedown={startDrag}
              ontouchstart={startDrag}
              onkeydown={handleKeyDown}
            >
              {@html ICONS.arrowsPointingOut}
            </div>
          </div>

          {#snippet tooltip()}
            <div
              style="background:{hex};color:{getTextColor(hex)};"
              class="w-full rounded-container-token text-center break-all flex flex-wrap items-center justify-center gap-4 z-30"
            >
              {#if canUserDeleteColor && sortableColors.length > 1}
                <button
                  onclick={async () => {
                    colors = colors.filter((_, i) => i !== index);

                    sortableColors = getSortableColors();
                    if (onchanged) onchanged();
                  }}
                  class="btn-icon bg-secondary-hover-token"
                  >{@html ICONS.trash}</button
                >
              {/if}
              {#if canUserEditColor}
                <button
                  class="btn bg-secondary-hover-token flex items-center justify-start"
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
              {:else}
                <div
                  class="flex flex-col items-start justify-start text-left text-wrap"
                >
                  <span class="text-xs">
                    {#if brandName && yarnName}
                      {brandName}
                      -
                      {yarnName}
                    {/if}
                  </span>
                  <span class="text-lg leading-tight">
                    {name || hex}
                  </span>
                </div>
              {/if}
              {#if typeof color.locked !== 'undefined'}
                <button
                  class="btn btn-icon"
                  onclick={(e) => {
                    e.preventDefault();
                    color.locked = !color.locked;
                    if (onchanged) onchanged();
                  }}
                >
                  {#if color.locked}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      class="w-6 h-6"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M12 1.5a5.25 5.25 0 0 0-5.25 5.25v3a3 3 0 0 0-3 3v6.75a3 3 0 0 0 3 3h10.5a3 3 0 0 0 3-3v-6.75a3 3 0 0 0-3-3v-3c0-2.9-2.35-5.25-5.25-5.25Zm3.75 8.25v-3a3.75 3.75 0 1 0-7.5 0v3h7.5Z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  {:else}
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
                        d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                      />
                    </svg>
                  {/if}
                </button>
              {/if}
            </div>
          {/snippet}
        </Tooltip>
      </button>
    {/each}
  </div>
  {#if showSchemeName}
    <p class="text-xs">{@html schemeName}</p>
  {/if}
</div>
