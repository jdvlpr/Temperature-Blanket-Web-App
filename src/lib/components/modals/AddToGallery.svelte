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
  import Spinner from '$lib/components/Spinner.svelte';
  import { locations, previews, project } from '$lib/state';
  import { sendToProjectGallery, svgToPNG } from '$lib/utils';
  import { ExternalLinkIcon } from '@lucide/svelte';
  import StickyPart from './StickyPart.svelte';

  let submitting = $state(false),
    message = $state();

  async function submit() {
    submitting = true;
    message = {
      text: "<p class='font-bold text-xl my-4 text-center'>Sending Project...</p><p class='italic'>This could take up to a few minutes. Please don't navigate away.</p>",
      icon: 'spinner',
    };
    const imgSrc = await svgToPNG({
      svgNode: previews.active.svg,
      width: previews.active.width,
      height: previews.active.height,
      download: false,
    });

    const img = new Image();
    img.onload = async () => {
      message = {
        text: await sendToProjectGallery(imgSrc),
        icon: 'none',
      };
      submitting = false;
    };

    img.src = imgSrc;

    document.getElementById('temporary-canvas')?.remove();
  }
</script>

<div class="p-2 text-center">
  {#if project.gallery.href && project.gallery.title && project.gallery.title === locations.projectTitle}
    <div class="card preset-filled-surface-100-900 mt-4 p-4 text-center">
      <p class="my-2">
        This project has a gallery page:
        <a
          href={project.gallery.href}
          target="_blank"
          class="link btn hover:preset-tonal-surface w-fit whitespace-pre-wrap"
          rel="noreferrer"><ExternalLinkIcon />{project.gallery.title}</a
        >
      </p>
    </div>
  {/if}
  <div class="grid max-w-(--breakpoint-sm) grid-cols-1 gap-4 sm:grid-cols-3">
    {#if !message}
      <div class="col-span-full flex flex-col gap-2 sm:col-span-2">
        <p class="text-left text-lg font-bold">
          Do you understand and agree to the following terms and conditions?
        </p>
        <div class="flex flex-col gap-2 text-left">
          <p>
            • I am submitting this project's location and dates, gauge and yarn
            information, URL, preview image, and the current date to be
            displayed as a gallery page in the public <a
              href="/gallery"
              target="_blank"
              class="link">Project Gallery</a
            >. No personal information will be sent.
          </p>
          <p>
            • This project's gallery page cannot be edited once it is submitted.
          </p>
          <p>
            • Submissions which appear to be spam or abuse of this service may
            be removed.
          </p>
          <p>• Gallery pages are subject to change.</p>
        </div>
      </div>
      <div
        class="bg-surface-50 dark:bg-surface-950 rounded-container pointer-events-none col-span-full m-auto mb-4 flex w-full max-w-[250px] flex-col gap-2 p-4 sm:col-span-1"
      >
        <span class="line-clamp-4 font-bold">{locations.projectTitle}</span>
        <previews.active.previewComponent />
      </div>
    {:else}
      <div
        class="col-span-full flex w-full flex-col items-center justify-center gap-4"
      >
        {#if message.icon === 'spinner'}
          <Spinner />
        {/if}

        <div class="my-2 flex flex-col items-center justify-center gap-2">
          {@html message.text}
        </div>
      </div>
    {/if}
  </div>
</div>

<StickyPart position="bottom">
  {#if !submitting && !message}
    <div
      class="flex flex-col items-center justify-center gap-2 p-2 py-4 text-center"
    >
      <p class="text-sm italic">This action can't be undone.</p>
      <button
        class="btn preset-filled-primary-500"
        title="Add project to gallery"
        onclick={submit}>Yes, Send to Gallery</button
      >
    </div>
  {/if}
</StickyPart>
