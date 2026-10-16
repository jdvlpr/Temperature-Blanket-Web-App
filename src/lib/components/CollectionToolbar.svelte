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

<!-- @component
  Search, filters, sort and view for a list of projects or palettes: the
  Gallery's, and My Library's. It only holds the values; the page finds what
  matches (the Gallery asks the server on `onchange`, My Library filters what's
  saved here). Search always shows; Yarn, Pattern Type and `filters` sit behind
  the Filters button, open while any are on, and show as removable chips while
  closed. With `showFilters` off, only View and the page's actions show, for
  short lists.
-->
<script lang="ts" generics="T extends string">
  import { FIELD_GROUP, FIELD_ICON } from '#lib/constants/class-constants.js';
  import SelectYarn from '#lib/components/SelectYarn.svelte';
  import SortSelectMenu from '#lib/components/SortSelectMenu.svelte';
  import ViewMenu from '#lib/components/buttons/ViewMenu.svelte';
  import { menuTriggerClass } from '#lib/components/menu-styles.js';
  import { getBrands } from '#lib/data/yarns/colorways.svelte.js';
  import { previews } from '#lib/state/preview-state.svelte.js';
  import type { PageLayout } from '#lib/types/page-types.js';
  import {
    ChevronDownIcon,
    EarthIcon,
    Grid3x3,
    ListFilterIcon,
    SearchIcon,
    XIcon,
  } from '@lucide/svelte';
  import { untrack, type Snippet } from 'svelte';

  let {
    kind,
    search = $bindable(''),
    searchLabel = 'Search',
    searchPlaceholder = 'e.g., Kansas, 2003',
    searchIcon = 'earth',
    yarn = true,
    brandId = $bindable(''),
    yarnId = $bindable(''),
    onlyThisYarn = $bindable(false),
    patternType = $bindable<string | undefined>(),
    sortOptions,
    sort,
    onsort,
    reversed,
    onreverse,
    canReverse,
    layout = $bindable('grid'),
    showFilters = true,
    disabled = false,
    onchange,
    filters,
    menus,
    actions,
  }: {
    /** What's listed, for the "Only" filter's description */
    kind: 'project' | 'palette';
    search?: string;
    searchLabel?: string;
    searchPlaceholder?: string;
    searchIcon?: 'earth' | 'search';
    /** Offers the brand and yarn filter */
    yarn?: boolean;
    brandId?: string;
    yarnId?: string;
    onlyThisYarn?: boolean;
    /** Offers the pattern filter when bound (projects) */
    patternType?: string;
    sortOptions: readonly { value: T; label: string; details?: string }[];
    sort: T;
    onsort: (sort: T) => void;
    reversed?: boolean;
    onreverse?: (reversed: boolean) => void;
    canReverse?: (sort: T) => boolean;
    layout?: PageLayout;
    /** Off for short lists: just View and the actions */
    showFilters?: boolean;
    disabled?: boolean;
    /** Any search or filter changed (not sort or view) */
    onchange?: () => void;
    /** More filters, after the built-in ones */
    filters?: Snippet;
    /** More menus, after Sort (only with the filters) */
    menus?: Snippet;
    /** The page's buttons, at the end of the row, e.g. New Project */
    actions?: Snippet;
  } = $props();

  const id = $props.id();
  const searchId = `${id}-search`;
  const panelId = `${id}-filters`;
  const hasPattern = $derived(patternType !== undefined);
  // Anything to put behind the Filters button
  const hasHidden = $derived(yarn || hasPattern || !!filters);

  const hasYarn = $derived(yarn && !!(brandId || yarnId));
  const activeCount = $derived(
    (hasYarn ? 1 : 0) + (hasPattern && patternType ? 1 : 0),
  );

  // Open while a filter is on, e.g. arriving from a yarn link
  let open = $state(untrack(() => activeCount > 0));
  let filtersButton = $state<HTMLButtonElement>();

  const yarnLabel = $derived.by(() => {
    if (!hasYarn) return '';
    const brand = getBrands().find((brand) => brand.id === brandId);
    const yarnName = brand?.yarns.find((y) => y.id === yarnId)?.name;
    const name = [brand?.name, yarnName].filter(Boolean).join(' ') || 'Yarn';
    return onlyThisYarn ? `Only ${name}` : name;
  });
  const patternLabel = $derived(
    previews.all.find((preview) => preview.wpTagSlug === patternType)?.name ??
      'Pattern',
  );

  /** A chip's ✕: the chip goes, so focus moves to the Filters button */
  function removeFilter(clear: () => void) {
    clear();
    onchange?.();
    filtersButton?.focus();
  }
