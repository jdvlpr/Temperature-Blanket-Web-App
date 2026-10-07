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
  import { PUBLIC_COOLORS_LINK } from '$env/static/public';
  import PaletteStrip from '$lib/components/PaletteStrip.svelte';
  import Expand from '$lib/components/Expand.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import { ensureYarnData } from '$lib/data/yarns/colorways.svelte';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { dialog } from '$lib/state/page-state.svelte';
  import type { Color } from '$lib/types/yarn-types';
  import { readPastedColors } from '$lib/utils/color-utils';
  import { pluralize } from '$lib/utils/string-utils';
  import { onMount } from 'svelte';

  let {
    updateGauge,
  }: {
    updateGauge?: (update: { _colors: Color[] }) => void;
  } = $props();

  let text = $state('');
  let showExamples = $state(false);

  let read = $derived(readPastedColors(text));
  let count = $derived(read.colors.length);

  function save() {
    if (!count) return;
    updateGauge?.({ _colors: read.colors });
    dialog.close();
  }

  onMount(() => {
    // Codes and links carry yarn details, which need the yarn data to read
    ensureYarnData();
  });
</script>

<div class="flex flex-col gap-4 px-4 pt-2 pb-4">
  <label for="paste-colors" class="label">
    <span class="label-text">Colors, a code, or a link</span>
    <textarea
      bind:value={text}
      id="paste-colors"
      class="textarea rounded-container min-h-28"
      placeholder="e.g. red, FFA500, #ADD8E6"
      aria-describedby="paste-colors-hint"
      onkeydown={(e) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          save();
        }
      }}></textarea>
  </label>
  <p id="paste-colors-hint" class="-mt-2 text-sm opacity-80">
    Color names, hex codes, or rgb() colors, separated by commas or new lines.
    Or a link from this site or Coolors.co.
  </p>

  {#if count}
    <PaletteStrip
      colors={read.colors}
      label={`${count} ${pluralize('Color', count)}`}
    />
  {/if}

  {#if read.unreadable.length}
    <div class="card preset-tonal-warning p-4 text-sm" role="status">
      <p>
        {count ? 'Couldn’t read' : 'No colors found in'}:
        <span class="font-bold break-all">{read.unreadable.join(', ')}</span>
      </p>
      {#if count}
        <p class="mt-1 opacity-80">
          {count === 1
            ? 'Only the color above'
            : `Only the ${count} colors above`}
          will be used.
        </p>
      {/if}
    </div>
  {/if}

  <div class="flex flex-col gap-2 text-left text-sm">
    <div class="mx-auto">
      <Expand bind:isExpanded={showExamples} label="More examples" />
    </div>
    {#if showExamples}
      <div transition:safeSlide class="flex flex-col gap-2">
        <p>
          <a
            href="https://htmlcolorcodes.com/color-names/"
            target="_blank"
            rel="noreferrer"
            class="link">HTML color names</a
          >, hex codes, or rgb() colors:
        </p>
        <div class="ml-2 flex flex-wrap gap-2">
          <pre class="pre select-all">red, orange, light blue</pre>
          <pre class="pre select-all">FF0000-FFA500-ADD8E6</pre>
          <pre class="pre select-all">#FF0000 #FFA500 #ADD8E6</pre>
          <pre class="pre select-all">rgb(255, 0, 0)</pre>
        </div>
        <p>
          A palette link, saved project URL, or yarn search URL from this site,
          or the URL of a palette from <a
            href={PUBLIC_COOLORS_LINK}
            target="_blank"
            rel="nofollow noreferrer"
            class="link">Coolors.co</a
          >.
        </p>
        <p>A palette code from older versions of this site:</p>
        <div class="ml-2 flex flex-wrap gap-2">
          <pre
            class="pre break-all select-all">palette:40004bae8bbdf7f7f780c58100441b</pre>
        </div>
      </div>
    {/if}
  </div>
</div>

<StickyPart position="bottom">
  <div class="p-2 max-sm:pb-4">
    <SaveAndCloseButtons
      onSave={save}
      onClose={dialog.close}
      saveText={count
        ? `Use ${count} ${pluralize('Color', count)}`
        : 'Use Colors'}
      disabled={!count}
    />
  </div>
</StickyPart>
