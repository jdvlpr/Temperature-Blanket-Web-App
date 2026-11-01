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

<!-- Import File in Edit Weather Data (EditWeather.svelte): reads a CSV file's
values into the editor's changes, to check before Apply. The headings it
reads are in weather-edits.ts (CSV_HEADINGS) and ImportFileRequirements. -->

<script lang="ts">
  import Spinner from '#lib/components/Spinner.svelte';
  import HelpIcon from '#lib/components/buttons/HelpIcon.svelte';
  import { CSVtoArray } from '#lib/utils/weather-utils.svelte.js';
  import {
    readImportedRows,
    type EditRow,
    type ImportedValue,
  } from '#lib/utils/weather-edits.js';
  import { FileIcon } from '@lucide/svelte';
  import { FileUpload } from '@skeletonlabs/skeleton-svelte';

  let {
    rows,
    onvalues,
  }: {
    rows: EditRow[];
    /** The file's values, by the editor's row */
    onvalues: (values: ImportedValue[]) => void;
  } = $props();

  let processing = $state(false);
  let errorMessages: string[] = $state([]);
  let matchedDays: number | null = $state(null);

  function read(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    processing = true;
    reader.onload = (e: ProgressEvent<FileReader>) => {
      processing = false;
      const text = e.target?.result;
      if (typeof text !== 'string') return;
      const result = readImportedRows(CSVtoArray({ str: text }), rows);
      errorMessages = result.errors;
      matchedDays = result.matchedDays;
      onvalues(result.values);
    };
    reader.readAsText(file);
  }
</script>

<div
  class="inline-flex w-full flex-col items-center justify-center p-2 text-center"
>
  <div class="mt-2">
    <HelpIcon
      topic="import-weather-data-file-requirements"
      title="Get more help"
    >
      {#snippet text()}
        <p class="font-bold underline">CSV File Requirements</p>
      {/snippet}
    </HelpIcon>
  </div>

  {#if processing}
    <div class="my-4">
      <Spinner />
      <p>Reading the file…</p>
    </div>
  {:else}
    <FileUpload
      name="files"
      class="mt-4 justify-center"
      onFileAccept={(e: { files: File[] }) => read(e.files[0])}
      accept=".csv"
    >
      <FileUpload.Dropzone>
        <FileIcon class="size-10" />
        <span>Select a CSV file or drag here.</span>
        <FileUpload.Trigger>Browse Files</FileUpload.Trigger>
        <FileUpload.HiddenInput />
      </FileUpload.Dropzone>
    </FileUpload>

    {#if matchedDays !== null}
      <p class="mt-2" role="status">
        {#if matchedDays}
          Read {matchedDays}
          {matchedDays === 1 ? 'day' : 'days'}. The changed values are marked in
          the table; check them, then Apply.
        {:else}
          No days in the file matched this project's days.
        {/if}
      </p>
    {/if}
    {#if errorMessages.length > 0}
      <details class="mt-2 text-left text-sm">
        <summary class="cursor-pointer"
          >{errorMessages.length}
          {errorMessages.length === 1 ? 'row was' : 'rows were'} left out</summary
        >
        <ul class="mt-1 ml-4 list-disc">
          {#each errorMessages as message (message)}
            <li>{message}</li>
          {/each}
        </ul>
      </details>
    {/if}
  {/if}
</div>
