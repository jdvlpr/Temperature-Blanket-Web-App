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

<!-- The Palette menu, as the planner's Project menu is the project's: a card
with the palette's name and where it's saved (or Save Palette), what to do
with it, Move to Trash, a few recent palettes, and a line of help links. A side
panel on large screens (see openPaletteMenu); screens opened from here open in
the panel, with a Back button to it. -->

<script lang="ts">
  import { browser, version } from '$app/env';
  import { resolve } from '$app/paths';
  import {
    paletteNameDiffers,
    type GalleryPage,
  } from '#lib/accounts/gallery.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import SaveStatus from '#lib/components/SaveStatus.svelte';
  import SharePalette from '#lib/components/modals/SharePalette.svelte';
  import ShareRows from '#lib/components/ShareRows.svelte';
  import { loadShareState, shareRows } from '#lib/accounts/share-rows.js';
  import {
    PANEL_LIST,
    PANEL_ROW,
    SMALL_LINK,
    SMALL_LINKS,
  } from '#lib/constants/class-constants.js';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import { startingPaletteSearch } from '#lib/state/starting-palette.js';
  import {
    MAX_SAVED_PALETTE_NAME_LENGTH,
    PaletteStorage,
    savedPalettes,
  } from '#lib/storage/palettes.svelte.js';
  import { TRASH_DAYS } from '#lib/storage/trash.js';
  import { sync } from '#lib/sync/status.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { confirmTrash } from '#lib/utils/confirm-trash.js';
  import {
    colorsToPaletteCode,
    getColorsFromInput,
    getPaletteFallbackName,
    getYarnPageURL,
  } from '#lib/utils/color-utils.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import { pluralize } from '#lib/utils/string-utils.js';
  import {
    BookmarkPlusIcon,
    ChevronRightIcon,
    CopyPlusIcon,
    DownloadIcon,
    ExternalLinkIcon,
    FolderOpenIcon,
    LandmarkIcon,
    LayoutGridIcon,
    PlusIcon,
    RotateCwIcon,
    Trash2Icon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import PaletteExport from './PaletteExport.svelte';
  import PaletteTitle from './PaletteTitle.svelte';
  import SaveFirst from './SaveFirst.svelte';
  import {
    addOpenPaletteToAccount,
    openPalette,
    paletteAutosave,
    retryPaletteSave,
    saveNewPalette,
    savePaletteNow,
  } from './autosave.svelte';
  import { yarnPageState } from './state.svelte';

  let { onsave }: { /** Opens Save Palette */ onsave: () => void } = $props();

  const ROW = PANEL_ROW;
  const LINK_ICON = 'icon-sm inline opacity-60';

  const saved = $derived(Boolean(paletteAutosave.id));
  const colorsNow = () => $state.snapshot(yarnPageState.gauge.colors);

  /** Its Yarn Palette Creator link, with its name for whoever opens it */
  function linkFor(colors: Color[], name: string) {
    const url = getYarnPageURL({
      colors,
      origin: window.location.origin,
      version,
    });
    return name ? `${url}&name=${encodeURIComponent(name)}` : url;
  }

  /** Its name or colors differ from its gallery page's */
  const changedFrom = (colors: Color[], label: string) => (page: GalleryPage) =>
    paletteNameDiffers(label, page) ||
    Boolean(
      page.link &&
      colorsToPaletteCode(getColorsFromInput({ string: page.link }) || []) !==
        colorsToPaletteCode(colors),
    );

  // Copy Link and its gallery page, right in the list; what they open opens
  // in the panel with Back to this menu. The link is ready before Copy Link
  // is chosen: a clipboard write right after waiting on storage can be
  // refused (Safari).
  const shareRowsList = $derived.by(() => {
    const colors = colorsNow();
    const label = yarnPageState.title;
    const name = paletteAutosave.id
      ? paletteAutosave.name
      : yarnPageState.suggestedNameFor(colors);
    const here = browser
      ? window.location.pathname + window.location.search
      : '';
    const publish = (paletteId: string, update?: GalleryPage) =>
      dialog.trigger({
        type: 'component',
        component: {
          ref: SharePalette,
          props: {
            paletteId,
            colors,
            name: label,
            showOwner: update?.showOwner,
            update,
          },
        },
        options: {
          title: update ? 'Edit Gallery Page' : 'Publish to Gallery',
          size: 'medium',
          returnable: true,
        },
      });
    return shareRows({
      kind: 'palette',
      id: paletteAutosave.id ?? '',
      link: browser ? linkFor(colors, name) : undefined,
      changed: changedFrom(colors, label),
      signInHref: `${resolve('/auth/sign-in')}?redirect=${encodeURIComponent(here)}`,
      // A gallery page is a saved palette's, so it's saved first
      onpublish: async () => {
        try {
          const id =
            paletteAutosave.id ?? (await saveNewPalette(name)).palette.id;
          publish(id);
        } catch {
          toast.trigger({
            message: 'Unable to save the palette in this browser',
            category: 'error',
          });
        }
      },
      onedit: (page: GalleryPage) =>
        paletteAutosave.id && publish(paletteAutosave.id, page),
    });
  });
  onMount(() => loadShareState('palette'));

  // A new project in the planner, with these colors on its Temperature gauge
  function startProject() {
    const colors = colorsNow();
    const go = async () => {
      await savePaletteNow();
      window.location.assign(
        resolve('/') +
          startingPaletteSearch(
            getYarnPageURL({ colors, origin: window.location.origin }),
          ),
      );
    };
    if (paletteAutosave.id) {
      void go();
      return;
    }
    dialog.trigger({
      type: 'component',
      component: {
        ref: SaveFirst,
        props: {
          onsave: async () => {
            await saveNewPalette(yarnPageState.suggestedNameFor(colors));
          },
          ongo: go,
        },
      },
      options: { title: 'Start a Project' },
    });
  }

  async function copyPalette() {
    try {
      await savePaletteNow();
      const { palette } = await PaletteStorage.add({
        code: colorsToPaletteCode(colorsNow()),
        name: `${yarnPageState.title} (copy)`.slice(
          0,
          MAX_SAVED_PALETTE_NAME_LENGTH,
        ),
        copy: true,
      });
      await openPalette(palette.id);
      dialog.close();
      toast.trigger({
        message: 'Saved a copy. You’re now working on the copy.',
        category: 'success',
      });
    } catch (e) {
      console.warn("Can't save a copy", { e });
      toast.trigger({ message: 'Unable to save a copy', category: 'error' });
    }
  }

  async function newPalette() {
    await savePaletteNow();
    yarnPageState.startNew();
    dialog.close();
  }

  // To the Trash, then a new palette, with Undo to bring it back here
  async function trashPalette() {
    const id = paletteAutosave.id;
    if (!id) return;
    const label = yarnPageState.title;
    const colors = colorsNow();
    try {
      // Its gallery page comes down with it, so it asks first
      if (__ACCOUNTS_ENABLED__ && account.summary?.id) {
        await galleryPages.load();
        if (galleryPages.grouped.byPalette.has(id) && !(await confirmTrash()))
          return;
      }
      await savePaletteNow();
      await PaletteStorage.remove(id);
      yarnPageState.startNew();
      dialog.close();
      toast.trigger({
        message: `Moved ${label} to the Trash`,
        category: 'success',
        action: {
          label: 'Undo',
          response: async () => {
            try {
              await PaletteStorage.restore(id);
              galleryPages.refreshSoon();
              await yarnPageState.openSaved(id, colors);
            } catch {
              toast.trigger({
                message: 'Unable to restore the palette',
                category: 'error',
              });
            }
          },
        },
      });
    } catch (e) {
      console.warn("Can't move the palette to the Trash", { e });
      toast.trigger({
        message: 'Unable to delete the palette',
        category: 'error',
      });
    }
  }

  // A few palettes edited most recently, not counting this one
  let yarnDataReady = $state(false);
  onMount(async () => {
    await ensureYarnData();
    yarnDataReady = true;
  });
  $effect(() => {
    void sync.version;
    void account.summary?.id;
    void paletteAutosave.id;
    if (browser) void savedPalettes.refresh();
  });
  const recentTotal = $derived(savedPalettes.items.length);
  const recent = $derived(
    yarnDataReady
      ? savedPalettes.items
          .filter((p) => p.id !== paletteAutosave.id)
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, 3)
          .map((palette) => {
            const colors = getColorsFromInput({ string: palette.code });
            if (!colors || !colors.length) return null;
            return {
              id: palette.id,
              colors,
              label: palette.name || getPaletteFallbackName(colors),
            };
          })
          .filter((n) => n !== null)
      : [],
  );

  async function openRecent(id: string, colors: Color[]) {
    await savePaletteNow();
    await yarnPageState.openSaved(id, colors);
    dialog.close();
  }
