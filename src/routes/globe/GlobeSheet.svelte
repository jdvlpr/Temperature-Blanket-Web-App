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

<!--
  The places panel as a bottom sheet over a full-screen globe, for phones in
  portrait. The whole sheet drags, the way map apps' sheets do: the handle and
  search row always move it, and so does the list — except when the sheet is
  fully open, where the list scrolls, and only a pull down from the top of the
  list drags the sheet closed again. Touching the globe never involves it.

  Not vaul-svelte's Drawer (used elsewhere in the app): that is a modal,
  dismissible drawer, and this sheet is always present with the globe behind
  it fully usable.
-->

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { settleSheet, type SheetSnap } from './globe-utils';

  interface Props {
    snap: SheetSnap;
    heights: Record<SheetSnap, number>;
    /** Summary shown under the handle, e.g. "12 places in view". */
    label: string;
    /** The sheet's height right now, following a drag live. */
    liveHeight?: number;
    dragging?: boolean;
    children: Snippet;
  }

  let {
    snap = $bindable(),
    heights,
    label,
    liveHeight = $bindable(),
    dragging = $bindable(),
    children,
  }: Props = $props();

  /** Movement under this many px is a tap on the handle, not a drag. */
  const TAP_SLOP_PX = 6;

  let dragHeight = $state<number | null>(null);
  const height = $derived(dragHeight ?? heights[snap]);

  $effect(() => {
    liveHeight = height;
  });
  $effect(() => {
    dragging = dragHeight !== null;
  });

  let sectionElement: HTMLElement | undefined = $state();

  // Shared by the mouse and touch paths below.
  let startY = 0;
  let startHeight = 0;
  let moved = false;
  let samples: { y: number; t: number }[] = [];

  function beginDrag(y: number, t: number) {
    startY = y;
    startHeight = height;
    moved = false;
    samples = [{ y, t }];
  }

  function moveDrag(y: number, t: number) {
    moved = true;
    dragHeight = Math.min(
      heights.full,
      Math.max(heights.peek, startHeight - (y - startY)),
    );
    samples.push({ y, t });
    // Only the last ~100ms decide the release velocity.
    while (samples.length > 2 && t - samples[0].t > 100) samples.shift();
  }

  function finishDrag(y: number, t: number, cancelled: boolean) {
    if (dragHeight === null) return;
    const first = samples[0];
    const dt = t - first.t;
    // Positive when moving up, i.e. the sheet growing.
    const velocity = !cancelled && dt > 0 ? (first.y - y) / dt : 0;
    snap = settleSheet(dragHeight, velocity, heights);
    dragHeight = null;
  }

  /*
   * Touch. Pointer events can't do this job on a phone: once the browser has
   * claimed a touch for scrolling it fires pointercancel and the page moves
   * instead. A non-passive touchmove listener can preventDefault the first
   * move, which is what keeps the page — and, on iOS, the whole document's
   * rubber-band bounce — out of it. Svelte registers ontouchmove as passive,
   * hence addEventListener.
   */
  let touchMode: 'undecided' | 'sheet' | 'scroll' = 'undecided';
  let touchScroller: HTMLElement | null = null;

  function handleTouchStart(event: TouchEvent) {
    if (event.touches.length !== 1) {
      touchMode = 'scroll';
      return;
    }
    const touch = event.touches[0];
    beginDrag(touch.clientY, event.timeStamp);
    touchMode = 'undecided';
    touchScroller =
      (event.target as HTMLElement).closest<HTMLElement>(
        '[data-sheet-scroll]',
      ) ?? null;
  }

  function handleTouchMove(event: TouchEvent) {
    if (touchMode === 'scroll' || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const dy = touch.clientY - startY;

    if (touchMode === 'undecided') {
      // Decided on the very first movement: after that, the browser may have
      // committed to scrolling and the event can no longer be cancelled.
      if (dy === 0) return;
      const listCanScroll =
        touchScroller !== null &&
        snap === 'full' &&
        touchScroller.scrollHeight > touchScroller.clientHeight;
      const pullingDownFromTop = dy > 0 && (touchScroller?.scrollTop ?? 0) <= 0;
      touchMode = listCanScroll && !pullingDownFromTop ? 'scroll' : 'sheet';
      if (touchMode === 'scroll') return;
    }

    if (event.cancelable) event.preventDefault();
    moveDrag(touch.clientY, event.timeStamp);
  }

  function handleTouchEnd(event: TouchEvent) {
    const touch = event.changedTouches[0];
    if (touchMode === 'sheet' && touch) {
      finishDrag(touch.clientY, event.timeStamp, event.type === 'touchcancel');
    }
    touchMode = 'undecided';
    touchScroller = null;
  }

  $effect(() => {
    const element = sectionElement;
    if (!element) return;
    const options = { passive: false } as const;
    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd);
    element.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  });

  /*
   * Mouse, for a desktop browser in a narrow portrait window: drag by the
   * handle only, since a mouse drag in the list should select text as usual.
   */
  let mousePointerId: number | null = null;

  function handlePointerDown(event: PointerEvent) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    mousePointerId = event.pointerId;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    beginDrag(event.clientY, event.timeStamp);
  }

  function handlePointerMove(event: PointerEvent) {
    if (event.pointerId !== mousePointerId) return;
    if (!moved && Math.abs(event.clientY - startY) < TAP_SLOP_PX) return;
    moveDrag(event.clientY, event.timeStamp);
  }

  function handlePointerUp(event: PointerEvent, cancelled: boolean) {
    if (event.pointerId !== mousePointerId) return;
    mousePointerId = null;
    finishDrag(event.clientY, event.timeStamp, cancelled);
  }

  function handleClick() {
    // A drag also ends in a click on the handle; only a real tap toggles.
    if (moved) {
      moved = false;
      return;
    }
    snap = snap === 'peek' ? 'half' : 'peek';
  }

  function handleKeydown(event: KeyboardEvent) {
    const order: SheetSnap[] = ['peek', 'half', 'full'];
    const index = order.indexOf(snap);
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      snap = order[Math.min(order.length - 1, index + 1)];
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      snap = order[Math.max(0, index - 1)];
    }
  }
