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

<script module lang="ts">
  import { FIELD_GROUP } from '#lib/constants/class-constants.js';
  import type { ColorwaySort } from '#lib/components/yarn-colorways/colorway-utils.js';

  class YarnColorwayFinderState {
    selectedBrandId = $state('');
    selectedYarnId = $state('');
    selectedYarnWeightId: YarnWeight['id'] | '' = $state('');
    search = $state('');
    hex = $state('');
    /** The chosen sort; null follows the search (best match with a color) */
    sort = $state<ColorwaySort | null>(null);
    /** Reverse the sort (any but Best match); stays on across sorts */
    reversed = $state(false);
  }

  const yarnColorwayFinderState = new YarnColorwayFinderState();
</script>

<script lang="ts">
  import { browser, version } from '$app/env';
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import AppShell from '#lib/components/AppShell.svelte';
  import Card from '#lib/components/Card.svelte';
  import Footer from '#lib/components/Footer.svelte';
  import FilterChips from '#lib/components/FilterChips.svelte';
  import FiltersButton from '#lib/components/buttons/FiltersButton.svelte';
  import ColorSearchField from '#lib/components/ColorSearchField.svelte';
  import SelectYarn from '#lib/components/SelectYarn.svelte';
  import ColorwayCards from '#lib/components/yarn-colorways/ColorwayCards.svelte';
  import ColorwayRows from '#lib/components/yarn-colorways/ColorwayRows.svelte';
  import SortSelectMenu from '#lib/components/SortSelectMenu.svelte';
  import ViewMenu from '#lib/components/buttons/ViewMenu.svelte';
  import {
    canReverse,
    closeMatches,
    colorwaySortOptions,
    defaultColorwaySort,
    isColorwaySort,
    sortColorways,
  } from '#lib/components/yarn-colorways/colorway-utils.js';
  import SelectYarnWeight from '#lib/components/SelectYarnWeight.svelte';
  import Share from '#lib/components/Share.svelte';
  import Spinner from '#lib/components/Spinner.svelte';
  import YarnSources from '#lib/components/YarnSources.svelte';
  import ToTopButton from '#lib/components/buttons/ToTopButton.svelte';
  import {
    ALL_YARN_WEIGHTS,
    YARN_COLORWAYS_PER_PAGE,
  } from '#lib/constants/color-constants.js';
  import {
    ensureYarnData,
    getBrands,
    getColorwaysWithAffiliateLinks,
  } from '#lib/data/yarns/colorways.svelte.js';
  import { safeSlide } from '#lib/features/transitions/safeSlide.js';
  import type { Color, YarnWeight } from '#lib/types/yarn-types.js';
  import { pluralize } from '#lib/utils/string-utils.js';
  import {
    ChevronDownIcon,
    CircleQuestionMarkIcon,
    PlusIcon,
    SearchIcon,
    XIcon,
  } from '@lucide/svelte';
  import { Accordion } from '@skeletonlabs/skeleton-svelte';
  import chroma from 'chroma-js';
  import { onMount } from 'svelte';

  let urlParams: URLSearchParams | undefined;
  let isLoaded = $state(false);
  let filtersContainer: HTMLDivElement | undefined = $state();
  let showScrollToTopButton = $state(false);
  let itemsToShow = $state(YARN_COLORWAYS_PER_PAGE);

  let layout = $state<'grid' | 'list'>('grid');

  let accordionState: string[] = $state([]);

  // Yarn Weight and Colorway Name sit behind the Filters button
  let filtersOpen = $state(false);
  let filtersButton = $state<FiltersButton>();
  // Yarn Weight only shows until a yarn is chosen
  const weightShown = $derived(
    !(
      yarnColorwayFinderState.selectedBrandId &&
      yarnColorwayFinderState.selectedYarnId
    ),
  );
  const chips = $derived([
    ...(weightShown && yarnColorwayFinderState.selectedYarnWeightId
      ? [
          {
            label: `${ALL_YARN_WEIGHTS.find((weight) => weight.id === yarnColorwayFinderState.selectedYarnWeightId)?.name} weight`,
            remove: () => (yarnColorwayFinderState.selectedYarnWeightId = ''),
          },
        ]
      : []),
    ...(yarnColorwayFinderState.search
      ? [
          {
            label: `Name: ${yarnColorwayFinderState.search}`,
            remove: () => (yarnColorwayFinderState.search = ''),
          },
        ]
      : []),
  ]);

  onMount(() => {
    initPage();
  });

  async function initPage() {
    await ensureYarnData();

    urlParams = new URLSearchParams(window.location.search);
    // Load URL
    if (urlParams.has('f')) {
      const f = urlParams.get('f');
      if (f) getURLYarnParams(f);
    }

    if (urlParams.has('fw')) {
      const weightId = urlParams.get('fw');
      if (weightId && ALL_YARN_WEIGHTS.some((n) => n.id === weightId)) {
        yarnColorwayFinderState.selectedYarnWeightId =
          weightId as YarnWeight['id'];
      }
    }

    if (urlParams.has('c')) {
      const color = urlParams.get('c');
      if (color && chroma.valid(color))
        yarnColorwayFinderState.hex = chroma(color).hex('rgb');
    }
    if (urlParams.has('n'))
      yarnColorwayFinderState.search = urlParams.get('n') ?? '';
    const sort = urlParams.get('s');
    if (isColorwaySort(sort)) yarnColorwayFinderState.sort = sort;
    yarnColorwayFinderState.reversed = urlParams.get('r') === '1';

    const scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio != 1) {
            showScrollToTopButton = true;
          } else {
            showScrollToTopButton = false;
          }
        });
      },
      { threshold: 1 },
    );
    if (filtersContainer) scrollObserver.observe(filtersContainer);
    // Open when a link brought filters
    filtersOpen = chips.length > 0;
    isLoaded = true;
  }

  function getShareableURL({
    selectedBrandId,
    selectedYarnId,
    selectedYarnWeightId,
    search,
    hex,
    sort,
    reversed,
  }: {
    selectedBrandId: string;
    selectedYarnId: string;
    selectedYarnWeightId: YarnWeight['id'] | '';
    search: string;
    hex: string;
    sort: ColorwaySort | null;
    reversed: boolean;
  }) {
    if (!browser) return;

    let url = `${window.location.origin}${window.location.pathname}`;

    const params: Record<string, string> = {};

    if (selectedBrandId && selectedYarnId)
      params.f = `${selectedBrandId}-${selectedYarnId}`;
    else if (selectedBrandId) params.f = selectedBrandId;
    else if (selectedYarnId) params.f = selectedYarnId;

    if (selectedYarnWeightId) params.fw = selectedYarnWeightId;

    if (hex) params.c = hex.includes('#') ? hex.substring(1) : hex;
    if (search) params.n = search;
    if (sort && sort !== defaultColorwaySort(!!hex)) params.s = sort;
    if (reversed) params.r = '1';

    if (params.f || params.fw || params.c || params.n || params.s || params.r) {
      params.v = version;
      url += '?';
      url += new URLSearchParams(params).toString();
    }
    const href = new URL(url).href;
    return href;
  }

  function getURLYarnParams(paramString: string) {
    if (!paramString.includes('-')) {
      // check if brandId exists
      if (getBrands().find((brand) => brand.id === paramString))
        yarnColorwayFinderState.selectedBrandId = paramString;
      // check if yarnId exists
      if (
        getBrands()
          .flatMap((brand) => brand.yarns)
          .find((yarn) => yarn.id === paramString)
      )
        yarnColorwayFinderState.selectedYarnId = paramString;
      return;
    }
    const [brandId, yarnId] = paramString.split('-');

    // check if brandId exists
    if (getBrands().find((brand) => brand.id === brandId))
      yarnColorwayFinderState.selectedBrandId = brandId;
    // check if yarnId exists
    if (
      getBrands()
        .flatMap((brand) => brand.yarns)
        .find((yarn) => yarn.id === yarnId)
    )
      yarnColorwayFinderState.selectedYarnId = yarnId;
  }

  /** The colorways that pass the filters and the name search, in catalog order */
  let filtered = $derived.by(() => {
    if (!isLoaded) return [];
    const { selectedBrandId, selectedYarnId, selectedYarnWeightId } =
      yarnColorwayFinderState;
    const find = yarnColorwayFinderState.search.toLowerCase();
    return getColorwaysWithAffiliateLinks().filter(
      (colorway) =>
        (!selectedBrandId || colorway.brandId === selectedBrandId) &&
        (!selectedYarnId || colorway.yarnId === selectedYarnId) &&
        (!selectedYarnWeightId ||
          colorway.yarnWeightId === selectedYarnWeightId) &&
        (!find || (colorway.name ?? '').toLowerCase().includes(find)),
    );
  });

  /** During a color search, just its close matches, each with its delta */
  let matched = $derived<(Color & { delta?: number })[]>(
    yarnColorwayFinderState.hex
      ? closeMatches(filtered, yarnColorwayFinderState.hex)
      : filtered,
  );

  let sort = $derived(
    yarnColorwayFinderState.sort === 'best-match' &&
      !yarnColorwayFinderState.hex
      ? defaultColorwaySort(false)
      : (yarnColorwayFinderState.sort ??
          defaultColorwaySort(!!yarnColorwayFinderState.hex)),
  );

  /** Sorted once per search and sort, so Show More only adds to the end */
  let sorted = $derived(
    sortColorways(matched, sort, yarnColorwayFinderState.reversed),
  );
  let results = $derived(sorted.slice(0, itemsToShow));

  // A new search or sort starts again from the first page
  $effect.pre(() => {
    void matched;
    void sort;
    void yarnColorwayFinderState.reversed;
    itemsToShow = YARN_COLORWAYS_PER_PAGE;
  });

  let shareableURL = $derived(
    getShareableURL({
      selectedBrandId: yarnColorwayFinderState.selectedBrandId,
      selectedYarnId: yarnColorwayFinderState.selectedYarnId,
      selectedYarnWeightId: yarnColorwayFinderState.selectedYarnWeightId,
      search: yarnColorwayFinderState.search,
      hex: yarnColorwayFinderState.hex,
      sort: yarnColorwayFinderState.sort,
      reversed: yarnColorwayFinderState.reversed && canReverse(sort),
    }),
  );
