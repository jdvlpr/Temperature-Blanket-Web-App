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
    allGaugesAttributes,
    gauges,
  } from '#lib/state/gauges-state.svelte.js';
  import { pageSections } from '#lib/state/page-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import {
    ChevronDownIcon,
    CirclePlusIcon,
    EllipsisVerticalIcon,
    Trash2Icon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import { onMount, tick, untrack } from 'svelte';
  import {
    menuContentClass,
    menuItemClass,
    menuPositioning,
  } from './menu-styles.js';
  import Gauge from './Gauge.svelte';
  import GaugeCustomizer from './GaugeCustomizer.svelte';

  onMount(() => {
    setupAvailableGauges();
  });

  // The gauges the weather has data for that the project doesn't have yet
  let addable = $derived(
    gauges.allAvailable.filter(
      ({ id }) => !gauges.allCreated.some((gauge) => gauge.id === id),
    ),
  );

  function setupAvailableGauges() {
    allGaugesAttributes.forEach((gauge) => {
      gauge.targets.forEach((target) => {
        if (
          weather.data?.some((day) => {
            if (target.type === 'category') return day[target.id] !== null;
            else {
              const value = day[target.id];
              if (value && typeof value === 'object' && 'metric' in value) {
                return value[preferences.value.units ?? 'metric'] !== null;
              }
              return false;
            }
          })
        ) {
          // For each of the gauge's weather parameter targets, check to see if there is any data, and if so setup the default gauge
          gauges.addToAvailable({
            id: gauge.id,
            label: gauge.label,
          });
        } else {
          // Otherwise remove the gauge. Weather data may no longer be available for a certain gauge if, for example, the user changes the location
          gauges.removeFromAvailable(gauge.id);
        }
      });
    });

    // If the active gauge is no longer available, set it to the first available
    if (!gauges.allCreated.find((gauge) => gauge.id === gauges.activeGaugeId))
      gauges.activeGaugeId = gauges.allCreated[0]?.id;
  }

  // If an initially empty weather parameter gets some user-created data, or if the user searches for a different location,
  // then add the available gauge to the options
  $effect(() => {
    weather.data;
    tick().then(() => {
      setupAvailableGauges();
    });
  });

  // Scroll to the active gauge button when the active gauge changes or the color section is activated
  $effect(() => {
    gauges.activeGaugeId;

    if (!pageSections.items[3].active) return;

    untrack(() => {
      if (!gauges.allowScrollToActiveGaugeButton) return;
      tick().then(() => {
        const activeGaugeBtn = document.getElementById('active-gauge-button');
        if (activeGaugeBtn) {
          activeGaugeBtn.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
          });
          gauges.allowScrollToActiveGaugeButton = false;
        }
      });
    });
  });
</script>

<!-- The project's gauges as a switch, the open one with its own menu, then
the gauges it could add -->
<div class="flex items-center gap-2 py-2">
  <div
    class="bg-surface-100 dark:bg-surface-900 rounded-container flex min-w-0 snap-x gap-1 overflow-x-auto p-1"
  >
    {#each gauges.allCreated as { id, label } (id)}
      {@const isActive = gauges.activeGaugeId === id}
      <div
        class={[
          'rounded-base flex shrink-0 snap-start items-center',
          isActive && 'preset-filled-surface-50-950 shadow-sm',
        ]}
        id={isActive ? 'active-gauge-button' : undefined}
      >
        <button
          class={['btn', !isActive && 'hover:preset-tonal-surface']}
          aria-pressed={isActive}
          onclick={() => (gauges.activeGaugeId = id)}
        >
          {label}
        </button>
        <!-- Temperature is every project's first gauge, so it stays -->
        {#if isActive && id !== 'temp'}
          <Menu
            positioning={menuPositioning('bottom-start')}
            onSelect={() => gauges.remove(id)}
          >
            <Menu.Trigger
              class="btn-icon hover:preset-tonal-surface -ml-2"
              title="{label} Options"
            >
              <EllipsisVerticalIcon />
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content class={menuContentClass}>
                  <Menu.Item value="delete" class={menuItemClass}>
                    <Trash2Icon class="shrink-0" aria-hidden="true" />
                    Delete {label}
                  </Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu>
        {/if}
      </div>
    {/each}
  </div>

  {#if addable.length}
    <Menu
      positioning={menuPositioning('bottom-start')}
      onSelect={(details) => {
        // Added, and opened
        const gauge = addable.find(({ id }) => id === details.value);
        if (gauge) gauges.addById(gauge.id);
      }}
    >
      <Menu.Trigger class="btn hover:preset-tonal-surface shrink-0">
        <CirclePlusIcon />
        Add Gauge
        <ChevronDownIcon class="icon-sm" aria-hidden="true" />
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content class={menuContentClass}>
            {#each addable as { id, label } (id)}
              <Menu.Item value={id} class={menuItemClass}>{label}</Menu.Item>
            {/each}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu>
  {/if}
</div>

{#if gauges.activeGauge && !gauges.activeGauge?.calculating}
  {#if gauges.activeGauge?.isStatic}
    <p class="text-sm">
      This gauge has a fixed number of colors for the eight phases of the moon.
      You can only edit the colors individually.
    </p>
  {/if}

  <Gauge bind:gauge={gauges.activeGauge} inProject />

  <GaugeCustomizer bind:gauge={gauges.activeGauge} />
{/if}
