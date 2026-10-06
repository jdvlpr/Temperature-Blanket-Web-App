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
  A color to search yarn by: a color picker, a text box for a color name or
  hex code (tinted with the color), Clear, and Photo, which picks one from a
  photo. `hex` is the valid color, or '' for none. Photo opens its own
  dialog, unless `onphoto` handles it (e.g. inside a dialog already).
-->
<script lang="ts">
  import PickColorFromImage from '$lib/components/modals/PickColorFromImage.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import { getTextColor } from '$lib/utils/color-utils';
  import { iconColorOn } from '$lib/components/yarn-colorways/colorway-utils';
  import { ImageIcon, PipetteIcon, XIcon } from '@lucide/svelte';
  import chroma from 'chroma-js';
  import { untrack } from 'svelte';

  interface Props {
    hex: string;
    label?: string;
    /** Shows the photo picker; left out, Photo opens it as a dialog */
    onphoto?: () => void;
  }

  let {
    hex = $bindable(''),
    label = 'Search by Color',
    onphoto,
  }: Props = $props();

  const id = $props.id();

  /** What's typed, which may be a name ("pink") rather than a hex code */
  let text = $state('');

  // Follow a color set from outside (a link, a photo): the text shows it,
  // unless it already names that color
  $effect.pre(() => {
    const current = hex;
    untrack(() => {
      if (!current) text = '';
      else if (!chroma.valid(text) || chroma(text).hex('rgb') !== current)
        text = current;
    });
  });

  function setColor(value: string) {
    // 'rgb' leaves out alpha
    if (chroma.valid(value)) hex = chroma(value).hex('rgb');
  }

  function photo() {
    if (onphoto) return onphoto();
    dialog.trigger({
      type: 'component',
      component: {
        ref: PickColorFromImage,
        props: { onPick: setColor },
      },
      options: { size: 'medium', title: 'Pick a Color from a Photo' },
    });
  }
</script>

<!-- Where the field is narrow (a phone, a dialog), Photo is just its icon,
so the text box keeps its room -->
<div class="label @container w-full">
  <label class="label-text" for="{id}-text">{label}</label>
  <div class="input-group w-full grid-cols-[auto_1fr_auto_auto]">
    <span class="ig-cell relative p-1.5">
      <input
        type="color"
        class="input size-8 cursor-pointer rounded-full! p-0"
        aria-label="Choose a color"
        value={hex || '#000000'}
        onchange={(e) => {
          text = e.currentTarget.value;
          setColor(text);
        }}
      />
      <!-- Shows the circle picks a color; clicks go through to it -->
      <PipetteIcon
        size={16}
        aria-hidden="true"
        class="pointer-events-none absolute top-1/2 left-1/2 -translate-1/2"
        style="color:{iconColorOn(hex || '#000000')}"
      />
    </span>
    <input
      id="{id}-text"
      type="text"
      class="ig-input min-w-0"
      autocomplete="off"
      placeholder="e.g., pink, #c3f4d2"
      style="background:{hex || 'none'} !important;color:{getTextColor(hex)}"
      bind:value={text}
      oninput={() => (text.trim() ? setColor(text) : (hex = ''))}
    />
    {#if hex || text}
      <button
        type="button"
        aria-label="Clear Color"
        class="ig-btn"
        onclick={() => {
          hex = '';
          text = '';
        }}
        ><XIcon />
      </button>
    {/if}
    <button
      type="button"
      aria-label="Pick color from a photo"
      title="Pick color from a photo"
      class="ig-btn gap-1"
      data-photo-button
      onclick={photo}
      ><ImageIcon aria-hidden="true" />
      <span class="hidden @sm:inline">Photo</span>
    </button>
  </div>
</div>
