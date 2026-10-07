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

<!-- @component
  A palette's colors side by side: an overview, to look at, not to edit. Pointing
  at, tapping, or focusing a color names its yarn in one tooltip the colors
  share. On its own the strip is one tab stop, and the arrow keys move between
  its colors; with `onselect`, each color is a button (as in the palette editor,
  where it goes to the color's row). Inside a link or button (`insideControl`)
  the colors aren't tab stops, and screen readers hear the control's name instead.
-->
<script lang="ts">
  import type { Color } from '$lib/types/yarn-types';
  import { getTextColor } from '$lib/utils/color-utils';
  import { growIn, motionDuration } from '$lib/utils/feedback.svelte';
  import { pluralize } from '$lib/utils/string-utils';
  import {
    arrow,
    autoUpdate,
    computePosition,
    flip,
    offset,
    shift,
  } from '@floating-ui/dom';
  import { onMount, type Snippet } from 'svelte';
  import { createAttachmentKey } from 'svelte/attachments';
  import { scale } from 'svelte/transition';
  import { LockKeyholeIcon } from '@lucide/svelte';

  interface Props {
    colors: Color[];
    /** Text, or markup, under the colors */
    label?: string | Snippet;
    height?: string;
    roundedBottom?: boolean;
    /** In a link or button: the colors aren't tab stops, and the strip is hidden from screen readers */
    insideControl?: boolean;
    /** Called with a color's index when it's pressed; each color is then a button */
    onselect?: (index: number) => void;
    /** Called with a color's index when it's pointed at or focused from the keyboard, and null after */
    onhover?: (index: number | null) => void;
    /** A color to outline, as when its marker is pointed at on an image */
    highlightIndex?: number | null;
    /** Colors that just changed (by undo or redo), which glow for a moment */
    flashIndices?: number[];
    /** The first colors grow in one after another, e.g. a palette just taken from an image */
    staggerIn?: boolean;
  }

  const WHITE = '#ffffff';

  let {
    colors,
    label,
    height = '70px',
    roundedBottom = true,
    insideControl = false,
    onselect,
    onhover,
    highlightIndex = null,
    flashIndices = [],
    staggerIn = false,
  }: Props = $props();

  /** The color named in the tooltip */
  let active: number | null = $state(null);
  /** The color that takes focus when tabbing to the strip */
  let tabStop = $state(0);
  let swatches: HTMLElement[] = $state([]);
  let tooltip: HTMLElement | undefined = $state();
  let tooltipArrow: HTMLElement | undefined = $state();

  let activeColor = $derived(active === null ? null : colors[active]);

  // A new palette may have fewer colors
  $effect.pre(() => {
    if (tabStop >= colors.length) tabStop = 0;
    if (active !== null && active >= colors.length) active = null;
  });

  // Colors added later grow in. The first colors just appear — unless
  // `staggerIn`, when they grow in one after another.
  let mounted = false;
  onMount(() => {
    requestAnimationFrame(() => (mounted = true));
  });
  function swatchIn(node: Element, { index }: { index: number }) {
    if (!mounted && !staggerIn) return { duration: 0 };
    return growIn(node, { delay: mounted ? 0 : index * 45 });
  }

  function describe(color: Color) {
    return color.brandName && color.yarnName && color.name
      ? `${color.brandName} - ${color.yarnName}: ${color.name}`
      : (color.name ?? color.hex ?? WHITE);
  }

  $effect(() => {
    const reference = active === null ? undefined : swatches[active];
    const floating = tooltip;
    if (!reference || !floating) return;
    return autoUpdate(reference, floating, async () => {
      const { x, y, middlewareData, placement } = await computePosition(
        reference,
        floating,
        {
          placement: 'top',
          middleware: [
            offset(8),
            flip(),
            shift({ padding: 4 }),
            tooltipArrow && arrow({ element: tooltipArrow, padding: 4 }),
          ],
        },
      );
      Object.assign(floating.style, { left: `${x}px`, top: `${y}px` });
      if (tooltipArrow && middlewareData.arrow) {
        const { x: arrowX } = middlewareData.arrow;
        Object.assign(tooltipArrow.style, {
          left: arrowX != null ? `${arrowX}px` : '',
          top: placement.startsWith('bottom') ? '-4px' : '',
          bottom: placement.startsWith('top') ? '-4px' : '',
        });
      }
    });
  });

  function onkeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && active !== null) {
      // Escape hides the tooltip, not a dialog around the strip
      event.stopPropagation();
      active = null;
      return;
    }
    const last = colors.length - 1;
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? Math.min(tabStop + 1, last)
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? Math.max(tabStop - 1, 0)
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null;
    if (next === null) return;
    event.preventDefault();
    tabStop = next;
    swatches[next]?.focus();
  }

  /** Moves the focus to a color, as when a control for it goes away */
  export function focusColor(index: number) {
    tabStop = Math.max(0, Math.min(index, colors.length - 1));
    swatches[tabStop]?.focus();
  }

  /** What a color's span or button has either way */
  function swatchAttributes(color: Color, index: number) {
    const hex = color.hex ?? WHITE;
    return {
      [createAttachmentKey()]: (node: HTMLElement) => {
        swatches[index] = node;
      },
      class: [
        'grid h-full min-w-0 flex-1 place-items-center focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-current',
        onselect && 'cursor-pointer',
        flashIndices.includes(index) && 'history-flash',
      ],
      style: `background:${hex};color:${getTextColor(hex)};${
        highlightIndex === index
          ? `box-shadow:inset 0 0 0 4px ${getTextColor(hex)}`
          : ''
      }`,
      'aria-label': insideControl
        ? undefined
        : `Color ${index + 1}: ${describe(color)}${color.locked ? ', locked' : ''}`,
      tabindex: insideControl ? undefined : index === tabStop ? 0 : -1,
      onpointerenter: (event: PointerEvent) => {
        if (event.pointerType === 'touch') {
          // A tap on a link or button uses it, so there's nothing to name
          if (insideControl || onselect) return;
        } else onhover?.(index);
        active = index;
      },
      onfocus: (event: FocusEvent) => {
        tabStop = index;
        active = index;
        // Keyboard focus only, not a click or tap
        if ((event.target as Element).matches(':focus-visible'))
          onhover?.(index);
      },
      onblur: () => {
        active = null;
        onhover?.(null);
      },
    };
  }
