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
  import Tooltip from '$lib/components/Tooltip.svelte';
  import GettingWeather from '$lib/components/modals/GettingWeather.svelte';
  import GettingWeatherWarnCustomWeather from '$lib/components/modals/GettingWeatherWarnCustomWeather.svelte';
  import {
    isCustomWeather,
    isProjectLoading,
    modal,
    weather,
  } from '$lib/stores';
  import { bind } from 'svelte-simple-modal';

  export let disabled = true;

  function setModal() {
    modal.set(bind(GettingWeather));
  }

  function setWarnCustomWeatherModal() {
    modal.set(bind(GettingWeatherWarnCustomWeather));
  }
</script>

{#if disabled && !$isProjectLoading}
  <Tooltip
    buttonDisabled={disabled}
    title="Search for Weather Data"
    id="location-action-button"
    fullWidth={true}
    class="btn variant-filled-primary text-2xl font-bold w-full sm:w-fit"
  >
    {#if !!$isCustomWeather}
      Reload Weather Data
    {:else}
      Search {#if $weather}Again{/if}
    {/if}
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
        d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
      />
    </svg>
    <p slot="tooltip">Choose a valid location and dates above.</p>
  </Tooltip>
{:else}
  <button
    class="btn variant-filled-primary text-2xl font-bold w-full sm:w-fit"
    on:click={() => {
      if ($isCustomWeather) setWarnCustomWeatherModal();
      else setModal();
    }}
    title="Search for Weather Data"
    id="location-action-button"
    {disabled}
  >
    {#if !!$isCustomWeather}
      Reload Weather Data
    {:else}
      Search {#if $weather}Again{/if}
    {/if}
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
        d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
      />
    </svg>
  </button>
{/if}
