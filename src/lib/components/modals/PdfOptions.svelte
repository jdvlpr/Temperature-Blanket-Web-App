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

<!-- What to put in the PDF, then download it. Opened by downloadPDF; its
title is in the dialog's header. -->

<script lang="ts">
  import pdfExtraColors from '$lib/features/pdf/sections/extra-colors.svelte';
  import pdfGauges from '$lib/features/pdf/sections/gauges.svelte';
  import pdfWeatherData from '$lib/features/pdf/sections/weather-data.svelte';
  import { allGaugesAttributes, gauges } from '$lib/state/gauges-state.svelte';
  import { locations } from '$lib/state/location-state.svelte';
  import { dialog, toast } from '$lib/state/page-state.svelte';
  import { previews } from '$lib/state/preview-state.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import SaveAndCloseButtons from './SaveAndCloseButtons.svelte';

  async function download() {
    dialog.close();
    try {
      const { default: JsPDF } = await import('jspdf');
      const doc = new JsPDF();
      const totalPages =
        pdfGauges.pages() + pdfExtraColors.pages() + pdfWeatherData.pages();
      pdfGauges.create(doc, totalPages);
      pdfExtraColors.create(doc, totalPages);
      pdfWeatherData.create(doc, totalPages);
      // Remove blank first page, ugly hack
      doc.deletePage(1);
      doc.save(`Temperature-Blanket-${locations.projectFilename}.pdf`);
    } catch (e) {
      console.warn("Can't create the PDF", { e });
      toast.trigger({ message: 'Unable to create the PDF', category: 'error' });
    }
  }
</script>

<div class="flex flex-col gap-4 p-4 pt-2">
  <div class="flex flex-col gap-1">
    <p class="font-bold">Weather Data</p>
    <div class="flex flex-col gap-1">
      {#each allGaugesAttributes as { targets } (targets)}
        {#each targets as { id, label } (id)}
          <label class="flex items-center space-x-2">
            <input
              type="checkbox"
              name="id"
              class="checkbox"
              value={id}
              bind:group={weather.pdfOptions.weatherDataParams}
            />
            <p>{label}</p>
          </label>
        {/each}
      {/each}
    </div>
  </div>

  <div class="flex flex-col gap-1">
    <div class="flex flex-col">
      <p class="font-bold">Gauges</p>
      <p class="text-surface-700-300 text-xs">Colors & Ranges</p>
    </div>
    <div class="flex flex-col gap-1">
      {#each gauges.allCreated as { id, label } (id)}
        <label class="flex items-center space-x-2">
          <input
            type="checkbox"
            name="id"
            class="checkbox"
            value={id}
            bind:group={weather.pdfOptions.gauges}
          />
          <p>{label}</p>
        </label>
      {/each}
    </div>
  </div>

  {#if weather.pdfOptions.gauges.length > 0}
    <div class="flex flex-col gap-1">
      <p class="font-bold">Gauge Options</p>
      <label class="flex items-center space-x-2">
        <input
          type="checkbox"
          name="showDaysInRange"
          class="checkbox"
          bind:checked={weather.pdfOptions.showDaysInRange}
        />
        <p>Show number of days in ranges</p>
      </label>
    </div>
  {/if}

  {#if previews.extraColors.length > 0}
    <div class="flex flex-col gap-1">
      <div class="flex flex-col">
        <p class="font-bold">Additional Colors</p>
        <p class="text-surface-700-300 text-xs">
          Accent & border colors used in the preview
        </p>
      </div>
      <label class="flex items-center space-x-2">
        <input
          type="checkbox"
          name="additionalColors"
          class="checkbox"
          bind:checked={weather.pdfOptions.additionalColors}
        />
        <p>Include additional colors page</p>
      </label>
    </div>
  {/if}

  <SaveAndCloseButtons
    saveText="Download"
    onSave={download}
    onClose={dialog.dismiss}
  />
</div>
