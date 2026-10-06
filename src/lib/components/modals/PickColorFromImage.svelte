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

<script module lang="ts">
  import type { Point } from '$lib/features/image-palette/pixels';

  // The last photo and spot, so reopening during a visit picks up there
  let last = $state.raw<{
    pixels: ImageData;
    thumbnail: string;
    at: Point;
  } | null>(null);
</script>

<script lang="ts">
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import {
    checkImageFile,
    decodeImage,
    imageToPixels,
    makeThumbnail,
  } from '$lib/features/image-palette/decode';
  import {
    placeMagnifier,
    sampleHex,
  } from '$lib/features/image-palette/pixels';
  import { dialog } from '$lib/state/page-state.svelte';
  import { getGenericColorName, getTextColor } from '$lib/utils/color-utils';
  import { ChevronRightIcon, ImagePlusIcon } from '@lucide/svelte';
  import { Portal } from '@skeletonlabs/skeleton-svelte';
  import { onMount } from 'svelte';
  import { innerHeight, innerWidth } from 'svelte/reactivity/window';

  interface Props {
    /** Called with the chosen color when the user confirms it */
    onPick: (hex: string) => void;
    /** Shown inside another dialog rather than as its own: back to that one,
     * by Back, Cancel, or once a color is used */
    onBack?: () => void;
  }

  let { onPick, onBack }: Props = $props();

  /** Leave: back to the dialog this is shown in, or else close */
  const leave = () => (onBack ? onBack() : dialog.close());

  // As in the image palette's photo
  const LOUPE_SIZE = 112;
  const LOUPE_GAP = 44;
  const SCREEN_MARGIN = 8;
  const LOUPE_ZOOM = 6;

  let step = $state<'start' | 'picker'>('start');
  let input: HTMLInputElement | undefined = $state();
  let draggingFile = $state(false);
  let loading = $state(false);
  let errorMessage = $state<string | null>(null);
  let pixels = $state.raw<ImageData | null>(null);
  let at = $state<Point>({ x: 0.5, y: 0.5 });
  let loadId = 0;

  let stageWidth = $state(0);
  let frame: HTMLDivElement | undefined = $state();
  let imageCanvas: HTMLCanvasElement | undefined = $state();
  let loupeCanvas: HTMLCanvasElement | undefined = $state();
  /** Where a drag's pointer is on screen, for the magnifier */
  let dragAt = $state<{ cx: number; cy: number } | null>(null);
  let frameRequest = 0;

  let hex = $derived(
    pixels
      ? sampleHex({
          data: pixels.data,
          width: pixels.width,
          height: pixels.height,
          x: at.x,
          y: at.y,
        })
      : null,
  );

  let colorName = $derived(hex ? getGenericColorName({ color: hex }) : null);

  // The photo fits the dialog's width, at most 60% of the screen's height
  let size = $derived.by(() => {
    const ratio = pixels ? pixels.width / pixels.height : 3 / 2;
    const maxHeight = Math.min(
      stageWidth / ratio,
      (innerHeight.current ?? 800) * 0.6,
    );
    const width = Math.max(0, Math.min(stageWidth, maxHeight * ratio));
    return { width, height: width / ratio };
  });

  let loupePosition = $derived(
    dragAt
      ? placeMagnifier({
          x: dragAt.cx,
          y: dragAt.cy,
          size: LOUPE_SIZE,
          gap: LOUPE_GAP,
          margin: SCREEN_MARGIN,
          screenWidth: innerWidth.current ?? 0,
        })
      : null,
  );

  onMount(() => () => {
    cancelAnimationFrame(frameRequest);
    if (pixels && last) last.at = at;
    dialog.backAction = null;
  });

  // The dialog's Back button returns to choosing a photo, then (shown inside
  // another dialog) to that one
  $effect(() => {
    dialog.backAction =
      step === 'picker' ? () => (step = 'start') : (onBack ?? null);
  });

  $effect(() => {
    if (!imageCanvas || !pixels) return;
    imageCanvas.width = pixels.width;
    imageCanvas.height = pixels.height;
    imageCanvas.getContext('2d')?.putImageData(pixels, 0, 0);
  });

  $effect(() => {
    void at;
    if (!dragAt || !loupeCanvas || !imageCanvas) return;
    const ctx = loupeCanvas.getContext('2d');
    if (!ctx) return;
    const span = LOUPE_SIZE / LOUPE_ZOOM;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, LOUPE_SIZE, LOUPE_SIZE);
    ctx.drawImage(
      imageCanvas,
      at.x * imageCanvas.width - span / 2,
      at.y * imageCanvas.height - span / 2,
      span,
      span,
      0,
      0,
      LOUPE_SIZE,
      LOUPE_SIZE,
    );
  });

  // Touch listeners added by Svelte are passive, so they can't stop a drag
  // from also scrolling the dialog. This one can, and only acts mid-drag.
  $effect(() => {
    if (!frame) return;
    const onTouchMove = (e: TouchEvent) => {
      if (dragAt && e.cancelable) e.preventDefault();
    };
    frame.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => frame?.removeEventListener('touchmove', onTouchMove);
  });

  const clamp = (n: number) => Math.min(Math.max(n, 0), 1);

  function moveTo(e: PointerEvent) {
    const rect = frame!.getBoundingClientRect();
    at = {
      x: clamp((e.clientX - rect.left) / rect.width),
      y: clamp((e.clientY - rect.top) / rect.height),
    };
    dragAt = { cx: e.clientX, cy: e.clientY };
  }

  function onDown(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (!pixels || loading) return;
    e.preventDefault();
    frame!.setPointerCapture(e.pointerId);
    moveTo(e);
  }

  function onMove(e: PointerEvent) {
    if (!dragAt) return;
    cancelAnimationFrame(frameRequest);
    frameRequest = requestAnimationFrame(() => moveTo(e));
  }

  function onUp(e: PointerEvent) {
    if (!dragAt) return;
    cancelAnimationFrame(frameRequest);
    if (e.type === 'pointerup') moveTo(e);
    dragAt = null;
  }

  function onMarkerKey(e: KeyboardEvent) {
    const step = e.shiftKey ? 0.05 : 0.01;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      at = { x: clamp(at.x + dx), y: clamp(at.y + dy) };
    } else if (e.key === 'Enter') {
      e.preventDefault();
      use();
    }
  }

  async function openFile(file: File | undefined) {
    if (!file) return;
    const check = checkImageFile(file);
    if (!check.ok) {
      errorMessage = check.error;
      return;
    }
    const id = ++loadId;
    errorMessage = null;
    loading = true;
    step = 'picker';
    const url = URL.createObjectURL(file);
    try {
      const image = await decodeImage(url);
      if (id !== loadId) return;
      const drawn = imageToPixels(image);
      if (!drawn) throw new Error('No canvas');
      pixels = drawn.pixels;
      at = { x: 0.5, y: 0.5 };
      last = {
        pixels: drawn.pixels,
        thumbnail: makeThumbnail(drawn.canvas),
        at,
      };
    } catch {
      if (id !== loadId) return;
      errorMessage = check.failMessage;
      // Keep showing the previous photo, if there was one
      if (!pixels) step = 'start';
    } finally {
      URL.revokeObjectURL(url);
      if (id === loadId) loading = false;
    }
  }

  function continueLast() {
    if (!last) return;
    pixels = last.pixels;
    at = last.at;
    errorMessage = null;
    step = 'picker';
  }

  function use() {
    if (!hex) return;
    if (last) last.at = at;
    onPick(hex);
    leave();
  }

  function onPaste(e: ClipboardEvent) {
    const file = Array.from(e.clipboardData?.files ?? []).find((n) =>
      n.type.startsWith('image/'),
    );
    if (!file) return;
    e.preventDefault();
    openFile(file);
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

<input
  type="file"
  accept="image/*"
  hidden
  bind:this={input}
  onchange={(e) => {
    const target = e.currentTarget;
    openFile(target.files?.[0]);
    // Allow choosing the same file again
    target.value = '';
  }}
/>

<div
  role="region"
  aria-label="Pick a color from a photo"
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
    openFile(e.dataTransfer.files[0]);
  }}
