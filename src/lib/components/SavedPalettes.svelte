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
  import { TrashSlots, TrashUndos } from '#lib/utils/trash-undo.svelte.js';
  import TrashUndo from '#lib/components/TrashUndo.svelte';
  import { version } from '$app/env';
  import NameField from '#lib/components/NameField.svelte';
  import PaletteCard from '#lib/components/PaletteCard.svelte';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import PlaceholderPalettes from '#lib/components/PlaceholderPalettes.svelte';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import { toast } from '#lib/state/page-state.svelte.js';
  import {
    MAX_SAVED_PALETTE_NAME_LENGTH,
    PaletteStorage,
    savedPalettes,
    type SavedPalette,
  } from '#lib/storage/palettes.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import {
    getColorsFromInput,
    getPaletteFallbackName,
    getYarnPageURL,
  } from '#lib/utils/color-utils.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import { confirmTrash } from '#lib/utils/confirm-trash.js';
  import type { LibraryFilters } from '#lib/state/library-filters.svelte.js';
  import {
    matchesSearch,
    matchesStatus,
    matchesYarn,
    sortLibrary,
  } from '#lib/utils/collection-filter.js';
  import { PencilIcon, Trash2Icon, XIcon } from '@lucide/svelte';
  import MoreMenu from '#lib/components/buttons/MoreMenu.svelte';
  import { onMount, type Snippet } from 'svelte';

  // With updateGauge (Browse Palettes), choosing a palette uses it; without it
  // (the My Projects page), each palette is a link to the Yarn Palette Creator
  // With sharing (My Projects, signed in), each palette says who can see it
  // With filters (My Library), only what matches shows, sorted as chosen;
  // oncount says how many
  let {
    updateGauge,
    sharing,
    filters,
    oncount,
  }: {
    updateGauge?: (update: { _colors: Color[]; _schemeId?: string }) => void;
    sharing?: Snippet<
      [{ palette: SavedPalette; colors: Color[]; label: string }]
    >;
    filters?: LibraryFilters;
    /** How many there are without the filters, once known, and how many show */
    oncount?: (count: { total: number; matching: number }) => void;
  } = $props();

  // Codes only carry hex and brand/yarn ids, so names need the yarn data first
  let yarnDataReady = $state(false);
  let editingId = $state<string | null>(null);
  let editingName = $state('');
  // Undos live in the list, since the dialog is modal and a toast button behind
  // it can't be clicked: each where its palette was, so it's right there
  const undos = new TrashUndos();
  const slots = new TrashSlots();

  const dateTimeOf = (time: number) =>
    new Date(time).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

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
            };
          })
          .filter((n) => n !== null)
      : [],
  );

  // Every card, newest first (the order they were saved in)
  let allCards = $derived(
    palettes.map((item) => ({
      ...item,
      key: item.palette.id,
      time: item.palette.createdAt,
    })),
  );

  // What the filters let through, sorted as chosen
  let cards = $derived.by(() => {
    if (!filters) return allCards;
    const yarn = {
      brandId: filters.brandId,
      yarnId: filters.yarnId,
      only: filters.onlyThisYarn,
    };
    const kept = allCards.filter(
      (card) =>
        matchesSearch(filters.search, [
          card.label,
          ...card.colors.flatMap((color) => [
            color.name,
            color.brandName,
            color.yarnName,
          ]),
        ]) &&
        matchesYarn(card.colors, yarn) &&
        matchesStatus(filters.status, {
          published: galleryPages.grouped.byPalette.has(card.palette.id),
          ravelry: false,
        }),
    );
    return sortLibrary(kept, filters.sort, filters.reversed, {
      time: (card) => card.time,
      name: (card) => card.label,
    });
  });

  $effect(() => {
    if (yarnDataReady && savedPalettes.loaded)
      oncount?.({ total: allCards.length, matching: cards.length });
  });
  const undoSpots = $derived(undos.placed(cards.map((card) => card.key)));

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
    // Its gallery page comes down with it, so it asks first
    if (
      galleryPages.grouped.byPalette.has(palette.id) &&
      !(await confirmTrash())
    )
      return;
    slots.remember(palette.id, layout);
    undos.add(
      palette.id,
      label,
      cards.map((card) => card.key),
    );
    await run(
      () => PaletteStorage.remove(palette.id),
      'Unable to delete the palette',
    );
  }

  async function undoRemove(id: string) {
    await run(
      () => PaletteStorage.restore(id),
      'Unable to restore the palette',
    );
    undos.remove(id);
    slots.forget(id);
    // Its gallery page, if it had one, comes back too
    galleryPages.refreshSoon();
  }

  /** Its Yarn Palette Creator link, with its name for Save Palette there */
  function linkFor(colors: Color[], name: string) {
    const url = getYarnPageURL({
      colors,
      origin: window.location.origin,
      version,
    });
    return name ? `${url}&name=${encodeURIComponent(name)}` : url;
  }

  // My Projects lays them out as its View menu says; Browse Palettes, one per row
  let grid = $derived(
    !updateGauge && (preferences.value.myProjectsLayout ?? 'grid') === 'grid',
  );
  const layout = $derived(grid ? 'grid' : 'list');

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
        <!-- In the space its palette left -->
        <li class="w-full self-stretch" style={slots.style(entry.id, layout)}>
          <TrashUndo
            fill
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
  {#if yarnDataReady && !cards.length && undoSpots.size}
    <div class="flex w-full flex-col gap-2">{@render undoAt(null, false)}</div>
  {/if}
  {#if !yarnDataReady}
    <div class="my-1"></div>
    <PlaceholderPalettes items={3} maxWFull={true} />
  {:else if !cards.length && filters && allCards.length}
    <div class="my-8 flex flex-col items-center gap-2 text-center">
      <p>No palettes match these filters.</p>
      <button
        type="button"
        class="btn preset-tonal-primary border-primary-500 border"
        onclick={() => filters.clear()}
      >
        <XIcon />
        Clear Filters
      </button>
    </div>
  {:else if !cards.length}
    <div class="my-8 flex max-w-prose flex-col gap-2 text-center">
      <p class="font-bold">No saved palettes yet</p>
    </div>
  {:else}
    <ul
      class={[
        'my-2 w-full',
        grid
          ? 'grid grid-cols-1 items-start gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-3'
          : 'flex flex-col items-start justify-start gap-6',
      ]}
      aria-label="Saved palettes"
    >
      {#each cards as card (card.key)}
        {@const { palette, colors, label } = card}
        {@render undoAt(card.key, true)}
        <li class="flex w-full min-w-0" {@attach slots.track(card.key)}>
          {#if editingId === palette.id}
            <div class="flex w-full flex-col gap-2">
              <PaletteStrip {colors} />
              <NameField
                bind:value={editingName}
                label="Palette name"
                maxlength={MAX_SAVED_PALETTE_NAME_LENGTH}
                placeholder={getPaletteFallbackName(colors)}
                onsave={saveRename}
                oncancel={() => (editingId = null)}
              />
            </div>
          {:else}
            <PaletteCard
              {colors}
              name={label}
              summary={updateGauge ? !!palette.name : false}
              href={updateGauge ? undefined : linkFor(colors, palette.name)}
              onclick={updateGauge ? () => use(colors) : undefined}
              title={updateGauge
                ? 'Use This Palette'
                : 'Open in Yarn Palette Creator'}
            >
              {#snippet nameRow()}
                <span class="inline-flex items-start gap-0.5">
                  {#if updateGauge}
                    <button
                      type="button"
                      class="cursor-pointer text-left font-semibold"
                      onclick={() => use(colors)}
                      ><span class="sr-only">Use </span>{label}</button
                    >
                  {:else}
                    <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- a full address, with the colors in its query -->
                    <a
                      href={linkFor(colors, palette.name)}
                      class="font-semibold break-words"
                      title="Open in Yarn Palette Creator"
                    >
                      <span class="sr-only">Open</span>
                      {label}
                      <span class="sr-only">in Yarn Palette Creator</span>
                    </a>
                  {/if}
                </span>
              {/snippet}
              {#snippet details()}
                {#if !updateGauge}
                  <span class="text-surface-700-300 line-clamp-1 text-xs"
                    >Saved {dateTimeOf(palette.createdAt)}</span
                  >
                {/if}
              {/snippet}
              {#snippet action()}
                <MoreMenu
                  label="More for {label}"
                  items={[
                    {
                      value: 'rename',
                      label: 'Rename',
                      icon: PencilIcon,
                      onselect: () => startRename(palette),
                    },
                    {
                      value: 'trash',
                      label: 'Move to Trash',
                      icon: Trash2Icon,
                      onselect: () => remove(palette, label),
                      separate: true,
                    },
                  ]}
                />
              {/snippet}
              {#snippet footer()}
                {@render sharing?.({ palette, colors, label })}
              {/snippet}
            </PaletteCard>
          {/if}
        </li>
      {/each}
      {@render undoAt(null, true)}
    </ul>
  {/if}
</div>
