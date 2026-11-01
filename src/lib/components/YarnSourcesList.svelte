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

<!-- Every yarn by brand, with where its colors came from and when, and a
search, which starts as `search` (a yarn's, from its ⋮ menu or the yarn
picker). Loads the yarn data when it shows. -->

<script lang="ts">
  import { FIELD_GROUP } from '#lib/constants/class-constants.js';
  import { ALL_YARN_WEIGHTS } from '#lib/constants/color-constants.js';
  import {
    ensureYarnData,
    getBrands,
    isYarnDataLoaded,
  } from '#lib/data/yarns/colorways.svelte.js';
  import type { TISO8601DateString } from '#lib/types/weather-types.js';
  import { stringToDate } from '#lib/utils/date-utils.js';
  import { pluralize } from '#lib/utils/string-utils.js';
  import {
    isYarnUnavailable,
    yarnSourceGroups,
  } from '#lib/utils/yarn-sources.js';
  import { SearchIcon, XIcon } from '@lucide/svelte';
  import { onMount, untrack } from 'svelte';

  let { search = '' }: { search?: string } = $props();

  let query = $state(untrack(() => search));
  const searchId = $props.id();

  onMount(() => {
    ensureYarnData();
  });

  const groups = $derived(
    isYarnDataLoaded() ? yarnSourceGroups(getBrands(), query) : [],
  );
  const yarnCount = $derived(
    groups.reduce((count, brand) => count + brand.yarns.length, 0),
  );

  const date = (value: TISO8601DateString) =>
    stringToDate(value).toLocaleDateString(undefined, { timeZone: 'UTC' });
</script>

<div class="flex flex-col gap-4 text-left">
  <div class={[FIELD_GROUP, 'grid-cols-[auto_1fr_auto]']}>
    <span class="label label-text" aria-hidden="true"><SearchIcon /></span>
    <input
      id={searchId}
      type="text"
      class="input w-full truncate"
      autocomplete="off"
      aria-label="Search yarns"
      placeholder="Search brands, yarns or sites"
      bind:value={query}
    />
    {#if query}
      <button
        type="button"
        class="btn hover:preset-tonal-surface"
        title="Clear Search"
        aria-label="Clear Search"
        onclick={() => (query = '')}
      >
        <XIcon />
      </button>
    {/if}
  </div>

  {#if !isYarnDataLoaded()}
    <p class="text-surface-700-300 text-sm">Loading yarns…</p>
  {:else if !groups.length}
    <p class="text-surface-700-300 text-sm">
      No yarns match “{query}”.
      <button type="button" class="link" onclick={() => (query = '')}
        >Show All Yarns</button
      >
    </p>
  {:else}
    <p class="text-surface-700-300 text-sm" aria-live="polite">
      {yarnCount}
      {pluralize('yarn', yarnCount)} from {groups.length}
      {pluralize('brand', groups.length)}
      {#if query}
        <span aria-hidden="true">·</span>
        <button type="button" class="link" onclick={() => (query = '')}
          >Show All Yarns</button
        >
      {/if}
    </p>

    <!-- Brands aren't sections of a Guides & Help page -->
    <div class="flex flex-col gap-4 text-sm" data-on-this-page-ignore>
      {#each groups as brand (brand.id)}
        <section class="flex flex-col gap-1">
          <h3 class="text-base font-bold">{brand.name}</h3>
          <ul class="flex flex-col gap-2">
            {#each brand.yarns as yarn (yarn.id)}
              {@const weight = ALL_YARN_WEIGHTS.find(
                (n) => n.id === yarn.weightId,
              )?.name}
              <li>
                <p>
                  <span class="font-semibold">{yarn.name}</span>
                  {#if weight}
                    <span class="text-surface-700-300">
                      (<a
                        href="/documentation/basics/yarn-weights?highlight={weight}"
                        class="link"
                        target="_blank"
                        title="See the yarn weights chart">{weight}</a
                      >)</span
                    >
                  {/if}
                  {#if isYarnUnavailable(yarn)}
                    <span class="text-surface-700-300">· Link unavailable</span>
                  {/if}
                </p>
                {#each yarn.colorways as { source, colors } (source.href)}
                  <p class="text-surface-700-300">
                    {#if source.unavailable}
                      {colors.length}
                      {pluralize('colorway', colors.length)} from {source.name},
                      accessed {date(source.accessed)} (unavailable since {date(
                        source.unavailable,
                      )})
                    {:else}
                      <!-- eslint-disable svelte/no-navigation-without-resolve -- yarn makers' own pages -->
                      <a
                        href={source.href}
                        class="link"
                        target="_blank"
                        rel="noopener noreferrer"
                        >{colors.length}
                        {pluralize('colorway', colors.length)} from {source.name}</a
                      >, accessed {date(source.accessed)}
                      <!-- eslint-enable svelte/no-navigation-without-resolve -->
                    {/if}
                  </p>
                {/each}
              </li>
            {/each}
          </ul>
        </section>
      {/each}
    </div>
  {/if}
</div>
