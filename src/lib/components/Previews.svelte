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

<script lang="ts">
  import PreviewSelect from '$lib/components/previews/PreviewSelect.svelte';
  import { gauges } from '$lib/state/gauges-state.svelte';
  import { previews } from '$lib/state/preview-state.svelte';
  import { project } from '$lib/state/project-state.svelte';
  import { weather } from '$lib/state/weather-state.svelte';
  import { motion } from '$lib/utils/feedback.svelte';
  import { downloadPreviewPNG } from '$lib/utils/preview-utils.svelte';
  import { exists } from '$lib/utils/other-utils';
  import { getProjectParametersFromURLHash } from '$lib/utils/project-utils.svelte';
  import { ImageIcon } from '@lucide/svelte';
  import { onMount, untrack } from 'svelte';
  import SendToGalleryButton from './buttons/SendToGalleryButton.svelte';

  function initDefaultPreview() {
    if (previews.activeId) return;

    // If this is a saved/shared project whose URL hash names a preview,
    // don't default to Rows here — loadProjectFromURL's restore path will
    // load and activate the right one. Racing both loads could let whichever
    // dynamic import resolves last win, clobbering the real preview.
    const params = getProjectParametersFromURLHash(
      window.location.hash.substring(1),
    );
    const hasPreviewParam = previews.all.some((p) => exists(params[p.id]));
    if (project.onLoaded.isProject && hasPreviewParam) return;

    previews.load('rows');
  }

  onMount(() => {
    initDefaultPreview();
  });

  // When weather data first arrives (a new location, dates, or project), the
  // preview fills in from the top, like rows being stitched. Not on edits.
  let knitting = $state(false);
  let hadWeather = false;
  let knitTimer: ReturnType<typeof setTimeout>;
  $effect(() => {
    const hasWeather = weather.rawData.length > 0;
    if (hasWeather && !hadWeather && !untrack(() => motion.reduced)) {
      knitting = true;
      clearTimeout(knitTimer);
      // Long enough for a slower preview to finish drawing and still knit in
      knitTimer = setTimeout(() => (knitting = false), 1500);
    }
    hadWeather = hasWeather;
  });
</script>

<div
  class={[
    'preset-tonal-surface card mt-4 p-2 md:p-4 md:shadow-lg',
    knitting && 'preview-knit',
  ]}
>
  <PreviewSelect />

  <div class="flex flex-col items-start justify-center gap-2">
    {#if gauges.activeGauge?.colors && previews.active?.settingsComponent}
      {#key previews.active}
        <div class="flex w-full flex-wrap items-start justify-center gap-4">
          <previews.active.settingsComponent />
        </div>
      {/key}

      <div
        class="rounded-container bg-surface-100 dark:bg-surface-900 mt-2 flex w-full flex-wrap justify-center gap-2 px-4 py-2 shadow-inner"
      >
        <button
          class="btn hover:preset-tonal-surface"
          title="Download the preview image (PNG)"
          onclick={() => {
            const active = previews.active;
            if (!active?.width || !active?.height || !active?.svg) return;
            downloadPreviewPNG(active.width, active.height, active.svg);
          }}
        >
          <ImageIcon />
          Download PNG
        </button>

        <!-- Links to the gallery page instead once it's sent -->
        <SendToGalleryButton isPrimary={true} />
      </div>
    {/if}
  </div>
</div>
