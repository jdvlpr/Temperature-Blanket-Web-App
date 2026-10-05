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

<!-- On the Account page, next to the display name: the link to the owner's
public gallery page, once they've included a project or palette on it (that's
chosen for each one, when adding it and in My Projects). Hidden otherwise. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import { getGalleryPages } from '$lib/accounts/gallery';
  import { ExternalLinkIcon, UserRoundIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let {
    name,
  }: { /** The account's display name, as edited above */ name: string } =
    $props();

  let publicId = $state<string | null>(null);
  let included = $state(0);
  let hasName = $derived(Boolean(name.trim()));

  onMount(async () => {
    const gallery = await getGalleryPages();
    if (!gallery) return;
    included = gallery.posts.filter((post) => post.showOwner).length;
    publicId = gallery.settings.publicId;
  });
</script>

{#if included && publicId}
  {#if hasName}
    <a
      href={resolve('/gallery/by/[ownerId]', { ownerId: publicId })}
      target="_blank"
      class="hover:bg-surface-100-900 flex min-h-12 w-full items-center gap-3 px-4 py-3 transition-colors"
      data-testid="gallery-owner-page"
    >
      <UserRoundIcon class="shrink-0 opacity-70" />
      <span class="flex-1">Your public gallery page</span>
      <ExternalLinkIcon class="size-4 shrink-0 opacity-50" />
    </a>
  {:else}
    <p class="text-warning-700-300 px-4 py-3 text-sm">
      Add a display name above to show it on your public gallery page and on
      the projects and palettes you included there.
    </p>
  {/if}
{/if}
