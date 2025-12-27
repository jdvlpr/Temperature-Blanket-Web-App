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
  class GalleryPalettesPopularState {
    projects = $state([]);
    months = $state(0.25);
  }

  export const galleryPalettesPopularState = new GalleryPalettesPopularState();
</script>

<script>
  import ColorPalette from '$lib/components/ColorPalette.svelte';
  import PlaceholderPalettes from '$lib/components/PlaceholderPalettes.svelte';
  import { allGaugesAttributes } from '$lib/state';
  import {
    fetchPopularProjects,
    getColorsFromInput,
    getProjectParametersFromURLHash,
    getTitleFromLocationsMeta,
    pluralize,
    recordPageView,
  } from '$lib/utils';
  import { getContext, onMount } from 'svelte';

  let close = $state(null);
  if (typeof getContext === 'function')
    close = getContext('simple-modal')?.close;

  let { updateGauge } = $props();

  let palettes = $state([]);
  let loading = $state(true);

  onMount(async () => {
    if (!galleryPalettesPopularState.projects.length) {
      loading = true;
      let results = await fetchPopularProjects({
        months: galleryPalettesPopularState.months,
      });
      galleryPalettesPopularState.projects = results;
      loading = false;
    } else loading = false;
  });

  function getPalettesFromPopularProjects(projects) {
    let _palettes = [];
    // {#each $popularProjects as { title, date, featured_image_src, id }}
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

        if (isNotPresetScheme && someColorsAreYarn && isUniquePalette) {
          const title = getTitleFromLocationsMeta(project.meta.locations);

          // Check that the colors are not already in the palettes array
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
          schemeName += '</p>'; // end line-clamp-1

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

  $effect(() => {
    palettes = getPalettesFromPopularProjects(
      galleryPalettesPopularState.projects,
    );
  });
</script>

<div class="flex flex-wrap items-end justify-center gap-2 pb-4 text-center">
  <label class="label text-sm">
    <span>Popular during the past</span>
    <select
      class="select mx-auto w-fit min-w-[90px]"
      id="select-time-period"
      bind:value={galleryPalettesPopularState.months}
      onchange={async () => {
        loading = true;
        galleryPalettesPopularState.projects = [];
        let results = await fetchPopularProjects({
          months: galleryPalettesPopularState.months,
        });

        galleryPalettesPopularState.projects = results;

        loading = false;

        if (typeof document.getElementsByClassName('content') !== 'undefined')
          document.getElementsByClassName('content')[0].scrollTop = 0;
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
  class="flex scroll-mt-[58px] flex-col items-center px-2 lg:scroll-mt-[44px]"
>
  {#if loading}
    <div class="my-1"></div>
    <PlaceholderPalettes items={20} maxWFull={true} />
  {:else}
    <div class="my-2 flex w-full flex-col items-start justify-start gap-4">
      {#each palettes as { colors, schemeName, projectId }}
        <button
          type="button"
          class="w-full cursor-pointer"
          onclick={() => {
            recordPageView(projectId);
            updateGauge({
              _colors: colors,
              _schemeId: 'Custom',
            });
            if (close) close();
          }}
          title="Use This Palette"
        >
          <ColorPalette {colors} {schemeName} />
        </button>
      {/each}
    </div>
  {/if}

  {#if !galleryPalettesPopularState.projects.length && !loading}
    <p class="my-8 text-center">No Results</p>
  {/if}
</div>
