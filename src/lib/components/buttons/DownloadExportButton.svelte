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
                  Gauges and Weather Data
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
                  Gauges and Weather Data
                </p>
              </div>
            </button>
          </Menu.Item>
        {/if}
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>
