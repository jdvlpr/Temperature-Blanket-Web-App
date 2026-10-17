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

<script lang="ts">
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import { beforeNavigate } from '$app/navigation';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import AppShell from '#lib/components/AppShell.svelte';
  import Card from '#lib/components/Card.svelte';
  import Footer from '#lib/components/Footer.svelte';
  import Gauge from '#lib/components/Gauge.svelte';
  import GaugeCustomizer from '#lib/components/GaugeCustomizer.svelte';
  import YarnSources from '#lib/components/YarnSources.svelte';
  import UndoRedoButtons from '#lib/components/buttons/UndoRedoButtons.svelte';
  import SavePalette from '#lib/components/modals/SavePalette.svelte';
  import { openPaletteScreen } from './open-palette';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import {
    dialog,
    ignoresShortcuts,
    isOpenShortcut,
    isDesktop,
    isRedo,
    isUndo,
  } from '#lib/state/page-state.svelte.js';
  import { MAX_SAVED_PALETTE_NAME_LENGTH } from '#lib/storage/palettes.svelte.js';
  import { cleanName } from '#lib/utils/clean-name.js';
  import {
    colorsToPaletteCode,
    stringToColors,
    yarnDetailsToColors,
  } from '#lib/utils/color-utils.js';
  import { onMount } from 'svelte';
  import PaletteStatusButton from './PaletteStatusButton.svelte';
  import PaletteTitle from './PaletteTitle.svelte';
  import {
    closePalette,
    openMatchingPalette,
    openPalette,
    paletteAutosave,
    savePaletteNow,
    watchColors,
  } from './autosave.svelte';
  import { yarnPageState } from './state.svelte';

  watchColors(() => yarnPageState.gauge.colors);

  onMount(() => {
    initPage();
  });

  async function initPage() {
    yarnPageState.loading = true;
    const urlParams = new URLSearchParams(window.location.search);
    const before = colorsToPaletteCode(yarnPageState.gauge.colors);
    let colors = $state.snapshot(yarnPageState.gauge.colors);

    // Load URL
    const s = urlParams.get('s');
    if (s) colors = stringToColors({ string: s }) || colors;

    const yarnString = urlParams.get('f');
    if (yarnString) {
      await ensureYarnData();
      colors = yarnDetailsToColors({ string: yarnString, colors }) || colors;
    }

    // Back on the page with the same colors (or none in the link): carry on
    // with them, their history and the open palette
    const carryOn =
      yarnPageState.history.length > 0 &&
      (!s || colorsToPaletteCode(colors) === before);

    if (!carryOn) {
      yarnPageState.gauge.colors = colors;

      // A name that came with the palette (Open a Copy in the gallery)
      const name = cleanName(
        urlParams.get('name'),
        MAX_SAVED_PALETTE_NAME_LENGTH,
      );
      yarnPageState.suggestion = name
        ? { name, colors: $state.snapshot(yarnPageState.gauge.colors) }
        : null;

      closePalette();
      yarnPageState.startHistory();
      // Opened from My Library (or the link is one of the saved palettes)
      if (s) await openMatchingPalette(name);
    } else yarnPageState.showInAddressBar();

    yarnPageState.loading = false;
  }

  let debounceTimer: number;
  $effect(() => {
    // Every change to the colors, deeply
    void JSON.stringify(yarnPageState.gauge.colors);
    if (yarnPageState.loading) return;
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(() => yarnPageState.updateHistory(), 300);
  });

  const canUndo = $derived(!yarnPageState.history.isFirst);
  const canRedo = $derived(!yarnPageState.history.isLast);

  /** Save Palette; the palette it saves is then open here */
  function openSavePalette() {
    dialog.trigger({
      type: 'component',
      component: {
        ref: SavePalette,
        props: {
          colors: $state.snapshot(yarnPageState.gauge.colors),
          suggestedName: yarnPageState.suggestedNameFor(
            yarnPageState.gauge.colors,
          ),
          onsaved: (palette: { id: string }) => openPalette(palette.id),
        },
      },
      options: { size: 'medium', title: 'Save Palette' },
    });
  }

  // Leaving for another page of the site: a change waiting to save saves now
  beforeNavigate(() => void savePaletteNow());
