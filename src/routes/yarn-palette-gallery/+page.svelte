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

<script context="module">
  export let search = writable('');
  export let filteredBrandId = writable('');
  export let filteredYarnId = writable('');
  export let palettesContainOnlyFilteredYarn = writable(false);
  export let orderBy = writable('DESC');
  export let projects = writable([]);
  export let palettes = writable([]);
  export let popularPalettes = writable([]);
  export let gallery = writable({});
  export let timePeriod = writable(0.25);

  export const getYarnSearch = ({ brandId, yarnId }) => {
    if (brandId && yarnId) return `${brandId}-${yarnId}`;
    else if (brandId) return brandId;
    else if (yarnId) return yarnId;
    return '';
  };
</script>

<script>
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Card from '$lib/components/Card.svelte';
  import ColorPalette from '$lib/components/ColorPalette.svelte';
  import PlaceholderPalettes from '$lib/components/PlaceholderPalettes.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import ToTopButton from '$lib/components/buttons/ToTopButton.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import { ICONS } from '$lib/constants';
  import { gaugeProperties } from '$lib/stores';
  import {
    fetchPopularProjects,
    fetchProjects,
    getColorsFromInput,
    getProjectParametersFromURLHash,
    getPalettesFromProjects,
    pluralize,
    recordPageView,
    getTitleFromLocationsMeta,
  } from '$lib/utils';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import { colors as yarnPalleteCreatorPageColors } from './../yarn/+page.svelte';

  let first = 40;
  let loading = true;
  let scrollContainer;
  let showScrollToTopButton;

  onMount(async () => {
    if (!$projects.length) {
      loading = true;
      let results = await fetchProjects({
        first,
        after: endCursor,
        search: $search,
        order: $orderBy,
      });
      $gallery.pageInfo = results.pageInfo;
      $projects.push(...results.edges.flatMap((item) => item.node));
      $projects = $projects;
      $palettes = getPalettesFromProjects({
        projects: $projects,
        selectedBrandId: $filteredBrandId,
        selectedYarnId: $filteredYarnId,
        palettesContainOnlyFilteredYarn: $palettesContainOnlyFilteredYarn,
      });
      loading = false;
    } else {
      $palettes = getPalettesFromProjects({
        projects: $projects,
        selectedBrandId: $filteredBrandId,
        selectedYarnId: $filteredYarnId,
        palettesContainOnlyFilteredYarn: $palettesContainOnlyFilteredYarn,
      });
    }
    if (!$popularPalettes.length) {
      await fetchPopularPalettes();
    }
    loading = false;
    const scrollObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio === 0) {
            showScrollToTopButton = true;
          } else {
            showScrollToTopButton = false;
          }
        });
      },
      { threshold: 0 },
    );
    if (scrollContainer) scrollObserver.observe(scrollContainer);
  });

  $: hasNextPage = $gallery?.pageInfo?.hasNextPage;
  $: endCursor = $gallery?.pageInfo?.endCursor;

  $: showSearchReset = !!$search.length;

  async function fetchPopularPalettes() {
    let promisePopularPalettes = await fetchPopularProjects({
      months: $timePeriod,
      limit: 5,
    });
    $popularPalettes = getPalettesFromPopularProjects(promisePopularPalettes);
  }

  function getPalettesFromPopularProjects(projects) {
    if (!projects.length) return [];
    let _palettes = [];
    projects.forEach((project) => {
      const params = getProjectParametersFromURLHash(
        new URL(project.meta.project_url).hash.substring(1),
      );

      JSON.parse(project.meta.yarn_urls).forEach((yarn_url, i) => {
        const isNotPresetScheme = $gaugeProperties.every(
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

        if (isNotPresetScheme && someColorsAreYarn && isUniquePalette) {
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
          }" target="_blank" rel="noreferrer" class="underline line-clamp-1" title="Open Project Preview Page" onclick="event.stopPropagation()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 inline">
  <path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clip-rule="evenodd" />
  <path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clip-rule="evenodd" />
</svg>
<span class="whitespace-pre-wrap">${title} ${i > 0 ? ` - ${i + 1}` : ''}</span></a>`;
          // schemeName += `<span class="">${new Date(project.date).toLocaleDateString()}</span>`;
          schemeName += '</div>';

          _palettes.push({
            // date: new Date(project.date),
            // dateLabel,
            colors,
            projectId: project.id,
            // value: "Custom",
            // link: project.projectUrl,
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
  <svelte:fragment slot="stickyHeader">
    <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
  </svelte:fragment>

  <main
    slot="main"
    class="max-w-screen-xl m-auto flex flex-col justify-start gap-2"
  >
    {#if showScrollToTopButton && $projects.length}
      <ToTopButton
        bottom="1rem"
        onClick={() => {
          scrollContainer.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }}
      />
    {/if}

    <div class="flex flex-col justify-center gap-8">
      <div class="inline-grid gap-2 text-center">
        <Card>
          <div slot="header" class="bg-surface-50-900-token py-4">
            <h2 class="font-bold text-xl">Featured Yarn Palettes</h2>
            <label>
              <span>From popular projects during the past</span>
              <select
                bind:value={$timePeriod}
                class="select w-fit"
                on:change={() => {
                  $popularPalettes = [];
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
            slot="content"
            class="gap-4 my-2 flex flex-col items-start justify-start w-full"
          >
            {#if !$popularPalettes.length}
              <PlaceholderPalettes items={5} maxWFull={true} />
            {:else}
              {#each $popularPalettes as { colors, schemeName, projectId }}
                <!-- {@const href = `/yarn?s=${colorsToCode(colors, {
                            includePrefixes: false,
                        })}&f=${colorsToYarnDetails({ colors })}&v=${version}`} -->
                <a
                  on:click={async () => {
                    $yarnPalleteCreatorPageColors = colors;
                    await recordPageView(projectId);
                  }}
                  href="/yarn"
                  class="w-full flex flex-col text-left gap-y-1"
                >
                  <ColorPalette {colors} {schemeName} />
                </a>
              {/each}
            {/if}
          </div>
        </Card>
      </div>
      <div class="inline-grid gap-2 text-center">
        <Card>
          <div
            slot="header"
            bind:this={scrollContainer}
            class="bg-surface-50-900-token text-token pt-4 text-center flex flex-col gap-2 justify-center items-center scroll-mt-[70px] pb-4 px-2"
          >
            <div class="flex flex-col">
              <h2 class="font-bold text-xl">All Yarn Palettes</h2>
              <p class="text-sm">Palettes from all user-created projects</p>
            </div>
            <div class="grid-cols-12 grid gap-4 items-end w-full lg:px-2">
              <div class="w-full col-span-12 md:col-span-5">
                <SelectYarn
                  preselectDefaultYarn={false}
                  disabled={loading}
                  bind:selectedBrandId={$filteredBrandId}
                  bind:selectedYarnId={$filteredYarnId}
                />
              </div>

              {#if $filteredBrandId || $filteredYarnId}
                <div
                  class="w-full col-span-12 text-left md:col-span-4 flex flex-col items-start gap-0 top-[2px] relative"
                >
                  <ToggleSwitch
                    disabled={loading}
                    bind:checked={$palettesContainOnlyFilteredYarn}
                    label="Only This {$filteredBrandId && $filteredYarnId
                      ? 'Yarn'
                      : 'Brand'}"
                    details="All colorways in palette must be this {$filteredBrandId &&
                    $filteredYarnId
                      ? 'yarn'
                      : 'brand'}"
                  />
                </div>
              {/if}

              <div
                class="flex flex-col justify-start w-full col-span-12 md:col-span-3 gap-1"
              >
                <span class="flex items-center label gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-4 h-4 mr-1"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                  Search Projects
                </span>
                <div
                  class="input-group input-group-divider grid-cols-[1fr_auto]"
                >
                  <input
                    type="text"
                    class="truncate"
                    autocomplete="off"
                    placeholder="e.g., Kansas, 2003"
                    disabled={loading}
                    bind:value={$search}
                  />

                  {#if showSearchReset}
                    <button
                      disabled={loading}
                      class=""
                      title="Reset Search"
                      on:click={() => {
                        $search = '';
                      }}
                    >
                      {@html ICONS.xMark}
                    </button>
                  {/if}
                </div>
              </div>

              <label class="label col-span-6 md:col-span-2 w-full">
                <span class="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-4 h-4 mr-1"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
                    />
                  </svg>
                  Order By
                </span>
                <select
                  class="select truncate w-full"
                  bind:value={$orderBy}
                  disabled={loading}
                >
                  <option value="DESC" selected>Newest First</option>
                  <option value="ASC">Oldest First</option>
                </select>
              </label>

              <div
                class="justify-center flex col-span-6 md:col-span-2 {$filteredBrandId ||
                $filteredYarnId
                  ? 'md:col-start-11'
                  : ''}"
              >
                <button
                  class="btn variant-filled-primary flex items-center font-bold w-full"
                  disabled={loading}
                  on:click={async () => {
                    $projects = [];
                    $palettes = [];
                    loading = true;
                    const yarnSearch = getYarnSearch({
                      brandId: $filteredBrandId,
                      yarnId: $filteredYarnId,
                    });
                    let results = await fetchProjects({
                      first,
                      search: $search,
                      order: $orderBy,
                      yarn: yarnSearch,
                    });
                    $gallery.pageInfo = results.pageInfo;
                    if ($search)
                      $projects = results.edges.flatMap((item) => item.node);
                    else {
                      $projects.push(
                        ...results.edges.flatMap((item) => item.node),
                      );
                      $projects = $projects;
                    }
                    $palettes = getPalettesFromProjects({
                      projects: $projects,
                      selectedBrandId: $filteredBrandId,
                      selectedYarnId: $filteredYarnId,
                      palettesContainOnlyFilteredYarn:
                        $palettesContainOnlyFilteredYarn,
                    });
                    loading = false;
                  }}
                >
                  Search
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke-width="1.5"
                    stroke="currentColor"
                    class="w-6 h-6"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
          <div
            slot="content"
            class="gap-4 my-2 flex flex-col items-start justify-start w-full"
          >
            {#each $palettes as { colors, schemeName, projectId }}
              <a
                on:click={async () => {
                  $yarnPalleteCreatorPageColors = colors;
                  await recordPageView(projectId);
                }}
                href="/yarn"
                class="w-full flex flex-col text-left gap-y-1"
              >
                <ColorPalette {colors} {schemeName} />
              </a>
            {/each}
            {#if !$palettes.length && !loading}
              <p class="text-center my-8">
                No results. Try changing the filters above.
              </p>
            {/if}
            {#if loading}
              <PlaceholderPalettes items={20} maxWFull={true} />
            {:else if $palettes.length && hasNextPage}
              <button
                class="btn variant-filled-primary flex m-auto my-4"
                disabled={!hasNextPage}
                on:click={async () => {
                  loading = true;
                  const yarnSearch = getYarnSearch({
                    brandId: $filteredBrandId,
                    yarnId: $filteredYarnId,
                  });
                  let results = await fetchProjects({
                    first,
                    after: endCursor,
                    search: $search,
                    order: $orderBy,
                    yarn: yarnSearch,
                  });
                  $gallery.pageInfo = results.pageInfo;
                  $projects.push(...results.edges.flatMap((item) => item.node));
                  $projects = $projects;
                  $palettes = getPalettesFromProjects({
                    projects: $projects,
                    selectedBrandId: $filteredBrandId,
                    selectedYarnId: $filteredYarnId,
                    palettesContainOnlyFilteredYarn:
                      $palettesContainOnlyFilteredYarn,
                  });
                  loading = false;
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-6 h-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                <span>Load More</span>
              </button>
            {/if}
          </div>
        </Card>
      </div>
    </div>
  </main>
</AppShell>
