<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script module>
  class YarnPaletteGalleryState {
    search = $state('');
    filteredBrandId = $state('');
    filteredYarnId = $state('');
    palettesContainOnlyFilteredYarn = $state(false);
    orderBy = $state('DESC');
    projects = $state([]);
    palettes = $state([]);
    popularPalettes = $state([]);
    gallery = $state({});
    timePeriod = $state(0.25);

    getYarnSearch = ({ brandId, yarnId }) => {
      if (brandId && yarnId) return `${brandId}-${yarnId}`;
      else if (brandId) return brandId;
      else if (yarnId) return yarnId;
      return '';
    };
  }

  export const yarnPaletteGalleryState = new YarnPaletteGalleryState();
</script>

<script>
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import ColorPalette from '$lib/components/ColorPalette.svelte';
  import PlaceholderPalettes from '$lib/components/PlaceholderPalettes.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import ToTopButton from '$lib/components/buttons/ToTopButton.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import { allGaugesAttributes } from '$lib/state';
  import {
    fetchPopularProjects,
    fetchProjects,
    getColorsFromInput,
    getPalettesFromProjects,
    getProjectParametersFromURLHash,
    getTitleFromLocationsMeta,
    pluralize,
    recordPageView,
  } from '$lib/utils';
  import {
    ArrowUpDownIcon,
    ChevronRightIcon,
    PlusIcon,
    SearchIcon,
    XIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { yarnPageState } from '../yarn/state.svelte';

  let first = 40;
  let loading = $state(true);
  let scrollContainer = $state();
  let showScrollToTopButton = $state(false);

  onMount(async () => {
    if (!yarnPaletteGalleryState.projects.length) {
      loading = true;
      let results = await fetchProjects({
        first,
        after: endCursor,
        search: yarnPaletteGalleryState.search,
        order: yarnPaletteGalleryState.orderBy,
      });
      yarnPaletteGalleryState.gallery.pageInfo = results.pageInfo;
      yarnPaletteGalleryState.projects.push(
        ...results.edges.flatMap((item) => item.node),
      );
      yarnPaletteGalleryState.projects = yarnPaletteGalleryState.projects;
      yarnPaletteGalleryState.palettes = getPalettesFromProjects({
        projects: yarnPaletteGalleryState.projects,
        selectedBrandId: yarnPaletteGalleryState.filteredBrandId,
        selectedYarnId: yarnPaletteGalleryState.filteredYarnId,
        palettesContainOnlyFilteredYarn:
          yarnPaletteGalleryState.palettesContainOnlyFilteredYarn,
      });
      loading = false;
    } else {
      yarnPaletteGalleryState.palettes = getPalettesFromProjects({
        projects: yarnPaletteGalleryState.projects,
        selectedBrandId: yarnPaletteGalleryState.filteredBrandId,
        selectedYarnId: yarnPaletteGalleryState.filteredYarnId,
        palettesContainOnlyFilteredYarn:
          yarnPaletteGalleryState.palettesContainOnlyFilteredYarn,
      });
    }
    if (!yarnPaletteGalleryState.popularPalettes.length) {
      await fetchPopularPalettes();
    }
    loading = false;
    const scrollObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          showScrollToTopButton =
            !entry.isIntersecting && entry.boundingClientRect.top < 0;
        });
      },
      { threshold: 0 },
    );
    if (scrollContainer) scrollObserver.observe(scrollContainer);
  });

  let hasNextPage = $derived(
    yarnPaletteGalleryState.gallery?.pageInfo?.hasNextPage,
  );
  let endCursor = $derived(
    yarnPaletteGalleryState.gallery?.pageInfo?.endCursor,
  );

  let showSearchReset = $derived(!!yarnPaletteGalleryState.search.length);

  async function fetchPopularPalettes() {
    let promisePopularPalettes = await fetchPopularProjects({
      months: yarnPaletteGalleryState.timePeriod,
      limit: 5,
    });
    yarnPaletteGalleryState.popularPalettes = getPalettesFromPopularProjects(
      promisePopularPalettes,
    );
  }

  function getPalettesFromPopularProjects(projects) {
    if (!projects.length) return [];
    let _palettes = [];

    const MIN_COLORS = 3;
    projects.forEach((project) => {
      const params = getProjectParametersFromURLHash(
        new URL(project.meta.project_url).hash.substring(1),
      );

      JSON.parse(project.meta.yarn_urls).forEach((yarn_url, i) => {
        const isNotPresetScheme = allGaugesAttributes.every(
          (p) => !params?.[p.id]?.value?.includes('~'),
        );
        const colors = getColorsFromInput({
          string: yarn_url,
        });
        const someColorsAreYarn = colors?.some(
          (color) => color?.name && color?.brandName && color?.yarnName,
        );
        const isUniquePalette = !_palettes
          .map((palette) => JSON.stringify(palette.colors))
          .includes(JSON.stringify(colors));

        const hasEnoughColors = colors?.length > MIN_COLORS;

        if (
          isNotPresetScheme &&
          someColorsAreYarn &&
          isUniquePalette &&
          hasEnoughColors
        ) {
          const title = getTitleFromLocationsMeta(project.meta.locations);
          let schemeName =
            "<div class='flex flex-wrap justify-start items-center gap-x-4 text-xs'>";
          schemeName += '<p class="line-clamp-1">'; // start line-clamp-1
          schemeName += `<span class="mr-4">${colors.length} ${pluralize('color', colors.length)}</span>`;
          let yarnDetails = colors
            .filter((color) => color?.brandId && color?.yarnId)
            .map((color) => {
              return color.brandName + ' - ' + color.yarnName;
            });
          if (yarnDetails.length) {
            yarnDetails = [...new Set([...yarnDetails])];
            yarnDetails.forEach((yarnDetail, index, allitems) => {
              schemeName += `${yarnDetail}`;
              if (index + 1 !== allitems.length) schemeName += ', ';
            });
          }
          schemeName += '</p>'; // end line-clamp-2

          schemeName += `<a href="/gallery/${
            project.id
          }" target="_blank" rel="noreferrer" class="underline line-clamp-1" title="Open Project Preview Page" onclick="event.stopPropagation()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link size-4 inline"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
<span class="whitespace-pre-wrap">${title} ${i > 0 ? ` - ${i + 1}` : ''}</span></a>`;
          schemeName += '</div>';

          _palettes.push({
            colors,
            projectId: project.id,
            schemeName,
          });
        }
      });
    });
    return _palettes;
  }
