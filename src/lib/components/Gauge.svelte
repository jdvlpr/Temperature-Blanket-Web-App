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
  import ColorPaletteEditable from '$lib/components/ColorPaletteEditable.svelte';
  import GaugeCustomizer from '$lib/components/GaugeCustomizer.svelte';
  import SelectNumberOfColors from '$lib/components/SelectNumberOfColors.svelte';
  import RangeOptionsButton from '$lib/components/buttons/RangeOptionsButton.svelte';
  import BrowsePalettes from '$lib/components/modals/BrowsePalettes.svelte';
  import ChooseColorways from '$lib/components/modals/ChooseColorways.svelte';
  import GetPaletteFromImage from '$lib/components/modals/GetPaletteFromImage.svelte';
  import ImportExportPalette from '$lib/components/modals/ImportExportPalette.svelte';
  import RandomPalette from '$lib/components/modals/RandomPalette.svelte';
  import SortPalette from '$lib/components/modals/SortPalette.svelte';
  import {
    drawerState,
    gauges,
    isDesktop,
    modal,
    pageSections,
    pinAllSections,
  } from '$lib/state';
  import type { Color, GaugeSettingsType } from '$lib/types';
  import { createGaugeColors } from '$lib/utils';
  import {
    focusTrap,
    getModalStore,
    getToastStore,
  } from '@skeletonlabs/skeleton';
  import { Drawer } from 'vaul-svelte';

  const modalStore = getModalStore();

  const toastStore = getToastStore();

  function updateGauge({
    _colors,
    _schemeId = 'Custom',
  }: {
    _colors: Color[];
    _schemeId?: GaugeSettingsType['schemeId'];
  }) {
    if (_colors) {
      gauges.activeGauge.updateColors({ colors: _colors });
    }

    gauges.activeGauge.schemeId = _schemeId;

    drawerState.closeAll();
    if ($modalStore[0]) modalStore.close();
  }

  let fullscreen = $state(false);

  let gaugeContainerElement = $state();

  $effect(() => {
    if (fullscreen) {
      gaugeContainerElement.style.zIndex = '40';
      document.body.style.overflow = 'hidden';
    } else {
      gaugeContainerElement.style.zIndex = '';
      document.body.style.overflow = '';
    }
  });
</script>

<svelte:window
  onkeydown={(e) => {
    if (
      e.target.tagName === 'INPUT' ||
      e.target.tagName === 'TD' ||
      e.target.tagName === 'SELECT' ||
      e.target.tagName === 'BUTTON' ||
      $modalStore[0]
    )
      return;
    if (e.key === 'f') {
      if (
        !pageSections.items.find((p) => p.id === 'page-section-gauges')
          ?.active &&
        !pinAllSections.value
      )
        return;
      fullscreen = !fullscreen;
    } else if (e.key === 'Escape') {
      fullscreen = false;
    }
  }}
/>

{#if gauges.activeGaugeId !== 'temp'}
  <!-- If this is not the default temperature gauge and we're on the project planner page -->
  <button
    class="btn bg-secondary-hover-token justify-start gap-1 top-2 relative max-sm:mb-2"
    title="Delete {gauges.activeGauge.label}"
    onclick={() => {
      gauges.remove(gauges.activeGauge.id);
    }}
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="w-6 h-6 mr-1"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
    Delete {gauges.activeGauge.label}
  </button>
{/if}

<div
  class="w-full flex flex-col justify-center items-center bg-surface-300-600-token text-token {fullscreen
    ? 'fixed w-full h-full left-0 top-0 bg-surface-50-900-token overflow-scroll'
    : 'shadow-inner mt-2 pb-2 gap-2 rounded-container-token'}"
  bind:this={gaugeContainerElement}
  use:focusTrap={fullscreen}
