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

<!-- A YouTube video that loads only when someone chooses to play it, so
visiting a page sends nothing to YouTube (see the Privacy Policy). -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import { PlayIcon } from '@lucide/svelte';

  let {
    id,
    start = 0,
    title = 'YouTube video',
  }: { id: string; start?: number; title?: string } = $props();

  let playing = $state(false);

  const src = $derived(
    `https://www.youtube-nocookie.com/embed/${id}?autoplay=1${start ? `&start=${start}` : ''}`,
  );
</script>

<div class="rounded-container aspect-video w-full overflow-hidden">
  {#if playing}
    <iframe
      {src}
      {title}
      width="560"
      height="315"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerpolicy="strict-origin-when-cross-origin"
      allowfullscreen
      class="h-full w-full border-0"
    ></iframe>
  {:else}
    <div
      class="bg-surface-200-800 flex h-full w-full flex-col items-center justify-center gap-3 p-4 text-center"
    >
      <button
        type="button"
        class="btn preset-filled-primary-500"
        onclick={() => (playing = true)}
      >
        <PlayIcon />
        Play video
      </button>
      <p class="max-w-sm text-sm opacity-80">
        The video plays from YouTube, which receives your IP address. See the
        <a href={resolve('/privacy')} class="link">Privacy Policy</a>.
      </p>
    </div>
  {/if}
</div>
