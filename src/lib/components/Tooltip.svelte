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
  import { hideTooltips } from '$lib/components/ColorPaletteEditable.svelte';
  import { arrow, createFloatingActions } from 'svelte-floating-ui';
  import { flip, offset, shift, size } from 'svelte-floating-ui/dom';
  import { writable } from 'svelte/store';
  import { scale } from 'svelte/transition';

  export let placement = 'top';
  export let minWidth = '110px';
  export let disableTooltip = false;
  export let fullWidth = false;
  export let buttonDisabled = false;
  export let tooltipClass = 'text-sm';
  export let tooltipBg = 'bg-surface-200-700-token';
  export let tooltipStyle = '';

  const arrowRef = writable(null);
  let showTooltip: boolean = false;
  let isTooltipActive = false;

  let debounceTimer;
  const debounce = (callback, time) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  const [floatingRef, floatingContent, update] = createFloatingActions({
    strategy: 'absolute',
    placement,
    middleware: [
      offset(12),
      flip(),
      size({
        apply({ availableWidth, availableHeight, elements }) {
          // Do things with the data, e.g.
          Object.assign(elements.floating.style, {
            maxWidth: `${availableWidth}px`,
            maxHeight: `${availableHeight}px`,
          });
        },
      }),
      shift({ padding: 2 }),
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
    window.clearTimeout(debounceTimer);
    let timeout = setTimeout(() => {
      if (!isTooltipActive) {
        showTooltip = false;
      } else clearTimeout(timeout);
    }, duration);
  }
</script>

<div class="inline-block h-full" class:w-full={fullWidth}>
  {#if !disableTooltip && buttonDisabled}
    <div
      role="button"
      tabindex="0"
      on:mouseenter={() => {
        debounce(() => (showTooltip = true), 50);
      }}
      on:mouseleave={handelLeaveEvent}
      on:focus={() => {
        debounce(() => (showTooltip = true), 50);
      }}
      on:blur={handelLeaveEvent}
      use:floatingRef
    >
      <button on:click {...$$props} disabled>
        <slot />
      </button>
    </div>
  {:else if !disableTooltip}
    <button
      on:click
      {...$$props}
      on:mouseenter={() => {
        debounce(() => (showTooltip = true), 50);
      }}
      on:mouseleave={handelLeaveEvent}
      on:focus={() => {
        debounce(() => (showTooltip = true), 50);
      }}
      on:blur={handelLeaveEvent}
      use:floatingRef
    >
      <slot />
    </button>
  {:else}
    <button on:click {...$$props}>
      <slot />
    </button>
  {/if}
</div>
{#if showTooltip && !$hideTooltips}
  <div
    role="dialog"
    aria-labelledby="Tooltip or Menu"
    aria-describedby="A dialog box showing information or menu items."
    in:scale={{ duration: 175 }}
    class="absolute shadow-lg text-token cursor-text z-40 rounded-container-token"
    style="min-width:{minWidth}"
    use:floatingContent
    on:mouseenter={() => (isTooltipActive = true)}
    on:mouseleave={(event) => {
      isTooltipActive = false;
      handelLeaveEvent(event);
    }}
    on:focus={() => (isTooltipActive = true)}
    on:blur={(event) => {
      isTooltipActive = false;
      handelLeaveEvent(event);
    }}
  >
    <div
      class="p-2 rounded-container-token {tooltipBg} {tooltipClass}"
      style={tooltipStyle}
    >
      <slot name="tooltip" />
    </div>
    <div
      style="position:absolute; {tooltipStyle}"
      class="w-4 h-4 {tooltipBg} z-40"
      bind:this={$arrowRef}
    />
  </div>
{/if}
