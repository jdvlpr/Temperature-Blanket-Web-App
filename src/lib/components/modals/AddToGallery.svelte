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
  import Spinner from '$lib/components/Spinner.svelte';
  import CloseButton from '$lib/components/modals/CloseButton.svelte';
  import {
    activePreview,
    projectGalleryLink,
    projectGalleryTitle,
    projectTitle,
  } from '$lib/stores';
  import { sendToProjectGallery, svgToPNG } from '$lib/utils';
  import { getContext } from 'svelte';
  import StickyPart from './StickyPart.svelte';

  const { close } = getContext('simple-modal');

  let submitting = false,
    message;

  async function submit() {
    submitting = true;
    message = {
      text: "<p class='font-bold text-xl my-4'>Sending Project...</p><p class='italic'>This could take up to a few minutes. Please don't navigate away.</p>",
      icon: 'spinner',
    };
    const imgSrc = await svgToPNG({
      svgNode: $activePreview.svg,
      width: $activePreview.width,
      height: $activePreview.height,
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

<CloseButton onClose={close} />

<div
  class="p-2 sm:p-4 mt-10 max-w-screen-sm grid grid-cols-1 sm:grid-cols-3 gap-4"
>
  {#if !message}
    <div class="flex flex-col gap-2 col-span-full sm:col-span-2">
      <p class="font-bold text-left text-lg">
        Do you understand and agree to the following terms and conditions?
      </p>
      <div class="text-left flex flex-col gap-2">
        <p>
          &#8226; I am submitting this project's location and dates, gauge and
          yarn information, URL, preview image, and the current date to be
          displayed on a public gallery page. No personal information will be
          sent.
        </p>
        <p>
          &#8226; This project's gallery page cannot be edited once it is
          submitted.
        </p>
        <p>
          &#8226; Submissions which appear to be spam or abuse of this service
          may be removed.
        </p>
        <p>&#8226; Gallery pages are subject to change.</p>
      </div>
    </div>
    <div
      class="w-full col-span-full sm:col-span-1 max-w-[250px] m-auto pointer-events-none flex flex-col gap-2 p-2 card mb-4"
    >
      <span class="font-bold line-clamp-4">{$projectTitle}</span>
      <svelte:component this={$activePreview.preview} />
    </div>
  {:else}
    <div
      class="flex flex-col gap-4 items-center justify-center w-full col-span-full"
    >
      {#if message.icon === 'spinner'}
        <Spinner />
      {/if}

      <div class="flex flex-col gap-2 justify-center items-center my-2">
        {@html message.text}
      </div>
    </div>
  {/if}
</div>
{#if $projectGalleryLink && $projectGalleryTitle && $projectGalleryTitle === $projectTitle}
  <p class="my-2">
    <a
      href={$projectGalleryLink}
      target="_blank"
      class="link btn bg-secondary-hover-token w-fit whitespace-pre-wrap"
      rel="noreferrer">{$projectGalleryTitle}</a
    >
  </p>
{/if}

<StickyPart position="bottom">
  {#if !submitting && !message}
    <div class="pb-2 pt-4">
      <button
        class="btn variant-filled-primary"
        title="Add project to gallery"
        on:click={submit}>Yes, Send to Gallery</button
      >
    </div>
  {/if}
</StickyPart>