</script>

<svelte:head>
  <title>Yarn Colorway Finder</title>
  <meta
    name="description"
    content="Browse a collection of yarn colorways. Filter by brand or yarn name, and search by HTML color name, hex code, or a color picked from a photo to find matching yarn colorways."
  />

  <meta property="og:title" content="Yarn Colorway Finder" />
  <meta
    property="og:description"
    content="Browse yarn colorways, filter by brand or yarn, and search by hex color code or a color from a photo."
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/yarn-colorway-finder" />
  <meta property="og:type" content="website" />
  <meta
    property="og:image"
    content="{PUBLIC_BASE_URL}/images/temperature-blanket-og-image-5.0.0.jpg"
  />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
</svelte:head>

<AppShell pageName="Yarn Colorway Finder">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
    <Share href={shareableURL} />
  {/snippet}
  {#snippet main()}
    <main class="m-auto max-w-(--breakpoint-xl) pb-6">
      <div class="w-full px-2 py-4 text-center">
        <div class="flex flex-col gap-2">
          <h2 class="h1 text-gradient mb-0">Find Yarn by Color</h2>
          <p>
            Browse yarn colorways, filter by brand or yarn, and search by hex
            color code or a color picked from a photo.
          </p>
        </div>
      </div>
      <Card>
        {#snippet content()}
          <div class=" my-2 flex flex-col items-center">
            <div
              bind:this={filtersContainer}
              class="my-2 grid w-full scroll-mt-[66px] grid-cols-12 items-end justify-between gap-4"
            >
              <div class="col-span-full">
                <ColorSearchField bind:hex={yarnColorwayFinderState.hex} />
              </div>

              {#key isLoaded}
                <div class="col-span-12 w-full">
                  <SelectYarn
                    preselectDefaultYarn={false}
                    bind:selectedBrandId={
                      yarnColorwayFinderState.selectedBrandId
                    }
                    bind:selectedYarnId={yarnColorwayFinderState.selectedYarnId}
                    selectedYarnWeightId={yarnColorwayFinderState.selectedYarnWeightId}
                  />
                </div>
              {/key}
            </div>

            {#if results.length}
              <p class="my-2">
                {#if sorted.length > results.length}
                  Showing {results.length.toLocaleString()}
                  of
                {/if}
                {sorted.length.toLocaleString()}
                {yarnColorwayFinderState.hex
                  ? pluralize('close match', sorted.length, 'es')
                  : pluralize('Colorway', sorted.length)}
              </p>
            {/if}
            <div class="flex flex-wrap items-center justify-center gap-2">
              {#if results.length}
                <SortSelectMenu
                  options={colorwaySortOptions(!!yarnColorwayFinderState.hex)}
                  current={sort}
                  {canReverse}
                  reversed={yarnColorwayFinderState.reversed}
                  onsort={(chosen) => (yarnColorwayFinderState.sort = chosen)}
                  onreverse={(reversed) =>
                    (yarnColorwayFinderState.reversed = reversed)}
                  compact
                />
              {/if}
              {#if results.length}
                <ViewMenu bind:value={layout} fillOption compact />
              {/if}
              <FiltersButton
                bind:this={filtersButton}
                bind:open={filtersOpen}
                count={chips.length}
                controls="finder-filters"
              />
            </div>

            <div
              id="finder-filters"
              hidden={!filtersOpen}
              class="my-2 grid w-full grid-cols-12 items-end gap-4"
            >
              {#if isLoaded}
                {#key yarnColorwayFinderState.selectedBrandId || yarnColorwayFinderState.selectedYarnId}
                  <div
                    class="col-span-12 w-full md:col-span-4"
                    class:hidden={!weightShown}
                  >
                    <SelectYarnWeight
                      selectedBrandId={yarnColorwayFinderState.selectedBrandId}
                      bind:selectedYarnWeightId={
                        yarnColorwayFinderState.selectedYarnWeightId
                      }
                    />
                  </div>
                {/key}
              {/if}

              <div
                class={[
                  'label col-span-12 w-full',
                  weightShown && 'md:col-span-8',
                ]}
              >
                <label class="label-text" for="yarn-select-search-input">
                  Colorway Name
                </label>
                <div class={[FIELD_GROUP, 'w-full grid-cols-[auto_1fr_auto]']}>
                  <span class="label label-text" aria-hidden="true"
                    ><SearchIcon /></span
                  >
                  <input
                    id="yarn-select-search-input"
                    autocomplete="off"
                    placeholder="e.g., Wisteria, Cream"
                    type="text"
                    class="input truncate"
                    bind:value={yarnColorwayFinderState.search}
                  />
                  {#if yarnColorwayFinderState.search}
                    <button
                      aria-label="Clear Search"
                      class="btn hover:preset-tonal-surface"
                      onclick={() => {
                        yarnColorwayFinderState.search = '';
                      }}
                      ><XIcon />
                    </button>
                  {/if}
                </div>
              </div>
            </div>

            {#if !filtersOpen}
              <div class="my-2">
                <FilterChips {chips} onremove={() => filtersButton?.focus()} />
              </div>
            {/if}

            {#if results.length}
              <div class="my-4 w-full">
                {#if layout === 'grid'}
                  <ColorwayCards colorways={results} />
                {:else}
                  <ColorwayRows colorways={results} />
                {/if}
              </div>
            {:else if !isLoaded}
              <div class="mx-auto my-6">
                <Spinner />
              </div>
            {:else}
              <div class="bg-warning-500/20 card mx-auto my-2 p-4 text-center">
                <p>No Matching Colorways</p>
                <p class="text-sm">Try changing the filters above</p>
              </div>
            {/if}
            {#if sorted.length > results.length}
              <div class="mx-auto flex w-full justify-center">
                <button
                  class="btn rounded-container bg-primary-200-800 mb-2"
                  onclick={() => (itemsToShow += YARN_COLORWAYS_PER_PAGE)}
                  ><PlusIcon />Show More</button
                >
              </div>
            {/if}
          </div>
        {/snippet}
      </Card>
    </main>
  {/snippet}
  {#snippet footer()}
    <Footer>
      {#snippet about()}
        <span>
          <Accordion
            value={accordionState}
            onValueChange={(e) => (accordionState = e.value)}
            collapsible
            multiple
          >
            <Accordion.Item value="accurate">
              <Accordion.ItemTrigger
                class="flex items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2">
                  <CircleQuestionMarkIcon />

                  <p class="font-bold">Are the colors accurate?</p>
                </div>

                <Accordion.ItemIndicator class="group">
                  <ChevronDownIcon
                    class="icon-sm transition group-data-[state=open]:rotate-180"
                  />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                {#snippet element(attributes)}
                  {#if !attributes.hidden}
                    <div {...attributes} transition:safeSlide>
                      Colors on a screen will always look different from actual
                      yarn colorways. The colors used for this site are meant to
                      be an approximation. They also might not be up-to-date;
                      some colorways might have changed or not be available.
                      These results do not represent official colorway
                      information from their respective companies. The process
                      used to obtain colorway information is described here: <a
                        href="/documentation/colors-and-yarn#getting-yarn-colorway-data"
                        class="link">Getting Yarn Colorway Data</a
                      >. If you find an inaccuracy, send an email to
                      hello@temperature-blanket.com.
                    </div>
                  {/if}
                {/snippet}
              </Accordion.ItemContent>
            </Accordion.Item>
            <Accordion.Item value="find">
              <Accordion.ItemTrigger
                class="flex items-center justify-between gap-2"
              >
                <div class="flex items-center gap-2">
                  <CircleQuestionMarkIcon />
                  <p class="font-bold">
                    What if I can't find the yarn I'm looking for?
                  </p>
                </div>

                <Accordion.ItemIndicator class="group">
                  <ChevronDownIcon
                    class="icon-sm transition group-data-[state=open]:rotate-180"
                  />
                </Accordion.ItemIndicator>
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                {#snippet element(attributes)}
                  {#if !attributes.hidden}
                    <div {...attributes} transition:safeSlide>
                      Requests for yarn to be included in these results can be
                      made by anyone using <a
                        href="/yarn-search-request"
                        rel="noreferrer"
                        class="link">this request form</a
                      >.
                    </div>
                  {/if}
                {/snippet}
              </Accordion.ItemContent>
            </Accordion.Item>
          </Accordion>
        </span>
      {/snippet}

      {#snippet sources()}
        <span>
          <YarnSources />
        </span>
      {/snippet}
    </Footer>
  {/snippet}
</AppShell>
{#if showScrollToTopButton}
  <ToTopButton
    bottom="10px"
    onClick={() =>
      filtersContainer?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })}
  />
{/if}
