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
  import { locations, dialog, project, weather } from '$lib/state';
  import { ChevronRightIcon } from '@lucide/svelte';

  let disabled = $derived(!locations.allValid || project.status.loading);
</script>

{#if disabled && !project.status.loading}
  <Tooltip
    buttonDisabled={disabled}
    title="Search for Weather Data"
    id="location-action-button"
    classNames="btn btn-lg preset-filled-primary-500 sm:w-fit gap-1 shadow-sm"
  >
    {#if !!weather.isUserEdited}
      Reload Weather Data
    {:else}
      Search {#if weather.data.length}Again{/if}
    {/if}
    <ChevronRightIcon />
    {#snippet tooltip()}
      <p>Choose a valid location and dates above.</p>
    {/snippet}
  </Tooltip>
{:else}
  <button
    class="btn btn-lg preset-filled-primary-500 gap-1 shadow-sm sm:w-fit"
    onclick={() => {
      if (weather.isUserEdited)
        dialog.trigger({
          type: 'component',
          component: { ref: GettingWeatherWarnCustomWeather },
        });
      else
        dialog.trigger({
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
    <ChevronRightIcon />
  </button>
{/if}