</script>

{#snippet lock(color: Color)}
  {#if color.locked}
    <LockKeyholeIcon size={20} class="opacity-60" aria-hidden="true" />
  {/if}
{/snippet}

<!-- Spans throughout, so the strip can sit inside a link or button -->
<span class="flex w-full flex-col gap-y-1 text-left">
  <span
    class="relative block w-full"
    onpointerleave={(event) => {
      onhover?.(null);
      // A tap leaves as soon as it lifts; its tooltip stays until focus moves
      if (event.pointerType !== 'touch') active = null;
    }}
    aria-hidden={insideControl || undefined}
  >
    <span
      class={[
        'rounded-t-container flex w-full overflow-hidden',
        roundedBottom && 'rounded-b-container',
      ]}
      style:height
      role={insideControl ? undefined : 'group'}
      aria-label={insideControl
        ? undefined
        : `${colors.length} ${pluralize('color', colors.length)}`}
      onkeydown={insideControl ? undefined : onkeydown}
    >
      {#each colors as color, index (index)}
        {#if onselect}
          <button
            type="button"
            {...swatchAttributes(color, index)}
            onclick={() => {
              active = null;
              onselect(index);
            }}
            in:swatchIn|global={{ index }}>{@render lock(color)}</button
          >
        {:else}
          <span
            {...swatchAttributes(color, index)}
            role={insideControl ? undefined : 'img'}
            in:swatchIn|global={{ index }}>{@render lock(color)}</span
          >
        {/if}
      {/each}
    </span>

    {#if activeColor}
      <span
        bind:this={tooltip}
        data-floating
        aria-hidden="true"
        class="rounded-container flex max-w-[90vw] min-w-[200px] flex-col items-center justify-center p-3 text-center text-wrap shadow-lg"
        style:background={activeColor.hex ?? WHITE}
        style:color={getTextColor(activeColor.hex ?? WHITE)}
        in:scale={{ duration: motionDuration(150), start: 0.9 }}
      >
        {#if activeColor.brandName && activeColor.yarnName && activeColor.name}
          <span class="text-xs">
            {activeColor.brandName} - {activeColor.yarnName}
          </span>
          <span class="text-lg leading-tight">{activeColor.name}</span>
        {:else}
          <span class="text-lg">{activeColor.name ?? activeColor.hex}</span>
        {/if}
        <span bind:this={tooltipArrow} class="popover-arrow"></span>
      </span>
    {/if}
  </span>

  {#if typeof label === 'function'}
    {@render label()}
  {:else if label?.trim()}
    <span class="line-clamp-2 text-xs"
      >{label === 'Custom' ? 'Color Palette' : label}</span
    >
  {/if}
</span>
