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
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import {
    CirclePlusIcon,
    CloudRainIcon,
    EllipsisVerticalIcon,
    MoonIcon,
    SnowflakeIcon,
    SunIcon,
    ThermometerIcon,
    Trash2Icon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
  import { onMount, tick } from 'svelte';
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

  const GAUGE_ICONS = {
    temp: ThermometerIcon,
    prcp: CloudRainIcon,
    snow: SnowflakeIcon,
    dayt: SunIcon,
    moon: MoonIcon,
  };

  // In the switch a gauge's name stands alone: "Rain", not "Rain Gauge",
  // except a project's only gauge, which is spelled out without its stripe
  const shortLabel = (label: string) => label.replace(/ Gauge$/, '');
  let single = $derived(gauges.allCreated.length === 1);

  // Every tab is named when they all fit (measured with room for the ⋮, so
  // opening another gauge never changes it); otherwise only the open one
  let rowWidth = $state(0);
  let namedWidth = $state(0);
  let showNames = $derived(namedWidth > 0 && namedWidth <= rowWidth);

  // Arrow keys, Home and End move between the gauges, opening each
  function onTabKeydown(event: KeyboardEvent) {
    const ids = gauges.allCreated.map(({ id }) => id);
    const index = ids.indexOf(gauges.activeGaugeId as (typeof ids)[number]);
    const next = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: ids.length - 1,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const id = ids[(next + ids.length) % ids.length];
    gauges.activeGaugeId = id;
    tick().then(() => document.getElementById(`gauge-tab-${id}`)?.focus());
  }
</script>

<!-- The project's gauges as tabs, each an icon over a stripe of its colors,
named when there's room (the open one always, with its own menu); then the
gauges it could add. All five fit a phone's width without scrolling. -->
<div class="relative flex items-center gap-2 py-2" bind:clientWidth={rowWidth}>
  <div
    role="tablist"
    aria-label="Gauges"
    class="bg-surface-100 dark:bg-surface-900 rounded-container flex min-w-0 gap-0.5 p-1"
  >
    {#each gauges.allCreated as { id, label, colors } (id)}
      {@const isActive = gauges.activeGaugeId === id}
      {@const named = isActive || showNames}
      {@const Icon = GAUGE_ICONS[id]}
      <div
        class={[
          'rounded-base flex items-center',
          isActive
            ? 'preset-filled-surface-50-950 min-w-0 shadow-sm'
            : 'shrink-0',
        ]}
      >
        <!-- The stripe sits beside the button, not in it (btn's hover
        brightness would change its colors), under just its icon and name, so
        it stays clear of the pill's round ends -->
        <div class="relative flex min-w-0">
          <button
            role="tab"
            id="gauge-tab-{id}"
            aria-selected={isActive}
            aria-controls={isActive ? 'gauge-panel' : undefined}
            aria-label={label}
            title={named ? undefined : label}
            tabindex={isActive ? 0 : -1}
            class={[
              'btn rounded-base min-w-0',
              !isActive && 'hover:preset-tonal-surface',
              named ? 'gap-1.5 px-3' : 'px-2',
            ]}
            onclick={() => (gauges.activeGaugeId = id)}
            onkeydown={onTabKeydown}
          >
            <Icon aria-hidden="true" />
            {#if named}
              <!-- py-0.5: truncate's overflow would cut off the g's and p's
              below btn's tight line height -->
              <span class="truncate py-0.5"
                >{single ? label : shortLabel(label)}</span
              >
            {/if}
          </button>
          {#if colors?.length && !single}
            <span
              class={[
                'pointer-events-none absolute bottom-1 flex h-0.75 overflow-hidden rounded-full',
                named ? 'inset-x-3' : 'inset-x-2',
              ]}
              aria-hidden="true"
            >
              {#each colors as { hex }, i (i)}
                <span class="flex-1" style:background-color={hex}></span>
              {/each}
            </span>
          {/if}
        </div>
        <!-- Temperature is every project's first gauge, so it stays -->
        {#if isActive && id !== 'temp'}
          <Menu
            positioning={menuPositioning('bottom-start')}
            onSelect={() => gauges.remove(id)}
          >
            <Menu.Trigger
              class="btn-icon hover:preset-tonal-surface -ml-2 shrink-0"
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
      <Menu.Trigger
        class="btn-icon hover:preset-tonal-surface shrink-0"
        aria-label="Add Gauge"
        title="Add Gauge"
      >
        <CirclePlusIcon />
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner>
          <Menu.Content class={menuContentClass}>
            {#each addable as { id, label } (id)}
              {@const Icon = GAUGE_ICONS[id]}
              <Menu.Item value={id} class={menuItemClass}>
                <Icon class="shrink-0" aria-hidden="true" />
                {label}
              </Menu.Item>
            {/each}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu>
  {/if}

  <!-- The row as it'd be with every tab named, measured for showNames -->
  <div
    class="pointer-events-none invisible absolute inset-0 overflow-hidden"
    aria-hidden="true"
    inert
  >
    <div class="flex w-max items-center gap-2" bind:offsetWidth={namedWidth}>
      <div class="flex gap-0.5 p-1">
        {#each gauges.allCreated as { id, label } (id)}
          {@const Icon = GAUGE_ICONS[id]}
          <span class="btn gap-1.5 px-3"><Icon />{shortLabel(label)}</span>
        {/each}
        <span class="btn-icon -ml-2"></span>
      </div>
      {#if addable.length}
        <span class="btn-icon"></span>
      {/if}
    </div>
  </div>
</div>

{#if gauges.activeGauge && !gauges.activeGauge?.calculating}
  <div
    role="tabpanel"
    id="gauge-panel"
    aria-labelledby="gauge-tab-{gauges.activeGauge.id}"
  >
    {#if gauges.activeGauge?.isStatic}
      <p class="text-sm">
        This gauge has a fixed number of colors for the eight phases of the
        moon. You can only edit the colors individually.
      </p>
    {/if}

    <Gauge bind:gauge={gauges.activeGauge} inProject />

    <GaugeCustomizer bind:gauge={gauges.activeGauge} />
  </div>
{/if}