</script>

<svelte:head>
  <title>Yarn Palette Gallery</title>
  <meta
    name="description"
    content="Browse a collection of yarn palettes from user-created projects."
  />

  <meta property="og:title" content="Yarn Palette Gallery" />
  <meta
    property="og:description"
    content="Browse a collection of yarn palettes from user-created projects."
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/yarn-palette-gallery" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Yarn Palette Gallery">
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}

  {#snippet main()}
    <main class="m-auto mx-2 flex flex-col justify-start gap-2">
      <div class="flex flex-col justify-center gap-8">
        <div class="inline-grid gap-2 text-center">
          <div class="my-2">
            <h2 class="h2 text-gradient">Featured Yarn Palettes</h2>
            <label>
              <span>From popular projects during the past</span>
              <select
                bind:value={yarnPaletteGalleryState.timePeriod}
                class="select mx-auto w-fit min-w-[90px]"
                onchange={() => {
                  yarnPaletteGalleryState.popularPalettes = [];
                  fetchPopularPalettes();
                }}
              >
                <option value={0.0357}>day</option>
                <option value={0.25}>week</option>
                <option value={1}>month</option>
                <option value={12}>year</option>
              </select>
            </label>
          </div>
          <div
            class="my-2 flex w-full flex-col items-start justify-start gap-4"
          >
            {#if !yarnPaletteGalleryState.popularPalettes.length}
              <PlaceholderPalettes items={5} maxWFull={true} wFull={true} />
            {:else}
              {#each yarnPaletteGalleryState.popularPalettes as { colors, schemeName, projectId }}
                <!-- {@const href = `/yarn?s=${colorsToCode(colors, {
                                includePrefixes: false,
                            })}&f=${colorsToYarnDetails({ colors })}&v=${version}`} -->
                <a
                  onclick={async () => {
                    yarnPageState.gauge.colors = colors;
                    await recordPageView(projectId);
                  }}
                  href="/yarn"
                  class="flex w-full flex-col gap-y-1 text-left"
                >
                  <ColorPalette {colors} {schemeName} />
                </a>
              {/each}
            {/if}
          </div>
        </div>
        <div class="inline-grid gap-2 text-center">
          <div
            bind:this={scrollContainer}
            class="flex scroll-mt-[70px] flex-col items-center justify-center gap-2 px-2 pb-4 text-center"
          >
            <div class="flex flex-col">
              <h2 class="h2 text-gradient">All Yarn Palettes</h2>
              <p class="text-sm">Palettes from all user-created projects</p>
            </div>
            <div class="grid w-full grid-cols-12 items-end gap-4 lg:px-2">
              <div class="col-span-12 w-full md:col-span-5">
                <SelectYarn
                  preselectDefaultYarn={false}
                  disabled={loading}
                  bind:selectedBrandId={yarnPaletteGalleryState.filteredBrandId}
                  bind:selectedYarnId={yarnPaletteGalleryState.filteredYarnId}
                />
              </div>

              {#if yarnPaletteGalleryState.filteredBrandId || yarnPaletteGalleryState.filteredYarnId}
                <div
                  class="relative top-[2px] col-span-12 flex w-full flex-col items-start gap-0 text-left md:col-span-4"
                >
                  <ToggleSwitch
                    disabled={loading}
                    bind:checked={
                      yarnPaletteGalleryState.palettesContainOnlyFilteredYarn
                    }
                    label="Only This {yarnPaletteGalleryState.filteredBrandId &&
                    yarnPaletteGalleryState.filteredYarnId
                      ? 'Yarn'
                      : 'Brand'}"
                    details="All colorways in palette must be this {yarnPaletteGalleryState.filteredBrandId &&
                    yarnPaletteGalleryState.filteredYarnId
                      ? 'yarn'
                      : 'brand'}"
                  />
                </div>
              {/if}

              <div
                class="col-span-12 flex w-full flex-col justify-start gap-1 md:col-span-3"
              >
                <span class="flex items-center gap-1">
                  <SearchIcon class="size-4" />
                  Search Projects
                </span>
                <div class="input-group grid-cols-[1fr_auto]">
                  <input
                    type="text"
                    class="ig-input w-full truncate"
                    autocomplete="off"
                    placeholder="e.g., Kansas, 2003"
                    disabled={loading}
                    bind:value={yarnPaletteGalleryState.search}
                  />

                  {#if showSearchReset}
                    <button
                      disabled={loading}
                      class="ig-btn hover:preset-tonal"
                      title="Reset Search"
                      onclick={() => {
                        yarnPaletteGalleryState.search = '';
                      }}
                    >
                      <XIcon />
                    </button>
                  {/if}
                </div>
              </div>

              <label class="label col-span-6 w-full md:col-span-2">
                <span class="flex items-center gap-1">
                  <ArrowUpDownIcon class="size-4" />
                  Order By
                </span>
                <select
                  class="select w-full truncate"
                  bind:value={yarnPaletteGalleryState.orderBy}
                  disabled={loading}
                >
                  <option value="DESC" selected>Newest First</option>
                  <option value="ASC">Oldest First</option>
                </select>
              </label>

              <div
                class="col-span-6 flex justify-center md:col-span-2 {yarnPaletteGalleryState.filteredBrandId ||
                yarnPaletteGalleryState.filteredYarnId
                  ? 'md:col-start-11'
                  : ''}"
              >
                <button
                  class="btn preset-filled flex w-full items-center"
                  disabled={loading}
                  onclick={async () => {
                    yarnPaletteGalleryState.projects = [];
                    yarnPaletteGalleryState.palettes = [];
                    loading = true;
                    const yarnSearch = yarnPaletteGalleryState.getYarnSearch({
                      brandId: yarnPaletteGalleryState.filteredBrandId,
                      yarnId: yarnPaletteGalleryState.filteredYarnId,
                    });
                    let results = await fetchProjects({
                      first,
                      search: yarnPaletteGalleryState.search,
                      order: yarnPaletteGalleryState.orderBy,
                      yarn: yarnSearch,
                    });
                    yarnPaletteGalleryState.gallery.pageInfo = results.pageInfo;
                    if (yarnPaletteGalleryState.search)
                      yarnPaletteGalleryState.projects = results.edges.flatMap(
                        (item) => item.node,
                      );
                    else {
                      yarnPaletteGalleryState.projects.push(
                        ...results.edges.flatMap((item) => item.node),
                      );
                      yarnPaletteGalleryState.projects =
                        yarnPaletteGalleryState.projects;
                    }
                    yarnPaletteGalleryState.palettes = getPalettesFromProjects({
                      projects: yarnPaletteGalleryState.projects,
                      selectedBrandId: yarnPaletteGalleryState.filteredBrandId,
                      selectedYarnId: yarnPaletteGalleryState.filteredYarnId,
                      palettesContainOnlyFilteredYarn:
                        yarnPaletteGalleryState.palettesContainOnlyFilteredYarn,
                    });
                    loading = false;
                  }}
                >
                  Search
                  <ChevronRightIcon />
                </button>
              </div>
            </div>
          </div>
          <div
            class="my-2 flex w-full flex-col items-start justify-start gap-4"
          >
            {#each yarnPaletteGalleryState.palettes as { colors, schemeName, projectId }}
              <a
                onclick={async () => {
                  yarnPageState.gauge.colors = colors;
                  await recordPageView(projectId);
                }}
                href="/yarn"
                class="flex w-full flex-col gap-y-1 text-left"
              >
                <ColorPalette {colors} {schemeName} />
              </a>
            {/each}
            {#if !yarnPaletteGalleryState.palettes.length && !loading}
              <p class="my-8 text-center">
                No results. Try changing the filters above.
              </p>
            {/if}
            {#if loading}
              <PlaceholderPalettes items={20} maxWFull={true} wFull={true} />
            {:else if yarnPaletteGalleryState.palettes.length && hasNextPage}
              <button
                class="btn preset-filled m-auto my-4 flex"
                disabled={!hasNextPage}
                onclick={async () => {
                  loading = true;
                  const yarnSearch = yarnPaletteGalleryState.getYarnSearch({
                    brandId: yarnPaletteGalleryState.filteredBrandId,
                    yarnId: yarnPaletteGalleryState.filteredYarnId,
                  });
                  let results = await fetchProjects({
                    first,
                    after: endCursor,
                    search: yarnPaletteGalleryState.search,
                    order: yarnPaletteGalleryState.orderBy,
                    yarn: yarnSearch,
                  });
                  yarnPaletteGalleryState.gallery.pageInfo = results.pageInfo;
                  yarnPaletteGalleryState.projects.push(
                    ...results.edges.flatMap((item) => item.node),
                  );
                  yarnPaletteGalleryState.projects =
                    yarnPaletteGalleryState.projects;
                  yarnPaletteGalleryState.palettes = getPalettesFromProjects({
                    projects: yarnPaletteGalleryState.projects,
                    selectedBrandId: yarnPaletteGalleryState.filteredBrandId,
                    selectedYarnId: yarnPaletteGalleryState.filteredYarnId,
                    palettesContainOnlyFilteredYarn:
                      yarnPaletteGalleryState.palettesContainOnlyFilteredYarn,
                  });
                  loading = false;
                }}
              >
                <PlusIcon />
                Load More
              </button>
            {/if}
          </div>
        </div>
      </div>
    </main>
  {/snippet}
</AppShell>

{#if showScrollToTopButton && yarnPaletteGalleryState.projects.length}
  <ToTopButton
    onClick={() => {
      scrollContainer.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }}
  />
{/if}
