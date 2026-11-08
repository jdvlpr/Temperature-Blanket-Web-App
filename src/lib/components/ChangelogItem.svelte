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

<script lang="ts">
  import { ChevronsRightIcon } from '@lucide/svelte';
  import {
    CHANGELOG_TAGS,
    changelogHref,
  } from '#lib/constants/changelog-tags.js';
  import type { ChangelogItemNote } from '#lib/types/page-types.js';

  interface Props {
    version?: string | null;
    notes: ChangelogItemNote[];
  }

  let { version = null, notes }: Props = $props();
</script>

<!-- One bordered card; its notes are borderless tiles inside it, with corners
that follow the card's (its radius less its padding) -->
<div
  class="card bg-surface-100 dark:bg-surface-900 flex scroll-mt-24 flex-col gap-2 p-4"
  id={version}
>
  <div class="flex flex-wrap gap-2 text-xs">
    {#if version}
      <div
        class="bg-tertiary-100 dark:bg-tertiary-900 rounded-base inline-flex items-center gap-2 px-2.5 py-0.5"
      >
        <p class="">Version {version}</p>
      </div>
    {/if}
  </div>
  <div class="flex flex-wrap gap-2">
    {#each notes as { icon, text, title, instructions, IconComponent, tag }, i (i)}
      {@const chip = CHANGELOG_TAGS.find((t) => t.tag === tag)?.chip}
      <div
        class="bg-surface-50 dark:bg-surface-950 flex-auto rounded-[max(0px,calc(var(--radius-container)-var(--spacing)*4))] p-4"
      >
        <p class="flex items-center gap-2 text-base sm:gap-4">
          {#if icon}
            <span class="shrink-0">
              <!-- eslint-disable-next-line svelte/no-at-html-tags -- the site's own markup, from changelog.ts -->
              {@html icon}
            </span>
          {:else if IconComponent}
            <span class="shrink-0"><IconComponent /></span>
          {/if}

          <span class="flex flex-col">
            <span class="flex flex-wrap items-center gap-x-2 gap-y-1">
              {#if title}
                <span class="flex items-center gap-2 font-bold">
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -- the site's own markup, from changelog.ts -->
                  {@html title}
                </span>
              {/if}
              {#if chip}
                <!-- Shows only this kind of change -->
                <a
                  href={changelogHref(tag)}
                  class="badge preset-filled-surface-100-900 hover:preset-filled-surface-200-800 text-xs"
                  >{chip}</a
                >
              {/if}
            </span>
            {#if text}
              <span>
                <!-- eslint-disable-next-line svelte/no-at-html-tags -- the site's own markup, from changelog.ts -->
                {@html text}
              </span>
            {/if}
            {#if instructions}
              <span class="pt-2 text-sm">
                <ChevronsRightIcon class="icon-sm relative -top-[1px] inline" />
                <span>
                  <!-- eslint-disable-next-line svelte/no-at-html-tags -- the site's own markup, from changelog.ts -->
                  {@html instructions}
                </span>
              </span>
            {/if}
          </span>
        </p>
      </div>
    {/each}
  </div>
</div>
