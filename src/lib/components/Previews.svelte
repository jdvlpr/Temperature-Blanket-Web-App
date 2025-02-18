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
  import { onMount } from 'svelte';
  import { Drawer } from 'vaul-svelte';

  onMount(() => {
    if (!previews.activeId) {
      previews.activeId = 'rows';
    }
  });
</script>

{#if previews.active && weather.data.length}
  <PreviewSelect />

  <div class="flex flex-col gap-2 justify-center items-start">
    {#if gauges.activeGauge?.colors}
      {#key [project.url.hash, weather.tableData]}
        <div class="flex w-full flex-col gap-4 justify-center items-center">
          <previews.active.previewComponent />

          <Drawer.Root bind:open={drawerState.weatherDetails}>
            <Drawer.Portal>
              <Drawer.Overlay class="fixed inset-0 bg-black/40 z-40" />

              <Drawer.Content
                class="bg-surface-50-950 flex flex-col rounded-tl-container rounded-tr-container mt-24 fixed bottom-0 left-0 right-0 z-50"
              >
                <div
                  class="pt-4 rounded-tl-container rounded-tr-container overflow-auto"
                >
                  <div
                    class="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full mb-4 bg-surface-950-50"
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
          class="flex flex-wrap gap-2 justify-center my-2 lg:mb-4 px-4 py-2 shadow-inner rounded-container bg-surface-100-900 w-full"
        >
          <button
            class="btn hover:preset-tonal gap-1"
            title="Download PNG"
            onclick={() => {
              downloadPreviewPNG(
                previews.active.width,
                previews.active.height,
                previews.active.svg,
              );
            }}
          >
            {@html ICONS.download}
            Download Image (PNG)
          </button>

          <button
            class="btn preset-tonal-primary border border-primary-500 gap-2 items-center"
            onclick={() =>
              modal.trigger({
                type: 'component',
                component: {
                  ref: AddToGallery,
                },
              })}
            title="Show Send to Gallery Dialog"
            disabled
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
              />
            </svg>
            Send to Project Gallery (disabled)
          </button>

          {#if project.gallery.href && project.gallery.title && project.gallery.title === locations.projectTitle}
            <div class="flex flex-col gap-1 justify-center w-full">
              <p>View this project's gallery page:</p>
              <p>
                <a
                  href={project.gallery.href}
                  target="_blank"
                  class="underline btn hover:preset-tonal w-fit whitespace-pre-wrap"
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
