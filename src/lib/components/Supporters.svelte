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

<script>
  import { SUPPORTERS } from '$lib/constants';
  import { AwardIcon } from '@lucide/svelte';
  import { Avatar } from '@skeletonlabs/skeleton-svelte';
</script>

{#if SUPPORTERS}
  <!-- when there are more items, add these classes: sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-4 -->
  <div
    class="my-4 grid grid-cols-1 gap-4 rounded-none lg:grid-cols-2 2xl:grid-cols-3"
  >
    {#if SUPPORTERS?.gold?.length}
      <div class="relative flex items-center w-full col-span-full">
        <div class="grow border-t border-surface-300-700"></div>
        <div class="shrink mx-4 flex items-center gap-2">
          <AwardIcon />
          <div class="">
            <p class="">Gold Tier</p>
            <p class="text-xs">$6 per month</p>
          </div>
        </div>
        <div class="grow border-t border-surface-300-700"></div>
      </div>
      {#each SUPPORTERS?.gold as { name, href, linkText, imageSrc }}
        <div
          class="bg-surface-50 dark:bg-surface-950 px-2 py-4 rounded-container w-full flex flex-col justify-center"
        >
          <Avatar
            src={imageSrc}
            {name}
            size="size-24"
            rounded="rounded-[5px]"
            background="bg-none"
            classes="mx-auto shrink-0"
          />
          <div class="flex flex-col justify-center items-center">
            <h5 class="h5">
              {name}
            </h5>
            <a {href} target="_blank" class="link break-all">
              {linkText}
            </a>
          </div>
        </div>
      {/each}
    {/if}

    {#if SUPPORTERS?.silver?.length}
      <div class="relative flex items-center w-full col-span-full">
        <div class="grow border-t border-surface-300-700"></div>
        <div class="shrink mx-4 flex items-center gap-2">
          <AwardIcon />

          <div class="">
            <p class="">Silver Tier</p>
            <p class="text-xs">$4 per month</p>
          </div>
        </div>
        <div class="grow border-t border-surface-300-700"></div>
      </div>
      {#each SUPPORTERS.silver as { name, href, linkText }}
        <div
          class="h-fit bg-surface-50 dark:bg-surface-950 p-4 rounded-container flex flex-col items-center"
        >
          <h5 class="h5">{name}</h5>
          <a {href} target="_blank" class="link">{linkText}</a>
        </div>
      {/each}
    {/if}

    {#if SUPPORTERS?.bronze?.length}
      <div class="relative flex items-center w-full col-span-full">
        <div class="grow border-t border-surface-300-700"></div>
        <div class="shrink mx-4 flex items-center gap-2">
          <AwardIcon />

          <div class="">
            <p class="">Bronze Tier</p>
            <p class="text-xs">$2 per month</p>
          </div>
        </div>
        <div class="grow border-t border-surface-300-700"></div>
      </div>
      {#each SUPPORTERS?.bronze as { name }}
        <div
          class="h-fit bg-surface-50 dark:bg-surface-950 p-4 rounded-container flex flex-col items-center"
        >
          <h5 class="h5">{name}</h5>
        </div>
      {/each}
    {/if}
  </div>
{/if}
