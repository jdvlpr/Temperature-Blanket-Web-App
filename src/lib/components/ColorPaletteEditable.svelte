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

<script context="module">
  export let hideTooltips = writable(false);
</script>

<script lang="ts">
  import Tooltip from '$lib/components/Tooltip.svelte';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import { ICONS } from '$lib/constants';
  import { modal } from '$lib/stores';
  import type { Color } from '$lib/types';
  import { getTextColor } from '$lib/utils';
  import { createEventDispatcher } from 'svelte';
  import { SOURCES, TRIGGERS, dndzone } from 'svelte-dnd-action';
  import { bind } from 'svelte-simple-modal';
  import { flip } from 'svelte/animate';
  import { writable } from 'svelte/store';

  const dispatch = createEventDispatcher();

  export let colors: Color[] = [];
  export let schemeName = 'Palette Preview';
  export let canUserEditColor = true;
  export let canUserDeleteColor = true;
  export let showSchemeName = true;
  export let roundedBottom = true;

  $: sortableColors = colors.map((color, i) => {
    color.id = i;
    return color;
  });

  $: if (schemeName === 'Custom') schemeName = 'Color Palette';

  $: $hideTooltips = !dragDisabled;

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
    colors = colors;
  }
  const flipDurationMs = 200;
  let dragDisabled = true;

  function handleConsider(e) {
    const {
      items: newItems,
      info: { source, trigger },
    } = e.detail;
    sortableColors = newItems;
    // Ensure dragging is stopped on drag finish via keyboard
    if (source === SOURCES.KEYBOARD && trigger === TRIGGERS.DRAG_STOPPED) {
      dragDisabled = true;
    }
  }
  async function handleFinalize(e) {
    const {
      items: newItems,
      info: { source },
    } = e.detail;
    sortableColors = newItems;
    colors = sortableColors.map((color) => {
      delete color.id;
      return { ...color };
    });
    // Ensure dragging is stopped on drag finish via pointer (mouse, touch)
    if (source === SOURCES.POINTER) {
      dragDisabled = true;
    }
    dispatch('changed');
  }
  function startDrag(e) {
    // preventing default to prevent lag on touch devices (because of the browser checking for screen scrolling)
    e.preventDefault();
    dragDisabled = false;
  }
  function handleKeyDown(e) {
    if ((e.key === 'Enter' || e.key === ' ') && dragDisabled)
      dragDisabled = false;
  }
  function transformDraggedElement(draggedEl, data, index) {
    // draggedEl.style.minWidth = "24px";
    // draggedEl.querySelector(".dragicon").style.display = "block";
  }
</script>

<div class="flex flex-col text-left gap-y-1">
  <div
    class="w-full inline-flex h-[70px]"
    use:dndzone={{
      items: sortableColors,
      dragDisabled,
      flipDurationMs,
      type: 'palettePreview',
      centreDraggedOnCursor: true,
      transformDraggedElement,
    }}
    on:consider={handleConsider}
    on:finalize={handleFinalize}
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
      <!-- <div class="flex-1" style="background:{hex}" in:fade /> -->
      <div
        class="first:rounded-tl-container-token first:overflow-hidden last:rounded-tr-container-token last:overflow-hidden w-full h-[70px] group {roundedBottom
          ? 'first:rounded-bl-container-token last:rounded-br-container-token'
          : ''}"
        animate:flip={{ duration: flipDurationMs }}
      >
        <Tooltip
          tooltipStyle="background:{hex};"
          tooltipClass=""
          tooltipBg=""
          fullWidth={true}
          class="w-full h-[70px]"
          minWidth="260px"
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
                class="group-hover:hidden group-focus:hidden h-2 w-2 rounded-full opacity-20"
                class:hidden={sortableColors.length > 30}
                class:sm:block={sortableColors.length > 30 &&
                  sortableColors.length <= 50}
                class:xl:block={sortableColors.length > 50}
                style="background:{getTextColor(hex)}"
              ></div>
            {/if}
            <div
              role="button"
              tabindex={dragDisabled ? 0 : -1}
              aria-label="drag-handle"
              class="w-fit dragicon hidden group-hover:block group-focus:block"
              class:group-hover:inline-block={dragDisabled}
              style="color:{getTextColor(hex)}; {dragDisabled
                ? 'cursor: grab'
                : 'cursor: grabbing'}"
              on:mousedown={startDrag}
              on:touchstart|passive={startDrag}
              on:keydown={handleKeyDown}
              on:keydown={handleKeyDown}
            >
              {@html ICONS.arrowsPointingOut}
            </div>
          </div>

          <div
            slot="tooltip"
            style="background:{hex};color:{getTextColor(hex)}"
            class="w-full rounded-container-token text-center break-all flex flex-wrap items-center justify-center gap-4 z-30"
          >
            {#if canUserDeleteColor && sortableColors.length > 1}
              <button
                on:click={() => {
                  sortableColors.splice(index, 1);
                  colors = sortableColors.map((color) => {
                    delete color.id;
                    return {
                      ...color,
                    };
                  });
                  dispatch('changed');
                }}
                class="btn-icon bg-secondary-hover-token"
                >{@html ICONS.trash}</button
              >
            {/if}
            {#if canUserEditColor}
              <button
                class="btn bg-secondary-hover-token flex items-center justify-start"
                on:click={() =>
                  modal.set(
                    bind(ChangeColor, {
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
                    }),
                  )}
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
                on:click={(e) => {
                  e.preventDefault();
                  color.locked = !color.locked;
                  dispatch('changed');
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
        </Tooltip>
      </div>
    {/each}
  </div>
  {#if showSchemeName}
    <p class="text-xs">{@html schemeName}</p>
  {/if}
</div>
