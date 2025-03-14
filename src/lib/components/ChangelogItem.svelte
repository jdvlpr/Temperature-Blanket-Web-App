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
  import { ChevronsRightIcon } from '@lucide/svelte';

  interface Props {
    date?: any;
    version?: any;
    notes: any;
  }

  let { date = null, version = null, notes }: Props = $props();
</script>

<div class="flex flex-col gap-2">
  <div>
    {#if date}
      <h2 class="h2 text-gradient">{date}</h2>
    {/if}
  </div>
  <div class="card bg-surface-100 dark:bg-surface-900 flex flex-col gap-2 p-2">
    <div class="card flex flex-wrap gap-2">
      {#each notes as { icon, text, title, instructions }}
        <div class="card bg-surface-50 dark:bg-surface-950 flex-auto p-4">
          <p class="flex items-center gap-2 text-base sm:gap-4">
            {#if icon}
              <span class="shrink-0">{@html icon}</span>
            {/if}

            <span class="flex flex-col">
              {#if title}
                <span class="font-bold">{title}</span>
              {/if}
              {#if text}
                <span>{@html text}</span>
              {/if}
              {#if instructions}
                <span class="pt-2 text-sm">
                  <ChevronsRightIcon
                    class="relative -top-[1px] inline size-4"
                  />
                  <span>{@html instructions}</span>
                </span>
              {/if}
            </span>
          </p>
        </div>
      {/each}
    </div>
    {#if version}
      <p class="flex flex-wrap gap-2 text-xs" id={version}>
        <span class="bg-tertiary-100 dark:bg-tertiary-900 inline rounded px-2">
          <span>Version {version}</span>
        </span>
      </p>
    {/if}
  </div>
</div>
