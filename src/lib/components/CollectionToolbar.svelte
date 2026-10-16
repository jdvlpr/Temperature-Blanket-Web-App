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
  saved here). Search always shows; Show (`statuses`), Yarn, Pattern Type and
  `filters` sit behind the Filters button, open while any are on, and show as
  removable chips while closed. Filters, Sort and View share one line, Sort
  and View as icons on phones, so the panel always opens right below the
  button. With `showFilters` off, only View and the page's actions show, for
  short lists.
-->
<script lang="ts" generics="T extends string, S extends string = string">
  import { FIELD_GROUP, FIELD_ICON } from '#lib/constants/class-constants.js';
  import SelectYarn from '#lib/components/SelectYarn.svelte';
  import SortSelectMenu from '#lib/components/SortSelectMenu.svelte';
  import ViewMenu from '#lib/components/buttons/ViewMenu.svelte';
  import FilterChips, {
    yarnChipLabel,
  } from '#lib/components/FilterChips.svelte';
  import FiltersButton from '#lib/components/buttons/FiltersButton.svelte';
  import { previews } from '#lib/state/preview-state.svelte.js';
  import type { PageLayout } from '#lib/types/page-types.js';
  import {
    EarthIcon,
    EyeIcon,
    Grid3x3,
    SearchIcon,
    XIcon,
  } from '@lucide/svelte';
  import { untrack, type ComponentProps, type Snippet } from 'svelte';

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
    status = $bindable<S | undefined>(),
    statuses,
    sortOptions,
    sort,
    onsort,
    reversed,
    onreverse,
    canReverse,
    submenu,
    layout = $bindable('grid'),
    showFilters = true,
    disabled = false,
    onchange,
    filters,
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
    /** Offers the Show filter with these choices; the first shows all */
    status?: S;
    statuses?: readonly { value: S; label: string }[];
    sortOptions: readonly { value: T; label: string; details?: string }[];
    sort: T;
    onsort: (sort: T) => void;
    reversed?: boolean;
    onreverse?: (reversed: boolean) => void;
    canReverse?: (sort: T) => boolean;
    /** One sort's own choices, e.g. Popular's period (see SortSelectMenu) */
    submenu?: ComponentProps<typeof SortSelectMenu<T>>['submenu'];
    layout?: PageLayout;
    /** Off for short lists: just View and the actions */
    showFilters?: boolean;
    disabled?: boolean;
    /** Any search or filter changed (not sort or view) */
    onchange?: () => void;
    /** More filters, after the built-in ones */
    filters?: Snippet;
    /** The page's buttons, at the end of the row, e.g. New Project */
    actions?: Snippet;
  } = $props();

  const id = $props.id();
  const searchId = `${id}-search`;
  const panelId = `${id}-filters`;
  const hasPattern = $derived(patternType !== undefined);
  // Anything to put behind the Filters button
  const hasStatus = $derived(!!statuses && statuses.length > 1);
  const hasHidden = $derived(hasStatus || yarn || hasPattern || !!filters);

  const allStatus = $derived(statuses?.[0]?.value);
  const statusOn = $derived(hasStatus && status !== allStatus);
  const hasYarn = $derived(yarn && !!(brandId || yarnId));
  const activeCount = $derived(
    (statusOn ? 1 : 0) +
      (hasYarn ? 1 : 0) +
      (hasPattern && patternType ? 1 : 0),
  );

  // A choice no longer offered (e.g. On Ravelry on Palettes) starts over
  $effect(() => {
    if (statuses && !statuses.some(({ value }) => value === status))
      status = allStatus;
  });

  // Open while a filter is on, e.g. arriving from a yarn link
  let open = $state(untrack(() => activeCount > 0));
  let filtersButton = $state<FiltersButton>();

  const chips = $derived([
    ...(statusOn
      ? [
          {
            label: statuses?.find(({ value }) => value === status)?.label ?? '',
            remove: () => (status = allStatus),
          },
        ]
      : []),
    ...(hasYarn
      ? [
          {
            label: yarnChipLabel(brandId, yarnId, onlyThisYarn),
            remove: () => {
              brandId = '';
              yarnId = '';
              onlyThisYarn = false;
            },
          },
        ]
      : []),
    ...(hasPattern && patternType
      ? [
          {
            label:
              previews.all.find((preview) => preview.wpTagSlug === patternType)
                ?.name ?? 'Pattern',
            remove: () => (patternType = ''),
          },
        ]
      : []),
  ]);
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

  <!-- The page's actions at the end, as beside a heading (first on phones,
    so they never come between Filters and its panel below) -->
  <div
    class={[
      'my-2 flex w-full flex-wrap items-center gap-2',
      actions ? 'justify-between' : 'justify-center',
    ]}
  >
    <div class="flex flex-wrap items-center gap-2">
      {#if showFilters && hasHidden}
        <FiltersButton
          bind:this={filtersButton}
          bind:open
          count={activeCount}
          controls={panelId}
        />
      {/if}
      {#if showFilters}
        <SortSelectMenu
          options={sortOptions}
          current={sort}
          {disabled}
          {onsort}
          {reversed}
          {onreverse}
          {canReverse}
          {submenu}
          compact
        />
      {/if}
      <ViewMenu bind:value={layout} compact={showFilters} />
    </div>
    {#if actions}
      <div class="flex flex-wrap items-center gap-2 max-md:order-first">
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

      {#if hasStatus}
        <label class="label col-span-12 w-full md:col-span-5">
          <span class="label-text">Show</span>
          <div class="relative flex items-center">
            <EyeIcon class={FIELD_ICON} />
            <select
              {disabled}
              class="select truncate pl-11"
              bind:value={status}
              onchange={() => onchange?.()}
            >
              {#each statuses ?? [] as { value, label } (value)}
                <option {value}>{label}</option>
              {/each}
            </select>
          </div>
        </label>
      {/if}

      {@render filters?.()}
    </div>

    {#if !open}
      <FilterChips
        {chips}
        {disabled}
        onremove={() => {
          onchange?.();
          filtersButton?.focus();
        }}
      />
    {/if}
  {/if}
</div>
