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
  import { locations, modal, weather } from '$lib/state';
  import {
    ChevronRightIcon,
    CircleCheckIcon,
    CircleIcon,
    ExternalLinkIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import ToggleSwitch from '../buttons/ToggleSwitch.svelte';
  import GettingWeather from './GettingWeather.svelte';
  import GettingWeatherWarnCustomWeather from './GettingWeatherWarnCustomWeather.svelte';

  let warnSearchAgain = $state(false);

  onMount(() => {
    warnSearchAgain = weather.isUserEdited ? true : false;
  });

  function checkWarn() {
    if (!weather.data.length) return;
    warnSearchAgain = true;
  }

  //TODO: Investigate if this is working as expected
  $effect(() => {
    weather.defaultSource;
    weather.useSecondarySources;
    checkWarn();
  });
</script>

<div class="flex w-full flex-col items-center p-2 text-left">
  <div class="flex flex-col items-center gap-4">
    <div class="relative mt-2 overflow-x-scroll">
      <table
        class="border-colapse mx-auto inline-block max-w-[80vw] table-auto"
      >
        <thead>
          <tr>
            <th
              class="border-surface-500 border p-2"
              class:bg-surface-200={weather.defaultSource === 'Meteostat'}
              class:dark:bg-surface-700={weather.defaultSource === 'Meteostat'}
            >
              <button
                class="btn hover:preset-tonal gap-2"
                onclick={() => (weather.defaultSource = 'Meteostat')}
              >
                <span class="flex shrink-0 gap-1">
                  {#if weather.defaultSource === 'Meteostat'}
                    <CircleCheckIcon />
                  {:else}
                    <CircleIcon />
                  {/if}
                </span>
                Meteostat
              </button>
            </th>
            <th
              class="border-surface-500 border p-2"
              class:bg-surface-200={weather.defaultSource === 'Open-Meteo'}
              class:dark:bg-surface-700={weather.defaultSource === 'Open-Meteo'}
            >
              <button
                class="btn hover:preset-tonal gap-2"
                onclick={() => (weather.defaultSource = 'Open-Meteo')}
              >
                <span class="flex shrink-0 gap-1">
                  {#if weather.defaultSource === 'Open-Meteo'}
                    <CircleCheckIcon />
                  {:else}
                    <CircleIcon />
                  {/if}
                </span>
                Open-Meteo
              </button>
            </th>
          </tr>
        </thead>
        <tbody class="">
          <tr>
            <td class="border-surface-500 border p-2"
              ><a
                href="https://meteostat.net"
                rel="noopener noreferrer"
                class="link"
                target="_blank"
              >
                <span class="inline-flex gap-1 underline">
                  meteostat.net <ExternalLinkIcon class="inline" />
                </span>
              </a></td
            >
            <td class="border-surface-500 border p-2"
              ><a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                class="link"
              >
                <span class="inline-flex gap-1 underline">
                  open-meteo.com <ExternalLinkIcon class="inline" />
                </span>
              </a></td
            >
          </tr>
          <tr>
            <td class="border-surface-500 border p-2">1 to 7 day delay</td>
            <td class="border-surface-500 border p-2">5 day delay</td>
          </tr>

          <tr>
            <td class="border-surface-500 max-w-[300px] border p-2">
              Raw data provided by <a
                href="https://www.noaa.gov/"
                target="_blank"
                rel="noopener noreferrer"
                class="link"
                data-svelte-h="svelte-1wlhtuj">NOAA</a
              >,
              <a
                href="https://www.dwd.de/"
                target="_blank"
                rel="noopener noreferrer"
                class="link">DWD</a
              >
              and
              <a
                href="https://dev.meteostat.net/sources.html"
                target="_blank"
                rel="noopener noreferrer"
                class="link">others</a
              >. Licensed under
              <a
                href="https://creativecommons.org/licenses/by-nc/4.0/"
                target="_blank"
                rel="noopener noreferrer"
                class="link">CC BY-NC 4.0.</a
              >
            </td>
            <td class="border-surface-500 max-w-[300px] border p-2"
              >Includes data from the <a
                href="https://cds.climate.copernicus.eu/cdsapp#!/dataset/reanalysis-era5-land?tab=overview"
                rel="noopener noreferrer"
                target="_blank"
                class="link"
                data-svelte-h="svelte-exm2vv">Copernicus Program</a
              >
              and
              <a
                href="https://open-meteo.com/en/license"
                target="_blank"
                rel="noopener noreferrer"
                class="link">others</a
              >. Licenced under
              <a
                href="https://creativecommons.org/licenses/by/4.0/"
                target="_blank"
                class="link"
                rel="noreferrer noopener">CC BY 4.0</a
              >.</td
            >
          </tr>
        </tbody>
      </table>
    </div>

    <div>
      <ToggleSwitch
        bind:checked={weather.useSecondarySources}
        label="Use the other weather source if data is not available."
      />
    </div>

    {#if warnSearchAgain}
      <div
        class="bg-warning-500/20 card flex flex-col items-center justify-center p-4"
      >
        <p class="mb-4">
          Search again for weather data to apply weather source changes.
          {#if !locations.allValid}
            Close this modal, then choose a valid location and dates.
          {/if}
        </p>
        <button
          class="btn btn-lg preset-filled-primary-500 gap-2"
          onclick={() => {
            if (weather.isUserEdited) {
              modal.trigger({
                type: 'component',
                component: {
                  ref: GettingWeatherWarnCustomWeather,
                },
              });
            } else {
              modal.trigger({
                type: 'component',
                component: {
                  ref: GettingWeather,
                },
              });
            }
          }}
          disabled={!locations.allValid}
          >Search <ChevronRightIcon />
        </button>
      </div>
    {/if}

    <p class="pb-2 text-center">
      All weather data is subject to change if the provider updates their
      models.
    </p>
  </div>
</div>
