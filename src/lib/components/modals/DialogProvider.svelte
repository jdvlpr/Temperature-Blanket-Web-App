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
  import { dialog } from '$lib/state/page-state.svelte';
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import { ArrowLeftIcon } from '@lucide/svelte';
  import { motion } from '$lib/utils/feedback.svelte';
  import { cubicOut, linear } from 'svelte/easing';
  import { MediaQuery } from 'svelte/reactivity';
  import { fade, fly } from 'svelte/transition';
  import CloseButton from './CloseButton.svelte';
  import SaveAndCloseButtons from './SaveAndCloseButtons.svelte';

  // The Project menu: a panel that slides in from the right
  const side = $derived(dialog.options.placement === 'side');

  // Below the sm breakpoint a dialog is a bottom sheet
  const phone = new MediaQuery('(max-width: 639.98px)');

  // A titled dialog, or one opened from another, has a header bar
  const hasHeader = $derived(
    Boolean(dialog.options.title) ||
      dialog.stack.length > 0 ||
      Boolean(dialog.backAction),
  );

  // Moving between views of a dialog: a short slide, forward from the right
  // and back from the left. Nothing for a dialog opening by itself.
  const reduceMotion = $derived(motion.reduced);
  const moving = $derived(dialog.direction !== 'none' && !reduceMotion);
  const viewFly = $derived(
    moving
      ? {
          x: dialog.direction === 'back' ? -32 : 32,
          duration: 220,
          easing: cubicOut,
        }
      : { duration: 0 },
  );
  const viewFade = $derived({ duration: moving ? 180 : 0 });

  // Opening: rises into place (further on phones, where it comes up from the
  // bottom edge); the side panel slides in with CSS instead
  const openFly = $derived(
    side || reduceMotion
      ? { duration: 0 }
      : { y: phone.current ? 120 : 50, duration: 400, easing: cubicOut },
  );

  // Closing: a sheet slides down off the bottom edge (from wherever a drag
  // left it, at the speed it was let go), the side panel slides back out to
  // the right, and a dialog on a larger screen fades as it drops a little
  let releaseVelocity = 0;

  function closeOut(node: HTMLElement) {
    if (reduceMotion) return { duration: 0 };
    if (side)
      return {
        duration: 250,
        easing: cubicOut,
        css: (_t: number, u: number) => `transform: translateX(${u * 100}%)`,
      };
    if (!phone.current)
      return {
        duration: 150,
        easing: cubicOut,
        css: (t: number, u: number) =>
          `opacity: ${t}; transform: translateY(${u * 16}px)`,
      };
    const from = dragOffset;
    const distance = Math.max(0, node.offsetHeight - from);
    const thrown = releaseVelocity > 0;
    return {
      // Thrown: keep going at the release speed (but never crawl); otherwise
      // the same pace as opening
      duration: thrown
        ? Math.min(
            300,
            Math.max(120, distance / Math.max(releaseVelocity, 1.5)),
          )
        : 280,
      easing: thrown ? linear : cubicOut,
      css: (_t: number, u: number) =>
        `transform: translateY(${from + distance * u}px)`,
    };
  }

  // Dragging a phone's sheet down (by its top bar, or its content when
  // scrolled to the top): far or fast enough closes it, otherwise it settles
  // back. Close and Escape do the same without dragging.
  const grabbable = $derived(!side && phone.current);

  /** Movement under this many px is a tap, not a drag. */
  const TAP_SLOP_PX = 6;
  /** Released faster than this (px/ms, downwards), the sheet closes. */
  const CLOSE_VELOCITY = 0.5;

  let topBar: HTMLElement | undefined = $state();
  let dragOffset = $state(0);
  let dragging = $state(false);
  let sheetHeight = $state(0);
  // How far the sheet has gone towards closed, for fading the backdrop
  const dragProgress = $derived(
    sheetHeight ? Math.min(1, dragOffset / sheetHeight) : 0,
  );
  let startY = 0;
  let samples: { y: number; t: number }[] = [];

  // Reset on opening, not closing: the closing slide starts from the drag
  $effect(() => {
    if (dialog.opened) {
      dragOffset = 0;
      dragging = false;
      releaseVelocity = 0;
    }
  });

  /** A press on a control in the top bar (Back, Close) isn't a drag */
  function onControl(target: EventTarget | null) {
    return Boolean(
      (target as HTMLElement | null)?.closest(
        'button, a, input, [role="button"]',
      ),
    );
  }

  function beginDrag(y: number, t: number) {
    startY = y;
    samples = [{ y, t }];
    sheetHeight = dialog.scrollElement?.offsetHeight ?? 0;
    dragging = true;
  }

  function moveDrag(y: number, t: number) {
    // Down only: the sheet already reaches as high as it goes
    dragOffset = Math.max(0, y - startY);
    samples.push({ y, t });
    // Only the last ~100ms decide the release velocity
    while (samples.length > 2 && t - samples[0].t > 100) samples.shift();
  }

  function finishDrag(y: number, t: number, cancelled: boolean) {
    if (!dragging) return;
    dragging = false;
    // From the moves in the last ~100ms before letting go: none if the
    // finger stopped first
    samples.push({ y, t });
    const recent = samples.filter((sample) => t - sample.t <= 100);
    const first = recent[0];
    const dt = t - first.t;
    const velocity = !cancelled && dt > 0 ? (y - first.y) / dt : 0;
    const closing =
      !cancelled &&
      dragOffset > TAP_SLOP_PX &&
      (dragOffset > sheetHeight / 4 || velocity > CLOSE_VELOCITY);
    if (closing) {
      releaseVelocity = Math.max(0, velocity);
      dialog.close();
    } else {
      dragOffset = 0;
    }
  }

  /*
   * Touch, as with the globe's places sheet: pointer events can't do this on
   * a phone, since once the browser claims a touch for scrolling it fires
   * pointercancel and the page (or iOS's rubber-band bounce) moves instead
   * of the sheet. A non-passive touchmove can preventDefault that, and
   * Svelte registers ontouchmove as passive, hence addEventListener.
   *
   * The top bar always drags. The content drags too, the way the system's
   * sheets do, when pulled down while scrolled to the top, except where a
   * touch means something else there: form fields, canvases, anything that
   * handles its own touches (touch-action other than auto/manipulation),
   * and anything marked data-sheet-no-drag (e.g. reorder handles).
   */
  let touchMode: 'undecided' | 'sheet' | 'none' = 'none';
  let touchStart = { x: 0, y: 0, t: 0 };

  function handlesItsOwnTouches(target: Element, sheet: HTMLElement) {
    if (
      target.closest(
        'input, textarea, select, canvas, [contenteditable], [data-sheet-no-drag]',
      )
    )
      return true;
    for (
      let element: Element | null = target;
      element && element !== sheet;
      element = element.parentElement
    ) {
      const touchAction = getComputedStyle(element).touchAction;
      if (touchAction !== 'auto' && touchAction !== 'manipulation') return true;
      // Something inside that's scrolled down scrolls back up first
      if (element.scrollTop > 0) return true;
    }
    return false;
  }

  function sheetTouch(sheet: HTMLElement) {
    function start(event: TouchEvent) {
      touchMode = 'none';
      if (!grabbable || event.touches.length !== 1) return;
      const target = event.target as Element;
      if (topBar?.contains(target)) {
        if (onControl(target)) return;
        touchMode = 'sheet';
      } else {
        if (sheet.scrollTop > 0 || handlesItsOwnTouches(target, sheet)) return;
        touchMode = 'undecided';
      }
      const touch = event.touches[0];
      touchStart = { x: touch.clientX, y: touch.clientY, t: event.timeStamp };
      if (touchMode === 'sheet') beginDrag(touch.clientY, event.timeStamp);
    }

    function move(event: TouchEvent) {
      if (touchMode === 'none' || event.touches.length !== 1) return;
      const touch = event.touches[0];
      if (touchMode === 'undecided') {
        // Decided on the very first movement: after that, the browser may
        // have committed to scrolling and the event can't be cancelled
        const dx = touch.clientX - touchStart.x;
        const dy = touch.clientY - touchStart.y;
        if (dx === 0 && dy === 0) return;
        const pullingDown = dy > 0 && dy >= Math.abs(dx);
        if (!pullingDown || sheet.scrollTop > 0) {
          touchMode = 'none';
          return;
        }
        touchMode = 'sheet';
        beginDrag(touchStart.y, touchStart.t);
      }
      if (event.cancelable) event.preventDefault();
      moveDrag(touch.clientY, event.timeStamp);
    }

    function end(event: TouchEvent) {
      if (touchMode !== 'sheet') {
        touchMode = 'none';
        return;
      }
      touchMode = 'none';
      const touch = event.changedTouches[0];
      finishDrag(
        touch?.clientY ?? samples[samples.length - 1].y,
        event.timeStamp,
        event.type === 'touchcancel',
      );
    }

    const options = { passive: false } as const;
    sheet.addEventListener('touchstart', start, options);
    sheet.addEventListener('touchmove', move, options);
    sheet.addEventListener('touchend', end);
    sheet.addEventListener('touchcancel', end);
    return {
      destroy() {
        sheet.removeEventListener('touchstart', start);
        sheet.removeEventListener('touchmove', move);
        sheet.removeEventListener('touchend', end);
        sheet.removeEventListener('touchcancel', end);
      },
    };
  }

  // A mouse or pen, e.g. a desktop browser in a narrow window
  let pointerId: number | null = null;

  function handlePointerDown(event: PointerEvent) {
    if (!grabbable || event.pointerType === 'touch' || event.button !== 0)
      return;
    if (onControl(event.target)) return;
    pointerId = event.pointerId;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    beginDrag(event.clientY, event.timeStamp);
  }

  function handlePointerMove(event: PointerEvent) {
    if (event.pointerId !== pointerId) return;
    moveDrag(event.clientY, event.timeStamp);
  }

  function handlePointerUp(event: PointerEvent, cancelled: boolean) {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    finishDrag(event.clientY, event.timeStamp, cancelled);
  }
