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

<script lang="ts">
  import { TrashUndos } from '$lib/utils/trash-undo.svelte';
  import TrashUndo from '$lib/components/TrashUndo.svelte';
  import { version } from '$app/environment';
  import PaletteStrip from '$lib/components/PaletteStrip.svelte';
  import PlaceholderPalettes from '$lib/components/PlaceholderPalettes.svelte';
  import { ensureYarnData } from '$lib/data/yarns/colorways.svelte';
  import { toast } from '$lib/state/page-state.svelte';
  import {
    MAX_SAVED_PALETTE_NAME_LENGTH,
    PaletteStorage,
    savedPalettes,
    type SavedPalette,
  } from '$lib/storage/palettes.svelte';
  import type { Color } from '$lib/types/yarn-types';
  import {
    getColorsFromInput,
    getPaletteFallbackName,
    getYarnPageURL,
  } from '$lib/utils/color-utils';
  import { formatDateTime } from '$lib/utils/date-utils';
  import {
    CheckIcon,
    PencilIcon,
    Share2Icon,
    Trash2Icon,
    XIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';

  // With updateGauge (Browse Palettes), choosing a palette uses it; without it
  // (the My Projects page), each palette is a link to the Yarn Palette Creator
  // With onshare (My Projects, signed in), each palette can be shared to the gallery
  let {
    updateGauge,
    onshare,
  }: {
    updateGauge?: (update: { _colors: Color[]; _schemeId?: string }) => void;
    onshare?: (share: {
      paletteId: string;
      colors: Color[];
      name: string;
    }) => void;
  } = $props();

  // Codes only carry hex and brand/yarn ids, so names need the yarn data first
  let yarnDataReady = $state(false);
  let editingId = $state<string | null>(null);
  let editingName = $state('');
  // Undos live in the list, since the dialog is modal and a toast button behind
  // it can't be clicked: each where its palette was, so it's right there
  const undos = new TrashUndos();

  let palettes = $derived(
    yarnDataReady
      ? savedPalettes.items
          .map((palette) => {
            const colors = getColorsFromInput({ string: palette.code });
            if (!colors || !colors.length) return null;
            return {
              palette,
              colors,
              label: palette.name || getPaletteFallbackName(colors),
              saved: formatDateTime(palette.createdAt),
            };
          })
          .filter((n) => n !== null)
      : [],
  );

  const undoSpots = $derived(
    undos.placed(palettes.map((item) => item.palette.id)),
  );

  onMount(async () => {
    await Promise.all([ensureYarnData(), savedPalettes.refresh()]);
    yarnDataReady = true;
  });

  async function run(action: () => Promise<void>, errorMessage: string) {
    try {
      await action();
    } catch {
      toast.trigger({ message: errorMessage, category: 'error' });
    }
    await savedPalettes.refresh();
  }

  function startRename(palette: SavedPalette) {
    editingId = palette.id;
    editingName = palette.name;
  }

  async function saveRename() {
    if (!editingId) return;
    const id = editingId;
    editingId = null;
    await run(
      () => PaletteStorage.rename(id, editingName),
      'Unable to rename the palette',
    );
  }

  async function remove(palette: SavedPalette, label: string) {
    undos.add(
      palette.id,
      label,
      palettes.map((item) => item.palette.id),
    );
    await run(
      () => PaletteStorage.remove(palette.id),
      'Unable to delete the palette',
    );
  }

  async function undoRemove(id: string) {
    undos.remove(id);
    await run(
      () => PaletteStorage.restore(id),
      'Unable to restore the palette',
    );
  }

  // A click on the palette: links handle themselves, everything else uses the
  // palette or follows its link
  function choose(event: MouseEvent, colors: Color[]) {
    if ((event.target as HTMLElement).closest('a')) return;
    if (updateGauge) {
      use(colors);
      return;
    }
    (event.currentTarget as HTMLElement).querySelector('a')?.click();
  }

  function use(colors: Color[]) {
    updateGauge?.({ _colors: colors, _schemeId: 'Custom' });
  }
</script>

<!-- The dialog sizes to its content, so keep this as wide as the other Browse Palettes tabs -->
<div
  class={[
    'flex w-full flex-col items-center',
    updateGauge && 'px-2 md:min-w-[44rem] lg:min-w-[62rem]',
  ]}
>
  {#snippet undoAt(anchor: string | null, asListItems: boolean)}
    {#each undoSpots.get(anchor) ?? [] as entry (entry.id)}
      {#if asListItems}
        <li class="w-full">
          <TrashUndo
            label={entry.label}
            onundo={() => undoRemove(entry.id)}
            focus={undos.focusId === entry.id}
            onfocused={() => (undos.focusId = null)}
          />
        </li>
      {:else}
        <TrashUndo
          label={entry.label}
          onundo={() => undoRemove(entry.id)}
          focus={undos.focusId === entry.id}
          onfocused={() => (undos.focusId = null)}
        />
      {/if}
    {/each}
  {/snippet}

  <!-- With nothing left to list, they show on their own -->
  {#if yarnDataReady && !palettes.length && undoSpots.size}
    <div class="flex w-full flex-col gap-2">{@render undoAt(null, false)}</div>
  {/if}
  {#if !yarnDataReady}
    <div class="my-1"></div>
    <PlaceholderPalettes items={3} maxWFull={true} />
  {:else if !palettes.length}
    <div class="my-8 flex max-w-prose flex-col gap-2 text-center">
      <p class="font-bold">No saved palettes yet</p>
    </div>
  {:else}
    <ul
      class="my-2 flex w-full flex-col items-start justify-start gap-4"
      aria-label="Saved palettes"
    >
      {#each palettes as { palette, colors, label, saved } (palette.id)}
        {@render undoAt(palette.id, true)}
        <li class="flex w-full items-start gap-2">
          {#if editingId === palette.id}
            <div class="flex w-full flex-col gap-2">
              <PaletteStrip {colors} />
              <div class="input-group grid-cols-[1fr_auto_auto]">
                <input
                  type="text"
                  class="ig-input"
                  aria-label="Palette name"
                  autocomplete="off"
                  maxlength={MAX_SAVED_PALETTE_NAME_LENGTH}
                  placeholder={getPaletteFallbackName(colors)}
                  bind:value={editingName}
                  onkeydown={(e) => {
                    if (e.key === 'Enter') saveRename();
                    if (e.key === 'Escape') {
                      e.stopPropagation();
                      editingId = null;
                    }
                  }}
                />
                <button
                  type="button"
                  class="ig-btn hover:preset-tonal-surface"
                  title="Save Name"
                  onclick={saveRename}
                >
                  <CheckIcon />
                </button>
                <button
                  type="button"
                  class="ig-btn hover:preset-tonal-surface"
                  title="Cancel"
                  onclick={() => (editingId = null)}
                >
                  <XIcon />
                </button>
              </div>
            </div>
          {:else}
            <!-- The name in the label is the real link or button, for keyboards and
            screen readers; a click anywhere else on the palette does the same,
            and pointing at a color still names its yarn -->
            <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
            <div
              class="w-full min-w-0 cursor-pointer"
              onclick={(event) => choose(event, colors)}
            >
              <!-- Laid out like a saved project's details: name, then when it was saved.
              The name is the palette's link (My Projects) or button (Browse Palettes).
              The button has no handler of its own: its click reaches choose() -->
              {#snippet details()}
                <span
                  class="flex flex-wrap items-center justify-start gap-x-4 text-xs"
                >
                  {#if updateGauge}
                    <button
                      type="button"
                      class="cursor-pointer text-left underline"
                      ><span class="sr-only">Use </span>{label}</button
                    >
                  {:else}
                    <!-- eslint-disable svelte/no-navigation-without-resolve -- a full address, with the colors in its query -->
                    <a
                      href={getYarnPageURL({
                        colors,
                        origin: window.location.origin,
                        version,
                      })}
                      class="underline"
                      title="Open in Yarn Palette Creator"
                      ><span class="sr-only">Open </span>{label}<span
                        class="sr-only"
                      >
                        in Yarn Palette Creator</span
                      ></a
                    >
                    <!-- eslint-enable svelte/no-navigation-without-resolve -->
                  {/if}
                  <span>Saved {saved}</span>
                </span>
              {/snippet}
              <PaletteStrip {colors} insideControl label={details} />
            </div>
            <!-- Centered on the 70px color bar, not the label under it -->
            <div class="flex h-[70px] shrink-0 items-center gap-1">
              <button
                type="button"
                class="btn-icon hover:preset-tonal-surface"
                title="Rename Palette"
                aria-label="Rename {label}"
                onclick={() => startRename(palette)}
              >
                <PencilIcon />
              </button>
              {#if onshare}
                <button
                  type="button"
                  class="btn-icon hover:preset-tonal-surface"
                  title="Share to the Gallery"
                  aria-label="Share {label} to the gallery"
                  onclick={() =>
                    onshare({ paletteId: palette.id, colors, name: label })}
                >
                  <Share2Icon />
                </button>
              {/if}
              <button
                type="button"
                class="btn-icon hover:preset-tonal-surface"
                title="Delete Palette"
                aria-label="Delete {label}"
                onclick={() => remove(palette, label)}
              >
                <Trash2Icon />
              </button>
            </div>
          {/if}
        </li>
      {/each}
      {@render undoAt(null, true)}
    </ul>
  {/if}
</div>