</script>

<!-- Its title, Palette, is in the dialog's header -->
<div class="flex w-full flex-col gap-6 p-4 pt-2 text-left">
  <!-- This palette -->
  <section
    class="bg-surface-100 dark:bg-surface-900 rounded-container card-border flex flex-col gap-2 p-4"
    aria-label="This palette"
  >
    <PaletteTitle field />
    {#if !saved}
      <div class="flex flex-col gap-2 text-sm">
        <p class="font-bold">Not saved yet</p>
        <p class="opacity-70">
          Save it to keep it in My Library. Changes then save automatically.
        </p>
        <button
          type="button"
          class="btn preset-filled-primary-500 self-start"
          onclick={onsave}
          data-testid="menu-save-palette"
        >
          <BookmarkPlusIcon />
          Save Palette
        </button>
      </div>
    {:else if paletteAutosave.state === 'error'}
      <div class="flex flex-col gap-2 text-sm">
        <p class="text-error-700-300 font-bold">Not saved</p>
        <p class="opacity-70">
          The latest changes couldn’t be saved in this browser.
        </p>
        <button
          type="button"
          class="btn preset-tonal-primary self-start"
          onclick={retryPaletteSave}
        >
          <RotateCwIcon />
          Try Again
        </button>
      </div>
    {:else}
      <SaveStatus
        saveState={paletteAutosave.state}
        account={paletteAutosave.account}
        addToAccount={addOpenPaletteToAccount}
      />
    {/if}
  </section>

  <section aria-label="Palette actions">
    <ul class={PANEL_LIST}>
      <li>
        <button
          type="button"
          class={ROW}
          onclick={() =>
            dialog.trigger({
              type: 'component',
              component: { ref: PaletteExport },
              options: { title: 'Download / Export', returnable: true },
            })}
        >
          <DownloadIcon class="shrink-0 opacity-70" />
          <span class="flex flex-1 flex-col">
            <span>Download / Export</span>
            <span class="text-xs opacity-70"
              >Image, color codes or yarn names</span
            >
          </span>
          <ChevronRightIcon class="icon-sm shrink-0 opacity-50" />
        </button>
      </li>
      <ShareRows rows={shareRowsList} />
      <li>
        <button type="button" class={ROW} onclick={startProject}>
          <LayoutGridIcon class="shrink-0 opacity-70" />
          <span class="flex flex-1 flex-col">
            <span>Start a Project with It</span>
            <span class="text-xs opacity-70"
              >In the Project Planner, on the Temperature gauge</span
            >
          </span>
        </button>
      </li>
      {#if saved}
        <li>
          <button
            type="button"
            class={ROW}
            title="Save these colors as a new palette, and leave this one as it is"
            onclick={copyPalette}
          >
            <CopyPlusIcon class="shrink-0 opacity-70" />
            <span class="flex flex-1 flex-col">
              <span>Save a Copy</span>
              <span class="text-xs opacity-70">A new palette from this one</span
              >
            </span>
          </button>
        </li>
      {/if}
      <li>
        <button type="button" class={ROW} onclick={newPalette}>
          <PlusIcon class="shrink-0 opacity-70" />
          <span class="flex flex-1 flex-col">
            <span>New Palette</span>
            <span class="text-xs opacity-70"
              >{saved
                ? 'This one stays in My Palettes'
                : 'Undo brings these colors back'}</span
            >
          </span>
        </button>
      </li>
    </ul>
  </section>

  <!-- Deleting it, apart from the rest -->
  {#if saved}
    <section aria-label="Delete palette">
      <ul class={PANEL_LIST}>
        <li>
          <button
            type="button"
            class="{ROW} text-error-700-300"
            onclick={trashPalette}
            data-testid="trash-palette"
          >
            <Trash2Icon class="shrink-0 opacity-70" />
            <span class="flex flex-1 flex-col">
              <span>Move to Trash</span>
              <span class="text-xs opacity-70"
                >Restore it from My Library for {TRASH_DAYS} days</span
              >
            </span>
          </button>
        </li>
      </ul>
    </section>
  {/if}

  <!-- A few recent palettes; My Palettes has them all, the gallery more -->
  <section class="flex flex-col gap-2" aria-labelledby="recent-palettes">
    <h2 id="recent-palettes" class="text-sm font-bold opacity-70">
      {recent.length ? 'Recent Palettes' : 'Open a Palette'}
    </h2>
    <ul class={PANEL_LIST}>
      {#each recent as item (item.id)}
        <li>
          <button
            type="button"
            class={ROW}
            onclick={() => openRecent(item.id, item.colors)}
          >
            <span class="w-12 shrink-0" aria-hidden="true">
              <PaletteStrip
                colors={item.colors}
                height="40px"
                corners="small"
                insideControl
              />
            </span>
            <span
              class="line-clamp-2 min-w-0 flex-1 text-sm font-semibold break-words"
              >{item.label}</span
            >
          </button>
        </li>
      {/each}
      {#if recentTotal}
        <li>
          <a href={resolve('/my-palettes')} class={ROW}>
            <FolderOpenIcon class="shrink-0 opacity-70" />
            <span class="flex-1"
              >{recentTotal > recent.length + (saved ? 1 : 0)
                ? `All ${recentTotal} ${pluralize('Palette', recentTotal)}`
                : 'My Palettes'}</span
            >
          </a>
        </li>
      {/if}
      <li>
        <a href={resolve('/gallery/palettes')} class={ROW}>
          <LandmarkIcon class="shrink-0 opacity-70" />
          <span class="flex-1">Palette Gallery</span>
        </a>
      </li>
    </ul>
  </section>

  <!-- Help, in one line: the site menu has the rest -->
  <nav
    class={[SMALL_LINKS, 'border-surface-200-800 border-t pt-4']}
    aria-label="Help"
  >
    <a href={resolve('faq')} target="_blank" class={SMALL_LINK}
      >FAQ <ExternalLinkIcon class={LINK_ICON} /><span class="sr-only"
        >(opens in a new tab)</span
      ></a
    >
    <a href={resolve('documentation')} target="_blank" class={SMALL_LINK}>
      Documentation
      <ExternalLinkIcon class={LINK_ICON} /><span class="sr-only"
        >(opens in a new tab)</span
      >
    </a>
    <a href={resolve('contact')} target="_blank" class={SMALL_LINK}
      >Contact <ExternalLinkIcon class={LINK_ICON} /><span class="sr-only"
        >(opens in a new tab)</span
      ></a
    >
  </nav>
</div>