</script>

<Dialog
  open={dialog.opened}
  onOpenChange={(e) => (dialog.opened = e.open)}
  initialFocusEl={undefined}
>
  <Portal>
    <!-- Blurred behind, as with the site menu's drawer; the side panel also
    fades in, and slides in from the right (the site menu comes from the left) -->
    <Dialog.Backdrop
      class={[
        'bg-surface-50-950/50 fixed inset-0 z-60 backdrop-blur-md',
        side &&
          !reduceMotion &&
          'opacity-0 transition transition-discrete data-[state=open]:opacity-100 starting:data-[state=open]:opacity-0',
      ]}
      style={grabbable
        ? `opacity: ${1 - dragProgress}; transition: ${dragging || reduceMotion ? 'none' : 'opacity 200ms ease-out'}`
        : undefined}
    >
      {#snippet element(attributes)}
        {#if !attributes.hidden}
          <!-- The side panel's backdrop fades in with CSS -->
          <div
            {...attributes}
            in:fade={{ duration: side || reduceMotion ? 0 : 200 }}
            out:fade={{ duration: reduceMotion ? 0 : 200 }}
          ></div>
        {/if}
      {/snippet}
    </Dialog.Backdrop>
    <Dialog.Positioner
      class={[
        'fixed inset-0 z-60 flex items-center justify-center',
        side ? 'items-stretch justify-end' : 'max-sm:items-end',
      ]}
    >
      <Dialog.Content
        class={[
          'bg-surface-50 dark:bg-surface-950 max-h-dvh space-y-4 overflow-auto max-sm:min-w-screen',
          side
            ? reduceMotion
              ? 'h-dvh w-full sm:w-md'
              : 'h-dvh w-full translate-x-full opacity-0 transition transition-discrete data-[state=open]:translate-x-0 data-[state=open]:opacity-100 sm:w-md starting:data-[state=open]:translate-x-full starting:data-[state=open]:opacity-0'
            : [
                // A sheet on phones: square at the bottom edge, and short of
                // the top so its rounded corners sit against the backdrop
                'card shadow-xl max-sm:max-h-[calc(100dvh-2rem)] max-sm:rounded-b-none',
                dialog.options.size === 'xlarge'
                  ? 'w-full lg:max-h-[92svh]'
                  : 'lg:max-h-[80svh]',
              ],
          dialog.options.size === 'xlarge'
            ? 'max-w-(--breakpoint-xl)'
            : dialog.options.size === 'large'
              ? 'max-w-(--breakpoint-lg)'
              : dialog.options.size === 'medium'
                ? 'max-w-(--breakpoint-md)'
                : 'max-w-(--breakpoint-sm)',
        ]}
      >
        {#snippet element(attributes)}
          {#if !attributes.hidden}
            <div
              {...attributes}
              bind:this={dialog.scrollElement}
              in:fly={openFly}
              out:closeOut
              use:sheetTouch
              style:transform={dragOffset
                ? `translateY(${dragOffset}px)`
                : undefined}
              style:transition={side
                ? undefined
                : dragging || reduceMotion
                  ? 'none'
                  : 'transform 200ms ease-out'}
            >
              {#if grabbable || (dialog.type === 'component' && hasHeader)}
                <!-- The top bar, always in view: on phones the sheet's grab bar,
                and the whole bar drags the sheet (except its buttons); for a
                titled dialog, one header for every one: Back, title, Close.
                z-20: above content with its own z-index (e.g. segmented
                control items, z-10) -->
                <!-- Dragging is a pointer shortcut for Close/Escape, which
                everyone has, so the bar itself isn't a control -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                  bind:this={topBar}
                  class={[
                    'bg-surface-50 dark:bg-surface-950 sticky top-0 z-20 mb-0',
                    grabbable &&
                      'cursor-grab touch-none select-none active:cursor-grabbing',
                  ]}
                  onpointerdown={handlePointerDown}
                  onpointermove={handlePointerMove}
                  onpointerup={(event) => handlePointerUp(event, false)}
                  onpointercancel={(event) => handlePointerUp(event, true)}
                >
                  {#if grabbable}
                    <div
                      aria-hidden="true"
                      class="flex h-4 items-end justify-center"
                    >
                      <div
                        class="bg-surface-950-50/25 h-1 w-9 rounded-full"
                      ></div>
                    </div>
                  {/if}
                  {#if dialog.type === 'component' && hasHeader}
                    <header class="flex min-h-14 items-center gap-1 px-2 py-2">
                      {#if dialog.stack.length || dialog.backAction}
                        <button
                          type="button"
                          class="btn-icon hover:preset-tonal-surface"
                          aria-label="Back"
                          title="Back"
                          data-dialog-back
                          onclick={() =>
                            dialog.backAction
                              ? dialog.backAction()
                              : dialog.back()}
                          in:fade={{ duration: reduceMotion ? 0 : 150 }}
                        >
                          <ArrowLeftIcon />
                        </button>
                      {/if}
                      {#key dialog.options.title}
                        <Dialog.Title
                          class="min-w-0 flex-1 truncate px-2 text-lg font-bold"
                        >
                          {#snippet element(attributes)}
                            <h2 {...attributes}>
                              <span class="block truncate" in:fade={viewFade}
                                >{dialog.options.title ?? ''}</span
                              >
                            </h2>
                          {/snippet}
                        </Dialog.Title>
                      {/key}
                      {#if dialog.options.showCloseButton}
                        <CloseButton onClose={dialog.close} />
                      {/if}
                    </header>
                  {/if}
                </div>
              {/if}
              {#if dialog.type === 'component'}
                {#if !hasHeader && dialog.options.showCloseButton}
                  <div class="sticky top-2 z-20 float-right mr-2">
                    <CloseButton onClose={dialog.close} />
                  </div>
                {/if}

                {#if dialog.contentComponent.ref}
                  {#key dialog.contentComponent.ref}
                    <!-- Opened from the panel, or back to it: slides in from
                    the way it went -->
                    <div in:fly={viewFly}>
                      <dialog.contentComponent.ref
                        {...dialog.contentComponent.props ?? {}}
                      />
                    </div>
                  {/key}
                {/if}
              {:else if dialog.type === 'confirm'}
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label={dialog.title ?? ''}
                  class="flex flex-col gap-4 p-4"
                >
                  {#if dialog.title}
                    <h4 class="h4">{dialog.title}</h4>
                  {/if}
                  {#if dialog.body}
                    <p>{dialog.body}</p>
                  {/if}
                  <div>
                    <SaveAndCloseButtons
                      saveText="Yes"
                      onSave={() => {
                        dialog.response(true);
                        dialog.close();
                      }}
                      onClose={() => {
                        dialog.response(false);
                        dialog.close();
                      }}
                    />
                  </div>
                </div>
              {/if}
            </div>
          {/if}
        {/snippet}
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>
