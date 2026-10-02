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
  import Spinner from '$lib/components/Spinner.svelte';
  import { getTextColor } from '$lib/utils/color-utils';
  import { LockKeyholeIcon, LockOpenIcon, Trash2Icon } from '@lucide/svelte';
  import { Portal } from '@skeletonlabs/skeleton-svelte';
  import { MediaQuery } from 'svelte/reactivity';
  import { innerHeight, innerWidth } from 'svelte/reactivity/window';
  import { scale } from 'svelte/transition';
  import type {
    ImagePaletteState,
    PalettePoint,
  } from './image-palette-state.svelte';
  import { colorwayKey, type MatchedColor } from './match';
  import { placeMagnifier, pointsAlongLine, type Point } from './pixels';

  let { palette }: { palette: ImagePaletteState } = $props();

  const LOUPE_SIZE = 112;
  /** Space between the finger and the magnifier, so the finger never covers it */
  const LOUPE_GAP = 44;
  /** Space kept between the magnifier and the screen's edges */
  const SCREEN_MARGIN = 8;
  const LOUPE_ZOOM = 6;
  const POPOVER_WIDTH = 288;

  /** A pointer position: as fractions of the photo (x, y), in pixels within
   * the photo (px, py), and in pixels on screen (cx, cy) */
  type Pointer = Point & { px: number; py: number; cx: number; cy: number };
  type Drag =
    | { kind: 'point'; id: number; moved: boolean }
    | { kind: 'line'; from: Point; to: Point };

  // On large screens the photo fills the space it's given; on small ones it
  // takes at most 60% of the screen's height
  const large = new MediaQuery('min-width: 1024px');

  let stageWidth = $state(0);
  let stageHeight = $state(0);
  let frame: HTMLDivElement | undefined = $state();
  let imageCanvas: HTMLCanvasElement | undefined = $state();
  let previewCanvas: HTMLCanvasElement | undefined = $state();
  let loupeCanvas: HTMLCanvasElement | undefined = $state();
  let drag = $state<Drag | null>(null);
  let pointer = $state<Pointer | null>(null);
  let hover = $state<
    (Pointer & { hex: string; yarn: MatchedColor | null }) | null
  >(null);
  let previewAlternative = $state<MatchedColor | null>(null);
  let popover: HTMLDivElement | undefined = $state();
  let frameRequest = 0;
  let queued: (() => void) | null = null;

  let ratio = $derived(
    palette.pixels ? palette.pixels.width / palette.pixels.height : 3 / 2,
  );

  let size = $derived.by(() => {
    const maxHeight = large.current
      ? stageHeight
      : Math.min(stageWidth / ratio, (innerHeight.current ?? 800) * 0.6);
    const width = Math.max(0, Math.min(stageWidth, maxHeight * ratio));
    return { width, height: width / ratio };
  });

  let shownLine = $derived(drag?.kind === 'line' ? drag : palette.line);

  let linePreview = $derived(
    drag?.kind === 'line'
      ? pointsAlongLine(drag.from, drag.to, Math.max(palette.targetCount, 2))
      : [],
  );

  let selected = $derived(drag ? null : palette.selected);

  let alternatives = $derived(
    selected && palette.mode === 'yarn' ? palette.alternatives(selected) : [],
  );

  $effect(() => {
    // A different color was selected: stop previewing an alternative
    void palette.selectedId;
    previewAlternative = null;
  });

  $effect(() => {
    const pixels = palette.pixels;
    if (!imageCanvas || !pixels) return;
    imageCanvas.width = pixels.width;
    imageCanvas.height = pixels.height;
    imageCanvas.getContext('2d')?.putImageData(pixels, 0, 0);
  });

  $effect(() => {
    const pixels = palette.previewPixels;
    if (!previewCanvas || !pixels) return;
    previewCanvas.width = pixels.width;
    previewCanvas.height = pixels.height;
    previewCanvas.getContext('2d')?.putImageData(pixels, 0, 0);
  });

  const clamp = (n: number, min = 0, max = 1) =>
    Math.min(Math.max(n, min), max);

  function toPointer(e: PointerEvent): Pointer {
    const rect = frame!.getBoundingClientRect();
    return {
      x: clamp((e.clientX - rect.left) / rect.width),
      y: clamp((e.clientY - rect.top) / rect.height),
      px: e.clientX - rect.left,
      py: e.clientY - rect.top,
      cx: e.clientX,
      cy: e.clientY,
    };
  }

  /** Run the latest pointer update once per animation frame */
  function queue(update: () => void) {
    queued = update;
    if (frameRequest) return;
    frameRequest = requestAnimationFrame(() => {
      frameRequest = 0;
      queued?.();
      queued = null;
    });
  }

  function drawLoupe() {
    if (!loupeCanvas || !imageCanvas || !pointer) return;
    const ctx = loupeCanvas.getContext('2d');
    if (!ctx) return;
    const span = LOUPE_SIZE / LOUPE_ZOOM;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, LOUPE_SIZE, LOUPE_SIZE);
    ctx.drawImage(
      imageCanvas,
      pointer.x * imageCanvas.width - span / 2,
      pointer.y * imageCanvas.height - span / 2,
      span,
      span,
      0,
      0,
      LOUPE_SIZE,
      LOUPE_SIZE,
    );
  }

  $effect(() => {
    if (pointer && loupeCanvas) drawLoupe();
  });

  let loupePosition = $derived(
    pointer
      ? placeMagnifier({
          x: pointer.cx,
          y: pointer.cy,
          size: LOUPE_SIZE,
          gap: LOUPE_GAP,
          margin: SCREEN_MARGIN,
          screenWidth: innerWidth.current ?? 0,
        })
      : null,
  );

  // Touch listeners added by Svelte are passive, so they can't stop a drag
  // from also scrolling the dialog. This one can, and only acts mid-drag, so
  // taps on buttons (like in a color's details) still work.
  $effect(() => {
    if (!frame) return;
    const onTouchMove = (e: TouchEvent) => {
      if (drag && e.cancelable) e.preventDefault();
    };
    frame.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => frame?.removeEventListener('touchmove', onTouchMove);
  });

  function startDrag(e: PointerEvent, next: Drag) {
    drag = next;
    pointer = toPointer(e);
    hover = null;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onSurfaceDown(e: PointerEvent) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (!palette.hasImage || palette.loading) return;
    e.preventDefault();
    // A tap away from an open color only closes it (see the window handler)
    if (palette.selectedId !== null) return;
    const at = toPointer(e);
    if (palette.tool === 'line') {
      startDrag(e, { kind: 'line', from: at, to: at });
      return;
    }
    const id = palette.addPoint(at.x, at.y);
    palette.selectedId = null;
    if (id !== null) startDrag(e, { kind: 'point', id, moved: true });
  }

  function onMarkerDown(e: PointerEvent, point: PalettePoint) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    if (point.locked) {
      palette.selectedId = point.id;
      return;
    }
    startDrag(e, { kind: 'point', id: point.id, moved: false });
  }

  function onMove(e: PointerEvent) {
    if (drag) {
      queue(() => {
        if (!drag) return;
        pointer = toPointer(e);
        if (drag.kind === 'point') {
          drag.moved = true;
          palette.movePoint(drag.id, pointer.x, pointer.y);
        } else drag.to = { x: pointer.x, y: pointer.y };
      });
    } else if (
      e.pointerType === 'mouse' &&
      palette.hasImage &&
      !palette.loading &&
      palette.selectedId === null
    ) {
      queue(() => {
        if (drag) return;
        const at = toPointer(e);
        const color = palette.colorAt(at.x, at.y);
        hover = color ? { ...at, ...color } : null;
      });
    }
  }

  function onUp() {
    if (drag?.kind === 'line') {
      const { from, to } = drag;
      // Ignore taps: a line needs some length
      if (Math.hypot(to.x - from.x, to.y - from.y) > 0.03)
        palette.applyLine(from, to);
    } else if (drag?.kind === 'point' && !drag.moved) {
      // A marker tapped without dragging: show its details
      palette.selectedId = drag.id;
    }
    drag = null;
    pointer = null;
    hover = null;
  }

  function onMarkerKey(e: KeyboardEvent, point: PalettePoint) {
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
      palette.movePoint(point.id, point.x + dx, point.y + dy);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      palette.removePoint(point.id);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      palette.selectedId = palette.selectedId === point.id ? null : point.id;
    } else if (e.key === 'Escape' && palette.selectedId !== null) {
      e.preventDefault();
      e.stopPropagation();
      palette.selectedId = null;
    }
  }

  function describe(point: PalettePoint, index: number) {
    const yarn = palette.mode === 'yarn' ? point.yarn : null;
    const name = yarn
      ? `${yarn.brandName} ${yarn.yarnName} ${yarn.name}`
      : palette.colorOf(point);
    return `Color ${index + 1}: ${name}${point.locked ? ' (locked)' : ''}. Press Enter for details, arrow keys to move, Delete to remove.`;
  }

  const percent = (color: MatchedColor) =>
    `${Math.floor(100 - (color.delta ?? 0))}% match`;
