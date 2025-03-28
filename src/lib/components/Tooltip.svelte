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
  import { arrow, createFloatingActions } from 'svelte-floating-ui';
  // import { autoPlacement } from 'svelte-floating-ui/core';
  import {
    flip,
    offset,
    shift,
    size,
    type Placement,
  } from 'svelte-floating-ui/dom';
  import { writable } from 'svelte/store';
  import { scale } from 'svelte/transition';

  interface Props {
    placement?: Placement;
    minWidth?: string;
    disableTooltip?: boolean;
    fullWidth?: boolean;
    buttonDisabled?: boolean;
    tooltipClass?: string;
    tooltipBg?: string;
    tooltipStyle?: string;
    classNames?: string;
    dataPinned?: boolean;
    dataActive?: boolean;
    dataNoWeather?: boolean;
    title?: string;
    id?: string;
    showTooltip?: boolean;
    onclick?: (event: MouseEvent) => void;
    children?: import('svelte').Snippet;
    tooltip?: import('svelte').Snippet;
  }

  let {
    placement = 'top',
    minWidth = '110px',
    disableTooltip = false,
    fullWidth = false,
    buttonDisabled = false,
    tooltipClass = 'text-sm',
    tooltipBg = 'bg-surface-100 dark:bg-surface-900',
    tooltipStyle = '',
    classNames = '',
    dataPinned,
    dataActive,
    dataNoWeather,
    title = '',
    id = '',
    showTooltip = false,
    onclick,
    children,
    tooltip,
  }: Props = $props();

  const arrowRef = writable(null);

  let isTooltipActive = $state(false);

  let tooltipElement = $state();

  const [floatingRef, floatingContent, update] = createFloatingActions({
    strategy: 'absolute',
    placement,
    middleware: [
      flip(),
      offset(10),
      size({
        apply({ availableWidth, availableHeight, elements }) {
          // Do things with the data, e.g.
          Object.assign(elements.floating.style, {
            maxWidth: `${availableWidth}px`,
            maxHeight: `${availableHeight}px`,
          });
        },
      }),
      shift({
        padding: 2,
      }),
      arrow({ element: arrowRef }),
    ],
    onComputed({ placement, middlewareData }) {
      if (!showTooltip) return;
      const staticSide = {
        top: 'bottom',
        right: 'left',
        bottom: 'top',
        left: 'right',
      }[placement.split('-')[0]];

      if (middlewareData.arrow && $arrowRef) {
        const arrowLen = $arrowRef.offsetWidth;
        const { x, y } = middlewareData.arrow;
        Object.assign($arrowRef.style, {
          left: x != null ? `${x}px` : '',
          top: y != null ? `${y}px` : '',
          // Ensure the static side gets unset when
          // flipping to other placements' axes.
          right: '',
          bottom: '',
          [staticSide]: `${-arrowLen / 2}px`,
          transform: 'rotate(45deg)',
        });
      }
    },
  });

  function handelLeaveEvent(event, duration = 100) {
    event.preventDefault();
    let timeout = setTimeout(() => {
      if (!isTooltipActive) {
        showTooltip = false;
      } else clearTimeout(timeout);
    }, duration);
  }

  $effect(() => {
    if (showTooltip) {
      tooltipElement.style.zIndex = '100';
    }
  });
</script>

{#if !disableTooltip && buttonDisabled}
  <div
    role="button"
    tabindex="0"
    onmouseenter={() => {
      showTooltip = true;
    }}
    onmouseleave={handelLeaveEvent}
    onfocus={() => {
      showTooltip = true;
    }}
    onblur={handelLeaveEvent}
    use:floatingRef
  >
    <button
      {onclick}
      disabled
      class={[classNames, fullWidth && 'inline-block h-full w-full']}
      data-pinned={dataPinned}
      data-active={dataActive}
      data-no-weather={dataNoWeather}
      {title}
      {id}
    >
      {@render children?.()}
    </button>
  </div>
{:else if !disableTooltip}
  <button
    {onclick}
    class={[classNames, fullWidth && 'inline-block h-full w-full']}
    data-pinned={dataPinned}
    data-active={dataActive}
    data-no-weather={dataNoWeather}
    {title}
    {id}
    onmouseenter={() => {
      showTooltip = true;
    }}
    onmouseleave={handelLeaveEvent}
    onfocus={() => {
      showTooltip = true;
    }}
    onblur={handelLeaveEvent}
    use:floatingRef
  >
    {@render children?.()}
  </button>
{:else}
  <button
    {onclick}
    class={[classNames, fullWidth && 'inline-block h-full w-full']}
    data-pinned={dataPinned}
    data-active={dataActive}
    data-no-weather={dataNoWeather}
    {title}
    {id}
  >
    {@render children?.()}
  </button>
{/if}

{#if showTooltip}
  <div
    role="dialog"
    tabindex="-1"
    aria-labelledby="Tooltip or Menu"
    aria-describedby="A dialog box showing information or menu items."
    in:scale={{ duration: 175 }}
    class="rounded-container tooltip absolute z-200 block cursor-text shadow-lg"
    style="min-width:{minWidth}"
    use:floatingContent
    onmouseenter={() => (isTooltipActive = true)}
    onmouseleave={(event) => {
      isTooltipActive = false;
      handelLeaveEvent(event);
    }}
    onfocus={() => (isTooltipActive = true)}
    onblur={(event) => {
      isTooltipActive = false;
      handelLeaveEvent(event);
    }}
    bind:this={tooltipElement}
  >
    <div
      class="rounded-container p-2 {tooltipBg} {tooltipClass}"
      style={tooltipStyle}
    >
      {@render tooltip?.()}
    </div>

    <div
      style="position:absolute; {tooltipStyle}"
      class="h-4 w-4 {tooltipBg} z-40"
      bind:this={$arrowRef}
    ></div>
  </div>
{/if}