</script>

<svelte:window
  onkeydown={(ev) => {
    // The Palette menu's Open, in place of the browser's
    if (isOpenShortcut(ev) && !yarnPageState.loading) {
      ev.preventDefault();
      void openPaletteScreen();
      return;
    }
    if (ignoresShortcuts(ev) || yarnPageState.loading) return;
    if (isUndo(ev)) {
      ev.preventDefault();
      if (canUndo) yarnPageState.loadFromHistory({ action: 'Undo' });
    } else if (isRedo(ev)) {
      ev.preventDefault();
      if (canRedo) yarnPageState.loadFromHistory({ action: 'Redo' });
    } else if ((ev.metaKey || ev.ctrlKey) && ev.key === 's') {
      ev.preventDefault();
      if (paletteAutosave.id) void savePaletteNow();
      else openSavePalette();
    }
  }}
  onbeforeunload={(event) => {
    if (!paletteAutosave.id || paletteAutosave.state === 'saved') return;
    void savePaletteNow();
    event.preventDefault();
    event.returnValue = 'Unsaved Palette';
  }}
/>

<svelte:head>
  <title>Yarn Palette Creator</title>
  <meta
    name="description"
    content="Create a yarn color palette from a collection of brands and yarns. Find matching colorways from HTML hex color codes or from an image."
  />

  <meta property="og:title" content="Yarn Palette Creator" />
  <meta
    property="og:description"
    content="Create a yarn color palette from a collection of brands and yarns. Find matching colorways from HTML hex color codes or from an image."
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/yarn" />
  <meta property="og:type" content="website" />
  <meta
    property="og:image"
    content="{PUBLIC_BASE_URL}/images/temperature-blanket-og-image-5.0.0.jpg"
  />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
</svelte:head>

<AppShell pageName="Yarn Palette Creator">
  {#snippet stickyHeader()}
    <div class="hidden shrink-0 lg:inline-flex"><AppLogo /></div>
    <div class="flex min-w-0 flex-1 justify-between gap-2 sm:justify-end">
      <!-- The palette's name, in the space wider screens have spare -->
      {#if isDesktop.current}
        <div class="flex min-w-0 flex-1 items-center gap-0.5 lg:ml-2">
          <PaletteTitle />
        </div>
      {/if}
      <UndoRedoButtons
        {canUndo}
        {canRedo}
        onUndo={() => yarnPageState.loadFromHistory({ action: 'Undo' })}
        onRedo={() => yarnPageState.loadFromHistory({ action: 'Redo' })}
      />
    </div>
    <PaletteStatusButton onsave={openSavePalette} />
  {/snippet}
  {#snippet main()}
    <div>
      <main class="m-auto max-w-(--breakpoint-xl) text-center max-lg:px-2">
        <div class="w-full py-4">
          <div class="flex flex-col gap-2">
            <h2 class="h1 text-gradient mb-0">Design a Yarn Palette</h2>
            <p>
              Create a yarn palette from a collection of brands and yarns. Find
              matching colors from hex codes or an image.
            </p>
          </div>
        </div>
        <div class=" mt-4">
          <Gauge bind:gauge={yarnPageState.gauge} />

          <GaugeCustomizer bind:gauge={yarnPageState.gauge} />
        </div>
      </main>
    </div>
  {/snippet}
  {#snippet footer()}
    <div>
      <Footer>
        {#snippet sources()}
          <div class="text-sm">
            <p class="text-surface-700-300">
              Gradients based on <a
                href="https://www.ColorBrewer2.org"
                target="_blank"
                rel="noopener noreferrer"
                class="link">ColorBrewer2.org</a
              >
              by Cynthia A. Brewer, Geography, Pennsylvania State University, licenced
              under under
              <a
                href="https://www.apache.org/licenses/LICENSE-2.0"
                target="_blank"
                rel="noreferrer"
                class="link">Apache 2</a
              >.
            </p>
            <YarnSources />
          </div>
        {/snippet}
      </Footer>
    </div>
  {/snippet}
</AppShell>