</script>

<!-- Clicking anywhere else closes an open color's details -->
<svelte:window
  onpointerdown={(e) => {
    if (palette.selectedId === null) return;
    const target = e.target as Element | null;
    if (popover?.contains(target) || target?.closest('[data-marker]')) return;
    palette.selectedId = null;
  }}
/>

<!-- The photo is centered with offsets, not a transform: a transform would
make the magnifier's fixed position relative to the photo, not the screen -->
<div
  class="relative w-full lg:h-full"
  style={large.current ? '' : `height:${size.height}px`}
  bind:clientWidth={stageWidth}
  bind:clientHeight={stageHeight}
>
  <div
    bind:this={frame}
    class="absolute select-none"
    style="left:{(stageWidth - size.width) / 2}px;top:{Math.max(
      0,
      (stageHeight - size.height) / 2,
    )}px;width:{size.width}px;height:{size.height}px"
    role="group"
    aria-label="Photo with color markers"
    onpointermove={onMove}
    onpointerup={onUp}
    onpointercancel={onUp}
    onpointerleave={(e) => {
      if (e.pointerType === 'mouse') hover = null;
    }}
  >
    <canvas
      bind:this={imageCanvas}
      class="rounded-container absolute inset-0 h-full w-full shadow-lg"
      class:invisible={!palette.hasImage}
    ></canvas>
    {#if palette.showYarnPreview && palette.previewPixels}
      <canvas
        bind:this={previewCanvas}
        class="rounded-container absolute inset-0 h-full w-full"
      ></canvas>
    {/if}

    <!-- Picking surface: tap or click to add a color, drag to draw a line -->
    <div
      class={[
        'absolute inset-0 touch-none',
        palette.hasImage && !palette.loading && 'cursor-crosshair',
      ]}
      role="presentation"
      onpointerdown={onSurfaceDown}
    ></div>

    {#if shownLine}
      <svg
        class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          x1={shownLine.from.x * 100}
          y1={shownLine.from.y * 100}
          x2={shownLine.to.x * 100}
          y2={shownLine.to.y * 100}
          stroke="white"
          stroke-width="3"
          stroke-linecap="round"
          vector-effect="non-scaling-stroke"
          opacity="0.9"
        />
      </svg>
    {/if}

    {#each linePreview as dot, i (i)}
      <span
        class="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/40 shadow"
        style="left:{dot.x * 100}%;top:{dot.y * 100}%"
      ></span>
    {/each}

    {#if drag?.kind !== 'line'}
      {#each palette.points as point, i (point.id)}
        {@const color = palette.colorOf(point)}
        {@const raised =
          palette.selectedId === point.id || palette.hoveredId === point.id}
        <button
          type="button"
          class={[
            'absolute z-10 flex size-6 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full border-[3px] border-white shadow-[0_0_0_1px_rgb(0_0_0/0.35),0_2px_8px_rgb(0_0_0/0.45)] transition-transform duration-150',
            raised && 'z-20 scale-[1.35]',
            point.locked ? 'cursor-pointer' : 'cursor-grab',
          ]}
          style="left:{point.x * 100}%;top:{point.y *
            100}%;background:{color};color:{getTextColor(color)}"
          aria-label={describe(point, i)}
          aria-expanded={palette.selectedId === point.id}
          data-marker
          onpointerdown={(e) => onMarkerDown(e, point)}
          onpointerenter={() => (palette.hoveredId = point.id)}
          onpointerleave={() => (palette.hoveredId = null)}
          onkeydown={(e) => onMarkerKey(e, point)}
        >
          {#if point.locked}
            <LockKeyholeIcon class="size-3" />
          {/if}
        </button>
      {/each}
    {/if}

    {#if selected}
      {@const color = palette.colorOf(selected)}
      {@const text = getTextColor(color)}
      {@const shown =
        previewAlternative ?? (palette.mode === 'yarn' ? selected.yarn : null)}
      {@const below = selected.y < 0.45}
      {@const left = clamp(
        selected.x * size.width,
        POPOVER_WIDTH / 2,
        Math.max(POPOVER_WIDTH / 2, size.width - POPOVER_WIDTH / 2),
      )}
      <div
        bind:this={popover}
        class="rounded-container absolute z-30 flex -translate-x-1/2 flex-col gap-2 p-3 text-left shadow-xl"
        style="left:{left}px;{below
          ? `top:${selected.y * size.height + 22}px`
          : `bottom:${size.height - selected.y * size.height + 22}px`};width:{POPOVER_WIDTH}px;max-width:calc(100vw - 2rem);background:{previewAlternative?.hex ??
          color};color:{getTextColor(previewAlternative?.hex ?? color)}"
        role="dialog"
        aria-label="Color details"
        transition:scale={{ duration: 120, start: 0.9 }}
      >
        <div class="flex items-start gap-1">
          <div class="min-w-0 flex-1">
            {#if shown}
              <p class="text-xs">{shown.brandName} - {shown.yarnName}</p>
              <p class="text-lg leading-tight">{shown.name}</p>
              <p class="text-xs opacity-80">{percent(shown)}</p>
            {:else}
              <p class="text-lg leading-tight">{color}</p>
            {/if}
          </div>
          <button
            class="btn-icon hover:preset-tonal-surface"
            style="color:{text}"
            title={selected.locked ? 'Unlock' : 'Lock'}
            aria-label="{selected.locked ? 'Unlock' : 'Lock'} color"
            aria-pressed={selected.locked}
            onclick={() => palette.toggleLock(selected.id)}
          >
            {#if selected.locked}<LockKeyholeIcon />{:else}<LockOpenIcon />{/if}
          </button>
          <button
            class="btn-icon hover:preset-tonal-surface"
            style="color:{text}"
            title="Delete"
            aria-label="Delete color"
            onclick={() => palette.removePoint(selected.id)}
          >
            <Trash2Icon />
          </button>
        </div>
        {#if alternatives.length > 1 && !selected.locked}
          <div>
            <p class="mb-1 text-xs opacity-80">Other close yarns</p>
            <div class="flex flex-wrap gap-1.5">
              {#each alternatives as alternative (colorwayKey(alternative))}
                {@const current =
                  !!selected.yarn &&
                  colorwayKey(alternative) === colorwayKey(selected.yarn)}
                <button
                  class="size-8 rounded-full border-2 shadow-[0_0_0_1px_rgb(0_0_0/0.3)] transition-transform hover:scale-110"
                  style="background:{alternative.hex};border-color:{current
                    ? text
                    : 'rgb(255 255 255 / 0.6)'}"
                  title="{alternative.brandName} - {alternative.yarnName}: {alternative.name}"
                  aria-label="Use {alternative.brandName} {alternative.yarnName} {alternative.name}"
                  aria-pressed={current}
                  onpointerenter={() => (previewAlternative = alternative)}
                  onpointerleave={() => (previewAlternative = null)}
                  onfocus={() => (previewAlternative = alternative)}
                  onblur={() => (previewAlternative = null)}
                  onclick={() => {
                    palette.setYarn(selected.id, alternative);
                    previewAlternative = null;
                  }}
                ></button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}

    {#if drag && loupePosition}
      <!-- On the page itself, so neither the dialog's edges nor its opening
      animation (a transform) can move or cut off the magnifier -->
      <Portal>
        <div
          class="pointer-events-none fixed z-[70] overflow-hidden rounded-full border-4 border-white shadow-xl"
          style="left:{loupePosition.left}px;top:{loupePosition.top}px;width:{LOUPE_SIZE}px;height:{LOUPE_SIZE}px"
        >
          <canvas bind:this={loupeCanvas} width={LOUPE_SIZE} height={LOUPE_SIZE}
          ></canvas>
          <span
            class="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white shadow-[0_0_0_1px_black]"
          ></span>
        </div>
      </Portal>
    {/if}

    {#if hover && !drag}
      {@const hex = hover.yarn?.hex ?? hover.hex}
      <div
        class="rounded-container pointer-events-none absolute z-30 flex max-w-[220px] flex-col p-2 text-left text-xs shadow-lg"
        style="{hover.px > size.width - 236
          ? `right:${size.width - hover.px + 16}px`
          : `left:${hover.px + 16}px`};{hover.py > size.height - 96
          ? `bottom:${size.height - hover.py + 16}px`
          : `top:${hover.py + 16}px`};background:{hex};color:{getTextColor(
          hex,
        )}"
      >
        {#if hover.yarn}
          <span>{hover.yarn.brandName} - {hover.yarn.yarnName}</span>
          <span class="text-base leading-tight">{hover.yarn.name}</span>
          <span class="opacity-80">{percent(hover.yarn)}</span>
        {:else}
          <span class="text-base">{hover.hex}</span>
        {/if}
      </div>
    {/if}

    {#if palette.loading}
      <div
        class="rounded-container bg-surface-100-900 absolute inset-0 z-40 flex flex-col items-center justify-center gap-2"
      >
        <Spinner />
        <p class="text-surface-700-300 text-sm">Loading photo...</p>
      </div>
    {/if}
  </div>
</div>
