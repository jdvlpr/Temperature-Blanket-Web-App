<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

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
  import { dialog, previews } from '$lib/state';
  import {
    downloadPDF,
    downloadPreviewPNG,
    downloadWeatherCSV,
  } from '$lib/utils';
  import {
    ChevronDownIcon,
    DownloadIcon,
    FilePlusIcon,
    ImageIcon,
    TableIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';

  let {
    menuList = ['pdf', 'csv', 'png', 'google-sheet'],
    buttonText = 'Download/Export',
  } = $props();
</script>

<Menu positioning={{ placement: 'top' }} class="m-0 p-0">
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
          <Menu.Item value="pdf" class="hover:preset-tonal-surface">
            <button
              class="flex items-center gap-2 text-left whitespace-pre-wrap"
              onclick={downloadPDF}
              title="Download PDF File"
            >
              <DownloadIcon />
              <div class="flex flex-col">
                <p>Download PDF</p>
                <p class="text-surface-700-300 text-xs">
                  Gauges & Weather Data
                </p>
              </div>
            </button>
          </Menu.Item>
        {/if}
        {#if menuList.includes('csv')}
          <Menu.Item value="csv" class="hover:preset-tonal-surface">
            <button
              class="flex items-center gap-2 text-left whitespace-pre-wrap"
              onclick={downloadWeatherCSV}
              title="Download CSV File"
            >
              <TableIcon />
              <div class="flex flex-col">
                <p>Download CSV</p>
                <p class="text-surface-700-300 text-xs">Weather Data</p>
              </div>
            </button>
          </Menu.Item>
        {/if}
        {#if previews.active?.previewComponent && menuList.includes('png')}
          <Menu.Item value="preview" class="hover:preset-tonal-surface">
            <button
              class="flex h-auto items-center gap-2 text-left whitespace-pre-wrap"
              title="Download PNG File"
              onclick={() => {
                downloadPreviewPNG(
                  previews.active.width,
                  previews.active.height,
                  previews.active.svg,
                );
              }}
            >
              <ImageIcon />
              <div class="flex flex-col">
                <p>Download PNG</p>
                <p class="text-surface-700-300 text-xs">Preview Image</p>
              </div>
            </button>
          </Menu.Item>
        {/if}
        {#if menuList.includes('google-sheet')}
          <Menu.Separator />
          <Menu.Item value="google-sheet" class="hover:preset-tonal-surface">
            <button
              class="flex items-center gap-2 text-left whitespace-pre-wrap"
              onclick={() => {
                dialog.trigger({
                  type: 'component',
                  component: {
                    ref: ExportToGoogleSheetModal,
                  },
                });
              }}
              title="Create Google Sheet"
            >
              <FilePlusIcon />
              <div class="flex flex-col">
                <p>Create Google Sheet</p>
                <p class="text-surface-700-300 text-xs">
                  Gauges & Weather Data
                </p>
              </div>
              <span class="badge preset-filled-secondary-500">New</span>
            </button>
          </Menu.Item>
        {/if}
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>