>
  {#if step === 'start'}
    <div class="mx-auto flex max-w-xl flex-col gap-6 px-4 pt-2 pb-8">
      <p class="text-surface-700-300 text-center">
        Pick a color from a photo to find yarn that matches it. Photos stay on
        your device.
      </p>
      {#if errorMessage}
        <p class="text-error-700-300 text-center" role="alert">
          {errorMessage}
        </p>
      {/if}
      <button
        class={[
          'card flex flex-col items-center gap-3 p-6 text-center transition-colors',
          draggingFile
            ? 'preset-tonal-primary outline-primary-500 outline-2 outline-dashed'
            : 'preset-outlined-surface-300-700 hover:bg-surface-100-900',
        ]}
        onclick={() => input?.click()}
      >
        <ImagePlusIcon class="size-10 opacity-70" />
        <span class="text-lg font-bold">Your Photo</span>
        <span class="text-surface-700-300 text-sm"
          >Choose a photo, or drop or paste one here</span
        >
      </button>
      {#if last}
        <button
          class="card preset-outlined-surface-300-700 hover:bg-surface-100-900 flex items-center gap-4 p-3 text-left transition-colors"
          onclick={continueLast}
        >
          <img
            src={last.thumbnail}
            alt=""
            class="rounded-container h-14 w-20 shrink-0 object-cover"
          />
          <span class="flex min-w-0 flex-1 flex-col">
            <span class="font-bold">Continue with your last photo</span>
            <span class="text-surface-700-300 text-sm"
              >Pick up where you left off</span
            >
          </span>
          <ChevronRightIcon class="shrink-0" />
        </button>
      {/if}
    </div>
  {:else}
    <div class="flex flex-col gap-2 px-2 pb-2 sm:px-4">
      <p class="text-surface-700-300 text-center text-xs">
        Tap or drag on the photo to pick a color. With the keyboard, use the
        arrow keys (Shift for bigger steps).
      </p>
      {#if errorMessage}
        <p class="text-error-700-300 text-center text-sm" role="alert">
          {errorMessage}
        </p>
      {/if}
      <div
        class="relative w-full"
        style="height:{size.height}px"
        bind:clientWidth={stageWidth}
      >
        <div
          bind:this={frame}
          class={[
            'absolute touch-none select-none',
            pixels && !loading && 'cursor-crosshair',
          ]}
          style="left:{(stageWidth - size.width) /
            2}px;top:0;width:{size.width}px;height:{size.height}px"
          role="presentation"
          data-sheet-no-drag
          onpointerdown={onDown}
          onpointermove={onMove}
          onpointerup={onUp}
          onpointercancel={onUp}
        >
          <canvas
            bind:this={imageCanvas}
            class="absolute inset-0 h-full w-full shadow-lg"
            class:invisible={!pixels}
          ></canvas>
          {#if pixels && hex}
            <button
              type="button"
              class="absolute z-10 size-7 -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgb(0_0_0/0.35),0_2px_8px_rgb(0_0_0/0.45)]"
              style="left:{at.x * 100}%;top:{at.y * 100}%;background:{hex}"
              aria-label="Color picker on the photo. Use the arrow keys to move, Enter to use this color."
              onkeydown={onMarkerKey}
            ></button>
          {/if}
          {#if dragAt && loupePosition}
            <!-- On the page itself, so neither the dialog's edges nor its
            opening animation (a transform) can move or cut off the magnifier -->
            <Portal>
              <div
                class="pointer-events-none fixed z-[70] overflow-hidden rounded-full border-4 border-white shadow-xl"
                style="left:{loupePosition.left}px;top:{loupePosition.top}px;width:{LOUPE_SIZE}px;height:{LOUPE_SIZE}px"
                aria-hidden="true"
              >
                <canvas
                  bind:this={loupeCanvas}
                  width={LOUPE_SIZE}
                  height={LOUPE_SIZE}
                ></canvas>
                <span
                  class="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white shadow-[0_0_0_1px_black]"
                ></span>
              </div>
            </Portal>
          {/if}
          {#if loading}
            <div
              class="bg-surface-100-900 absolute inset-0 z-40 flex flex-col items-center justify-center gap-2"
            >
              <Spinner />
              <p class="text-surface-700-300 text-sm">Loading photo...</p>
            </div>
          {/if}
        </div>
      </div>
    </div>
    <StickyPart position="bottom">
      <div class="flex flex-col gap-1 px-2 pt-2 sm:px-4">
        <div
          class="rounded-container flex h-14 w-full items-center justify-center px-4 text-lg shadow-inner"
          style="background:{hex ?? 'none'};color:{hex
            ? getTextColor(hex)
            : 'inherit'}"
        >
          {#if hex && !loading}
            <span aria-hidden="true">{colorName ?? hex}</span>
          {/if}
        </div>
        <!-- Said once a drag ends, not for every step of it -->
        <p class="sr-only" aria-live="polite">
          {#if hex && !loading && !dragAt}Picked color: {colorName ?? hex}{/if}
        </p>
        <SaveAndCloseButtons
          saveText="Use Color"
          disabled={!hex || loading}
          onSave={use}
          onClose={leave}
        />
      </div>
    </StickyPart>
  {/if}
</div>
