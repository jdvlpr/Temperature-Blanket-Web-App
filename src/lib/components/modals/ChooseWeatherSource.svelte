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
    CircleCheckIcon,
    CircleIcon,
    ExternalLinkIcon,
  } from '@lucide/svelte';
  import ToggleSwitch from '../buttons/ToggleSwitch.svelte';
  import GettingWeather from './GettingWeather.svelte';
  import GettingWeatherWarnCustomWeather from './GettingWeatherWarnCustomWeather.svelte';
  import SaveAndCloseButtons from './SaveAndCloseButtons.svelte';
  import StickyPart from './StickyPart.svelte';
  import { goToProjectSection } from '$lib/utils';

  let warnSearchAgain = $derived.by(() => {
    if (!weather.data.length) return false;

    return (
      weather.source.useSecondary !== useSecondary ||
      weather.source.name !== sourceName ||
      (weather.source.name === 'Meteostat' &&
        weather.source.settings.meteoStat.model !== meteostatModel) ||
      (weather.source.name === 'Open-Meteo' &&
        weather.source.settings.openMeteo.model !== openMeteoModel)
    );
  });

  let sourceName = $state(weather.source.name);

  let useSecondary = $state(weather.source.useSecondary);

  let meteostatModel = $state(weather.source.settings.meteoStat.model);

  let openMeteoModel = $state(weather.source.settings.openMeteo.model);

  async function _onOkay() {
    const _warnSearchAgain = warnSearchAgain; // save a copy of the current derived value

    weather.source.name = sourceName;
    weather.source.useSecondary = useSecondary;
    weather.source.settings.meteoStat.model = meteostatModel;
    weather.source.settings.openMeteo.model = openMeteoModel;

    modal.close();

    if (_warnSearchAgain) {
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
    }
  }
</script>

<div class="flex w-full flex-col items-center p-2 text-left">
  <div class="flex flex-col items-center gap-4">
    <div
      class="relative mt-2 grid auto-cols-auto grid-flow-row gap-4 overflow-x-scroll sm:grid-flow-col"
    >
      <div
        class={[
          'card rounded-container grid grid-flow-row auto-rows-max place-items-center gap-2 border p-2',
          sourceName === 'Open-Meteo'
            ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/10'
            : 'border-surface-200-800',
        ]}
      >
        <div>
          <p class="text-2xl font-bold">Open-Meteo</p>

          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            class="link text-sm"
          >
            <span class="inline-flex gap-1 underline">
              open-meteo.com <ExternalLinkIcon
                class="relative top-0.5 inline size-4"
              />
            </span>
          </a>
        </div>

        <p class="">5 day delay</p>

        <button
          class={[
            'btn  w-fit',
            sourceName === 'Open-Meteo'
              ? 'preset-filled'
              : 'hover:preset-tonal',
          ]}
          onclick={() => {
            sourceName = 'Open-Meteo';
          }}
        >
          <span class="flex shrink-0 gap-1">
            {#if sourceName === 'Open-Meteo'}
              <CircleCheckIcon />
            {:else}
              <CircleIcon />
            {/if}
          </span>
          Select this Source
        </button>

        <div class="flex flex-col gap-2 min-sm:h-[266px]">
          <p class=" font-bold">Settings</p>

          <p class="">
            Select a Model <a
              href="https://open-meteo.com/en/docs/historical-weather-api#data_sources"
              target="_blank"
              class="link"
              >More info <ExternalLinkIcon
                size={16}
                class="relative -top-[2px] inline"
              /></a
            >
          </p>

          <div class="flex flex-col gap-1">
            <label class="flex items-center gap-2">
              <input
                type="radio"
                class="radio"
                value="auto"
                disabled={sourceName !== 'Open-Meteo'}
                bind:group={openMeteoModel}
              />
              Best Match (Default)
            </label>
            <span class="text-sm"
              >Combines data from various models seamlessly.</span
            >
          </div>

          <div class="flex flex-col gap-1">
            <label class="flex items-center gap-2">
              <input
                type="radio"
                class="radio"
                value="era5_land"
                disabled={sourceName !== 'Open-Meteo'}
                bind:group={openMeteoModel}
              />
              ERA5 Land
              <span class="badge bg-tertiary-50-950">Beta</span>
            </label>

            <span class="text-sm"
              >More likely to ensure data consistency, preventing unintentional
              alterations that could arise from the adoption of different
              weather model upgrades.
            </span>
          </div>
        </div>

        <p class="text-sm">
          Includes data from the <a
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
          >.
        </p>
      </div>

      <div
        class={[
          'card rounded-container grid grid-flow-row auto-rows-max place-items-center gap-2 border p-2',
          sourceName === 'Meteostat'
            ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-950/10'
            : 'border-surface-200-800',
        ]}
      >
        <div class="">
          <p class="text-2xl font-bold">Meteostat</p>

          <a
            href="https://meteostat.net"
            rel="noopener noreferrer"
            class="link text-sm"
            target="_blank"
          >
            <span class="inline-flex gap-1 underline">
              meteostat.net <ExternalLinkIcon
                class="relative top-0.5 inline size-4"
              />
            </span>
          </a>
        </div>

        <p class="">1 to 7 day delay</p>

        <button
          class={[
            'btn w-fit',
            sourceName === 'Meteostat' ? 'preset-filled' : 'hover:preset-tonal',
          ]}
          onclick={() => {
            sourceName = 'Meteostat';
          }}
        >
          <span class="flex shrink-0 gap-1">
            {#if sourceName === 'Meteostat'}
              <CircleCheckIcon />
            {:else}
              <CircleIcon />
            {/if}
          </span>
          Select this Source
        </button>

        <div class="flex flex-col justify-start gap-2 min-sm:h-[266px]">
          <p class="font-bold">Settings</p>

          <div class="flex flex-col gap-1">
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                class="checkbox"
                disabled={sourceName !== 'Meteostat'}
                bind:checked={meteostatModel}
              />
              Fill Missing Data
            </label>
            <span class="text-sm"
              >Substitute missing records with statistically optimized model
              data. (On by default.)
            </span>
          </div>
        </div>

        <p class="text-sm">
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
        </p>
      </div>
    </div>

    <div>
      <ToggleSwitch
        bind:checked={useSecondary}
        label="Use the other weather source if data is not available."
      />
    </div>

    <p class="pb-2 text-center">
      All weather data is subject to change if the provider updates their
      models.
    </p>
  </div>
</div>

<StickyPart position="bottom">
  <div class="pb-2 sm:pb-0">
    {#if warnSearchAgain}
      <p class="text-warning-800-200 mx-auto py-2 text-center">
        Search again for weather data to apply weather source changes.
        {#if !locations.allValid}
          First, choose a valid location and dates.
        {/if}
      </p>
    {/if}

    <SaveAndCloseButtons
      onSave={_onOkay}
      onClose={modal.close}
      saveText={warnSearchAgain && locations.allValid
        ? 'Save & Search'
        : 'Save'}
    />
  </div>
</StickyPart>
