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

<!-- Beside Search for Weather, for a link without weather: while its gallery
pages are looked up, a note; then the weather of the one with its dates to
load (or, of several, a choice of them in GalleryWeather.svelte). It stays
until there's weather, so it's never lost by closing anything. -->
<script lang="ts">
  import { galleryWeatherOffer } from '#lib/state/gallery-weather-offer.svelte.js';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import { weatherSearch } from '#lib/state/weather-search.svelte.js';
  import { loadGalleryWeatherWithToast } from '#lib/utils/open-saved-project.js';
  import {
    CloudDownloadIcon,
    ExternalLinkIcon,
    LoaderCircleIcon,
  } from '@lucide/svelte';

  let loading = $state(false);

  const pages = $derived(
    weatherSearch.active ? [] : galleryWeatherOffer.fitting,
  );
  const page = $derived(pages.length === 1 ? pages[0] : null);

  const published = $derived(
    page?.date
      ? new Date(page.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '',
  );

  async function load(postId: number) {
    loading = true;
    await loadGalleryWeatherWithToast(postId);
    loading = false;
  }

  async function choose() {
    const { default: GalleryWeather } =
      await import('#lib/components/modals/GalleryWeather.svelte');
    dialog.trigger({
      type: 'component',
      component: { ref: GalleryWeather, props: { pages } },
      options: { title: 'Load Weather Data?', size: 'medium' },
    });
  }
</script>

<div aria-live="polite" class="contents">
  {#if galleryWeatherOffer.showChecking && !weatherSearch.active}
    <p
      class="text-surface-700-300 flex items-center justify-center gap-2 text-center text-sm"
    >
      <LoaderCircleIcon
        class="icon-sm shrink-0 animate-spin"
        aria-hidden="true"
      />
      Checking the gallery for this project's weather…
    </p>
  {:else if pages.length}
    <div
      class="flex flex-col items-center gap-2 text-center text-sm"
      data-testid="gallery-weather-offer"
    >
      <p>
        {#if page}
          This project has a gallery page with its weather{published
            ? `, published ${published}`
            : ''}.
        {:else}
          This project has {pages.length} gallery pages with its weather.
        {/if}
        Loading it saves searching every date.
      </p>
      <div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {#if page}
          <button
            type="button"
            class="btn preset-tonal"
            disabled={loading}
            onclick={() => load(page.postId)}
          >
            {#if loading}
              <LoaderCircleIcon class="animate-spin" />
            {:else}
              <CloudDownloadIcon />
            {/if}
            Load Weather
          </button>
          <a
            class="anchor inline-flex items-center gap-1"
            href={`/gallery/${page.postId}`}
            target="_blank"
            rel="noreferrer"
            >View gallery page <ExternalLinkIcon class="icon-sm" /><span
              class="sr-only">(opens in a new tab)</span
            ></a
          >
        {:else}
          <button type="button" class="btn preset-tonal" onclick={choose}>
            <CloudDownloadIcon /> Choose a Page…
          </button>
        {/if}
      </div>
    </div>
  {/if}
</div>