</script>

<section
  bind:this={sectionElement}
  data-globe-sheet
  data-sheet-snap={snap}
  class={[
    'bg-surface-50-950 fixed inset-x-0 bottom-0 z-10 flex flex-col overscroll-none rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.3)]',
    dragHeight === null &&
      'transition-transform duration-300 ease-out motion-reduce:transition-none',
  ]}
  style:height="{heights.full}px"
  style:transform="translateY({heights.full - height}px)"
  aria-label="Places on the globe"
>
  <button
    type="button"
    class="flex w-full shrink-0 cursor-grab touch-none flex-col items-center gap-1 pt-2 pb-1 select-none active:cursor-grabbing"
    aria-expanded={snap !== 'peek'}
    aria-label={snap === 'peek'
      ? `Show the list of places. ${label}`
      : `Collapse the list of places. ${label}`}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={(event) => handlePointerUp(event, false)}
    onpointercancel={(event) => handlePointerUp(event, true)}
    onclick={handleClick}
    onkeydown={handleKeydown}
  >
    <span class="bg-surface-400-600 h-1.5 w-10 rounded-full"></span>
    <span class="text-surface-600-400 text-xs">{label}</span>
  </button>

  <div class="min-h-0 flex-1">
    {@render children()}
  </div>
</section>

<style>
  /*
   * The page itself must never move under the sheet. It has no content to
   * scroll in this layout, but iOS still rubber-bands the document (and can
   * scroll it to hide the address bar), which drags the fixed globe and
   * sheet along with it.
   *
   * Done in CSS rather than by saving and restoring inline styles on
   * <html>/<body>: the menu dialog (Zag) locks body scroll the same way, and
   * when its lifetime overlapped the sheet's — opening the globe from the
   * menu — each captured the other's lock as the "original" style and put it
   * back afterwards, leaving every later page unscrollable on iOS. This lock
   * simply ends when the sheet leaves the DOM.
   */
  :global(html:has([data-globe-sheet])),
  :global(html:has([data-globe-sheet]) body) {
    overflow: hidden;
    overscroll-behavior: none;
  }
</style>
