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

<!-- The Palette menu, in the same shape as the planner's Project menu: a card
with the palette's name and where it's saved (or Save Palette); Download and
Start a Project with It; its Share rows; the Palette itself (New, Open…,
Duplicate, Move to Trash); a line of help links. A
side panel on large screens (see openPaletteMenu); screens opened from here
open in the panel, with a Back button to it. -->

<script lang="ts">
  import { browser, version } from '$app/env';
  import { resolve } from '$app/paths';
  import {
    paletteNameDiffers,
    type GalleryPage,
  } from '#lib/accounts/gallery.js';
  import { galleryPages } from '#lib/accounts/gallery-pages.svelte.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import PanelGroup from '#lib/components/PanelGroup.svelte';
  import SaveStatus from '#lib/components/SaveStatus.svelte';
  import KeyboardShortcuts from '#lib/components/modals/KeyboardShortcuts.svelte';
  import SaveFirst from '#lib/components/modals/SaveFirst.svelte';
  import SharePalette from '#lib/components/modals/SharePalette.svelte';
  import ShareRows from '#lib/components/ShareRows.svelte';
  import { loadShareState, shareRows } from '#lib/accounts/share-rows.js';
  import {
    BTN_PRIMARY,
    PANEL_ROW,
    SMALL_LINK,
    SMALL_LINKS,
  } from '#lib/constants/class-constants.js';
  import { YARN_KEYBOARD_SHORTCUTS } from '#lib/constants/page-constants.js';
  import { startingPaletteSearch } from '#lib/state/starting-palette.js';
  import {
    MAX_SAVED_PALETTE_NAME_LENGTH,
    PaletteStorage,
  } from '#lib/storage/palettes.svelte.js';
  import { TRASH_DAYS } from '#lib/storage/trash.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { confirmTrash } from '#lib/utils/confirm-trash.js';
  import {
    colorsToPaletteCode,
    getColorsFromInput,
    getYarnPageURL,
  } from '#lib/utils/color-utils.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import {
    BookmarkPlusIcon,
    ChevronRightIcon,
    CopyPlusIcon,
    DownloadIcon,
    ExternalLinkIcon,
    FolderOpenIcon,
    LayoutGridIcon,
    PlusIcon,
    RotateCwIcon,
    Trash2Icon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import GettingStarted from './GettingStarted.svelte';
  import { openPaletteScreen } from './open-palette';
  import PaletteExport from './PaletteExport.svelte';
  import PaletteTitle from './PaletteTitle.svelte';
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
  const signedIn = $derived(
    __ACCOUNTS_ENABLED__ && Boolean(account.summary?.id),
  );
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
          message:
            'Save this palette first? It goes on the new project’s Temperature gauge either way. Saved, you can come back to it from My Palettes.',
          saveLabel: 'Save and Start',
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
        message: 'Duplicated. You’re now working on the copy.',
        category: 'success',
      });
    } catch (e) {
      console.warn("Can't duplicate", { e });
      toast.trigger({ message: 'Unable to duplicate', category: 'error' });
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
          class="{BTN_PRIMARY} self-start"
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

  <PanelGroup label="Download and use">
    <li>
      <button
        type="button"
        class={ROW}
        onclick={() =>
          dialog.trigger({
            type: 'component',
            component: { ref: PaletteExport },
            options: { title: 'Download', returnable: true },
          })}
      >
        <DownloadIcon class="shrink-0 opacity-70" />
        <span class="flex flex-1 flex-col">
          <span>Download</span>
          <span class="text-xs opacity-70"
            >Image, color codes or yarn names</span
          >
        </span>
        <ChevronRightIcon class="icon-sm shrink-0 opacity-50" />
      </button>
    </li>
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
  </PanelGroup>

  <PanelGroup heading="Share">
    <ShareRows rows={shareRowsList} />
  </PanelGroup>

  <PanelGroup heading="Palette">
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
    <li>
      <button
        type="button"
        class={ROW}
        onclick={() => openPaletteScreen(true)}
        data-testid="menu-open"
      >
        <FolderOpenIcon class="shrink-0 opacity-70" />
        <span class="flex flex-1 flex-col">
          <span>Open…</span>
          <span class="text-xs opacity-70"
            >{signedIn
              ? 'Your palettes, or ones you starred'
              : 'Your saved palettes'}</span
          >
        </span>
        <ChevronRightIcon class="icon-sm shrink-0 opacity-50" />
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
            <span>Duplicate</span>
            <span class="text-xs opacity-70">A new palette from this one</span>
          </span>
        </button>
      </li>
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
    {/if}
  </PanelGroup>

  <!-- Help, in one line: the site menu has the rest -->
  <nav
    class={[SMALL_LINKS, 'border-surface-200-800 border-t pt-4']}
    aria-label="Help"
  >
    <button
      type="button"
      class={SMALL_LINK}
      onclick={() =>
        dialog.trigger({
          type: 'component',
          component: { ref: GettingStarted },
          options: { title: 'Getting Started' },
        })}>Getting Started</button
    >
    <button
      type="button"
      class={SMALL_LINK}
      onclick={() =>
        dialog.trigger({
          type: 'component',
          component: {
            ref: KeyboardShortcuts,
            props: { shortcuts: YARN_KEYBOARD_SHORTCUTS },
          },
          options: { title: 'Keyboard Shortcuts' },
        })}>Keyboard Shortcuts</button
    >
    <a href={resolve('documentation')} target="_blank" class={SMALL_LINK}>
      Guides & Help
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
