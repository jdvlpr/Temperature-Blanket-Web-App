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

<!-- Whether the account's gallery pages show its display name: on the Account
page, next to the name, as the one place to change it (My Projects and the
gallery dialog link here). Hidden until the account has a gallery page or
publishing from accounts is on. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import {
    getGalleryPages,
    updateGallerySettings,
  } from '$lib/accounts/gallery';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import { ExternalLinkIcon, UserRoundIcon } from '@lucide/svelte';
  import { onMount } from 'svelte';

  let {
    name,
  }: { /** The account's display name, as edited above */ name: string } =
    $props();

  let loaded = $state(false);
  let showName = $state(false);
  let publicId = $state<string | null>(null);
  let errorMessage = $state('');
  let hasName = $derived(Boolean(name.trim()));

  onMount(async () => {
    const gallery = await getGalleryPages();
    if (!gallery || (!gallery.publishing && !gallery.posts.length)) return;
    showName = gallery.settings.showName;
    publicId = gallery.settings.publicId;
    loaded = true;
  });

  async function save() {
    errorMessage = '';
    try {
      const settings = await updateGallerySettings({ showName });
      showName = settings.showName;
      publicId = settings.publicId;
    } catch {
      showName = !showName;
      errorMessage = 'That setting couldn’t be saved. Try again.';
    }
  }
</script>

{#if loaded}
  <div>
    <ToggleSwitch
      bare
      label="Show my name on my gallery pages"
      details="Projects you add to the public gallery will say “By” and your display name, linking to a public page that lists all of them. When this is off, they don’t show your name."
      bind:checked={showName}
      onchange={save}
    />
    {#if showName && !hasName}
      <p class="text-warning-700-300 px-4 pb-3 text-sm">
        Add a display name above to show it.
      </p>
    {/if}
    {#if errorMessage}
      <p class="text-error-700-300 px-4 pb-3" role="alert">{errorMessage}</p>
    {/if}
  </div>
  {#if showName && hasName && publicId}
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
  {/if}
{/if}
