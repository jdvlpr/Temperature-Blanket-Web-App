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
  import ColorPaletteEditable from '$lib/components/ColorPaletteEditable.svelte';
  import DefaultYarnSet from '$lib/components/DefaultYarnSet.svelte';
  import SelectNumberOfColors from '$lib/components/SelectNumberOfColors.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import { MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES } from '$lib/constants/color-constants';
  import { ensureYarnData } from '$lib/data/yarns/colorways.svelte';
  import { defaultYarn, dialog } from '$lib/state/page-state.svelte';
  import {
    getColorways,
    stringToBrandAndYarnDetails,
  } from '$lib/utils/yarn-utils';
  import { getTextColor } from '$lib/utils/color-utils';
  import {
    colorwayKey,
    findClosestColorway,
    indexColorways,
    matchUniqueColorways,
    sampleAverageHex,
    type ColorwayIndex,
    type MatchedColor,
  } from '$lib/utils/image-palette-utils';
  import {
    CameraIcon,
    RefreshCcwIcon,
    Trash2Icon,
    WandSparklesIcon,
    XIcon,
  } from '@lucide/svelte';
  import chroma from 'chroma-js';
  import type ColorThiefType from 'getimagepalette';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import SelectYarnWeight from '../SelectYarnWeight.svelte';
  import type { Color } from '$lib/types/yarn-types';
  import type { GaugeSettingsType } from '$lib/types/gauge-types';

  interface Props {
    updateGauge: (params: {
      _colors: Color[];
      _schemeId?: GaugeSettingsType['schemeId'];
    }) => void;
    numberOfColors: number;
  }

  let { updateGauge, numberOfColors }: Props = $props();

  // Large photos are drawn at most this many pixels wide or tall. Phone photos
  // can be 12-48 megapixels, which is slow to sample and wastes memory.
  const MAX_IMAGE_DIMENSION = 1200;

  let ColorThief: typeof ColorThiefType | undefined;
  // Pixels of the drawn image, read once per image so picking a color doesn't
  // need to read back from the canvas
  let pixels: ImageData | undefined;
  // A copy of the image for the palette extractor, which ignores near-white
  // pixels, so those are nudged just under its cutoff to keep whites in play
  let paletteSource:
    | (HTMLCanvasElement & { naturalWidth: number; naturalHeight: number })
    | undefined;
  let colorwayIndex: ColorwayIndex = [];
  let loadId = 0;
  let hoverFrame = 0;
  let lastPointer: { clientX: number; clientY: number } | null = null;

  let canvas: HTMLCanvasElement | undefined = $state();
  let canvasWrap: HTMLDivElement | undefined = $state();
  let input: HTMLInputElement | undefined = $state();
  let hasImage = $state(false);
  let loading = $state(true);
  let yarnReady = $state(false);
  let draggingFile = $state(false);
  let matchingYarnColors: MatchedColor[] = $state([]);
  let cursorColor: MatchedColor = $state({});
  let coords = $state({ x: 0, y: 0 });
  let showCursor = $state(false);
  let cursorInside = $state(false);
  let popCursor = $state(false);
  let selectedBrandId: string | undefined = $state();
  let selectedYarnId: string | undefined = $state();
  let selectedYarnWeightId: string | undefined = $state();
  let key = $state(false);
  let numberOfColorsKey = $state(false);
  let warningMessage = $state<string | null>(null);
  let errorMessage = $state<string | null>(null);
  let infoMessage = $state<string | null>(null);

  onMount(async () => {
    if (numberOfColors > MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES)
      numberOfColors = MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES;
    if (numberOfColors < 2) numberOfColors = 2;

    await ensureYarnData();
    if (defaultYarn.value) {
      const details = stringToBrandAndYarnDetails(defaultYarn.value);
      selectedBrandId = details.brandId ?? undefined;
      selectedYarnId = details.yarnId ?? undefined;
    }
    updateColorways();
    yarnReady = true;

    ColorThief = (await import('getimagepalette')).default;

    await getRandomImage();
  });

  function updateColorways() {
    colorwayIndex = indexColorways(
      getColorways({ selectedBrandId, selectedYarnId, selectedYarnWeightId }),
    );
  }

  function setColors(colors: MatchedColor[]) {
    matchingYarnColors = colors;
    numberOfColors = colors.length;
    key = !key;
  }

  async function loadImage(src: string, failMessage: string) {
    const id = ++loadId;
    loading = true;
    errorMessage = null;
    infoMessage = null;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = src;
    try {
      await image.decode();
    } catch {
      if (id !== loadId) return;
      // Keep showing the previous image, if there was one
      errorMessage = failMessage;
      loading = false;
      return;
    }
    // A newer image was requested while this one loaded
    if (id !== loadId) return;
    drawImage(image);
    loading = false;
    autoPalette({ count: numberOfColors });
  }

  function drawImage(image: HTMLImageElement) {
    if (!canvas) return;
    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(image, 0, 0, width, height);
    pixels = ctx.getImageData(0, 0, width, height);

    const data = new Uint8ClampedArray(pixels.data);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 250 && data[i + 1] > 250 && data[i + 2] > 250) {
        data[i] = data[i + 1] = data[i + 2] = 250;
      }
    }
    const source = document.createElement('canvas');
    source.width = width;
    source.height = height;
    source
      .getContext('2d')
      ?.putImageData(new ImageData(data, width, height), 0, 0);
    paletteSource = Object.assign(source, {
      naturalWidth: width,
      naturalHeight: height,
    });

    hasImage = true;
  }

  async function loadFile(file: File | undefined) {
    if (!file) return;
    const isHeic =
      /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);
    if (!file.type.startsWith('image/') && !isHeic) {
      errorMessage = "That file isn't an image. Try a JPG, PNG, or WebP file.";
      return;
    }
    const url = URL.createObjectURL(file);
    await loadImage(
      url,
      isHeic
        ? "This browser can't open HEIC photos. Try a JPG or PNG, or a screenshot of the photo."
        : "Couldn't open that image. Try a JPG, PNG, or WebP file.",
    );
    URL.revokeObjectURL(url);
  }

  function getRandomImage() {
    return loadImage(
      `https://picsum.photos/720/480?random=${Date.now()}`,
      "Couldn't load a random image. Check your connection and try again.",
    );
  }

  /** Colors in the image, most common first */
  function getImageHexes(count: number): string[] {
    if (!ColorThief || !paletteSource) return [];
    const palette = new ColorThief().getPalette(
      paletteSource,
      Math.min(Math.max(count, 2), MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES),
    );
    return palette?.map(([r, g, b]) => chroma(r, g, b).hex()) ?? [];
  }

  /** Replace unlocked colors with the image's most common colors */
  function autoPalette({ count }: { count: number }) {
    if (!hasImage) return;
    if (!colorwayIndex.length) {
      warningMessage = 'No colorways match the selected yarn.';
      return;
    }
    count = Math.max(
      count,
      matchingYarnColors.findLastIndex((color) => color.locked) + 1,
    );
    const locked = matchingYarnColors
      .slice(0, count)
      .map((color) => (color.locked ? color : null));
    const lockedColors = locked.filter((color) => color !== null);
    const fresh = matchUniqueColorways({
      hexes: getImageHexes(count),
      count: count - lockedColors.length,
      index: colorwayIndex,
      exclude: new Set(lockedColors.map(colorwayKey)),
    });

    const colors: MatchedColor[] = [];
    for (let i = 0; i < count; i++) {
      const color = locked[i] ?? fresh.shift();
      if (color) colors.push(locked[i] ? color : { ...color, locked: false });
    }
    if (colors.length < count) {
      infoMessage = `This image only has ${colors.length} distinct ${colors.length === 1 ? 'color' : 'colors'}.`;
    }
    setColors(colors);
  }

  /** Add colors to the end, favoring image colors not already in the palette */
  function addAutoColors(count: number) {
    const fresh = matchUniqueColorways({
      hexes: getImageHexes(matchingYarnColors.length + count),
      count,
      index: colorwayIndex,
      exclude: new Set(matchingYarnColors.map(colorwayKey)),
    });
    if (fresh.length < count) {
      infoMessage = `This image only has ${matchingYarnColors.length + fresh.length} distinct colors.`;
    }
    setColors([
      ...$state.snapshot(matchingYarnColors),
      ...fresh.map((color) => ({ ...color, locked: false })),
    ]);
  }

  function onYarnFilterChange() {
    updateColorways();
    if (!hasImage) return;
    if (!matchingYarnColors.length) {
      autoPalette({ count: numberOfColors });
      return;
    }
    if (!colorwayIndex.length) {
      warningMessage = 'No colorways match the selected yarn.';
      return;
    }
    // Re-match the colors picked from the image against the new yarn, rather
    // than replacing them
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- local, not state
    const used = new Set(
      matchingYarnColors.filter((color) => color.locked).map(colorwayKey),
    );
    setColors(
      matchingYarnColors.map((color) => {
        if (color.locked || !color.sourceHex) return color;
        const match = findClosestColorway({
          hex: color.sourceHex,
          index: colorwayIndex,
          exclude: used,
        });
        if (!match) return color;
        used.add(colorwayKey(match));
        return { ...match, locked: false };
      }),
    );
  }

  function toImagePoint(clientX: number, clientY: number) {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) * canvas.width) / rect.width;
    const y = ((clientY - rect.top) * canvas.height) / rect.height;
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return null;
    return { x, y };
  }

  function sampleAt(clientX: number, clientY: number): string | null {
    const point = toImagePoint(clientX, clientY);
    if (!point || !pixels) return null;
    return sampleAverageHex({
      data: pixels.data,
      width: pixels.width,
      height: pixels.height,
      ...point,
    });
  }

  function queueHover(e: PointerEvent) {
    lastPointer = { clientX: e.clientX, clientY: e.clientY };
    if (hoverFrame) return;
    hoverFrame = requestAnimationFrame(() => {
      hoverFrame = 0;
      updateHover();
    });
  }

  function updateHover() {
    if (!lastPointer || !canvasWrap) return;
    const hex = sampleAt(lastPointer.clientX, lastPointer.clientY);
    cursorInside = !!hex;
    if (!hex) return;
    cursorColor = findClosestColorway({ hex, index: colorwayIndex }) ?? { hex };
    const rect = canvasWrap.getBoundingClientRect();
    coords = {
      x: lastPointer.clientX - rect.left,
      y: lastPointer.clientY - rect.top,
    };
  }

  function addColorAt(clientX: number, clientY: number) {
    if (matchingYarnColors.length >= MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES)
      return;
    const hex = sampleAt(clientX, clientY);
    if (!hex) return;
    const match = findClosestColorway({ hex, index: colorwayIndex });
    if (!match) return;
    popCursor = true;
    setTimeout(() => (popCursor = false), 70);
    matchingYarnColors.push({ ...match, locked: false });
    numberOfColors = matchingYarnColors.length;
  }

  function onPaste(e: ClipboardEvent) {
    const file = Array.from(e.clipboardData?.files ?? []).find((n) =>
      n.type.startsWith('image/'),
    );
    if (!file) return;
    e.preventDefault();
    loadFile(file);
  }
