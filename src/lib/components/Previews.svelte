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
  import {
    preview,
    drawerState,
    locationsState,
    modal,
    previewWeatherTargets,
    projectGalleryLink,
    projectGalleryTitle,
  } from '$lib/state';
  import { downloadPreviewPNG } from '$lib/utils';
  import { Drawer } from 'vaul-svelte';
</script>

<PreviewSelect />

{#key preview.current.id}
  <div class="flex flex-col gap-2 justify-center items-start">
    <div class="flex w-full flex-col gap-4 justify-center items-center">
      <svelte:component this={preview.current.preview} />
      <Drawer.Root bind:open={drawerState.weatherDetails}>
        <Drawer.Portal>
          <Drawer.Overlay class="fixed inset-0 bg-black/40 z-40" />

          <Drawer.Content
            class="bg-surface-50-900-token text-token flex flex-col rounded-tl-container-token rounded-tr-container-token mt-24 fixed bottom-0 left-0 right-0 z-50"
          >
            <div
              class="pt-4 rounded-tl-container-token rounded-tr-container-token overflow-auto"
            >
              <div
                class="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full mb-4 bg-surface-900-50-token"
              ></div>
              <div class="mx-auto text-center">
                <WeatherDetails weatherTargets={previewWeatherTargets.value} />
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>

    <div class="flex w-full flex-wrap items-end justify-center gap-4">
      <svelte:component this={preview.current.settings} />
    </div>

    <div
      class="flex flex-wrap gap-2 justify-center my-2 lg:mb-4 px-4 py-2 shadow-inner rounded-container-token variant-soft-surface w-full"
    >
      <button
        class="btn bg-secondary-hover-token gap-1 text-token"
        title="Download PNG"
        on:click={() => {
          downloadPreviewPNG(
            preview.current.width,
            preview.current.height,
            preview.current.svg,
          );
        }}
        ><svg
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
            d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25"
          />
        </svg>
        Download Image (PNG)
      </button>

      <button
        class="btn variant-ghost-primary text-token gap-2 items-center"
        on:click={() =>
          modal.state.trigger({
            type: 'component',
            component: {
              ref: AddToGallery,
            },
          })}
        title="Show Send to Gallery Dialog"
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
        Send to Project Gallery
      </button>

      {#if projectGalleryLink.value && projectGalleryTitle.value && projectGalleryTitle.value === locationsState.projectTitle}
        <div class="flex flex-col gap-1 justify-center w-full">
          <p>View this project's gallery page:</p>
          <p>
            <a
              href={projectGalleryLink.value}
              target="_blank"
              class="underline btn bg-secondary-hover-token w-fit whitespace-pre-wrap"
              rel="noreferrer">{projectGalleryTitle.value}</a
            >
          </p>
        </div>
      {/if}
    </div>
  </div>
{/key}
