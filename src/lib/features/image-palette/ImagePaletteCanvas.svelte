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
  import { LockIcon } from '@lucide/svelte';
  import type {
    ImagePaletteState,
    PalettePoint,
  } from './image-palette-state.svelte';
  import type { MatchedColor } from './match';
  import { pointsAlongLine, type Point } from './pixels';

  let { palette }: { palette: ImagePaletteState } = $props();

  const LOUPE_SIZE = 112;
  const LOUPE_ZOOM = 6;

  type Pointer = Point & { px: number; py: number };
  type Drag =
    { kind: 'point'; id: number } | { kind: 'line'; from: Point; to: Point };

  let frame: HTMLDivElement | undefined = $state();
  let imageCanvas: HTMLCanvasElement | undefined = $state();
  let previewCanvas: HTMLCanvasElement | undefined = $state();
  let loupeCanvas: HTMLCanvasElement | undefined = $state();
  let drag = $state<Drag | null>(null);
  let pointer = $state<Pointer | null>(null);
  let hover = $state<
    (Pointer & { hex: string; yarn: MatchedColor | null }) | null
  >(null);
  let frameRequest = 0;
  let queued: (() => void) | null = null;

  let ratio = $derived(
    palette.pixels ? palette.pixels.width / palette.pixels.height : 3 / 2,
  );

  let shownLine = $derived(drag?.kind === 'line' ? drag : palette.line);

  let linePreview = $derived(
    drag?.kind === 'line'
      ? pointsAlongLine(drag.from, drag.to, Math.max(palette.targetCount, 2))
      : [],
  );

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

  const clamp = (n: number) => Math.min(Math.max(n, 0), 1);

  function toPointer(e: PointerEvent): Pointer {
    const rect = frame!.getBoundingClientRect();
    return {
      x: clamp((e.clientX - rect.left) / rect.width),
      y: clamp((e.clientY - rect.top) / rect.height),
      px: e.clientX - rect.left,
      py: e.clientY - rect.top,
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
    // Redraw whenever the pointer moves or the loupe appears
    if (pointer && loupeCanvas) drawLoupe();
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
    const at = toPointer(e);
    if (palette.tool === 'line') {
      startDrag(e, { kind: 'line', from: at, to: at });
      return;
    }
    const id = palette.addPoint(at.x, at.y);
    if (id !== null) startDrag(e, { kind: 'point', id });
  }

  function onMarkerDown(e: PointerEvent, point: PalettePoint) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    palette.selectedId = point.id;
    if (!point.locked) startDrag(e, { kind: 'point', id: point.id });
  }

  function onMove(e: PointerEvent) {
    if (drag) {
      queue(() => {
        if (!drag) return;
        pointer = toPointer(e);
        if (drag.kind === 'point')
          palette.movePoint(drag.id, pointer.x, pointer.y);
        else drag.to = { x: pointer.x, y: pointer.y };
      });
    } else if (
      e.pointerType === 'mouse' &&
      palette.hasImage &&
      !palette.loading
    ) {
      queue(() => {
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
    }
    drag = null;
    pointer = null;
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
    }
  }

  function describe(point: PalettePoint, index: number) {
    const yarn = palette.mode === 'yarn' ? point.yarn : null;
    const name = yarn
      ? `${yarn.brandName} ${yarn.yarnName} ${yarn.name}`
      : palette.colorOf(point);
    return `Color ${index + 1}: ${name}${point.locked ? ' (locked)' : ''}. Arrow keys move it, Delete removes it.`;
  }
</script>

<!-- Side gutters on small screens leave room to scroll past the photo,
which otherwise takes every touch -->
<div class="px-10 sm:px-0">
  <div
    bind:this={frame}
    class="relative mx-auto w-[min(100%,calc(50vh*var(--ratio)))] select-none sm:w-[min(100%,calc(65vh*var(--ratio)))]"
    style="aspect-ratio: {ratio}; --ratio: {ratio};"
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
      class="rounded-container absolute inset-0 h-full w-full"
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

    <svg
      class="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {#if shownLine}
        <line
          x1={shownLine.from.x * 100}
          y1={shownLine.from.y * 100}
          x2={shownLine.to.x * 100}
          y2={shownLine.to.y * 100}
          stroke="white"
          stroke-width="4"
          vector-effect="non-scaling-stroke"
          stroke-linecap="round"
        />
        <line
          x1={shownLine.from.x * 100}
          y1={shownLine.from.y * 100}
          x2={shownLine.to.x * 100}
          y2={shownLine.to.y * 100}
          stroke="black"
          stroke-width="2"
          stroke-dasharray="6 4"
          vector-effect="non-scaling-stroke"
        />
      {/if}
    </svg>

    {#each linePreview as dot, i (i)}
      <span
        class="pointer-events-none absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-black/60"
        style="left:{dot.x * 100}%;top:{dot.y * 100}%"
      ></span>
    {/each}

    {#if drag?.kind !== 'line'}
      {#each palette.points as point, i (point.id)}
        {@const color = palette.colorOf(point)}
        {@const text = getTextColor(color)}
        {@const active = palette.selectedId === point.id}
        <button
          type="button"
          class={[
            'absolute z-10 flex size-7 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center rounded-full border-2 text-xs font-bold shadow-[0_0_0_1px_rgb(0_0_0/0.5),0_2px_6px_rgb(0_0_0/0.4)] transition-transform',
            active && 'ring-primary-500 z-20 scale-125 ring-4',
            !active && palette.hoveredId === point.id && 'scale-125',
            point.locked ? 'cursor-pointer' : 'cursor-grab',
          ]}
          style="left:{point.x * 100}%;top:{point.y *
            100}%;background:{color};color:{text};border-color:{text}"
          aria-label={describe(point, i)}
          aria-pressed={active}
          onpointerdown={(e) => onMarkerDown(e, point)}
          onpointerenter={() => (palette.hoveredId = point.id)}
          onpointerleave={() => (palette.hoveredId = null)}
          onfocus={() => (palette.selectedId = point.id)}
          onkeydown={(e) => onMarkerKey(e, point)}
        >
          {#if point.locked}
            <LockIcon class="size-3" />
          {:else}
            {i + 1}
          {/if}
        </button>
      {/each}
    {/if}

    {#if drag && pointer}
      <!-- Magnifier above the finger, or below it near the top edge -->
      <div
        class="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full border-4 border-white shadow-xl"
        style="left:{pointer.px}px;top:{pointer.py +
          (pointer.py < LOUPE_SIZE + 20 ? 1 : -1) *
            (LOUPE_SIZE / 2 + 32)}px;width:{LOUPE_SIZE}px;height:{LOUPE_SIZE}px"
      >
        <canvas bind:this={loupeCanvas} width={LOUPE_SIZE} height={LOUPE_SIZE}
        ></canvas>
        <span
          class="absolute top-1/2 left-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-sm border-2 border-white shadow-[0_0_0_1px_black]"
        ></span>
      </div>
    {/if}

    {#if hover && !drag}
      <div
        class="rounded-container pointer-events-none absolute z-30 flex max-w-[200px] items-center gap-2 p-2 text-xs shadow-lg"
        style="left:{hover.px + 16}px;top:{hover.py + 16}px;background:{hover
          .yarn?.hex ?? hover.hex};color:{getTextColor(
          hover.yarn?.hex ?? hover.hex,
        )}"
      >
        {#if hover.yarn}
          <span class="flex flex-col">
            <span>{hover.yarn.brandName} - {hover.yarn.yarnName}</span>
            <span class="font-bold">{hover.yarn.name}</span>
            <span>{Math.floor(100 - (hover.yarn.delta ?? 0))}% Match</span>
          </span>
        {:else}
          <span class="font-bold">{hover.hex}</span>
        {/if}
      </div>
    {/if}

    {#if palette.loading}
      <div
        class="rounded-container bg-surface-50/70 dark:bg-surface-950/70 absolute inset-0 z-40 flex flex-col items-center justify-center"
      >
        <Spinner />
        <p class="my-2">Loading Image...</p>
      </div>
    {/if}
  </div>
</div>
