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
  import {
    menuContentClass,
    menuItemClass,
    menuPositioning,
  } from '#lib/components/menu-styles.js';
  import GettingWeatherWarnCustomWeather from '#lib/components/modals/GettingWeatherWarnCustomWeather.svelte';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherSearch } from '#lib/state/weather-search.svelte.js';
  import { weatherDays } from '#lib/state/weather-days.svelte.js';
  import { PopoverInstance } from '#lib/state/attachments/floating-state.svelte.js';
  import {
    CalendarPlusIcon,
    ChevronDownIcon,
    ChevronRightIcon,
    RefreshCwIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import { scale } from 'svelte/transition';
  import { WEATHER_ACTIONS } from '#lib/utils/weather-actions.js';

  let popover = new PopoverInstance();

  let disabled = $derived(!locations.allValid || project.status.loading);

  const kept = $derived(weatherDays.canSearchAgain && !project.status.loading);
  const withNewDays = $derived(
    weatherDays.offersNewDays && !project.status.loading,
  );

  const BUTTON =
    'btn btn-lg preset-filled-primary-500 gap-1 shadow-sm sm:w-fit';
</script>

{#snippet buttonContent()}
  Get Weather Data
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
{:else if withNewDays}
  <!-- As Create asks which kind: each choice says what it does -->
  <!-- Shown while days are waiting -->
  {#if weatherDays.newDaysCount}
    <span class="text-primary-500 text-sm" data-testid="new-days-available"
      ><span class="sr-only">,</span>
      {weatherDays.newDaysCount} new {weatherDays.newDaysCount === 1
        ? 'day'
        : 'days'}</span
    >
  {/if}
  <Menu
    ids={{ trigger: 'location-action-button' }}
    positioning={menuPositioning('bottom')}
    onSelect={(details) =>
      weatherSearch.start({
        mode: details.value === 'again' ? 'again' : 'new-days',
      })}
  >
    <Menu.Trigger class={BUTTON}>
      <span>Get Weather Data</span>
      <ChevronDownIcon class="icon-sm" aria-hidden="true" />
    </Menu.Trigger>
    <Portal>
      <Menu.Positioner>
        <Menu.Content class={menuContentClass}>
          {#if weatherDays.newDaysCount}
            <Menu.Item
              value="new-days"
              class={menuItemClass}
              disabled={!weatherDays.newDaysCount}
            >
              <CalendarPlusIcon class="shrink-0" aria-hidden="true" />
              <div class="flex min-w-0 flex-col text-left">
                <span>{WEATHER_ACTIONS['new-days'].label}</span>
                <span class="text-surface-700-300 text-xs"
                  >{weatherDays.newDaysCount
                    ? WEATHER_ACTIONS['new-days'].description
                    : WEATHER_ACTIONS['new-days'].upToDate}</span
                >
              </div>
            </Menu.Item>
          {/if}
          <Menu.Item value="again" class={menuItemClass}>
            <RefreshCwIcon class="shrink-0" aria-hidden="true" />
            <div class="flex min-w-0 flex-col text-left">
              <span>{WEATHER_ACTIONS.again.label}</span>
              <span class="text-surface-700-300 text-xs"
                >{WEATHER_ACTIONS.again.description}</span
              >
            </div>
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Portal>
  </Menu>
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
    title="Search for Weather Data"
    id="location-action-button"
    {disabled}
  >
    {@render buttonContent()}
  </button>
{/if}
