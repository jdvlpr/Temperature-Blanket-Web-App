<!--
Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>.
-->

<!-- A link opened without weather whose project has gallery pages that kept
theirs (galleryPagesForLink): load one's, as opening a copy from it does, or
not now and search for every date. Each page as its gallery card shows it;
several are a choice (versions published before pages were updated in place,
or copies others published). Asked every time the link opens. -->

<script lang="ts">
  import GalleryCardByline from '#lib/components/GalleryCardByline.svelte';
  import { imageClasses } from '#lib/components/GalleryProjectCard.svelte';
  import DialogFooter from '#lib/components/modals/DialogFooter.svelte';
  import {
    BTN_PRIMARY,
    BTN_SECONDARY,
    CARD_BOX,
  } from '#lib/constants/class-constants.js';
  import { galleryOwners } from '#lib/state/gallery-owners.svelte.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import { weatherSearch } from '#lib/state/weather-search.svelte.js';
  import type { GalleryWeatherPage } from '#lib/utils/gallery-weather.js';
  import { loadGalleryPageWeather } from '#lib/utils/open-saved-project.js';
  import { getTitleTextFromLocationsMeta } from '#lib/utils/project-utils.svelte.js';
  import { decodeHtmlEntities } from '#lib/utils/string-utils.js';
  import { CloudDownloadIcon, LoaderCircleIcon } from '@lucide/svelte';

  let { pages }: { pages: GalleryWeatherPage[] } = $props();

  // svelte-ignore state_referenced_locally
  let chosen = $state(pages[0]?.postId);
  let loading = $state(false);
  const several = $derived(pages.length > 1);

  // "By <name>", for pages showing their owner
  // svelte-ignore state_referenced_locally
  galleryOwners.load(pages.map((page) => page.postId));

  // A search started meanwhile gets every date anyway
  $effect(() => {
    if (weatherSearch.active) dialog.close();
  });

  const nameOf = (page: GalleryWeatherPage) =>
    page.projectName
      ? decodeHtmlEntities(page.projectName)
      : getTitleTextFromLocationsMeta(page.locations);

  async function load() {
    if (chosen === undefined) return;
    loading = true;
    const loaded = await loadGalleryPageWeather(chosen);
    loading = false;
    dialog.close();
    if (!loaded)
      toast.trigger({
        message:
          'That gallery page’s weather couldn’t be loaded. Search for weather to get it.',
        category: 'warning',
      });
  }
</script>

{#snippet card(page: GalleryWeatherPage)}
  {#if page.image}
    <img src={page.image} alt="" class={imageClasses.list} />
  {/if}
  <span class="flex min-w-0 flex-col text-left">
    <span class="line-clamp-2 text-sm font-semibold break-words"
      >{nameOf(page)}</span
    >
    <GalleryCardByline
      date={page.date}
      author={galleryOwners.nameOf(page.postId)}
    />
  </span>
{/snippet}

<div class="flex flex-col gap-4 px-4 pt-2 text-left">
  {#if several}
    <fieldset class="flex flex-col gap-2" disabled={loading}>
      <legend class="mb-2"
        >This project has {pages.length} gallery pages with weather. Choose the one
        to load.</legend
      >
      {#each pages as page (page.postId)}
        <label
          class={[
            CARD_BOX,
            'has-checked:outline-primary-500 has-focus-visible:outline-primary-500 flex cursor-pointer items-center gap-3 outline-offset-2 has-checked:outline-2 has-focus-visible:outline-2',
          ]}
        >
          <input
            type="radio"
            class="radio shrink-0"
            name="gallery-weather-page"
            value={page.postId}
            bind:group={chosen}
          />
          {@render card(page)}
        </label>
      {/each}
    </fieldset>
  {:else if pages[0]}
    <p>This project has a gallery page with its weather.</p>
    <div class={[CARD_BOX, 'flex items-center gap-3']}>
      {@render card(pages[0])}
    </div>
  {/if}
  <p class="text-surface-700-300 text-sm">
    Not loading it means searching for the weather of every date.
  </p>
  <DialogFooter>
    <button
      type="button"
      class={BTN_SECONDARY}
      disabled={loading}
      onclick={() => dialog.close()}>Not Now</button
    >
    <button
      type="button"
      class={BTN_PRIMARY}
      disabled={loading || chosen === undefined}
      onclick={load}
    >
      {#if loading}
        <LoaderCircleIcon class="animate-spin" />
      {:else}
        <CloudDownloadIcon />
      {/if}
      Load Weather
    </button>
  </DialogFooter>
</div>