>
  <div class="w-full {fullscreen ? 'flex-auto w-full h-fullf' : ''}">
    {#key gauges.activeGauge.colors}
      <ColorPaletteEditable
        bind:fullscreen
        bind:colors={gauges.activeGauge.colors}
        schemeName={gauges.activeGauge.schemeId}
        showSchemeName={false}
        roundedBottom={false}
      />
    {/key}
  </div>

  <div
    class="flex flex-wrap justify-center items-center gap-2 {fullscreen
      ? 'p-2'
      : ''}"
  >
    <div class="">
      <SelectNumberOfColors
        hideText={fullscreen}
        numberOfColors={gauges.activeGauge.colors.length}
        onchange={(e) => {
          const colors = createGaugeColors({
            schemeId: gauges.activeGauge.schemeId,
            numberOfColors: +e.target.value,
            colors: $state.snapshot(gauges.activeGauge.colors),
          });
          gauges.activeGauge.updateColors({ colors });
        }}
      />
    </div>

    {#if isDesktop.current}
      <button
        class="btn bg-secondary-hover-token justify-start"
        title="Browse Preset & User-Created Color Palettes"
        onclick={() =>
          modal.state.trigger({
            type: 'component',
            component: {
              ref: BrowsePalettes,
              props: {
                numberOfColors: gauges.activeGauge.numberOfColors,
                schemeId: gauges.activeGauge.schemeId,
                updateGauge,
              },
            },
          })}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6 mr-1"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"
          />
        </svg>
        {#if !fullscreen}
          Browse Palettes
        {/if}
      </button>
    {/if}

    {#if !isDesktop.current}
      <Drawer.Root bind:open={drawerState.browsePalettes}>
        <Drawer.Trigger on:click={() => (drawerState.browsePalettes = true)}>
          <button
            class="btn bg-secondary-hover-token justify-start"
            title="Browse Preset & User-Created Color Palettes"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="w-6 h-6 mr-1"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"
              />
            </svg>
            {#if !fullscreen}
              Browse Palettes
            {/if}
          </button>
        </Drawer.Trigger>
        <Drawer.Portal>
          <Drawer.Overlay class="fixed inset-0 bg-black/40 z-40" />

          <Drawer.Content
            class="h-[90svh] bg-surface-200-700-token text-token flex flex-col rounded-tl-container-token rounded-tr-container-token mt-24 fixed bottom-0 left-0 right-0 z-50"
          >
            <div
              class="pt-4 rounded-tl-container-token rounded-tr-container-token overflow-auto"
            >
              <div
                class="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full mb-4 bg-surface-900-50-token"
              ></div>
              <div class="mx-auto text-center">
                <BrowsePalettes
                  numberOfColors={gauges.activeGauge.numberOfColors}
                  schemeId={gauges.activeGauge.schemeId}
                  {updateGauge}
                  context="drawer"
                />
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    {/if}

    <button
      class="btn bg-secondary-hover-token justify-start"
      title="Choose Yarn Colorways, Filtered by Brand and Yarn"
      onclick={() =>
        modal.state.trigger({
          type: 'component',
          component: {
            ref: ChooseColorways,
            props: {
              updateGauge,
            },
          },
        })}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6 mr-1"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
      {#if !fullscreen}
        Choose Colorways
      {/if}
    </button>

    <button
      class="btn bg-secondary-hover-token justify-start"
      title="Get Palette from Image"
      onclick={() =>
        modal.state.trigger({
          type: 'component',
          component: {
            ref: GetPaletteFromImage,
            props: {
              numberOfColors: gauges.activeGauge.numberOfColors,
              updateGauge,
            },
          },
        })}
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6 mr-1"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        />
      </svg>
      {#if !fullscreen}
        Image Palette
      {/if}</button
    >

    <button
      class="btn bg-secondary-hover-token justify-start"
      title="Load Colors or Get a Palette Code to Share"
      onclick={() =>
        modal.state.trigger({
          type: 'component',
          component: {
            ref: ImportExportPalette,
            props: {
              colors: $state.snapshot(gauges.activeGauge.colors),
              updateGauge,
            },
          },
        })}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6 mr-1"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
        />
      </svg>
      {#if !fullscreen}
        Import/Export
      {/if}
    </button>

    <button
      class="btn bg-secondary-hover-token justify-start"
      title="Generate Random Colors"
      onclick={() =>
        modal.state.trigger({
          type: 'component',
          component: {
            ref: RandomPalette,
            props: {
              numberOfColors: gauges.activeGauge.numberOfColors,
              updateGauge,
            },
          },
        })}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6 mr-1"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      </svg>
      {#if !fullscreen}
        Random
      {/if}
    </button>

    <button
      class="btn bg-secondary-hover-token justify-start"
      title="Sort Colors"
      onclick={() =>
        modal.state.trigger({
          type: 'component',
          component: {
            ref: SortPalette,
            props: {
              colors: $state.snapshot(gauges.activeGauge.colors),
              updateGauge,
            },
          },
        })}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6 mr-1"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5"
        />
      </svg>
      {#if !fullscreen}
        Sort
      {/if}
    </button>

    <button
      aria-label="Fullscreen"
      class="btn bg-secondary-hover-token flex gap-1 justify-start items-center"
      onclick={() => (fullscreen = !fullscreen)}
    >
      {#if !fullscreen}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
          />
        </svg>
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25"
          />
        </svg>
      {/if}
      {#if fullscreen}
        Exit
      {/if}
      Fullscreen
    </button>
  </div>
</div>

<div class="mt-2 mb-4">
  <RangeOptionsButton />
</div>

{#key gauges.activeGauge.colors}
  <GaugeCustomizer />
{/key}
