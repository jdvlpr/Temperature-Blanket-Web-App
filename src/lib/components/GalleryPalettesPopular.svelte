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
  export let projects = writable([]);
  export let gallery = writable({});
  export let months = writable(0.25);
</script>

<script>
  import ColorPalette from '$lib/components/ColorPalette.svelte';
  import PlaceholderPalettes from '$lib/components/PlaceholderPalettes.svelte';
  import { gaugeProperties } from '$lib/stores';
  import {
    fetchPopularProjects,
    getColorsFromInput,
    getProjectParametersFromURLHash,
    getTitleFromLocationsMeta,
    pluralize,
    recordPageView,
  } from '$lib/utils';
  import { getContext, onMount } from 'svelte';
  import { writable } from 'svelte/store';

  let close = null;
  if (typeof getContext === 'function')
    close = getContext('simple-modal')?.close;

  export let updateGauge;

  let palettes = [];
  let loading = true;

  onMount(async () => {
    if (!$projects.length) {
      loading = true;
      let results = await fetchPopularProjects({
        months: $months,
      });
      $projects = results;
      loading = false;
    } else loading = false;
  });

  $: palettes = getPalettesFromPopularProjects($projects);

  function getPalettesFromPopularProjects(projects) {
    let _palettes = [];
    // {#each $popularProjects as { title, date, featured_image_src, id }}
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
          }" target="_blank" rel="noreferrer" class="underline line-clamp-1" title="Open Project Preview Page" onclick="event.stopPropagation()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="size-4 inline">
  <path fill-rule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clip-rule="evenodd" />
  <path fill-rule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clip-rule="evenodd" />
</svg>
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

<div
  class="text-center flex flex-wrap justify-center items-end bg-surface-100-800-token pb-4 gap-2"
>
  <label class="label text-sm">
    <span>Popular during the past</span>
    <select
      class="select truncate w-fit"
      id="select-time-period"
      bind:value={$months}
      on:change={async () => {
        loading = true;
        $projects = [];
        let results = await fetchPopularProjects({
          months: $months,
        });

        $projects = results;

        loading = false;
        if (document.getElementsByClassName('content'))
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
  class="flex flex-col items-center scroll-mt-[58px] lg:scroll-mt-[44px] px-2"
>
  {#if loading}
    <div class="my-1"></div>
    <PlaceholderPalettes items={20} maxWFull={true} />
  {:else}
    <div class="gap-4 my-2 flex flex-col items-start justify-start w-full">
      {#each palettes as { colors, schemeName, projectId }}
        <button
          type="button"
          class="cursor-pointer w-full"
          on:click={() => {
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

  {#if !$projects.length && !loading}
    <p class="text-center my-8">No Results</p>
  {/if}
</div>
