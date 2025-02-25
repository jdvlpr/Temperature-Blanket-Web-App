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
  <div class="flex flex-col gap-2 card p-2 bg-surface-100-900">
    <div class="flex flex-wrap gap-2 card">
      {#each notes as { icon, text, title, instructions }}
        <div class="card p-4 flex-auto bg-surface-50-950">
          <p class="text-base flex items-center gap-2 sm:gap-4">
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
                <span class="text-sm pt-2"
                  ><svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    class="w-4 h-4 align-text-top inline shrink-0"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M10.21 14.77a.75.75 0 01.02-1.06L14.168 10 10.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clip-rule="evenodd"
                    />
                    <path
                      fill-rule="evenodd"
                      d="M4.21 14.77a.75.75 0 01.02-1.06L8.168 10 4.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                      clip-rule="evenodd"
                    />
                  </svg>
                  <span>{@html instructions}</span>
                </span>
              {/if}
            </span>
          </p>
        </div>
      {/each}
    </div>
    {#if version}
      <p class="text-xs flex flex-wrap gap-2" id={version}>
        <span class="inline bg-tertiary-200-800 px-2 rounded">
          <span>Version {version}</span>
        </span>
      </p>
    {/if}
  </div>
</div>
