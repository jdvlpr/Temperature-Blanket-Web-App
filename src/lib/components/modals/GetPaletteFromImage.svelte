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
  import DefaultYarnSet from '$lib/components/DefaultYarnSet.svelte';
  import SelectNumberOfColors from '$lib/components/SelectNumberOfColors.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import SelectYarnWeight from '$lib/components/SelectYarnWeight.svelte';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import { MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES } from '$lib/constants/color-constants';
  import ImagePaletteCanvas from '$lib/features/image-palette/ImagePaletteCanvas.svelte';
  import ImagePaletteSelected from '$lib/features/image-palette/ImagePaletteSelected.svelte';
  import ImagePaletteSwatches from '$lib/features/image-palette/ImagePaletteSwatches.svelte';
  import { ImagePaletteState } from '$lib/features/image-palette/image-palette-state.svelte';
  import {
    PALETTE_STYLES,
    type PaletteStyle,
  } from '$lib/features/image-palette/select';
  import { dialog } from '$lib/state/page-state.svelte';
  import type { GaugeSettingsType } from '$lib/types/gauge-types';
  import type { Color } from '$lib/types/yarn-types';
  import {
    ArrowLeftRightIcon,
    CameraIcon,
    PlusIcon,
    RefreshCcwIcon,
    SplineIcon,
    Trash2Icon,
    WandSparklesIcon,
    XIcon,
  } from '@lucide/svelte';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
  import { onMount, untrack } from 'svelte';

  interface Props {
    updateGauge: (params: {
      _colors: Color[];
      _schemeId?: GaugeSettingsType['schemeId'];
    }) => void;
    numberOfColors: number;
    /** Put the warm end of a gradient first (a high-to-low gauge) */
    warmFirst?: boolean;
  }

  let { updateGauge, numberOfColors, warmFirst = true }: Props = $props();

  const palette = untrack(
    () => new ImagePaletteState({ numberOfColors, warmFirst }),
  );

  let input: HTMLInputElement | undefined = $state();
  let draggingFile = $state(false);

  const STYLE_LABELS: Record<PaletteStyle, string> = {
    balanced: 'Balanced',
    vivid: 'Vivid',
    muted: 'Muted',
    light: 'Light',
    dark: 'Dark',
  };

  onMount(() => {
    palette.init();
    return () => palette.destroy();
  });

  function onYarnFilterChange() {
    palette.setYarnFilter({
      brandId: palette.selectedBrandId,
      yarnId: palette.selectedYarnId,
      yarnWeightId: palette.selectedYarnWeightId,
    });
  }

  function onPaste(e: ClipboardEvent) {
    const file = Array.from(e.clipboardData?.files ?? []).find((n) =>
      n.type.startsWith('image/'),
    );
    if (!file) return;
    e.preventDefault();
    palette.loadFile(file);
  }
</script>

<!-- Stop the browser opening a dropped image that misses the drop area -->
<svelte:window
  onpaste={onPaste}
  ondragover={(e) => {
    if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
  }}
  ondrop={(e) => {
    if (e.dataTransfer?.types.includes('Files')) e.preventDefault();
  }}
/>

<div
  class={[
    'rounded-container flex flex-col gap-3 p-2',
    draggingFile && 'outline-primary-500 outline-2 outline-dashed',
  ]}
  role="region"
  aria-label="Get colors from an image"
  ondragover={(e) => {
    if (!e.dataTransfer?.types.includes('Files')) return;
    e.preventDefault();
    draggingFile = true;
  }}
  ondragleave={(e) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node))
      draggingFile = false;
  }}
  ondrop={(e) => {
    if (!e.dataTransfer?.files.length) return;
    e.preventDefault();
    draggingFile = false;
    palette.loadFile(e.dataTransfer.files[0]);
  }}
