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
  import WeatherDetails from '$lib/components/WeatherDetails.svelte';
  import WeatherTableView from '$lib/components/WeatherTableView.svelte';
  import ImportWeatherData from '$lib/components/modals/ImportWeatherData.svelte';
  import {
    modal,
    weather,
    weatherGrouping,
    weatherParametersInView,
    weatherView,
  } from '$lib/state';
  import { downloadWeatherCSV, getWeatherTargets } from '$lib/utils';
  import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';

  export let data = weather.data || [];
  export let context = 'body';

  $: weatherTargets = getWeatherTargets({
    weatherParameters: $weatherParametersInView,
  });
</script>

<div class="relative">
  {#if context === 'body'}
    <RadioGroup class="flex-wrap gap-y-2" active="bg-secondary-active-token">
      <RadioItem
        title="Set Daily Weather Display to Table"
        bind:group={$weatherView}
        name="weatherDisplay"
        value={'table'}
      >
        Table</RadioItem
      >
      <RadioItem
        title="Set Daily Weather Display to Details"
        bind:group={$weatherView}
        name="weatherDisplay"
        value={'range'}>Details</RadioItem
      >
    </RadioGroup>
  {/if}

  {#if $weatherView === 'range' || context !== 'body'}
    <WeatherDetails {data} {weatherTargets} />
  {:else if $weatherView === 'table'}
    <WeatherTableView {data} {weatherTargets} />
  {/if}

  <div
    class="flex flex-wrap gap-2 justify-center mt-4 mb-2 lg:mb-4 px-4 py-2 shadow-inner rounded-container-token variant-soft-surface"
  >
    <button
      class="btn bg-secondary-hover-token whitespace-pre-wrap"
      on:click={downloadWeatherCSV}
      title="Download CSV File"
    >
      <span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6 inline bottom-1 relative"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25"
          />
        </svg> Download Weather Data (CSV)
      </span>
    </button>

    {#if weatherGrouping.value !== 'week' && context === 'body'}
      <button
        class="btn bg-secondary-hover-token whitespace-pre-wrap"
        on:click={() => {
          modal.state.trigger({
            type: 'component',
            component: {
              ref: ImportWeatherData,
            },
          });
        }}
        title="Import Weather Data"
      >
        <span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-6 h-6 inline"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
            />
          </svg> Import Weather Data
        </span>
      </button>
    {/if}
  </div>
</div>
