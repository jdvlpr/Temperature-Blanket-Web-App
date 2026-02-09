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
  import { PUBLIC_KOFI_LINK } from '$env/static/public';
  import { SUPPORTERS } from '$lib/constants';
  import { AwardIcon } from '@lucide/svelte';
  import { Avatar } from '@skeletonlabs/skeleton-svelte';
</script>

{#if SUPPORTERS}
  <!-- when there are more items, add these classes: sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-4 -->
  <div
    class="my-4 flex flex-col items-center gap-4"
  >
    {#if SUPPORTERS?.gold?.length}
      <div class="grid grid-cols-1 gap-4 rounded-none md:grid-cols-2 w-full">
      {#each SUPPORTERS?.gold as { name, href, linkText, imageSrc, date }}
        {@const monthAndYear = new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' })}
        <div
          class="bg-surface-50 dark:bg-surface-950 rounded-container flex w-full flex-col justify-center px-2 py-4"
        >
          <Avatar class="mx-auto size-24 shrink-0 rounded-[5px] bg-transparent">
            <Avatar.Image src={imageSrc} alt="Jane Doe" {name} />
            <Avatar.Fallback>{name}</Avatar.Fallback>
          </Avatar>
          <div class="flex flex-col items-center justify-center">
            <h5 class="h5">
              {name}
            </h5>
            <p class="text-xs text-surface-500 mb-1"><AwardIcon class="text-yellow-500 size-4 inline"/> <a href="{PUBLIC_KOFI_LINK}/tiers" class="anchor" target="_blank">Gold Supporter</a> since {monthAndYear}</p>
            <a {href} target="_blank" class="anchor break-all">
              {linkText}
            </a>
          </div>
        </div>
      {/each}
      </div>
    {/if}

    {#if SUPPORTERS?.silver?.length}
      <div class="grid grid-cols-1 gap-4 rounded-none md:grid-cols-2 w-full">
      {#each SUPPORTERS.silver as { name, href, linkText, date }}
        {@const monthAndYear = new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' })}

        <div
          class="bg-surface-50 dark:bg-surface-950 rounded-container flex h-fit flex-col items-center p-4"
        >
          <h5 class="h5">{name}</h5>
          <p class="text-xs text-surface-500"><AwardIcon class="text-slate-500 size-4 inline"/> <a href="{PUBLIC_KOFI_LINK}/tiers" class="anchor" target="_blank">Silver Supporter</a> since {monthAndYear}</p>
          <a {href} target="_blank" class="anchor">{linkText}</a>
        </div>
      {/each}
      </div>
    {/if}

    {#if SUPPORTERS?.bronze?.length}
      <div class="grid grid-cols-1 gap-4 rounded-none md:grid-cols-2 w-full">
      {#each SUPPORTERS?.bronze as { name, date }}
        {@const monthAndYear = new Date(date).toLocaleString('default', { month: 'long', year: 'numeric' })}
        <div
          class="bg-surface-50 dark:bg-surface-950 rounded-container flex h-fit flex-col items-center p-4"
        >
          <h5 class="h5">{name}</h5>
          <p class="text-xs text-surface-500"><AwardIcon class="text-yellow-700 size-4 inline"/> <a href="{PUBLIC_KOFI_LINK}/tiers" class="anchor" target="_blank">Bronze Supporter</a> since {monthAndYear}</p>
        </div>
      {/each}
      </div>
    {/if}
  </div>
{/if}
