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
  import AddToGallery from '$lib/components/modals/AddToGallery.svelte';
  import PreviewSelect from '$lib/components/previews/PreviewSelect.svelte';
  import WeatherDetails from '$lib/components/WeatherDetails.svelte';
  import { ICONS } from '$lib/constants';
  import {
    drawerState,
    gauges,
    locations,
    modal,
    previews,
    previewWeatherTargets,
    project,
    weather,
  } from '$lib/state';
  import { downloadPreviewPNG } from '$lib/utils';
  import { onMount, tick } from 'svelte';
  import { Drawer } from 'vaul-svelte';
  import { weatherDataUpdatedKey } from './WeatherTableView.svelte';
  import { DownloadIcon, SendIcon } from '@lucide/svelte';

  let refreshKey = $state(Date.now());
  onMount(() => {
    if (!previews.activeId) {
      previews.activeId = 'rows';
    }
  });

  $effect(() => {
    project.url.hash, weather.data, weatherDataUpdatedKey.value;
    tick().then(() => {
      // Update after variables have a chance to update.
      // Without the tick, sometimes it would not update the preview
      refreshKey = Date.now();
    });
  });
</script>

{#if previews.active && weather.data.length}
  <PreviewSelect />

  <div class="flex flex-col items-start justify-center gap-2">
    {#if gauges.activeGauge?.colors}
      {#key refreshKey}
        <div class="flex w-full flex-col items-center justify-center gap-4">
          <previews.active.previewComponent />

          <Drawer.Root bind:open={drawerState.weatherDetails}>
            <Drawer.Portal>
              <Drawer.Overlay class="fixed inset-0 z-40 bg-black/40" />

              <Drawer.Content
                class="bg-surface-50 dark:bg-surface-950 rounded-tl-container rounded-tr-container fixed right-0 bottom-0 left-0 z-50 mt-24 flex flex-col"
              >
                <div
                  class="rounded-tl-container rounded-tr-container overflow-auto pt-4"
                >
                  <div
                    class="bg-surface-950-50 mx-auto mb-4 h-1.5 w-12 shrink-0 rounded-full"
                  ></div>
                  <div class="mx-auto text-center">
                    <WeatherDetails
                      weatherTargets={previewWeatherTargets.value}
                    />
                  </div>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        </div>

        <div class="flex w-full flex-wrap items-end justify-center gap-4">
          <previews.active.settingsComponent />
        </div>

        <div
          class="rounded-container bg-surface-100 dark:bg-surface-900 mt-2 flex w-full flex-wrap justify-center gap-2 px-4 py-2 shadow-inner"
        >
          <button
            class="btn hover:preset-tonal"
            title="Download PNG"
            onclick={() => {
              downloadPreviewPNG(
                previews.active.width,
                previews.active.height,
                previews.active.svg,
              );
            }}
          >
            <DownloadIcon />
            Download Image (PNG)
          </button>

          <button
            class="btn preset-tonal-primary border-primary-500 h-auto items-center border text-left whitespace-pre-wrap"
            onclick={() =>
              modal.trigger({
                type: 'component',
                component: {
                  ref: AddToGallery,
                },
              })}
            title="Show Send to Gallery Dialog"
          >
            <SendIcon />
            Send to Project Gallery
          </button>

          {#if project.gallery.href && project.gallery.title && project.gallery.title === locations.projectTitle}
            <div class="flex w-full flex-col justify-center gap-1">
              <p>View this project's gallery page:</p>
              <p>
                <a
                  href={project.gallery.href}
                  target="_blank"
                  class="btn hover:preset-tonal w-fit whitespace-pre-wrap underline"
                  rel="noreferrer">{project.gallery.title}</a
                >
              </p>
            </div>
          {/if}
        </div>
      {/key}
    {/if}
  </div>
{/if}
