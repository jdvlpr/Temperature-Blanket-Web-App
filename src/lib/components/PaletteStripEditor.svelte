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
  (`lockable`), or remove it. Sort, in each pop-up, does the rest. A pop-up
  can add its own row to the bar (`details`), and pick the color itself
  (`bind:selectedIndex`), as From an Image does when a photo's dot is pressed.
-->
<script lang="ts">
  import ColorSwatch from '$lib/components/ColorSwatch.svelte';
  import PaletteStrip from '$lib/components/PaletteStrip.svelte';
  import { menuTriggerClass } from '$lib/components/menu-styles';
  import type { Color } from '$lib/types/yarn-types';
  import { sameColorList } from '$lib/utils/color-utils';
  import { tick, type Snippet } from 'svelte';
  import {
    ArrowLeftIcon,
    ArrowRightIcon,
    LockKeyholeIcon,
    LockOpenIcon,
    Trash2Icon,
    CheckIcon,
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
    /** The pop-up's own tools under the strip (Sort, Clear…); the color's bar takes their place while it's open */
    toolbar?: Snippet;
    /** The color the bar is for, or null when it's closed */
    selectedIndex?: number | null;
    /** The pop-up's own row at the bottom of the bar, for that color */
    details?: Snippet<[index: number]>;
    /** A color to show in the bar instead, as while one of `details`' choices is pointed at */
    preview?: Color | null;
    /** Keep the bar open when the colors change from elsewhere, for a pop-up that closes it itself */
    keepOpen?: boolean;
    /** An id for the bar, for whatever else opens it */
    barId?: string;
    /** Called when the bar is closed with Escape or Done; return true to move the focus yourself, as back to a photo's dot */
    onclose?: (index: number) => boolean;
  }

  let {
    colors = $bindable([]),
    onchange,
    lockable = false,
    roundedBottom = true,
    highlightIndex = null,
    onhover,
    staggerIn = false,
    toolbar,
    selectedIndex: selected = $bindable(null),
    details,
    preview = null,
    keepOpen = false,
    barId,
    onclose,
  }: Props = $props();

  let strip: ReturnType<typeof PaletteStrip> | undefined = $state();
  let bar: HTMLElement | undefined = $state();
  /** What the bar last did, for screen readers */
  let announcement = $state('');
  /** The colors as this last changed them */
  let own: Color[] = [];

  let color = $derived(selected === null ? null : colors[selected]);
  let shown = $derived(preview ?? color);

  // A new palette from elsewhere (Randomize, a new photo, or Random
  // Palette's re-roll after a removal) closes the bar; the focus, if it was
  // in the bar, goes back to the strip
  $effect.pre(() => {
    if (keepOpen || selected === null || sameColorList(colors, own)) return;
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
    if (onclose?.(index)) return;
    strip?.focusColor(index);
  }

  function move(by: -1 | 1) {
    if (selected === null) return;
    const to = selected + by;
    if (to < 0 || to >= colors.length) return;
    const next = [...colors];
    [next[selected], next[to]] = [next[to], next[selected]];
    // The colors first, so a pop-up that keeps the selection by its own ids
    // finds the moved color in its new place
    update(next);
    selected = to;
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
    // The bar stays, for the color that took its place, so several can go in
    // a row (set after the colors, as in `move`)
    const index = Math.min(selected, next.length - 1);
    update(next);
    selected = index;
    announcement = `Removed. ${next.length} colors left`;
  }

  // The app's toolbar buttons, like the pop-ups' own tools. Ones that can't
  // do anything right now say so, but keep the focus.
  const barButtonClass = [
    menuTriggerClass,
    'aria-disabled:opacity-40 aria-disabled:hover:bg-transparent',
  ];
  // Hidden on a phone, but still the button's name for screen readers
  const phoneHidden = 'sr-only sm:not-sr-only';
</script>

<div class="flex w-full flex-col gap-2">
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
      id={barId}
      tabindex="-1"
      class={[
        // Tinted, like the pop-ups' other notices, so it reads as its own
        // panel for this one color
        'card preset-tonal-surface flex flex-wrap items-center gap-x-2 gap-y-1 p-2 text-left',
        // A strip with a square bottom sits flush in a card, whose tools are inset
        roundedBottom ? 'w-full' : 'mx-2 w-[calc(100%-1rem)]',
      ]}
      role="group"
      aria-label="Color {selected + 1}"
      onkeydown={(event) => {
        if (event.key !== 'Escape') return;
        // Only the bar, not the pop-up around it
        event.stopPropagation();
        close();
      }}
    >
      {#if shown}
        <ColorSwatch hex={shown.hex} number={selected + 1} small />
        <!-- Room for the name, at least: the buttons go to their own line
        rather than squeezing it out -->
        <span class="flex min-w-0 flex-1 basis-48 flex-col">
          <span class="truncate text-sm leading-tight font-semibold">
            {shown.name || shown.hex}
          </span>
          {#if shown.brandName && shown.yarnName}
            <span class="text-surface-700-300 truncate text-xs">
              {shown.brandName} · {shown.yarnName}
            </span>
          {/if}
        </span>
      {/if}
      <!-- Each button's name is its text; the bar is named for its color.
      On a phone, the arrows show only their icons; Done always says so. -->
      <span
        class="flex w-full flex-wrap items-center justify-end gap-1 sm:ml-auto sm:w-auto"
      >
        <button
          type="button"
          class={barButtonClass}
          title="Move Left"
          aria-disabled={selected === 0 || undefined}
          onclick={() => move(-1)}
        >
          <ArrowLeftIcon aria-hidden="true" />
          <span class={phoneHidden}>Move Left</span>
        </button>
        <button
          type="button"
          class={barButtonClass}
          title="Move Right"
          aria-disabled={selected === colors.length - 1 || undefined}
          onclick={() => move(1)}
        >
          <ArrowRightIcon aria-hidden="true" />
          <span class={phoneHidden}>Move Right</span>
        </button>
        {#if lockable}
          <button
            type="button"
            class={barButtonClass}
            title={color.locked
              ? 'Locked: kept when the other colors change'
              : 'Lock, to keep it when the other colors change'}
            aria-pressed={!!color.locked}
            onclick={toggleLock}
          >
            {#if color.locked}
              <LockKeyholeIcon aria-hidden="true" />
            {:else}
              <LockOpenIcon aria-hidden="true" />
            {/if}
            <span>Lock</span>
          </button>
        {/if}
        <button
          type="button"
          class={barButtonClass}
          title="Remove This Color"
          aria-disabled={colors.length < 2 || undefined}
          onclick={remove}
        >
          <Trash2Icon aria-hidden="true" />
          <span>Remove</span>
        </button>
        <button
          type="button"
          class={barButtonClass}
          title="Done with this color: its changes are kept"
          onclick={close}
        >
          <CheckIcon aria-hidden="true" />
          <span>Done</span>
        </button>
      </span>
      {#if details}
        <div class="w-full">{@render details(selected)}</div>
      {/if}
    </div>
  {:else if toolbar}
    {@render toolbar()}
  {/if}
  <p class="sr-only" aria-live="polite">{announcement}</p>
</div>
