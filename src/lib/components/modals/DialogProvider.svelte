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
  import { cubicOut } from 'svelte/easing';
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

  // Dragging the sheet's grab bar down: far or fast enough closes it,
  // otherwise it settles back. Close and Escape do the same without dragging.
  let dragOffset = $state(0);
  let dragging = $state(false);
  let dragStart = { y: 0, lastY: 0, lastTime: 0, velocity: 0 };

  $effect(() => {
    if (!dialog.opened) {
      dragOffset = 0;
      dragging = false;
    }
  });

  function onGrabStart(event: PointerEvent) {
    if (!event.isPrimary) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    dragging = true;
    dragStart = {
      y: event.clientY,
      lastY: event.clientY,
      lastTime: event.timeStamp,
      velocity: 0,
    };
  }

  function onGrabMove(event: PointerEvent) {
    if (!dragging) return;
    const elapsed = event.timeStamp - dragStart.lastTime;
    if (elapsed > 0)
      dragStart.velocity = (event.clientY - dragStart.lastY) / elapsed;
    dragStart.lastY = event.clientY;
    dragStart.lastTime = event.timeStamp;
    dragOffset = Math.max(0, event.clientY - dragStart.y);
  }

  function onGrabEnd() {
    if (!dragging) return;
    dragging = false;
    const height = dialog.scrollElement?.offsetHeight ?? 0;
    if (dragOffset > height / 4 || dragStart.velocity > 0.5) {
      if (reduceMotion) {
        dialog.close();
        return;
      }
      // Off the bottom edge, then closed
      dragOffset = height;
      setTimeout(dialog.close, 200);
    } else {
      dragOffset = 0;
    }
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
    />
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
              style:transform={dragOffset
                ? `translateY(${dragOffset}px)`
                : undefined}
              style:transition={side
                ? undefined
                : dragging || reduceMotion
                  ? 'none'
                  : 'transform 200ms ease-out'}
            >
              {#if !side}
                <!-- The sheet's grab bar: drag it down to close. For pointers
                only; Close and Escape do the same for everyone else. A tall
                strip, so it's easy to catch, and nothing else in the sheet
                drags it, so drags inside the content stay their own. -->
                <div
                  aria-hidden="true"
                  class="mb-0 flex h-6 cursor-grab touch-none items-center justify-center active:cursor-grabbing sm:hidden"
                  onpointerdown={onGrabStart}
                  onpointermove={onGrabMove}
                  onpointerup={onGrabEnd}
                  onpointercancel={onGrabEnd}
                >
                  <div class="bg-surface-950-50 h-1.5 w-12 rounded-full"></div>
                </div>
              {/if}
              {#if dialog.type === 'component'}
                {#if hasHeader}
                  <!-- One header for every titled dialog: Back, title, Close. z-20: above
                  content with its own z-index (e.g. segmented control items, z-10) -->
                  <header
                    class="bg-surface-50 dark:bg-surface-950 sticky top-0 z-20 mb-0 flex min-h-14 items-center gap-1 px-2 py-2"
                  >
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
                {:else if dialog.options.showCloseButton}
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
