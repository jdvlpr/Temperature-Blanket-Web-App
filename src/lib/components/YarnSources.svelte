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

<script lang="ts">
  import HelpIcon from '$lib/components/buttons/HelpIcon.svelte';
  import Expand from '$lib/components/Expand.svelte';
  import { ALL_YARN_WEIGHTS } from '$lib/constants';
  import { pluralize, stringToDate } from '$lib/utils';
  import { brands } from '$lib/yarns/brands';
  import { slide } from 'svelte/transition';

  interface Props {
    viewSources?: boolean;
  }

  let { viewSources = $bindable(false) }: Props = $props();
</script>

<div class="flex flex-wrap gap-2 justify-center my-4">
  <p class="text-sm">
    Real yarn colors will look different than what's on the screen. Any
    trademarked yarn or colorway details are owned by their respective
    companies. Results are not sponsored, but items purchased through some links
    (marked with a shopping bag icon next to the link) may earn the developer of
    this site a percentage of the sale at no additional cost to you. Requests
    for yarn to be included in these results can be made by anyone using <a
      href="/yarn-search-request"
      class="link">this request form.</a
    >
  </p>

  <Expand
    bind:isExpanded={viewSources}
    more="View Yarn Sources"
    less="Hide Yarn Sources"
  />

  {#if viewSources}
    <div
      transition:slide
      class="flex items-start flex-wrap gap-2 justify-start text-sm"
    >
      {#each brands as brand}
        {#each brand.yarns as yarn}
          {@const unavailable = yarn.colorways.some(
            (n) => !!n.source?.unavailable,
          )}
          {@const yarnWeightName = ALL_YARN_WEIGHTS.find(
            (n) => n.id === yarn.weightId,
          )?.name}
          <div
            class="flex text-left flex-1 basis-[270px] items-center flex-wrap gap-x-2"
          >
            <p class="font-bold w-full">
              {brand.name} - {yarn.name}
              {#if yarnWeightName}
                <span class="font-normal">
                  (<a
                    href="/blog/yarn-weights?highlight={yarnWeightName}"
                    class="link"
                    target="_blank"
                    title="See the yarn weights chart">{yarnWeightName}</a
                  >)
                </span>
              {/if}
              {#if unavailable}
                <span class="font-normal"
                  >[{pluralize('Link', yarn.colorways.length)} Unavailable]

                  <HelpIcon href="/documentation#link-unavailable" /></span
                >{/if}
            </p>

            <p>
              {#each yarn.colorways as { source, colors }}
                <a
                  href={source.href}
                  class="flex flex-wrap gap-2 justify-start items-center cursor-pointer"
                  class:cursor-not-allowed={source.unavailable}
                  class:pointer-events-none={source.unavailable}
                  class:link={!source.unavailable}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {colors.length}
                  colorways from {source.name}
                </a>
                accessed on {stringToDate(source.accessed).toLocaleDateString()}
                {#if source.unavailable}
                  (Unavailable from {stringToDate(
                    source.unavailable,
                  ).toLocaleDateString()})
                {/if}
              {/each}
            </p>
          </div>
        {/each}
      {/each}
    </div>
  {/if}
</div>
