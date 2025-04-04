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
  import Spinner from '$lib/components/Spinner.svelte';
  import HelpIcon from '$lib/components/buttons/HelpIcon.svelte';
  import { weather } from '$lib/state';
  import {
    CSVtoArray,
    celsiusToFahrenheit,
    convertTime,
    dateToISO8601String,
    displayNumber,
    fahrenheitToCelsius,
    hoursToMinutes,
    inchesToMillimeters,
    millimetersToInches,
    stringToDate,
  } from '$lib/utils';
  import { CircleXIcon, FileIcon, FilePlusIcon } from '@lucide/svelte';
  import { FileUpload } from '@skeletonlabs/skeleton-svelte';

  let imported = $state(false);
  let processing = $state(false);
  let errorMessages = $state([]);
  let csvUpload = $state();

  function submitForm(event) {
    if (!csvUpload[0]) return;
    const input = csvUpload[0];
    const reader = new FileReader();
    processing = true;

    reader.onload = (e) => {
      errorMessages = [];
      const text = e.target.result;
      const data = CSVtoArray({ str: text });
      if (!weather.rawData.length) return;
      const weatherToMatch = weather.rawData.map(
        (n) => `${dateToISO8601String(n.date)}-${n.location}`,
      );

      let _rawData = $state.snapshot(weather.rawData);

      for (var i = 0; i < data.length; i++) {
        const row = data[i];
        const date = row?.['Date'] || row?.['date'];
        const locationIndex =
          row?.['Location Index'] ||
          row?.['location index'] ||
          row?.['Location'];

        const index =
          date && !isNaN(locationIndex)
            ? weatherToMatch.indexOf(
                `${dateToISO8601String(stringToDate(date))}-${locationIndex}`,
              )
            : null;

        const hasError =
          !date || isNaN(locationIndex) || index === -1 || index === null;
        if (hasError) {
          if (!date)
            errorMessages.push(
              `Row ${i + 2} not imported: Missing or invalid Date.`,
            );

          if (isNaN(locationIndex))
            errorMessages.push(
              `Row ${i + 2} not imported: Missing or invalid Location Index.`,
            );

          if (index === -1)
            errorMessages.push(
              `Row ${i + 2} not imported: Date out of this project's range. (${date})`,
            );
          continue;
        }
        let day = _rawData[index];

        const highF = +row?.['High Temperature (°F)'];
        if (!isNaN(highF)) {
          day.tmax.imperial = highF;
          day.tmax.metric = fahrenheitToCelsius(highF);
        }

        const highC = +row?.['High Temperature (°C)'];
        if (!isNaN(highC)) {
          day.tmax.metric = highC;
          day.tmax.imperial = celsiusToFahrenheit(highC);
        }

        const avgF = +row?.['Average Temperature (°F)'];
        if (!isNaN(avgF)) {
          day.tavg.imperial = avgF;
          day.tavg.metric = fahrenheitToCelsius(avgF);
        }

        const avgC = +row?.['Average Temperature (°C)'];
        if (!isNaN(avgC)) {
          day.tavg.metric = avgC;
          day.tavg.imperial = celsiusToFahrenheit(avgC);
        }

        const lowF = +row?.['Low Temperature (°F)'];
        if (!isNaN(lowF)) {
          day.tmin.imperial = lowF;
          day.tmin.metric = fahrenheitToCelsius(lowF);
        }

        const lowC = +row?.['Low Temperature (°C)'];
        if (!isNaN(lowC)) {
          day.tmin.metric = lowC;
          day.tmin.imperial = celsiusToFahrenheit(lowC);
        }

        const rainIn = +row?.['Rain (in)'];
        if (!isNaN(rainIn)) {
          day.prcp.imperial = rainIn;
          day.prcp.metric = inchesToMillimeters(rainIn);
        }

        const rainMm = +row?.['Rain (mm)'];
        if (!isNaN(rainMm)) {
          day.prcp.metric = rainMm;
          day.prcp.imperial = millimetersToInches(rainMm);
        }

        const snowIn = +row?.['Snow (in)'];
        if (!isNaN(snowIn)) {
          day.snow.imperial = snowIn;
          day.snow.metric = inchesToMillimeters(snowIn);
        }

        const snowMm = +row?.['Snow (mm)'];
        if (!isNaN(snowMm)) {
          day.snow.metric = snowMm;
          day.snow.imperial = millimetersToInches(snowMm);
        }

        const daytime = row?.['Daytime (h:m)'];
        if (daytime) {
          if (
            daytime !==
              convertTime(day.dayt.imperial, {
                displayUnits: false,
                padStart: true,
                forceUnits: 'imperial',
              }) ||
            daytime !==
              convertTime(day.dayt.metric, {
                displayUnits: false,
                padStart: true,
                forceUnits: 'metric',
              })
          ) {
            const time = daytime.split(':');
            const hours = +time[0] + +time[1] / 60;
            day.dayt.imperial = displayNumber(+hours, 4);
            day.dayt.metric = hoursToMinutes(hours, 4);
          }
        }
        _rawData[index] = day;
      }

      weather.rawData = _rawData;

      imported = true;
      processing = false;
    };

    reader.readAsText(input);
  }
</script>

<div
  class="inline-flex w-full flex-col items-center justify-center p-4 text-center"
>
  <div class="mt-2">
    <HelpIcon
      href="/documentation/#import-weather-data-file-requirements"
      title="Get more help"
    >
      {#snippet text()}
        <p class="font-bold underline">CSV File Requirements</p>
      {/snippet}
    </HelpIcon>
  </div>

  {#if !processing}
    {#if !imported || errorMessages.length > 0}
      <FileUpload
        name="files"
        classes="mt-4 justify-center"
        onFileAccept={(e) => {
          csvUpload = e.files;
          submitForm(e);
        }}
        accept=".csv"
        subtext="Only CSV files allowed"
      >
        {#snippet iconInterface()}<FilePlusIcon class="size-8" />{/snippet}
        {#snippet iconFile()}<FileIcon class="size-4" />{/snippet}
        {#snippet iconFileRemove()}<CircleXIcon class="size-4" />{/snippet}
      </FileUpload>
      {#if errorMessages.length > 0}
        <p>Import finished, but there were some issues (listed below).</p>
        <p class="mb-2">
          Close this and check the weather data, or edit your file and try
          again.
        </p>
        {#each errorMessages as message}
          <p class="text-sm">{message}</p>
        {/each}
      {/if}
    {:else}
      <div class="my-8">
        <p class="text-lg font-bold">Done!</p>
        <p>
          Close this to check the weather data and continue working on your
          project.
        </p>
      </div>
    {/if}
  {:else}
    <div class="my-8">
      <Spinner />
      <p>Processing...</p>
    </div>
  {/if}
</div>
