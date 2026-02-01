<script>
  import ExportToGoogleSheetModal from '$lib/features/google-sheets/ExportToGoogleSheetModal.svelte';
  import { dialog, previews } from '$lib/state';
  import {
    downloadPDF,
    downloadPreviewPNG,
    downloadWeatherCSV,
  } from '$lib/utils';
  import {
    ChartColumnIcon,
    ChevronDownIcon,
    DownloadIcon,
    FileIcon,
    FilePlusIcon,
    FileTextIcon,
    ImageIcon,
    TableIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
</script>

<Menu positioning={{ placement: 'top' }}>
  <Menu.Trigger class="btn hover:preset-tonal-surface w-fit">
    <DownloadIcon /> Download/Export <ChevronDownIcon /></Menu.Trigger
  >
  <Portal>
    <Menu.Positioner>
      <Menu.Content class="z-9999">
        <Menu.Item value="pdf">
          <button
            class="flex items-center gap-2 text-left whitespace-pre-wrap"
            onclick={downloadPDF}
            title="Download PDF File"
          >
            <DownloadIcon />
            <div class="flex flex-col">
              <p>Download PDF</p>
              <p class="text-xs">Gauges and Weather Data</p>
            </div>
          </button>
        </Menu.Item>
        <Menu.Item value="csv">
          <button
            class="flex items-center gap-2 text-left whitespace-pre-wrap"
            onclick={downloadWeatherCSV}
            title="Download CSV File"
          >
            <TableIcon />
            <div class="flex flex-col">
              <p>Download CSV</p>
              <p class="text-xs">Weather Data</p>
            </div>
          </button>
        </Menu.Item>
        {#if previews.active?.previewComponent}
          <Menu.Item value="preview">
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
                <p class="text-xs">Preview Image</p>
              </div>
            </button>
          </Menu.Item>
        {/if}
        <Menu.Separator />
        <Menu.Item value="google-sheet">
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
            </div>
          </button>
        </Menu.Item>
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>
