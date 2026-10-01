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

<!-- The Project menu's Download / Export screen. A file downloads right away
and closes the panel; PDF and Google Sheet first ask what to include, on a
screen of their own. -->

<script lang="ts">
  import { PANEL_LIST, PANEL_ROW } from '$lib/constants/class-constants';
  import ExportToGoogleSheetModal from '$lib/features/google-sheets/ExportToGoogleSheetModal.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import { previews } from '$lib/state/preview-state.svelte';
  import { downloadPreviewPNG } from '$lib/utils/preview-utils.svelte';
  import {
    downloadPDF,
    downloadWeatherCSV,
  } from '$lib/utils/project-utils.svelte';
  import {
    ChevronRightIcon,
    FilePlusIcon,
    FileTextIcon,
    ImageIcon,
    TableIcon,
  } from '@lucide/svelte';

  function csv() {
    downloadWeatherCSV();
    dialog.close();
  }

  function png() {
    const active = previews.active;
    if (!active?.width || !active?.height || !active?.svg) return;
    downloadPreviewPNG(active.width, active.height, active.svg);
    dialog.close();
  }
</script>

<div class="flex w-full flex-col gap-6 p-4 pt-2 text-left">
  <section class="flex flex-col gap-2" aria-labelledby="export-download">
    <h3 id="export-download" class="text-sm font-bold opacity-70">Download</h3>
    <ul class={PANEL_LIST}>
      <li>
        <button type="button" class={PANEL_ROW} onclick={downloadPDF}>
          <FileTextIcon class="shrink-0 opacity-70" />
          <span class="flex flex-1 flex-col">
            <span>PDF</span>
            <span class="text-xs opacity-70">Gauges & Weather Data</span>
          </span>
          <ChevronRightIcon class="size-4 shrink-0 opacity-50" />
        </button>
      </li>
      <li>
        <button type="button" class={PANEL_ROW} onclick={csv}>
          <TableIcon class="shrink-0 opacity-70" />
          <span class="flex flex-1 flex-col">
            <span>CSV</span>
            <span class="text-xs opacity-70"
              >Weather Data, for spreadsheets</span
            >
          </span>
        </button>
      </li>
      {#if previews.active?.previewComponent}
        <li>
          <button type="button" class={PANEL_ROW} onclick={png}>
            <ImageIcon class="shrink-0 opacity-70" />
            <span class="flex flex-1 flex-col">
              <span>PNG</span>
              <span class="text-xs opacity-70">Preview Image</span>
            </span>
          </button>
        </li>
      {/if}
    </ul>
  </section>

  <section class="flex flex-col gap-2" aria-labelledby="export-export">
    <h3 id="export-export" class="text-sm font-bold opacity-70">Export</h3>
    <ul class={PANEL_LIST}>
      <li>
        <button
          type="button"
          class={PANEL_ROW}
          onclick={() =>
            dialog.trigger({
              type: 'component',
              component: { ref: ExportToGoogleSheetModal },
              options: { title: 'Create Google Sheet' },
            })}
        >
          <FilePlusIcon class="shrink-0 opacity-70" />
          <span class="flex flex-1 flex-col">
            <span>Google Sheet</span>
            <span class="text-xs opacity-70"
              >Gauges & Weather Data, in a new sheet in your Google Drive</span
            >
          </span>
          <ChevronRightIcon class="size-4 shrink-0 opacity-50" />
        </button>
      </li>
    </ul>
  </section>
</div>
