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

<script lang="ts">
  import GettingWeatherWarnCustomWeather from '#lib/components/modals/GettingWeatherWarnCustomWeather.svelte';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherSearch } from '#lib/state/weather-search.svelte.js';
  import { weatherDays } from '#lib/state/weather-days.svelte.js';
  import { PopoverInstance } from '#lib/state/attachments/floating-state.svelte.js';
  import { ChevronRightIcon } from '@lucide/svelte';
  import { scale } from 'svelte/transition';
  import { WEATHER_ACTIONS } from '#lib/utils/weather-actions.js';
  import { pluralize } from '#lib/utils/string-utils.js';

  let popover = new PopoverInstance();

  let disabled = $derived(!locations.allValid || project.status.loading);

  const kept = $derived(weatherDays.canSearchAgain && !project.status.loading);

  const BUTTON =
    'btn btn-lg preset-filled-primary-500 gap-1 shadow-sm sm:w-fit';
</script>

<!-- New project: Get Weather Data; saved, days waiting: Add N New Days;
saved, none waiting: Check for Updates -->
{#snippet buttonContent(label = 'Get Weather Data')}
  {label}
  <ChevronRightIcon />
{/snippet}

{#if disabled && !project.status.loading}
  <button {...popover.reference()} class={BUTTON} {disabled}>
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
    class={BUTTON}
    onclick={() => {
      if (kept) weatherSearch.start({ mode: 'again' });
      else if (weather.isUserEdited)
        dialog.trigger({
          type: 'component',
          component: { ref: GettingWeatherWarnCustomWeather },
        });
      else weatherSearch.start();
    }}
    title={kept ? WEATHER_ACTIONS.again.description : 'Search for Weather Data'}
    id="location-action-button"
    {disabled}
  >
    {@render buttonContent(
      !kept
        ? 'Get Weather Data'
        : weatherDays.newDaysCount
          ? `Add ${weatherDays.newDaysCount} New ${pluralize('Day', weatherDays.newDaysCount)}`
          : WEATHER_ACTIONS.again.label,
    )}
  </button>
{/if}