</script>

<svelte:window onpaste={onPaste} />

<div
  class={[
    'rounded-container p-2',
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
    loadFile(e.dataTransfer.files[0]);
  }}
>
  <div class="flex justify-center">
    <input
      type="file"
      accept="image/*"
      hidden
      bind:this={input}
      onchange={(e) => {
        const target = e.currentTarget;
        loadFile(target.files?.[0]);
        // Allow choosing the same file again
        target.value = '';
      }}
    />
    <button class="btn hover:preset-tonal-surface" onclick={getRandomImage}>
      <RefreshCcwIcon />
      Random Image</button
    >
    <button
      class="btn hover:preset-tonal-surface"
      onclick={() => input?.click()}
    >
      <CameraIcon />
      Choose Image
    </button>
  </div>

  {#if errorMessage}
    <p class="text-error-700-300 my-2 text-center" role="alert">
      {errorMessage}
    </p>
  {/if}

  {#if yarnReady}
    <div
      class="no-scroll my-2 grid w-full grid-cols-12 items-end justify-center gap-4"
    >
      <div
        class="order-1 col-span-full w-full md:col-span-9"
        class:md:col-span-full={!!selectedBrandId && !!selectedYarnId}
      >
        <SelectYarn
          context="modal"
          bind:selectedBrandId
          bind:selectedYarnId
          onselectautocomplete={onYarnFilterChange}
          {selectedYarnWeightId}
        />
      </div>

      {#if selectedBrandId && selectedYarnId}
        <div class="order-2 col-span-full w-full md:order-3">
          <DefaultYarnSet {selectedBrandId} {selectedYarnId} />
        </div>
      {/if}

      {#key selectedBrandId}
        <div
          class="order-3 col-span-full w-full md:order-2 md:col-span-3"
          class:hidden={!!selectedBrandId && !!selectedYarnId}
        >
          <SelectYarnWeight
            {selectedBrandId}
            bind:selectedYarnWeightId
            onchange={onYarnFilterChange}
          />
        </div>
      {/key}
    </div>
  {/if}

  <p class="my-2 text-sm" class:hidden={!hasImage || loading}>
    Click or touch-and-drag on the image to choose colors. You can also drop or
    paste an image here.
  </p>

  <div
    bind:this={canvasWrap}
    class="relative mx-12 mb-2 flex flex-col items-center sm:mx-16"
    class:hidden={!hasImage || loading}
  >
    {#if showCursor && cursorInside}
      <div in:fade>
        <p
          class="rounded-container pointer-events-none absolute z-10 box-border flex max-w-[180px] min-w-[140px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center p-2 shadow-lg"
          style="left:{coords.x}px;top:{coords.y -
            70}px;background:{cursorColor.hex};color:{getTextColor(
            cursorColor.hex ?? '#ffffff',
          )};"
        >
          {#if cursorColor.name && cursorColor.brandName && cursorColor.yarnName}
            <span class="text-xs"
              >{cursorColor.brandName}
              - {cursorColor.yarnName}</span
            >
            <span class="">{cursorColor.name}</span>
            <span class="text-xs"
              >{Math.floor(100 - (cursorColor.delta ?? 0))}% Match</span
            >
          {:else}
            <span class="">{cursorColor.hex}</span>
          {/if}
        </p>
        <div
          class="rounded-container pointer-events-none absolute box-border h-10 w-10 -translate-x-1/2 -translate-y-1/2 shadow-lg transition-transform"
          class:scale-0={popCursor}
          style="left:{coords.x}px;top:{coords.y}px;background:{cursorColor.hex};border:2px solid {getTextColor(
            cursorColor.hex ?? '#ffffff',
          )}"
        ></div>
      </div>
    {/if}
    <canvas
      bind:this={canvas}
      class="block h-auto max-h-[65vh] w-auto max-w-full cursor-crosshair touch-none select-none"
      aria-label="The chosen image. Click or touch it to pick colors, or use Auto Palette."
      onpointerdown={(e) => {
        if (e.cancelable) e.preventDefault();
        showCursor = true;
        queueHover(e);
        if (e.pointerType === 'mouse') {
          if (e.button !== 0) return;
          addColorAt(e.clientX, e.clientY);
        } else {
          e.currentTarget.setPointerCapture(e.pointerId);
        }
      }}
      onpointermove={(e) => {
        if (e.pointerType !== 'mouse' && !e.buttons) return;
        showCursor = true;
        queueHover(e);
      }}
      onpointerup={(e) => {
        if (e.pointerType === 'mouse') return;
        addColorAt(e.clientX, e.clientY);
        showCursor = false;
      }}
      onpointercancel={() => (showCursor = false)}
      onpointerleave={(e) => {
        if (e.pointerType === 'mouse') showCursor = false;
      }}
    ></canvas>
  </div>

  {#if matchingYarnColors.length >= MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES && !loading}
    <p class="text-error-400">Maximum number of colors selected.</p>
  {/if}

  {#if infoMessage && !loading}
    <p class="my-2 text-center text-sm">{infoMessage}</p>
  {/if}

  {#if loading}
    <div class="my-12 text-center">
      <Spinner />
      <p class="my-2">Loading Image...</p>
    </div>
  {:else if hasImage}
    <div class="mt-4 mb-2 flex flex-wrap items-center justify-center gap-2">
      {#key numberOfColorsKey}
        <SelectNumberOfColors
          {numberOfColors}
          max={MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES}
          allowZero={true}
          onchange={(e) => {
            if (e.cancelable) e.preventDefault();

            const value = parseInt((e.target as HTMLInputElement).value);
            const lastLockedIndex = matchingYarnColors.findLastIndex(
              (color) => color.locked,
            );

            if (value - 1 < lastLockedIndex) {
              warningMessage = `Cannot decrease number of colors because it would delete a locked color`;
              numberOfColorsKey = !numberOfColorsKey;
              return;
            }

            infoMessage = null;
            if (value < matchingYarnColors.length) {
              setColors(matchingYarnColors.slice(0, value));
            } else if (value > matchingYarnColors.length) {
              addAutoColors(value - matchingYarnColors.length);
            }
            numberOfColorsKey = !numberOfColorsKey;
          }}
        />
      {/key}

      {#if warningMessage}
        <div class="text-warning-900-100 flex gap-2">
          <p>{warningMessage}</p>
          <button
            class="btn hover:preset-tonal-surface"
            aria-label="close"
            onclick={() => (warningMessage = null)}
          >
            <XIcon />
          </button>
        </div>
      {/if}

      <button
        class="btn hover:preset-tonal-surface"
        onclick={() => {
          infoMessage = null;
          autoPalette({ count: Math.max(numberOfColors, 2) });
        }}
      >
        <WandSparklesIcon />
        Auto Palette
      </button>

      <button
        class="btn hover:preset-tonal-surface"
        onclick={() => {
          infoMessage = null;
          setColors(matchingYarnColors.filter((color) => color.locked));
          numberOfColorsKey = !numberOfColorsKey;
        }}
      >
        <Trash2Icon />
        Delete Colors
      </button>
    </div>
  {/if}

  <p class="text-surface-700-300 my-2 text-center text-sm">
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
  <div class="p-2">
    {#if matchingYarnColors.length && !loading}
      <div class="mb-2">
        {#key numberOfColors}
          {#key key}
            <ColorPaletteEditable
              canUserEditColor={false}
              bind:colors={matchingYarnColors}
              onchanged={() => {
                if (matchingYarnColors.length !== numberOfColors)
                  numberOfColors = matchingYarnColors.length;
              }}
            />
          {/key}
        {/key}
      </div>
    {/if}
    <SaveAndCloseButtons
      disabled={!hasImage || loading || !matchingYarnColors.length}
      onSave={() => {
        updateGauge({
          _colors: $state
            .snapshot(matchingYarnColors)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            .map(({ id, locked, delta, sourceHex, ...color }) => color),
        });
        dialog.close();
      }}
      onClose={dialog.close}
    />
  </div>
</StickyPart>
