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

<script>
  import ExportToGoogleSheetModal from '$lib/features/google-sheets/ExportToGoogleSheetModal.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import { previews } from '$lib/state/preview-state.svelte';
  import {
    downloadPDF,
    downloadWeatherCSV,
  } from '$lib/utils/project-utils.svelte';
  import { downloadPreviewPNG } from '$lib/utils/preview-utils.svelte';
  import {
    ChevronDownIcon,
    DownloadIcon,
    FilePlusIcon,
    FileTextIcon,
    ImageIcon,
    TableIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';

  let {
    menuList = ['pdf', 'csv', 'png', 'google-sheet'],
    buttonText = 'Download / Export',
  } = $props();

  // Actions run from the Menu, not a <button> inside each item: Enter and
  // Space click the item element itself, which a nested button never sees
  /** @type {Record<string, () => unknown>} */
  const actions = {
    pdf: downloadPDF,
    csv: downloadWeatherCSV,
    preview: () => {
      const active = previews.active;
      if (!active?.width || !active?.height || !active?.svg) return;
      downloadPreviewPNG(active.width, active.height, active.svg);
    },
    'google-sheet': () => {
      dialog.trigger({
        type: 'component',
        component: {
          ref: ExportToGoogleSheetModal,
        },
        options: { title: 'Create Google Sheet' },
      });
    },
  };

  // Left-aligned: the text fills the row, so a short one (CSV) lines up with
  // the long ones rather than sitting in the middle
  const ITEM =
    'data-highlighted:bg-surface-200-800 flex h-auto items-center justify-start gap-2 text-left whitespace-pre-wrap data-highlighted:text-inherit';
</script>

<Menu
  positioning={{ placement: 'top' }}
  class="m-0 p-0"
  onSelect={(details) => actions[details.value]?.()}
>
  <Menu.Trigger class="btn hover:preset-tonal-surface w-fit">
    <DownloadIcon />
    <span class="flex items-center gap-1"
      >{buttonText} <ChevronDownIcon size={18} /></span
    ></Menu.Trigger
  >
  <Portal>
    <Menu.Positioner>
      <Menu.Content class="bg-surface-100-900 z-9999">
        {#if menuList.includes('pdf')}
          <Menu.Item value="pdf" class={ITEM} title="Download PDF File">
            <FileTextIcon />
            <div class="flex min-w-0 flex-1 flex-col">
              <p>Download PDF</p>
              <p class="text-surface-700-300 text-xs">Gauges & Weather Data</p>
            </div>
          </Menu.Item>
        {/if}
        {#if menuList.includes('csv')}
          <Menu.Item value="csv" class={ITEM} title="Download CSV File">
            <TableIcon />
            <div class="flex min-w-0 flex-1 flex-col">
              <p>Download CSV</p>
              <p class="text-surface-700-300 text-xs">Weather Data</p>
            </div>
          </Menu.Item>
        {/if}
        {#if previews.active?.previewComponent && menuList.includes('png')}
          <Menu.Item value="preview" class={ITEM} title="Download PNG File">
            <ImageIcon />
            <div class="flex min-w-0 flex-1 flex-col">
              <p>Download PNG</p>
              <p class="text-surface-700-300 text-xs">Preview Image</p>
            </div>
          </Menu.Item>
        {/if}
        {#if menuList.includes('google-sheet')}
          <Menu.Separator />
          <Menu.Item
            value="google-sheet"
            class={ITEM}
            title="Create Google Sheet"
          >
            <FilePlusIcon />
            <div class="flex min-w-0 flex-1 flex-col">
              <p>Create Google Sheet</p>
              <p class="text-surface-700-300 text-xs">Gauges & Weather Data</p>
            </div>
          </Menu.Item>
        {/if}
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>
