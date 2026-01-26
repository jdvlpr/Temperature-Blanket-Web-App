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
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import { pluralize, stringToDate } from '$lib/utils';
  import { brands } from '$lib/data/yarns/brands';
  import { ShoppingCartIcon } from '@lucide/svelte';

  interface Props {
    viewSources?: boolean;
  }

  let { viewSources = $bindable(false) }: Props = $props();
</script>

<div class="my-4 flex flex-wrap justify-center gap-2">
  <p class="text-sm">
    Real yarn colors will look different than what's on the screen. Any
    trademarked yarn or colorway details are owned by their respective
    companies. Purchases via links with a shopping cart icon <ShoppingCartIcon
      class="relative -top-px inline size-4"
    /> support the developer of this web app at no extra cost to you. Requests for
    yarn to be included in these results can be made by anyone using
    <a href="/yarn-search-request" class="link">this request form.</a>
  </p>

  <Expand bind:isExpanded={viewSources} label="Yarn Sources" />

  {#if viewSources}
    <div
      transition:safeSlide
      class="flex flex-wrap items-start justify-start gap-2 text-sm"
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
            class="flex flex-1 basis-[270px] flex-wrap items-center gap-x-2 text-left"
          >
            <p class="w-full font-bold">
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
                  class="flex cursor-pointer flex-wrap items-center justify-start gap-2"
                  class:cursor-not-allowed={source.unavailable}
                  class:pointer-events-none={source.unavailable}
                  class:link={!source.unavailable}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {colors.length}
                  colorways from {source.name}
                </a>
                accessed on {stringToDate(source.accessed).toLocaleDateString(
                  undefined,
                  {
                    timeZone: 'UTC',
                  },
                )}
                {#if source.unavailable}
                  (Unavailable from {stringToDate(
                    source.unavailable,
                  ).toLocaleDateString(undefined, {
                    timeZone: 'UTC',
                  })})
                {/if}
              {/each}
            </p>
          </div>
        {/each}
      {/each}
    </div>
  {/if}
</div>
