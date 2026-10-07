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

<!-- Shares a saved palette to the Yarn Palette Gallery, from My Projects while
signed in. It goes live at once and is linked to the account. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import PaletteStrip from '$lib/components/PaletteStrip.svelte';
  import { getGalleryPages, sharePalette } from '$lib/accounts/gallery';
  import { account } from '$lib/accounts/summary.svelte';
  import ShowOwnerToggle from '$lib/components/account/ShowOwnerToggle.svelte';
  import { onMount } from 'svelte';
  import type { Color } from '$lib/types/yarn-types';
  import { getYarnPageURL } from '$lib/utils/color-utils';
  import { cleanName } from '$lib/utils/string-utils';
  import { CheckIcon, LoaderCircleIcon, Share2Icon } from '@lucide/svelte';

  // The gallery's limit (MAX_PALETTE_TITLE_LENGTH on the server)
  const MAX_NAME_LENGTH = 80;

  let {
    paletteId,
    colors,
    name: savedName,
  }: { paletteId: string; colors: Color[]; name: string } = $props();

  // svelte-ignore state_referenced_locally
  let name = $state(cleanName(savedName, MAX_NAME_LENGTH));
  let busy = $state(false);
  let shared = $state(false);
  // The palette's gallery page, once shared
  let postId = $state<number | null>(null);
  let errorMessage = $state('');
  // Include it on the account's public gallery, starting from the last choice
  let showOwner = $state(false);
  let serverName = $state<string | null>(null);
  let ownerName = $derived((serverName ?? account.summary?.name ?? '').trim());

  onMount(async () => {
    const gallery = await getGalleryPages();
    if (!gallery) return;
    showOwner = gallery.settings.showOwnerDefault;
    if (typeof gallery.name === 'string') serverName = gallery.name;
  });

  async function share(event: Event) {
    event.preventDefault();
    const title = cleanName(name, MAX_NAME_LENGTH);
    if (!title || busy) return;
    busy = true;
    errorMessage = '';
    const result = await sharePalette({
      paletteId,
      title,
      // Without the app version, so the same palette is the same link and
      // the gallery can tell it's already there
      yarnUrl: getYarnPageURL({ colors, origin: window.location.origin }),
      showOwner,
    });
    busy = false;
    if (result.status === 'shared') {
      shared = true;
      postId = result.postId;
    } else errorMessage = result.message;
  }
</script>

<div class="flex w-full max-w-(--breakpoint-sm) flex-col gap-4 p-4 text-left">
  <PaletteStrip {colors} />
  {#if shared}
    <div class="flex flex-col items-center gap-2 text-center" role="status">
      <CheckIcon class="text-success-700-300 size-8" />
      <p class="font-bold">Your palette is in the gallery</p>
      <p class="text-sm">
        You can remove it from My Projects, under My Public Gallery Pages.
      </p>
      {#if postId}
        <a
          href={resolve('/gallery/palette/[id]', { id: String(postId) })}
          target="_blank"
          class="link">View its gallery page</a
        >
      {/if}
      <a
        href="{resolve('/gallery')}?view=yarn-palettes"
        target="_blank"
        class="link">View the Yarn Palette Gallery</a
      >
    </div>
  {:else}
    <form class="flex flex-col gap-4" onsubmit={share}>
      <label class="label">
        <span class="label-text">Name</span>
        <input
          type="text"
          class="input"
          autocomplete="off"
          maxlength={MAX_NAME_LENGTH}
          required
          bind:value={name}
          disabled={busy}
        />
      </label>
      <ul class="flex list-inside list-disc flex-col gap-1 text-sm">
        <li>
          It goes live in the public Yarn Palette Gallery right away, with this
          name and its colors.
        </li>
        <li>
          It’s linked to your account, so you can remove it later from My
          Projects.
        </li>
        <li>Palettes that look like spam or abuse may be removed.</li>
      </ul>
      <ShowOwnerToggle
        kind="palette"
        bind:checked={showOwner}
        name={ownerName}
        disabled={busy}
      />
      {#if errorMessage}
        <p class="text-error-700-300" role="alert">{errorMessage}</p>
      {/if}
      <button
        type="submit"
        class="btn preset-filled-primary-500 w-full sm:w-fit"
        disabled={busy || !cleanName(name, MAX_NAME_LENGTH)}
      >
        {#if busy}<LoaderCircleIcon class="animate-spin" />{:else}<Share2Icon
          />{/if}
        Share Palette
      </button>
    </form>
  {/if}
</div>
