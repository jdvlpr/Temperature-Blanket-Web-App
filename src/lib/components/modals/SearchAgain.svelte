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

<!-- The saved days a search of every day got differently, one card each:
the saved values stay unless a day's "Use new values" is checked. Save keeps
the choices (values kept aren't asked about again unless they change again);
closing changes nothing, so they're asked about next time. -->
<script lang="ts">
  import ToggleSwitch from '#lib/components/buttons/ToggleSwitch.svelte';
  import SaveAndCloseButtons from '#lib/components/modals/SaveAndCloseButtons.svelte';
  import { UNIT_LABELS } from '#lib/constants/weather-constants.js';
  import { locations } from '#lib/state/location-state.svelte.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { weatherDays } from '#lib/state/weather-days.svelte.js';
  import { projectChanged } from '#lib/storage/autosave.svelte.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import type { WeatherDay } from '#lib/types/weather-types.js';
  import { pluralize } from '#lib/utils/string-utils.js';
  import {
    applyChanges,
    dayKey,
    updateDeclined,
    type ComparedParam,
    type DayKey,
  } from '#lib/utils/weather-days.js';
  import { SvelteSet } from 'svelte/reactivity';
  import { onMount } from 'svelte';
  import { galleryPageOf, loadShareState } from '#lib/accounts/share-rows.js';
  import { project } from '#lib/state/project-state.svelte.js';
  import { changesFor, type SearchAgainResult } from './search-again.js';

  let { result }: { result: SearchAgainResult } = $props();

  const changes = $derived(changesFor(result));

  // Its gallery page, if published, to update with the new values
  onMount(() => {
    if (__ACCOUNTS_ENABLED__) loadShareState('project');
  });
  const published = $derived(
    __ACCOUNTS_ENABLED__ && !!galleryPageOf('project', project.id),
  );
  let updatePage = $state(true);
  // Days to take the new values of; none to start
  const use = new SvelteSet<DayKey>();

  const savedByKey = $derived(new Map(result.saved.map((d) => [dayKey(d), d])));
  const gotByKey = $derived(new Map(result.got.map((d) => [dayKey(d), d])));

  const units = $derived(preferences.value.units ?? 'metric');
  const several = $derived(locations.all.length > 1);

  const LABELS: Record<ComparedParam, string> = {
    tmax: 'High',
    tavg: 'Average',
    tmin: 'Low',
    prcp: 'Rain',
    snow: 'Snow',
  };

  function show(day: WeatherDay | undefined, param: ComparedParam) {
    const value = day?.[param]?.[units] ?? null;
    if (value === null) return 'no data';
    const unit =
      param === 'prcp' || param === 'snow'
        ? ` ${UNIT_LABELS.height[units]}`
        : UNIT_LABELS.temperature[units];
    return `${value}${unit}`;
  }

  const formatDate = (iso: string) =>
    new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, {
      timeZone: 'UTC',
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const compareGauges = $derived(
    preferences.value.weatherChanges?.compare === 'gauges',
  );
  const askEveryTime = $derived(
    preferences.value.weatherChanges?.ask === 'every',
  );
  function setPreference(
    field: 'compare' | 'ask',
    value: 'all' | 'gauges' | 'changed' | 'every',
  ) {
    preferences.value.weatherChanges = {
      ...preferences.value.weatherChanges,
      [field]: value,
    };
  }

  // Edit Gallery Page in this one's place, ready to save the new values
  async function editGalleryPage() {
    const { default: AddToGallery } = await import('./AddToGallery.svelte');
    dialog.trigger({
      type: 'component',
      component: { ref: AddToGallery },
      options: { title: 'Edit Gallery Page', size: 'medium' },
    });
  }

  function save() {
    const shown = changes;
    const chosen = new Set(
      [...use].filter((key) => shown.some((c) => c.key === key)),
    );
    if (chosen.size)
      weather.updateRawData(
        applyChanges(
          $state.snapshot(weather.rawData) as WeatherDay[],
          result.got,
          chosen,
        ),
      );
    weatherDays.declined = updateDeclined(
      $state.snapshot(weatherDays.declined),
      shown,
      chosen,
    );
    projectChanged({ weather: true });
    const kept = shown.length - chosen.size;
    if (chosen.size && published && updatePage) void editGalleryPage();
    else dialog.close();
    toast.trigger({
      category: 'success',
      message: chosen.size
        ? `Updated ${chosen.size} ${pluralize('day', chosen.size)}${kept ? `, kept ${kept}` : ''}.`
        : `Kept your saved ${pluralize('value', shown.length)}.`,
    });
  }
</script>

{#snippet alsoUpdate()}
  <label class="flex cursor-pointer items-center justify-center gap-2 text-sm">
    <input type="checkbox" class="checkbox" bind:checked={updatePage} />
    Also update my gallery page
  </label>
{/snippet}

<div class="flex flex-col gap-4 px-2 pt-2 text-left">
  <p>
    {#if changes.length}
      Your weather source now has different values for {changes.length} saved
      {pluralize('day', changes.length)}. Your saved values stay unless you
      choose new ones.
    {:else}
      No changes to show with these settings.
    {/if}
    {#if result.added}
      {result.added} new {pluralize('day', result.added)}
      {result.added === 1 ? 'was' : 'were'} added.
    {/if}
  </p>

  <div
    class="bg-surface-100 dark:bg-surface-900 rounded-container divide-surface-200-800 flex flex-col divide-y border border-gray-300 dark:border-gray-700"
  >
    <ToggleSwitch
      bare
      label="Show Only Values My Gauges Use"
      details="Only show high, average, low, rain or snow changes if your project uses them"
      checked={compareGauges}
      onchange={(e) =>
        setPreference(
          'compare',
          (e.currentTarget as HTMLInputElement).checked ? 'gauges' : 'all',
        )}
    />
    <ToggleSwitch
      bare
      label="Ask Every Time"
      details="Otherwise values you keep are only asked about if they change again"
      checked={askEveryTime}
      onchange={(e) =>
        setPreference(
          'ask',
          (e.currentTarget as HTMLInputElement).checked ? 'every' : 'changed',
        )}
    />
  </div>

  {#if changes.length}
    <div class="flex flex-wrap justify-center gap-2">
      <button
        type="button"
        class="btn btn-sm preset-tonal"
        onclick={() => use.clear()}>Keep All</button
      >
      <button
        type="button"
        class="btn btn-sm preset-tonal"
        onclick={() => changes.forEach((c) => use.add(c.key))}
        >Update All</button
      >
    </div>

    <ul class="flex flex-col gap-2" aria-label="Changed days">
      {#each changes as change (change.key)}
        {@const saved = savedByKey.get(change.key)}
        {@const got = gotByKey.get(change.key)}
        {@const headingId = `search-again-${change.key.replace('|', '-')}`}
        <li
          class="bg-surface-100 dark:bg-surface-900 rounded-container card-border flex flex-col gap-2 p-3"
          aria-labelledby={headingId}
        >
          <p id={headingId} class="font-bold">
            {formatDate(change.date)}{#if several}
              <span class="font-normal opacity-70">
                · {locations.all[change.location]?.label ?? ''}</span
              >{/if}
          </p>
          <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            {#each change.changes as { param } (param)}
              <dt class="opacity-70">{LABELS[param]}</dt>
              <dd class="flex flex-wrap gap-x-1">
                <span>{show(saved, param)}</span>
                <span aria-hidden="true">→</span>
                <span class="sr-only">now</span>
                <span class="font-bold">{show(got, param)}</span>
              </dd>
            {/each}
          </dl>
          <label class="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              class="checkbox"
              checked={use.has(change.key)}
              onchange={(e) =>
                e.currentTarget.checked
                  ? use.add(change.key)
                  : use.delete(change.key)}
            />
            Use new values<span class="sr-only">
              for {formatDate(change.date)}</span
            >
          </label>
        </li>
      {/each}
    </ul>
  {/if}

  <SaveAndCloseButtons
    above={published && changes.length ? alsoUpdate : undefined}
    onSave={save}
    onClose={() => dialog.close()}
    disabled={!changes.length}
  />
</div>
