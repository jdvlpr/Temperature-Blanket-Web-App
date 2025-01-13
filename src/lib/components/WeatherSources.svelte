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
  import { run } from 'svelte/legacy';

  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import GettingWeather from '$lib/components/modals/GettingWeather.svelte';
  import GettingWeatherWarnCustomWeather from '$lib/components/modals/GettingWeatherWarnCustomWeather.svelte';
  import {
    defaultWeatherSource,
    isCustomWeather,
    locationsState,
    modal,
    useSecondaryWeatherSources,
    weather,
  } from '$lib/state';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import { onMount } from 'svelte';

  const modalStore = getModalStore();

  let warnSearchAgain = $state(false);

  onMount(() => {
    warnSearchAgain = $isCustomWeather ? true : false;
  });

  function checkWarn() {
    if (!weather.data) return;
    warnSearchAgain = true;
  }
  run(() => {
    defaultWeatherSource.value, $useSecondaryWeatherSources, checkWarn();
  });
</script>

<div class="flex flex-col gap-4 items-center">
  <div class="overflow-x-scroll relative mt-2">
    <table class="table-auto border-colapse max-w-[80vw] mx-auto inline-block">
      <thead>
        <tr>
          <th
            class="border border-surface-500 p-2"
            class:bg-surface-200={defaultWeatherSource.value === 'Meteostat'}
            class:dark:bg-surface-700={defaultWeatherSource.value ===
              'Meteostat'}
          >
            <button
              class="btn bg-secondary-hover-token gap-2"
              onclick={() => (defaultWeatherSource.value = 'Meteostat')}
            >
              <span class="flex flex-shrink-0 gap-1">
                {#if defaultWeatherSource.value === 'Meteostat'}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                {:else}
                  <span
                    class="rounded-full mx-[2.5px] p-2 w-3 h-3 border-[1.5px] border-surface-900-50-token"
                  ></span>
                {/if}
              </span>
              Meteostat
            </button>
          </th>
          <th
            class="border border-surface-500 p-2"
            class:bg-surface-200={defaultWeatherSource.value === 'Open-Meteo'}
            class:dark:bg-surface-700={defaultWeatherSource.value ===
              'Open-Meteo'}
          >
            <button
              class="btn bg-secondary-hover-token gap-2"
              onclick={() => (defaultWeatherSource.value = 'Open-Meteo')}
            >
              <span class="flex flex-shrink-0 gap-1">
                {#if defaultWeatherSource.value === 'Open-Meteo'}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                {:else}
                  <span
                    class="rounded-full mx-[2.5px] p-2 w-3 h-3 border-[1.5px] border-surface-900-50-token"
                  ></span>
                {/if}
              </span>
              Open-Meteo
            </button>
          </th>
        </tr>
      </thead>
      <tbody class="text-sm">
        <tr>
          <td class="border border-surface-500 p-2"
            ><a
              href="https://meteostat.net"
              rel="noopener noreferrer"
              class="link"
              target="_blank"
            >
              <span class="inline-flex gap-1 underline">
                meteostat.net <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  class="w-5 h-5"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                    clip-rule="evenodd"
                  />
                  <path
                    fill-rule="evenodd"
                    d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                    clip-rule="evenodd"
                  />
                </svg>
              </span>
            </a></td
          >
          <td class="border border-surface-500 p-2"
            ><a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              class="link"
            >
              <span class="inline-flex gap-1 underline">
                open-meteo.com <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  class="w-5 h-5"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                    clip-rule="evenodd"
                  />
                  <path
                    fill-rule="evenodd"
                    d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z"
                    clip-rule="evenodd"
                  />
                </svg>
              </span>
            </a></td
          >
        </tr>
        <tr>
          <td class="border border-surface-500 p-2">1 to 7 day delay</td>
          <td class="border border-surface-500 p-2">5 day delay</td>
        </tr>

        <tr>
          <td class="border border-surface-500 p-2 max-w-[300px]">
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
          <td class="border border-surface-500 p-2 max-w-[300px]"
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
      bind:checked={$useSecondaryWeatherSources}
      label="Use the other weather source if data is not available."
    />
  </div>

  {#if warnSearchAgain}
    <div class="variant-soft-warning text-token card p-4">
      <p class="text-sm mb-4">
        Search again for weather data to apply weather source changes.
        {#if !locationsState.allValid}
          Close this modal, then choose a valid location and dates.
        {/if}
      </p>
      <button
        class="btn variant-filled-primary font-bold text-2xl"
        onclick={() => {
          if ($isCustomWeather) {
            modalStore.close();
            modal.state.trigger({
              type: 'component',
              component: {
                ref: GettingWeatherWarnCustomWeather,
              },
            });
          } else {
            modalStore.close();
            modal.state.trigger({
              type: 'component',
              component: {
                ref: GettingWeather,
              },
            });
          }
        }}
        disabled={!locationsState.allValid}
        >Search <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
          />
        </svg>
      </button>
    </div>
  {/if}

  <p class="text-sm">
    All weather data is subject to change if the provider updates their models.
  </p>
  <p class="font-ornament text-6xl mb-2">u</p>
</div>