</script>

<div class="flex w-full flex-col gap-2">
  {#if showFilters}
    <div class="label w-full text-left">
      <label class="label-text" for={searchId}>{searchLabel}</label>
      <div class={[FIELD_GROUP, 'grid-cols-[auto_1fr_auto]']}>
        <span class="label label-text" aria-hidden="true"
          >{#if searchIcon === 'earth'}<EarthIcon />{:else}<SearchIcon
            />{/if}</span
        >
        <input
          id={searchId}
          type="text"
          class="input w-full truncate"
          autocomplete="off"
          placeholder={searchPlaceholder}
          bind:value={search}
          oninput={() => onchange?.()}
        />

        {#if search}
          <button
            type="button"
            class="btn hover:preset-tonal-surface"
            title="Clear Search"
            aria-label="Clear Search"
            onclick={() => {
              search = '';
              onchange?.();
            }}
          >
            <XIcon />
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- The page's actions at the end, as beside a heading -->
  <div
    class={[
      'my-2 flex w-full flex-wrap items-center gap-2',
      actions ? 'justify-between' : 'justify-center',
    ]}
  >
    <div class="flex flex-wrap items-center gap-2">
      {#if showFilters}
        <SortSelectMenu
          options={sortOptions}
          current={sort}
          {disabled}
          {onsort}
          {reversed}
          {onreverse}
          {canReverse}
        />
        {@render menus?.()}
        {#if hasHidden}
          <button
            bind:this={filtersButton}
            type="button"
            class={menuTriggerClass}
            aria-expanded={open}
            aria-controls={panelId}
            onclick={() => (open = !open)}
          >
            <ListFilterIcon aria-hidden="true" />
            <span
              >Filters{#if activeCount}<span aria-hidden="true">
                  · {activeCount}</span
                ><span class="sr-only">, {activeCount} on</span>{/if}</span
            >
            <ChevronDownIcon
              class={['icon-sm transition-transform', open && 'rotate-180']}
              aria-hidden="true"
            />
          </button>
        {/if}
      {/if}
      <ViewMenu bind:value={layout} />
    </div>
    {#if actions}
      <div class="flex flex-wrap items-center gap-2">
        {@render actions()}
      </div>
    {/if}
  </div>

  {#if showFilters && hasHidden}
    <div
      id={panelId}
      hidden={!open}
      class="grid w-full grid-cols-12 items-start gap-4 text-left"
    >
      {#if yarn}
        <div class="col-span-12 w-full md:col-span-7">
          <SelectYarn
            preselectDefaultYarn={false}
            {disabled}
            bind:selectedBrandId={brandId}
            bind:selectedYarnId={yarnId}
            onselectautocomplete={() => onchange?.()}
            bind:only={onlyThisYarn}
            ononlychange={() => onchange?.()}
            onlyKind={kind}
          />
        </div>
      {/if}

      {#if hasPattern}
        <label class="label col-span-12 w-full md:col-span-5">
          <span class="label-text">Pattern Type</span>
          <div class="relative flex items-center">
            <Grid3x3 class={FIELD_ICON} />
            <select
              {disabled}
              class="select truncate pl-11"
              bind:value={patternType}
              onchange={() => onchange?.()}
            >
              <option value="">Any Pattern</option>
              {#each previews.all as { name, wpTagSlug } (wpTagSlug)}
                <option value={wpTagSlug}>{name}</option>
              {/each}
            </select>
          </div>
        </label>
      {/if}

      {@render filters?.()}
    </div>

    {#if !open && activeCount}
      <ul class="flex flex-wrap justify-center gap-2" aria-label="Filters on">
        {#if hasYarn}
          <li>
            <button
              type="button"
              class="btn btn-sm preset-tonal rounded-full"
              aria-label="Remove filter: {yarnLabel}"
              {disabled}
              onclick={() =>
                removeFilter(() => {
                  brandId = '';
                  yarnId = '';
                  onlyThisYarn = false;
                })}
            >
              <span>{yarnLabel}</span>
              <XIcon aria-hidden="true" />
            </button>
          </li>
        {/if}
        {#if hasPattern && patternType}
          <li>
            <button
              type="button"
              class="btn btn-sm preset-tonal rounded-full"
              aria-label="Remove filter: {patternLabel}"
              {disabled}
              onclick={() => removeFilter(() => (patternType = ''))}
            >
              <span>{patternLabel}</span>
              <XIcon aria-hidden="true" />
            </button>
          </li>
        {/if}
      </ul>
    {/if}
  {/if}
</div>
