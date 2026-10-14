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
  import type { GalleryPage } from '#lib/accounts/gallery.js';
  import GallerySharing from '#lib/components/account/GallerySharing.svelte';
  import {
    FolderPlusIcon,
    LoaderCircleIcon,
    PencilIcon,
    Trash2Icon,
  } from '@lucide/svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import MoreMenu from '#lib/components/buttons/MoreMenu.svelte';
  import { onMount, type Snippet } from 'svelte';
  import type { Attachment } from 'svelte/attachments';

  // With updateGauge (Browse Palettes), choosing a palette uses it; without it
  // (the My Projects page), each palette is a link to the Yarn Palette Creator
  // With sharing (My Projects, signed in), each palette says who can see it,
  // and palettes only in the gallery (deleted or not saved here) are listed too
  let {
    updateGauge,
    sharing,
    galleryOnly = [],
  }: {
    updateGauge?: (update: { _colors: Color[]; _schemeId?: string }) => void;
    sharing?: Snippet<
      [{ palette: SavedPalette; colors: Color[]; label: string }]
    >;
    /** The newest page of each palette only in the gallery */
    galleryOnly?: GalleryPage[];
  } = $props();

  // Codes only carry hex and brand/yarn ids, so names need the yarn data first
  let yarnDataReady = $state(false);
  let editingId = $state<string | null>(null);
  let editingName = $state('');
  // Undos live in the list, since the dialog is modal and a toast button behind
  // it can't be clicked: each where its palette was, so it's right there
  const undos = new TrashUndos();
  const slots = new TrashSlots();

  const dateOf = (time: number) =>
    new Date(time).toLocaleDateString(undefined, { dateStyle: 'medium' });
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

  // Every card, newest first: saved ones by when they were saved (their
  // order), ones only in the gallery by when they were published. One just
  // moved to the Trash shows as its undo, not again.
  type Card = {
    key: string;
    time: number;
    colors: Color[];
    label: string;
  } & (
    | { palette: SavedPalette; page?: never }
    | { palette?: never; page: GalleryPage }
  );
  let cards = $derived.by((): Card[] => {
    const saved: Card[] = palettes.map((item) => ({
      ...item,
      key: item.palette.id,
      time: item.palette.createdAt,
    }));
    if (!yarnDataReady || !savedPalettes.loaded || !galleryOnly.length)
      return saved;
    const undoing = new Set(undos.entries.map((entry) => entry.id));
    const pages = galleryOnly
      .filter((page) => !undoing.has(page.projectId))
      .map((page): Card | null => {
        const colors = page.link && getColorsFromInput({ string: page.link });
        if (!colors || !colors.length) return null;
        return {
          page,
          colors,
          label: page.title,
          key: `gallery-${page.postId}`,
          time: page.publishedAt,
        };
      })
      .filter((n) => n !== null);
    // A stable sort: the saved ones keep their order
    return [...saved, ...pages].sort((a, b) => b.time - a.time);
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
    // The list is refreshed by then, so its gallery-only card (when
    // published) doesn't show in between
    await run(
      () => PaletteStorage.restore(id),
      'Unable to restore the palette',
    );
    undos.remove(id);
    slots.forget(id);
  }

  // Saving a gallery-only palette back: its card says so meanwhile, and
  // becomes a saved palette's card once it's listed
  const adding = new SvelteSet<string>();
  // Its card, once saved: focus moves there, as its old card is gone
  let focusId = $state<string | null>(null);
  const takeFocus: Attachment<HTMLElement> = (link) => {
    link.focus({ preventScroll: true });
    focusId = null;
  };
  async function addBack(page: GalleryPage, colors: Color[]) {
    if (adding.has(page.projectId)) return;
    adding.add(page.projectId);
    try {
      const { addPaletteBack } =
        await import('#lib/accounts/gallery-add-back.js');
      focusId = await addPaletteBack(page, colors);
    } catch {
      toast.trigger({
        message: `“${page.title}” couldn’t be added to My Saved Palettes. Try again later.`,
        category: 'error',
      });
    } finally {
      adding.delete(page.projectId);
    }
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
        {@const { palette, page, colors, label } = card}
        {@render undoAt(card.key, true)}
        <li class="flex w-full min-w-0" {@attach slots.track(card.key)}>
          {#if page}
            <!-- Only in the gallery: opens a copy, as its gallery page does -->
            <PaletteCard
              {colors}
              name={label}
              summary={false}
              href={linkFor(colors, page.title)}
              title="Open a copy in Yarn Palette Creator"
            >
              {#snippet details()}
                <span
                  class="text-surface-700-300 line-clamp-1 text-xs"
                  aria-live="polite"
                >
                  {#if adding.has(page.projectId)}
                    <LoaderCircleIcon
                      class="icon-sm inline animate-spin"
                      aria-hidden="true"
                    />
                    Adding to My Saved Palettes…
                  {:else}
                    Gallery only · Published {dateOf(page.publishedAt)}
                  {/if}
                </span>
              {/snippet}
              {#snippet action()}
                <MoreMenu
                  label="More for {label}"
                  items={[
                    {
                      value: 'add-back',
                      label: 'Add to My Saved Palettes',
                      icon: FolderPlusIcon,
                      onselect: () => addBack(page, colors),
                    },
                  ]}
                />
              {/snippet}
              {#snippet footer()}
                <GallerySharing
                  compact
                  kind="palette"
                  {label}
                  {page}
                  galleryOnly
                  onadd={() => {}}
                  onupdate={() => {}}
                />
              {/snippet}
            </PaletteCard>
          {:else if editingId === palette.id}
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
                      {@attach focusId === palette.id ? takeFocus : undefined}
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
