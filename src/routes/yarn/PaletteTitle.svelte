<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- The open palette's name, as ProjectTitle is the project's: a text field
styled as the title (in the top bar on wider screens), or a labelled field (the
Palette menu). Click to rename in place; Enter or clicking away keeps the
name, Escape puts it back. Not saved yet, focusing the title saves the palette
first, since naming it means keeping it; the menu's field saves it once a
name is given. -->

<script lang="ts">
  import { toast } from '#lib/state/page-state.svelte.js';
  import { MAX_SAVED_PALETTE_NAME_LENGTH } from '#lib/storage/palettes.svelte.js';
  import { tick } from 'svelte';
  import {
    paletteAutosave,
    renameOpenPalette,
    saveNewPalette,
  } from './autosave.svelte';
  import { yarnPageState } from './state.svelte';

  let { field = false }: { field?: boolean } = $props();

  let name = $state('');
  let focused = $state(false);

  // The saved name, or the gallery's for a palette not saved yet
  const savedName = $derived(
    paletteAutosave.id
      ? paletteAutosave.name
      : yarnPageState.suggestedNameFor(yarnPageState.gauge.colors),
  );
  $effect(() => {
    const saved = savedName;
    if (!focused) name = saved;
  });

  // No name: what the palette is called in My Library shows in its place
  const fallback = $derived(yarnPageState.title);

  async function onfocus(e: FocusEvent & { currentTarget: HTMLInputElement }) {
    focused = true;
    const input = e.currentTarget;
    if (!name) name = fallback;
    await tick();
    input.select();
    // The menu's field can be focused just by opening it: that saves only
    // once a name is given
    if (!paletteAutosave.id && !field) await save(savedName);
  }

  async function save(withName: string) {
    try {
      const { added } = await saveNewPalette(withName);
      toast.trigger({
        message: added
          ? 'Palette saved. Changes now save automatically.'
          : 'This palette is already saved. Changes now save automatically.',
        category: added ? 'success' : 'info',
      });
    } catch {
      toast.trigger({
        message: 'Unable to save the palette in this browser',
        category: 'error',
      });
    }
  }

  async function onblur() {
    focused = false;
    let renamed = name.trim();
    // Left as the fallback: still no name, so it follows the colors
    if (!savedName && renamed === fallback) renamed = '';
    name = renamed;
    if (renamed === savedName) return;
    if (!paletteAutosave.id) {
      if (!field || !renamed) return;
      await save(renamed);
      // Already saved under another name: it takes this one
      if (paletteAutosave.id && paletteAutosave.name !== renamed)
        await renameOpenPalette(renamed);
      return;
    }
    try {
      await renameOpenPalette(renamed);
      toast.trigger({
        message: renamed ? 'Palette renamed' : 'Name removed',
        category: 'success',
      });
    } catch {
      name = savedName;
      toast.trigger({
        message: 'Unable to rename the palette',
        category: 'error',
      });
    }
  }

  function onkeydown(e: KeyboardEvent & { currentTarget: HTMLInputElement }) {
    if (e.key === 'Enter') e.currentTarget.blur();
    if (e.key === 'Escape') {
      e.stopPropagation();
      name = savedName;
      e.currentTarget.blur();
    }
  }

  const title = $derived(
    paletteAutosave.id ? 'Rename Palette' : 'Save and name this palette',
  );
</script>

{#if field}
  <label class="label text-left">
    <span class="label-text">Name</span>
    <input
      type="text"
      class="input"
      {title}
      autocomplete="off"
      spellcheck="false"
      maxlength={MAX_SAVED_PALETTE_NAME_LENGTH}
      placeholder={fallback}
      bind:value={name}
      {onfocus}
      {onblur}
      {onkeydown}
      data-testid="palette-name-field"
    />
  </label>
{:else}
  <!-- The hidden copy of the text sizes the field to it, so it's exactly as
  wide as the title, focused or not -->
  <div
    class="inline-grid max-w-full min-w-0 grid-cols-[minmax(0,max-content)] font-bold"
  >
    <span
      class="invisible col-start-1 row-start-1 truncate border border-transparent px-2 whitespace-pre"
      aria-hidden="true">{name || fallback}</span
    >
    <!-- size=1: otherwise its default width (20 characters) widens the column
    past a short name -->
    <input
      type="text"
      size={1}
      class="rounded-base hover:border-surface-300-700 focus:border-surface-300-700 focus:bg-surface-50-950 col-start-1 row-start-1 h-10 w-full min-w-0 truncate border border-transparent bg-transparent px-2 outline-none placeholder:text-current"
      class:placeholder:opacity-70={!paletteAutosave.id}
      aria-label="Palette name"
      {title}
      autocomplete="off"
      spellcheck="false"
      maxlength={MAX_SAVED_PALETTE_NAME_LENGTH}
      placeholder={fallback}
      bind:value={name}
      {onfocus}
      {onblur}
      {onkeydown}
      data-testid="top-bar-palette-name"
    />
  </div>
{/if}
