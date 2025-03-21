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
  import { browser } from '$app/environment';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import ChangeColor from '$lib/components/modals/ChangeColor.svelte';
  import { modal } from '$lib/state';
  import type { Color } from '$lib/types';
  import { getTextColor } from '$lib/utils';
  import {
    LockKeyholeIcon,
    LockOpenIcon,
    MoveIcon,
    SearchIcon,
    Trash2Icon,
  } from '@lucide/svelte';
  import {
    SOURCES,
    TRIGGERS,
    dragHandle,
    dragHandleZone,
  } from 'svelte-dnd-action';
  import { flip } from 'svelte/animate';
  import { fade } from 'svelte/transition';

  interface Props {
    colors?: Color[];
    schemeName?: string;
    canUserEditColor?: boolean;
    canUserDeleteColor?: boolean;
    showSchemeName?: boolean;
    roundedBottom?: boolean;
    typeId?: string;
    onchanged?: any;
    fullscreen?: boolean;
  }

  let {
    colors = $bindable([]),
    schemeName = 'Palette Preview',
    canUserEditColor = true,
    canUserDeleteColor = true,
    showSchemeName = true,
    roundedBottom = true,
    typeId = getTypeId(),
    onchanged = null,
    fullscreen = $bindable(),
  }: Props = $props();

  const flipDurationMs = 200;

  const uniqueId =
    browser && crypto && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Math.random() * 100}-${Math.random() * 100}-${Math.random() * 100}`;

  let sortableColors = $state(getSortableColors());

  let activeColorIndex: number | null = $state(null);

  function getTypeId() {
    return crypto && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Math.random() * 100}-${Math.random() * 100}-${Math.random() * 100}`;
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
    const _colors = [];
    colors.forEach((color, i) => {
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
      colors = _colors;
      modal.close();
    });

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

    draggedEl.style.zIndex = '30000';
    // draggedEl.querySelector('.dragicon').style.display = 'block';
  }

  $effect(() => {
    if (schemeName === 'Custom') schemeName = 'Color Palette';
  });
</script>

<svelte:window
  onclick={(e) => {
    if (!(e.target as Element).closest(`.palette-item-${uniqueId}`))
      activeColorIndex = null;
    else
      activeColorIndex = +(e.target as Element).closest(
        `.palette-item-${uniqueId}`,
      )?.dataset.index;
  }}
/>

<div
  class="flex w-full flex-col gap-y-1 text-left {fullscreen ? 'h-full' : ''}"
>
  <div
    class="inline-flex w-full {fullscreen ? 'h-full flex-col' : 'h-[70px]'}"
    use:dragHandleZone={{
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
      <div
        class=" w-full {fullscreen
          ? 'h-full'
          : 'first:rounded-tl-container last:rounded-tr-container h-[70px] first:overflow-hidden last:overflow-hidden'} group palette-item-{uniqueId} {roundedBottom &&
        !fullscreen
          ? 'first:rounded-bl-container last:rounded-br-container'
          : ''}"
        data-index={index}
        animate:flip={{ duration: flipDurationMs }}
        role="button"
        tabindex="0"
        onclick={() => {
          if (activeColorIndex !== index) activeColorIndex = index;
          else if (activeColorIndex === index) activeColorIndex = null;
          else activeColorIndex = index;
        }}
        onkeydown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            if (activeColorIndex !== index) activeColorIndex = index;
            else if (activeColorIndex === index) activeColorIndex = null;
            else activeColorIndex = index;
          }
        }}
        onmouseenter={() => {
          activeColorIndex = index;
        }}
        onmouseleave={() => {
          activeColorIndex = null;
        }}
      >
        <Tooltip
          tooltipStyle="background:{hex};"
          tooltipBg=""
          fullWidth={true}
          classNames="w-full {fullscreen ? 'h-full' : 'h-[70px]'}"
          minWidth="260px"
          showTooltip={activeColorIndex === index && !isDragging.value}
        >
          <div
            class="flex flex-auto flex-col items-center justify-center {fullscreen
              ? 'h-full'
              : 'h-[70px]'}"
            title={brandName && yarnName && name
              ? `${brandName} - ${yarnName}: ${name}`
              : hex}
            style="background:{hex};color:{getTextColor(hex)}"
          >
            {#if isLocked}
              <LockKeyholeIcon />
            {:else}
              <div
                class="h-2 w-2 rounded-full opacity-20 group-hover:hidden group-focus:hidden {activeColorIndex ===
                  index &&
                !isDragging.value &&
                !isLocked
                  ? 'hidden!'
                  : 'inline-block'}"
                class:hidden={sortableColors.length > 30}
                class:sm:block={sortableColors.length > 30 &&
                  sortableColors.length <= 50}
                class:xl:block={sortableColors.length > 50}
                style="background:{getTextColor(hex)}"
              ></div>
            {/if}
            <div
              role="button"
              tabindex={isDragging.value ? 0 : -1}
              aria-label="drag-handle"
              class="dragicon hidden w-fit group-hover:block group-focus:block {activeColorIndex ===
                index &&
              !isDragging.value &&
              !isLocked
                ? 'inline-block!'
                : 'hidden!'}"
              class:group-hover:inline-block={isDragging.value}
              style="color:{getTextColor(hex)}; {isDragging.value
                ? 'cursor: grab'
                : 'cursor: grabbing'}"
              onmousedown={startDrag}
              in:fade
              use:dragHandle
              ontouchstart={startDrag}
              onkeydown={handleKeyDown}
            >
              <MoveIcon />
            </div>
          </div>

          {#snippet tooltip()}
            <div
              style="background:{hex};color:{getTextColor(hex)};"
              class="rounded-container z-30 flex w-full flex-wrap items-center justify-center gap-4 text-center break-all"
            >
              {#if canUserDeleteColor && sortableColors.length > 1}
                <button
                  onclick={() => {
                    colors = colors.filter((_, i) => i !== index);

                    sortableColors = getSortableColors();
                    if (onchanged) onchanged();
                  }}
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      colors = colors.filter((_, i) => i !== index);

                      sortableColors = getSortableColors();
                      if (onchanged) onchanged();
                    }
                  }}
                  class="btn hover:preset-tonal h-auto"
                >
                  <span class="text-xs">{index + 1}</span>
                  <Trash2Icon />
                </button>
              {/if}
              {#if canUserEditColor}
                <button
                  class="btn hover:preset-tonal h-auto"
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
                    })}
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
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
                      });
                    }
                  }}
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
                  class="btn-icon hover:preset-tonal"
                  onclick={(e) => {
                    e.preventDefault();
                    colors[index].locked = !colors[index].locked;
                    color.locked = colors[index].locked;
                    if (onchanged) onchanged($state.snapshot(colors));
                  }}
                  onkeydown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      colors[index].locked = !colors[index].locked;
                      color.locked = colors[index].locked;
                      if (onchanged) onchanged($state.snapshot(colors));
                    }
                  }}
                >
                  {#if color.locked}
                    <LockKeyholeIcon />
                  {:else}
                    <LockOpenIcon />
                  {/if}
                </button>
              {/if}
            </div>
          {/snippet}
        </Tooltip>
      </div>
    {/each}
  </div>
  {#if showSchemeName}
    <p class="text-xs">{@html schemeName}</p>
  {/if}
</div>
