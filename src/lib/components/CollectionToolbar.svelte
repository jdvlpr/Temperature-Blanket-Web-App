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
  saved here). With `showFilters` off, only View and the page's actions
  show, for short lists.
-->
<script lang="ts" generics="T extends string">
  import { FIELD_GROUP, FIELD_ICON } from '#lib/constants/class-constants.js';
  import SelectYarn from '#lib/components/SelectYarn.svelte';
  import SortSelectMenu from '#lib/components/SortSelectMenu.svelte';
  import ViewMenu from '#lib/components/buttons/ViewMenu.svelte';
  import { previews } from '#lib/state/preview-state.svelte.js';
  import type { PageLayout } from '#lib/types/page-types.js';
  import { EarthIcon, Grid3x3, SearchIcon, XIcon } from '@lucide/svelte';
  import type { Snippet } from 'svelte';

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

  const searchId = $props.id();
  const hasPattern = $derived(patternType !== undefined);
  // Search on its own row when it's the only filter
  const searchOnly = $derived(!yarn && !hasPattern);
</script>

<div class="flex w-full flex-col gap-2">
  {#if showFilters}
    <div class="grid w-full grid-cols-12 items-start gap-4 text-left">
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

      <div
        class={[
          'label col-span-12',
          searchOnly ? 'md:col-span-8 md:col-start-3' : 'md:col-span-5',
        ]}
      >
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

      {#if hasPattern}
        <label class="label col-span-12 w-full md:col-span-7">
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
        />
        {@render menus?.()}
      {/if}
      <ViewMenu bind:value={layout} />
    </div>
    {#if actions}
      <div class="flex flex-wrap items-center gap-2">
        {@render actions()}
      </div>
    {/if}
  </div>
</div>
