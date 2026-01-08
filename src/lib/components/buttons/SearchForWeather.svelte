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
  import GettingWeather from '$lib/components/modals/GettingWeather.svelte';
  import GettingWeatherWarnCustomWeather from '$lib/components/modals/GettingWeatherWarnCustomWeather.svelte';
  import {
    dialog,
    locations,
    project,
    weather,
    PopoverInstance,
  } from '$lib/state';
  import { ChevronRightIcon } from '@lucide/svelte';
  import { scale } from 'svelte/transition';

  let popover = new PopoverInstance();

  let disabled = $derived(!locations.allValid || project.status.loading);
</script>

{#snippet buttonContent()}
  {#if weather.isUserEdited}
    Reload Weather Data
  {:else}
    Search {#if weather.data.length && !project.status.loading}Again{/if}
  {/if}
  <ChevronRightIcon />
{/snippet}

{#if disabled && !project.status.loading}
  <button
    {...popover.reference()}
    class="btn btn-lg preset-filled-primary-500 gap-1 shadow-sm sm:w-fit"
    {disabled}
  >
    {@render buttonContent()}
  </button>

  {#if popover.isOpen()}
    <div
      data-floating
      {...popover.floating()}
      class="preset-filled-surface-100-900 card p-2"
      in:scale={{ duration: 150, delay: 150 }}
    >
      <p class="">Choose a valid location and dates above.</p>
      <div {...popover.arrow()}></div>
    </div>
  {/if}
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
    {@render buttonContent()}
  </button>
{/if}
