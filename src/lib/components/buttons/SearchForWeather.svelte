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
  import { locations, modal, project, weather } from '$lib/state';

  function setModal() {}

  function setWarnCustomWeatherModal() {}

  let disabled = $derived(!locations.allValid || project.status.loading);
</script>

{#if disabled && !project.status.loading}
  <Tooltip
    buttonDisabled={disabled}
    title="Search for Weather Data"
    id="location-action-button"
    classNames="btn btn-lg preset-filled-primary-500  sm:w-fit gap-1 shadow-sm"
  >
    {#if !!weather.isUserEdited}
      Reload Weather Data
    {:else}
      Search {#if weather.data.length}Again{/if}
    {/if}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="size-4"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="m8.25 4.5 7.5 7.5-7.5 7.5"
      />
    </svg>
    {#snippet tooltip()}
      <p>Choose a valid location and dates above.</p>
    {/snippet}
  </Tooltip>
{:else}
  <button
    class="btn btn-lg preset-filled-primary-500 sm:w-fit gap-1 shadow-sm"
    onclick={() => {
      if (weather.isUserEdited)
        modal.trigger({
          type: 'component',
          component: { ref: GettingWeatherWarnCustomWeather },
        });
      else
        modal.trigger({
          type: 'component',
          component: { ref: GettingWeather },
        });
    }}
    title="Search for Weather Data"
    id="location-action-button"
    {disabled}
  >
    {#if !!weather.isUserEdited}
      Reload Weather Data
    {:else}
      Search {#if weather.data.length}Again{/if}
    {/if}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="size-4"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="m8.25 4.5 7.5 7.5-7.5 7.5"
      />
    </svg>
  </button>
{/if}
