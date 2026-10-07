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
  A palette's strip, for the pop-ups that make one (Choose Colorways, Random
  Palette, From an Image). Pressing a color outlines it and opens one bar
  under the strip, for that color: move it left or right, lock it
  (`lockable`), or remove it. Sort, in each pop-up, does the rest.
-->
<script lang="ts">
  import ColorSwatch from '$lib/components/ColorSwatch.svelte';
  import PaletteStrip from '$lib/components/PaletteStrip.svelte';
  import type { Color } from '$lib/types/yarn-types';
  import { sameColorList } from '$lib/utils/color-utils';
  import { tick } from 'svelte';
  import {
    ArrowLeftIcon,
    ArrowRightIcon,
    LockKeyholeIcon,
    LockOpenIcon,
    Trash2Icon,
    XIcon,
  } from '@lucide/svelte';

  interface Props {
    colors: Color[];
    /** Called with the new colors after a move, lock, or removal */
    onchange?: (colors: Color[]) => void;
    /** Whether colors can be locked, to keep them when the rest change */
    lockable?: boolean;
    roundedBottom?: boolean;
    /** A color to outline, as when its marker is pointed at on an image */
    highlightIndex?: number | null;
    /** Called with a color's index when it's pointed at or focused from the keyboard, and null after */
    onhover?: (index: number | null) => void;
    staggerIn?: boolean;
  }

  let {
    colors = $bindable([]),
    onchange,
    lockable = false,
    roundedBottom = true,
    highlightIndex = null,
    onhover,
    staggerIn = false,
  }: Props = $props();

  let strip: ReturnType<typeof PaletteStrip> | undefined = $state();
  let bar: HTMLElement | undefined = $state();
  /** The color the bar is for */
  let selected: number | null = $state(null);
  /** What the bar last did, for screen readers */
  let announcement = $state('');
  /** The colors as this last changed them */
  let own: Color[] = [];

  let color = $derived(selected === null ? null : colors[selected]);

  // A new palette from elsewhere (Randomize, a new photo, or Random
  // Palette's re-roll after a removal) closes the bar; the focus, if it was
  // in the bar, goes back to the strip
  $effect.pre(() => {
    if (selected === null || sameColorList(colors, own)) return;
    const index = selected;
    const hadFocus = !!bar?.contains(document.activeElement);
    selected = null;
    if (hadFocus) tick().then(() => strip?.focusColor(index));
  });

  function update(next: Color[]) {
    own = $state.snapshot(next);
    colors = next;
    onchange?.(next);
  }

  function select(index: number) {
    own = $state.snapshot(colors);
    selected = selected === index ? null : index;
    announcement = '';
  }

  function close() {
    const index = selected ?? 0;
    selected = null;
    strip?.focusColor(index);
  }

  function move(by: -1 | 1) {
    if (selected === null) return;
    const to = selected + by;
    if (to < 0 || to >= colors.length) return;
    const next = [...colors];
    [next[selected], next[to]] = [next[to], next[selected]];
    selected = to;
    update(next);
    announcement = `Moved to ${to + 1} of ${next.length}`;
  }

  function toggleLock() {
    if (selected === null) return;
    const locked = !colors[selected].locked;
    update(colors.map((c, i) => (i === selected ? { ...c, locked } : c)));
    announcement = locked ? 'Locked' : 'Unlocked';
  }

  function remove() {
    if (selected === null || colors.length < 2) return;
    const next = colors.filter((_, i) => i !== selected);
    // The bar stays, for the color that took its place, so several can go in a row
    selected = Math.min(selected, next.length - 1);
    update(next);
    announcement = `Removed. ${next.length} colors left`;
  }

  // Buttons that can't do anything right now say so, but keep the focus
  const barButtonClass =
    'btn-icon btn-icon-sm hover:preset-tonal-surface aria-disabled:opacity-40 aria-disabled:hover:bg-transparent';
</script>

<div class="flex w-full flex-col">
  <PaletteStrip
    bind:this={strip}
    {colors}
    {roundedBottom}
    {staggerIn}
    {onhover}
    highlightIndex={selected ?? highlightIndex}
    onselect={select}
    selectedIndex={selected}
  />

  {#if color && selected !== null}
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div
      bind:this={bar}
      class="flex flex-wrap items-center gap-x-2 gap-y-1 px-2 pt-2 text-left"
      role="group"
      aria-label="Color {selected + 1}"
      onkeydown={(event) => {
        if (event.key !== 'Escape') return;
        // Only the bar, not the pop-up around it
        event.stopPropagation();
        close();
      }}
    >
      <ColorSwatch hex={color.hex} number={selected + 1} small />
      <span class="flex min-w-0 flex-1 flex-col">
        <span class="truncate text-sm leading-tight font-semibold">
          {color.name || color.hex}
        </span>
        {#if color.brandName && color.yarnName}
          <span class="text-surface-700-300 truncate text-xs">
            {color.brandName} · {color.yarnName}
          </span>
        {/if}
      </span>
      <span class="flex items-center gap-1">
        <button
          type="button"
          class={barButtonClass}
          title="Move Left"
          aria-label="Move color {selected + 1} left"
          aria-disabled={selected === 0 || undefined}
          onclick={() => move(-1)}
        >
          <ArrowLeftIcon size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          class={barButtonClass}
          title="Move Right"
          aria-label="Move color {selected + 1} right"
          aria-disabled={selected === colors.length - 1 || undefined}
          onclick={() => move(1)}
        >
          <ArrowRightIcon size={18} aria-hidden="true" />
        </button>
        {#if lockable}
          <button
            type="button"
            class={barButtonClass}
            title={color.locked ? 'Unlock' : 'Lock'}
            aria-label="Lock color {selected + 1}"
            aria-pressed={!!color.locked}
            onclick={toggleLock}
          >
            {#if color.locked}
              <LockKeyholeIcon size={18} aria-hidden="true" />
            {:else}
              <LockOpenIcon size={18} aria-hidden="true" />
            {/if}
          </button>
        {/if}
        <button
          type="button"
          class={barButtonClass}
          title="Remove"
          aria-label="Remove color {selected + 1}"
          aria-disabled={colors.length < 2 || undefined}
          onclick={remove}
        >
          <Trash2Icon size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          class={barButtonClass}
          title="Close"
          aria-label="Close color {selected + 1}"
          onclick={close}
        >
          <XIcon size={18} aria-hidden="true" />
        </button>
      </span>
    </div>
  {/if}
  <p class="sr-only" aria-live="polite">{announcement}</p>
</div>
