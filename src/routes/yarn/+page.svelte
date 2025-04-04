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
  import { browser, version } from '$app/environment';
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Card from '$lib/components/Card.svelte';
  import Footer from '$lib/components/Footer.svelte';
  import Gauge from '$lib/components/Gauge.svelte';
  import GaugeCustomizer from '$lib/components/GaugeCustomizer.svelte';
  import Share from '$lib/components/Share.svelte';
  import YarnSources from '$lib/components/YarnSources.svelte';
  import {
    colorsToCode,
    colorsToYarnDetails,
    stringToColors,
    yarnDetailsToColors,
  } from '$lib/utils';
  import { onMount } from 'svelte';
  import { yarnPageState } from './state.svelte';

  let urlParams,
    schemeId = $state('Custom');
  let isFinishedOnMount = $state(false);

  onMount(() => {
    urlParams = new URLSearchParams(window.location.search);
    // Load URL
    if (urlParams?.has('s')) {
      yarnPageState.gauge.colors =
        stringToColors({
          string: urlParams.get('s'),
        }) || yarnPageState.gauge.colors;
    }

    if (urlParams?.has('f')) {
      let _yarnString = urlParams.get('f');

      yarnPageState.gauge.colors = yarnDetailsToColors({
        string: _yarnString,
        colors: $state.snapshot(yarnPageState.gauge.colors),
      });
    }

    isFinishedOnMount = true;
  });

  function getYarnFilterParams(colors) {
    const details = colorsToYarnDetails({ colors });
    if (!details) return '';
    return `&f=${details}`;
  }

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

  let shareableURL = $derived(getShareableURL(yarnPageState.gauge.colors));
</script>

<svelte:head>
  <title>Yarn Palette Creator</title>
  <meta
    name="description"
    content="Create a yarn color palette from a collection of brands and yarns. Find matching colorways from HTML hex color codes or from an image."
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
    content="{PUBLIC_BASE_URL}/images/temperature-blanket-og-image-5.0.0.jpg"
  />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
</svelte:head>

<AppShell pageName="Yarn Palette Creator">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
    <Share href={shareableURL} />
  {/snippet}
  {#snippet main()}
    <div>
      <main class="max-w-(--breakpoint-xl) m-auto text-center">
        <Card>
          {#snippet header()}
            <div class="bg-surface-100 dark:bg-surface-900 p-4">
              <p class="text-center">
                Create a yarn color palette from a collection of brands and
                yarns. Find matching colorways from HTML hex color codes or from
                an image.
              </p>
            </div>
          {/snippet}
          {#snippet content()}
            <div class=" mt-4">
              <Gauge bind:gauge={yarnPageState.gauge} />

              {#key yarnPageState.gauge.colors}
                <GaugeCustomizer bind:gauge={yarnPageState.gauge} />
              {/key}
            </div>
          {/snippet}
        </Card>
      </main>
    </div>
  {/snippet}
  {#snippet footer()}
    <div>
      <Footer>
        {#snippet sources()}
          <div class="text-sm">
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
        {/snippet}
      </Footer>
    </div>
  {/snippet}
</AppShell>
