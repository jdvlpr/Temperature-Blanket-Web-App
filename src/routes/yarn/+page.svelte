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

<script context="module" lang="ts">
  export let colors: Writable<Array<Color>> = writable([]);
</script>

<script lang="ts">
  import { browser, version } from '$app/environment';
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Card from '$lib/components/Card.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Gauge from '$lib/components/Gauge.svelte';
  import Share from '$lib/components/Share.svelte';
  import YarnSources from '$lib/components/YarnSources.svelte';
  import { layout } from '$lib/stores';
  import type { Color } from '$lib/types';
  import {
    colorsToCode,
    colorsToYarnDetails,
    setLocalStorageLayout,
    stringToColors,
    yarnDetailsToColors,
  } from '$lib/utils';
  import { onMount } from 'svelte';
  import { writable, type Writable } from 'svelte/store';

  let urlParams,
    schemeId = 'Custom';
  let isFinishedOnMount = false;
  onMount(() => {
    urlParams = new URLSearchParams(window.location.search);
    // Load URL
    if (urlParams?.has('s')) {
      $colors =
        stringToColors({
          string: urlParams.get('s'),
        }) || $colors;
    }
    if (urlParams?.has('f')) {
      let yarn = urlParams.get('f');

      $colors = yarnDetailsToColors({
        string: yarn,
        colors: $colors,
      });
    }

    if ($colors.length === 0) {
      $colors = [
        {
          hex: '#f43f5e',
        },
        {
          hex: '#d946ef',
        },
        {
          hex: '#8b5cf6',
        },
        {
          hex: '#3b82f6',
        },
        {
          hex: '#06b6d4',
        },
        {
          hex: '#10b981',
        },
        {
          hex: '#eab308',
        },
        {
          hex: '#f97316',
        },
      ];
    }

    isFinishedOnMount = true;
  });

  $: $layout, setLocalStorageLayout();

  // $: $colors, updateUrl();

  function getYarnFilterParams(colors) {
    const details = colorsToYarnDetails({ colors });
    if (!details) return '';
    return `&f=${details}`;
  }

  $: shareableURL = getShareableURL($colors);

  function getShareableURL(colors) {
    if (!browser || !isFinishedOnMount) return;
    const yarnFilterText = getYarnFilterParams(colors);
    const url = `${window.location.origin}${window.location.pathname}?s=${colorsToCode(
      colors,
      {
        includePrefixes: false,
      },
    )}${yarnFilterText}&v=${version}`;
    const href = new URL(url).href;
    return href;
  }
</script>

<svelte:head>
  <title>Yarn Palette Creator</title>
  <meta
    name="description"
    content="Create a yarn color palette from a collection of brands and yarns. Find matching colorways from HTML hex color codes or from an image."
  />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no"
  />
  <meta property="og:title" content="Yarn Palette Creator" />
  <meta
    property="og:description"
    content="Create a yarn color palette from a collection of brands and yarns. Find matching colorways from HTML hex color codes or from an image."
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/yarn" />
  <meta property="og:type" content="website" />
  <meta
    property="og:image"
    content="{PUBLIC_BASE_URL}/images/yarn-palette-creator-og-image-2.4.0.jpg"
  />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
</svelte:head>

<AppShell pageName="Yarn Palette Creator">
  <svelte:fragment slot="stickyHeader">
    <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
    <Share href={shareableURL} />
  </svelte:fragment>
  <div slot="main">
    <main class="max-w-screen-xl m-auto text-center">
      <Card>
        <div slot="header" class="bg-surface-200-700-token text-token p-4">
          <p class="text-center">
            Create a yarn color palette from a collection of brands and yarns.
            Find matching colorways from HTML hex color codes or from an image.
          </p>
        </div>
        <div
          class="transition-opacity opacity-100 mt-4"
          class:opacity-50={!isFinishedOnMount}
          slot="content"
        >
          {#if $colors.length}
            <Gauge
              bind:colors={$colors}
              bind:numberOfColors={$colors.length}
              bind:schemeId
              context="weatherless"
            />
          {:else}
            <Gauge
              colors={[
                {
                  hex: '#f9fafb',
                },
                {
                  hex: '#f3f4f6',
                },
                {
                  hex: '#e5e7eb',
                },
                {
                  hex: '#d1d5db',
                },
                {
                  hex: '#9ca3af',
                },
                {
                  hex: '#6b7280',
                },
                {
                  hex: '#4b5563',
                },
                {
                  hex: '#374151',
                },
              ]}
              numberOfColors={8}
              bind:schemeId
              context="weatherless"
            />
          {/if}
        </div>
      </Card>
    </main>
  </div>
  <div slot="footer">
    <Footer>
      <div slot="sources" class="text-sm">
        <p>
          Default color schemes based on <a
            href="https://www.ColorBrewer2.org"
            target="_blank"
            rel="noopener noreferrer"
            class="link">ColorBrewer2.org</a
          >
          by Cynthia A. Brewer, Geography, Pennsylvania State University, licenced
          under under
          <a
            href="https://www.apache.org/licenses/LICENSE-2.0"
            target="_blank"
            rel="noreferrer"
            class="link">Apache 2</a
          >.
        </p>
        <YarnSources />
      </div>
    </Footer>
  </div>
</AppShell>