>
  <div class="flex flex-wrap justify-center gap-2">
    <input
      type="file"
      accept="image/*"
      hidden
      bind:this={input}
      onchange={(e) => {
        const target = e.currentTarget;
        palette.loadFile(target.files?.[0]);
        // Allow choosing the same file again
        target.value = '';
      }}
    />
    <button
      class="btn hover:preset-tonal-surface"
      onclick={() => palette.randomImage()}
    >
      <RefreshCcwIcon />
      Random Image
    </button>
    <button
      class="btn hover:preset-tonal-surface"
      onclick={() => input?.click()}
    >
      <CameraIcon />
      Choose Image
    </button>
  </div>

  {#if palette.errorMessage}
    <p class="text-error-700-300 text-center" role="alert">
      {palette.errorMessage}
    </p>
  {/if}

  <div class="flex flex-wrap items-center justify-center gap-2">
    <SegmentedControl
      value={palette.mode}
      onValueChange={(e) => {
        if (e.value === 'yarn' || e.value === 'exact') palette.setMode(e.value);
      }}
    >
      <SegmentedControl.Control class="bg-surface-100 dark:bg-surface-900">
        <SegmentedControl.Indicator />
        <SegmentedControl.Item value="yarn">
          <SegmentedControl.ItemText>Match to Yarn</SegmentedControl.ItemText>
          <SegmentedControl.ItemHiddenInput />
        </SegmentedControl.Item>
        <SegmentedControl.Item value="exact">
          <SegmentedControl.ItemText>Exact Colors</SegmentedControl.ItemText>
          <SegmentedControl.ItemHiddenInput />
        </SegmentedControl.Item>
      </SegmentedControl.Control>
    </SegmentedControl>
  </div>

  {#if palette.yarnReady && palette.mode === 'yarn'}
    <div class="grid w-full grid-cols-12 items-end justify-center gap-4">
      <div
        class="order-1 col-span-full w-full md:col-span-9"
        class:md:col-span-full={!!palette.selectedBrandId &&
          !!palette.selectedYarnId}
      >
        <SelectYarn
          context="modal"
          bind:selectedBrandId={palette.selectedBrandId}
          bind:selectedYarnId={palette.selectedYarnId}
          onselectautocomplete={onYarnFilterChange}
          selectedYarnWeightId={palette.selectedYarnWeightId}
        />
      </div>

      {#if palette.selectedBrandId && palette.selectedYarnId}
        <div class="order-2 col-span-full w-full md:order-3">
          <DefaultYarnSet
            selectedBrandId={palette.selectedBrandId}
            selectedYarnId={palette.selectedYarnId}
          />
        </div>
      {/if}

      {#key palette.selectedBrandId}
        <div
          class="order-3 col-span-full w-full md:order-2 md:col-span-3"
          class:hidden={!!palette.selectedBrandId && !!palette.selectedYarnId}
        >
          <SelectYarnWeight
            selectedBrandId={palette.selectedBrandId}
            bind:selectedYarnWeightId={palette.selectedYarnWeightId}
            onchange={onYarnFilterChange}
          />
        </div>
      {/key}
    </div>
  {/if}

  <div class="flex flex-wrap items-center justify-center gap-2">
    <SegmentedControl
      value={palette.style}
      onValueChange={(e) => {
        const style = e.value as PaletteStyle;
        if (PALETTE_STYLES.includes(style)) palette.setStyle(style);
      }}
    >
      <SegmentedControl.Control
        class="bg-surface-100 dark:bg-surface-900 flex-wrap"
      >
        <SegmentedControl.Indicator />
        {#each PALETTE_STYLES as style (style)}
          <SegmentedControl.Item value={style}>
            <SegmentedControl.ItemText
              >{STYLE_LABELS[style]}</SegmentedControl.ItemText
            >
            <SegmentedControl.ItemHiddenInput />
          </SegmentedControl.Item>
        {/each}
      </SegmentedControl.Control>
    </SegmentedControl>
    <button
      class="btn preset-filled-primary-500"
      disabled={!palette.hasImage || palette.loading || palette.working}
      onclick={() => palette.autoPalette()}
    >
      <WandSparklesIcon />
      Auto Palette
    </button>
  </div>

  <div class="flex flex-wrap items-center justify-center gap-2">
    <SegmentedControl
      value={palette.tool}
      onValueChange={(e) => {
        if (e.value === 'points' || e.value === 'line') palette.tool = e.value;
      }}
    >
      <SegmentedControl.Control class="bg-surface-100 dark:bg-surface-900">
        <SegmentedControl.Indicator />
        <SegmentedControl.Item value="points">
          <SegmentedControl.ItemText class="flex items-center gap-1"
            ><PlusIcon class="size-4" /> Pick Colors</SegmentedControl.ItemText
          >
          <SegmentedControl.ItemHiddenInput />
        </SegmentedControl.Item>
        <SegmentedControl.Item value="line">
          <SegmentedControl.ItemText class="flex items-center gap-1"
            ><SplineIcon class="size-4" /> Draw a Line</SegmentedControl.ItemText
          >
          <SegmentedControl.ItemHiddenInput />
        </SegmentedControl.Item>
      </SegmentedControl.Control>
    </SegmentedControl>

    {#key palette.points.length}
      <SelectNumberOfColors
        numberOfColors={palette.points.length}
        max={MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES}
        allowZero={true}
        onchange={(e) => {
          palette.setCount(parseInt((e.target as HTMLSelectElement).value));
        }}
      />
    {/key}
  </div>

  <p class="text-surface-700-300 text-center text-sm">
    {#if palette.tool === 'line'}
      Drag across the photo, like along a sunset or a shoreline, to get colors
      evenly spaced along the line, in order.
    {:else}
      Click or tap the photo to add a color, and drag markers to adjust them.
      You can also drop or paste an image here.
    {/if}
  </p>

  <ImagePaletteCanvas {palette} />

  {#if palette.warningMessage}
    <div class="text-warning-900-100 flex items-center justify-center gap-2">
      <p>{palette.warningMessage}</p>
      <button
        class="btn-icon hover:preset-tonal-surface"
        aria-label="Dismiss"
        onclick={() => (palette.warningMessage = null)}
      >
        <XIcon />
      </button>
    </div>
  {/if}
  {#if palette.infoMessage}
    <p class="text-center text-sm">{palette.infoMessage}</p>
  {/if}

  <div class="mx-auto w-full max-w-md">
    <ToggleSwitch
      label="Show the photo in these colors"
      checked={palette.showYarnPreview}
      disabled={!palette.hasImage}
      onchange={(e) =>
        palette.setYarnPreview((e.target as HTMLInputElement).checked)}
    />
  </div>

  <ImagePaletteSelected {palette} />

  <p class="text-surface-700-300 text-center text-sm">
    Random photos from <a
      href="https://unsplash.com"
      class="link"
      target="_blank"
      rel="nofollow noreferrer">Unsplash</a
    >
    via
    <a
      href="https://picsum.photos"
      class="link"
      target="_blank"
      rel="nofollow noreferrer">Lorem Picsum</a
    >. All images are processed on your device.
  </p>
</div>
<StickyPart position="bottom">
  <div class="flex flex-col gap-2 p-2">
    {#if palette.points.length && !palette.loading}
      <div class="flex flex-wrap items-center justify-center gap-1">
        <button
          class="btn btn-sm hover:preset-tonal-surface"
          title="Order the colors so each flows into the next"
          onclick={() => palette.sortAsGradient()}
        >
          <SplineIcon />
          Sort as Gradient
        </button>
        <button
          class="btn btn-sm hover:preset-tonal-surface"
          onclick={() => palette.reverse()}
        >
          <ArrowLeftRightIcon />
          Reverse
        </button>
        <button
          class="btn btn-sm hover:preset-tonal-surface"
          title="Remove all unlocked colors"
          onclick={() => palette.clear()}
        >
          <Trash2Icon />
          Clear
        </button>
      </div>
      <ImagePaletteSwatches {palette} />
    {/if}
    <SaveAndCloseButtons
      disabled={!palette.hasImage || palette.loading || !palette.points.length}
      onSave={() => {
        updateGauge({ _colors: palette.toColors() });
        dialog.close();
      }}
      onClose={dialog.close}
    />
  </div>
</StickyPart>
