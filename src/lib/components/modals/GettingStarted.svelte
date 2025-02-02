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
  import CloseButton from '$lib/components/modals/CloseButton.svelte';
  import { Step, Stepper } from '@skeletonlabs/skeleton';
  import { getContext, hasContext, onMount } from 'svelte';

  let close = null;
  if (hasContext('simple-modal')) close = getContext('simple-modal')?.close;

  let container: HTMLDivElement;
  onMount(() => container.focus());
</script>

{#if close}
  <CloseButton onClose={close} />
{/if}

<div
  bind:this={container}
  class="px-2 pb-6 sm:px-10 text-left max-w-screen-lg {close
    ? 'pt-16'
    : 'pt-4'}"
>
  <Stepper
    stepTerm=""
    buttonCompleteLabel="Lets Go!"
    on:complete={() => {
      if (close) close();
    }}
  >
    <Step>
      <svelte:fragment slot="header">
        <div class="w-full flex flex-col items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="size-12"
            viewBox="0 0 24 24"
            ><path
              fill="currentColor"
              d="M20 11h3v2h-3zM1 11h3v2H1zM13 1v3h-2V1zM4.92 3.5l2.13 2.14l-1.42 1.41L3.5 4.93zm12.03 2.13l2.12-2.13l1.43 1.43l-2.13 2.12zM12 6a6 6 0 0 1 6 6c0 2.22-1.21 4.16-3 5.2V19a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-1.8c-1.79-1.04-3-2.98-3-5.2a6 6 0 0 1 6-6m2 15v1a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-1zm-3-3h2v-2.13c1.73-.44 3-2.01 3-3.87a4 4 0 0 0-4-4a4 4 0 0 0-4 4c0 1.86 1.27 3.43 3 3.87z"
            /></svg
          >
          <p>Welcome!</p>
        </div>
      </svelte:fragment>

      <p class="">
        This Project Planner tool helps crocheters, knitters, and craftspeople
        to visualize designs inspired by the weather.
      </p>
    </Step>

    <Step>
      <svelte:fragment slot="header">
        <div class="w-full flex flex-col items-center">
          <p>Navigation</p>
        </div>
      </svelte:fragment>
      <div class="flex flex-col gap-4">
        <p>
          Use the buttons at the bottom of the page to navigate between the four
          main sections of the Project Planner.
        </p>
        <video
          class="w-full h-full md:hidden"
          autoplay
          webkit-playsinline
          playsinline
          loop
        >
          <source
            src="/images/get-started-tutorial/navigation-buttons.mp4"
            type="video/mp4"
          />
          <track kind="captions" />
          Your browser does not support the video tag.
        </video>
        <video
          class="w-full h-full max-md:hidden"
          autoplay
          webkit-playsinline
          playsinline
          loop
        >
          <source
            src="/images/get-started-tutorial/navigation-buttons-lg.mp4"
            type="video/mp4"
          />
          <track kind="captions" />
          Your browser does not support the video tag.
        </video>
      </div>
    </Step>

    <Step>
      <svelte:fragment slot="header">
        <div class="w-full flex flex-col items-center">
          <p>Yarn Colorways</p>
        </div>
      </svelte:fragment>

      <p class="">
        Create a palette for your project by picking from thousands of yarn
        colorways, getting colors from an image, or browsing the gallery for
        inspiration.
      </p>
      <div
        class="relative flex gap-6 snap-x snap-mandatory overflow-x-auto pt-2 pb-6 md:hidden"
        data-vaul-no-drag
      >
        <img
          src="/images/get-started-tutorial/Simulator Screenshot - iPhone 15 Pro - 2024-04-13 at 06.01.09 Medium.png"
          alt="Colors"
          class="max-h-[40svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Simulator Screenshot - iPhone 15 Pro - 2024-04-13 at 06.02.51 Medium.png"
          alt="Colors"
          class="max-h-[40svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Simulator Screenshot - iPhone 15 Pro - 2024-04-13 at 06.03.52 Medium.png"
          alt="Colors"
          class="max-h-[40svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Simulator Screenshot - iPhone 15 Pro - 2024-04-13 at 06.08.38 Medium.png"
          alt="Colors"
          class="max-h-[40svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Simulator Screenshot - iPhone 15 Pro - 2024-04-13 at 06.07.26 Medium.png"
          alt="Colors"
          class="max-h-[40svh] snap-start rounded-3xl shadow-lg"
        />
      </div>
      <div
        class="relative flex gap-6 snap-x snap-mandatory overflow-x-auto pt-2 pb-6 max-md:hidden"
        data-vaul-no-drag
      >
        <img
          src="/images/get-started-tutorial/Weather History Visualization for Crochet and Knitting Projects _ Temperature Bl · 06.21 · 04-13 Large Medium.jpeg"
          alt="Colors"
          class="max-h-[27svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Weather History Visualization for Crochet and Knitting Projects _ Temperature Bl · 06.25 · 04-13 Medium.jpeg"
          alt="Colors"
          class="max-h-[27svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Weather History Visualization for Crochet and Knitting Projects _ Temperature Bl · 06.27 · 04-13 Medium.jpeg"
          alt="Colors"
          class="max-h-[27svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Weather History Visualization for Crochet and Knitting Projects _ Temperature Bl · 06.29 · 04-13 Medium.jpeg"
          alt="Colors"
          class="max-h-[27svh] snap-start rounded-3xl shadow-lg"
        />
      </div>
    </Step>
    <Step>
      <svelte:fragment slot="header">
        <div class="w-full flex flex-col items-center">
          <p>Preview Your Project</p>
        </div>
      </svelte:fragment>

      <p class="">
        Customizations will be reflected in the live visualization, which you
        can use to make sure you like your project before you begin.
      </p>
      <div
        class="relative flex gap-6 snap-x snap-mandatory overflow-x-auto pt-2 pb-6 md:hidden"
        data-vaul-no-drag
      >
        <img
          src="/images/get-started-tutorial/Simulator Screenshot - iPhone 15 Pro - 2024-04-13 at 06.10.55 Medium.png"
          alt="Preview"
          class="max-h-[40svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Simulator Screenshot - iPhone 15 Pro - 2024-04-13 at 06.11.31 Medium.png"
          alt="Preview"
          class="max-h-[40svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Simulator Screenshot - iPhone 15 Pro - 2024-04-13 at 06.12.07 Medium.png"
          alt="Preview"
          class="max-h-[40svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Simulator Screenshot - iPhone 15 Pro - 2024-04-13 at 06.12.54 Medium.png"
          alt="Preview"
          class="max-h-[40svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Simulator Screenshot - iPhone 15 Pro - 2024-04-13 at 06.16.03 Medium.png"
          alt="Preview"
          class="max-h-[40svh] snap-start rounded-3xl shadow-lg"
        />
      </div>
      <div
        class="relative flex gap-6 snap-x snap-mandatory overflow-x-auto pt-2 pb-6 max-md:hidden"
        data-vaul-no-drag
      >
        <img
          src="/images/get-started-tutorial/Weather History Visualization for Crochet and Knitting Projects _ Temperature Bl · 06.31 · 04-13 Medium.jpeg"
          alt="Preview"
          class="max-h-[27svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Temperature-Blanket-Preview-Austin, Texas, United States-from-2023-01-01-to-2023-12-31 Medium.png"
          alt="Preview"
          class="max-h-[27svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Weather History Visualization for Crochet and Knitting Projects _ Temperature Bl · 06.35 · 04-13 Medium.jpeg"
          alt="Preview"
          class="max-h-[27svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Weather History Visualization for Crochet and Knitting Projects _ Temperature Bl · 06.37 · 04-13 Medium.jpeg"
          alt="Preview"
          class="max-h-[27svh] snap-start rounded-3xl shadow-lg"
        />
      </div>
    </Step>

    <Step>
      <svelte:fragment slot="header">
        <div class="w-full flex flex-col items-center">
          <p>Get Started and Explore!</p>
        </div>
      </svelte:fragment>
      <p>
        Start planning your project and discover many more features like
        downloading, saving, or sharing your project.
      </p>
      <div
        class="relative flex gap-6 snap-x snap-mandatory overflow-x-auto pt-2 pb-6 md:hidden"
        data-vaul-no-drag
      >
        <img
          src="/images/get-started-tutorial/Simulator Screenshot - iPhone 15 Pro - 2024-04-13 at 07.32.03 Medium.png"
          alt="Save"
          class="max-h-[40svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Simulator Screenshot - iPhone 15 Pro - 2024-04-13 at 07.33.15 Medium.png"
          alt="Download"
          class="max-h-[40svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Simulator Screenshot - iPhone 15 Pro - 2024-04-13 at 07.33.57 Medium.png"
          alt="Share"
          class="max-h-[40svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Simulator Screenshot - iPhone 15 Pro - 2024-04-13 at 07.37.23 Medium.png"
          alt="Import/Export"
          class="max-h-[40svh] snap-start rounded-3xl shadow-lg"
        />
      </div>
      <div
        class="relative flex gap-6 snap-x snap-mandatory overflow-x-auto pt-2 pb-6 max-md:hidden"
        data-vaul-no-drag
      >
        <img
          src="/images/get-started-tutorial/Screenshot 2024-04-13 at 07.25.04 Medium.jpeg"
          alt="Save"
          class="max-h-[27svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Screenshot 2024-04-13 at 07.27.20 Medium.jpeg"
          alt="Download"
          class="max-h-[27svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Screenshot 2024-04-13 at 07.29.27 Medium.jpeg"
          alt="Share"
          class="max-h-[27svh] snap-start rounded-3xl shadow-lg"
        />
        <img
          src="/images/get-started-tutorial/Weather History Visualization for Crochet and Knitting Projects _ Temperature Bl · 07.36 · 04-13 Medium.jpeg"
          alt="Import/Export"
          class="max-h-[27svh] snap-start rounded-3xl shadow-lg"
        />
      </div>
    </Step>
  </Stepper>
</div>
