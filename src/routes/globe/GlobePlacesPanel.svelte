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

<!--
  The list of places currently facing the camera.

  This is where the globe's text lives. Drawing names on the sphere itself
  meant one extruded text geometry per label, rebuilt as the visible set
  changed, which made the page unusable; names in the DOM cost a div each and
  give the page something readable and keyboard-navigable besides.
-->

<script lang="ts">
  import { pluralize } from '$lib/utils/string-utils';
  import { ChevronDownIcon, SearchIcon } from '@lucide/svelte';
  import GlobeRegionDetails from './GlobeRegionDetails.svelte';
  import {
    getRegionLabel,
    regionKey,
    type GlobeRegion,
    type GlobeRegionInView,
    type GlobeSearchResult,
  } from './globe-utils';

  interface Props {
    /** Regions facing the camera, already ranked and capped. */
    inView: GlobeRegionInView[];
    /** How many regions are visible in total, before the cap. */
    totalInView: number;
    searchQuery: string;
    searchResults: GlobeSearchResult[];
    /** Key of the expanded region, or null. */
    selectedKey: string | null;
    /** Whether the payload carries location names at all. */
    hasLabels: boolean;
    loading: boolean;
    /** True when the payload loaded but contains no projects. */
    isEmpty: boolean;
    onSelect: (region: GlobeRegion) => void;
    onHover: (region: GlobeRegion | null) => void;
    onChooseResult: (result: GlobeSearchResult) => void;
    onPointerEnter: () => void;
    onPointerLeave: () => void;
  }

  let {
    inView,
    totalInView,
    searchQuery = $bindable(),
    searchResults,
    selectedKey,
    hasLabels,
    loading,
    isEmpty,
    onSelect,
    onHover,
    onChooseResult,
    onPointerEnter,
    onPointerLeave,
  }: Props = $props();

  let listElement: HTMLElement | undefined = $state();

  const searching = $derived(searchQuery.trim().length > 0);

  /** What to show for a region: its location name, else a project title. */
  function displayName(region: GlobeRegion): string {
    return (
      getRegionLabel(region) ??
      region.projects?.[0]?.title ??
      'Unknown location'
    );
  }

  // Clicking a point on the globe expands its row, which may be scrolled out of
  // sight. Rows are addressed by data attribute rather than an array of
  // bind:this refs, which would have to be rebuilt every time the camera moves.
  $effect(() => {
    if (!selectedKey || !listElement) return;
    listElement
      .querySelector(`[data-region-key="${selectedKey}"]`)
      // 'nearest' so selecting an already-visible row doesn't jump the list.
      ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
</script>

<!--
  focusin/focusout alongside the pointer events: a keyboard user reading and
  activating rows deserves the same still globe a mouse user gets, and without
  these the sphere keeps spinning the highlighted point away from them. They
  bubble, so the search input is covered too.
-->
<aside
  onmouseenter={onPointerEnter}
  onmouseleave={onPointerLeave}
  onfocusin={onPointerEnter}
  onfocusout={onPointerLeave}
  class="bg-surface-50-950 lg:rounded-container flex h-[38dvh] w-full flex-col overflow-hidden lg:h-[75dvh] lg:w-[22rem] lg:shadow-md p-4"
  aria-label="Places on the globe"
>
  <div class="border-surface-300-700 shrink-0 border-b p-2">
    <div class="relative">
      <SearchIcon
        class="text-surface-500 pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2"
      />
      <input
        type="search"
        bind:value={searchQuery}
        placeholder={hasLabels
          ? 'Search places or projects'
          : 'Search projects'}
        aria-label="Search places or projects on the globe"
        disabled={loading}
        class="bg-surface-50-950 border-surface-300-700 w-full rounded-lg border py-1.5 pr-2 pl-8 text-sm"
      />
    </div>
  </div>

  <div bind:this={listElement} class="min-h-0 flex-1 overflow-y-auto">
    {#if loading}
      <p class="text-surface-600-400 p-3 text-sm">Loading places...</p>
    {:else if isEmpty}
      <p class="text-surface-600-400 p-3 text-sm">No projects to show yet.</p>
    {:else if searching}
      <ul>
        {#each searchResults as result (regionKey(result.region))}
          <li>
            <button
              onclick={() => onChooseResult(result)}
              onmouseenter={() => onHover(result.region)}
              onmouseleave={() => onHover(null)}
              onfocus={() => onHover(result.region)}
              onblur={() => onHover(null)}
              class="hover:bg-surface-200-800 flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left transition-colors"
            >
              <span class="text-sm leading-tight">{result.primary}</span>
              <span class="text-surface-600-400 text-xs">
                {result.count}
                {pluralize('project', result.count)}
              </span>
            </button>
          </li>
        {:else}
          <li class="text-surface-600-400 p-3 text-sm">No matches.</li>
        {/each}
      </ul>
    {:else if totalInView === 0}
      <p class="text-surface-600-400 p-3 text-sm">
        No projects on this side of the globe. Try rotating it, or search above.
      </p>
    {:else}
      <ul>
        {#each inView as { region } (regionKey(region))}
          {@const key = regionKey(region)}
          {@const expanded = key === selectedKey}
          {@const count = region.projects?.length ?? 0}
          <li data-region-key={key} class="border-surface-300-700/50 border-b">
            <button
              onclick={() => onSelect(region)}
              onmouseenter={() => onHover(region)}
              onmouseleave={() => onHover(null)}
              onfocus={() => onHover(region)}
              onblur={() => onHover(null)}
              aria-expanded={expanded}
              class="hover:bg-surface-200-800 flex w-full items-center gap-2 px-3 py-2 text-left transition-colors"
            >
              <span
                class="border-surface-400-600 size-3 shrink-0 rounded-full border"
                style="background-color: {region.popular_color?.hex ??
                  '#ffcc00'}"
                title={region.popular_color?.name ?? ''}
              ></span>
              <span class="flex min-w-0 flex-1 flex-col">
                <span class="truncate text-sm leading-tight"
                  >{displayName(region)}</span
                >
                <span class="text-surface-600-400 text-xs">
                  {count}
                  {pluralize('project', count)}
                </span>
              </span>
              <ChevronDownIcon
                class="text-surface-500 size-4 shrink-0 transition-transform {expanded
                  ? 'rotate-180'
                  : ''}"
              />
            </button>

            {#if expanded}
              <GlobeRegionDetails {region} />
            {/if}
          </li>
        {/each}
      </ul>

      {#if totalInView > inView.length}
        <p class="text-surface-600-400 p-3 text-xs">
          Showing the {inView.length} nearest the center, of {totalInView} places
          in view. Rotate or zoom to see others.
        </p>
      {/if}
    {/if}
  </div>
</aside>
