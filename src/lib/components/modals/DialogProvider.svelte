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
  import { cubicOut } from 'svelte/easing';
  import { prefersReducedMotion } from 'svelte/motion';
  import { fade, fly } from 'svelte/transition';
  import CloseButton from './CloseButton.svelte';
  import SaveAndCloseButtons from './SaveAndCloseButtons.svelte';

  // The Project menu: a panel that slides in from the right
  const side = $derived(dialog.options.placement === 'side');

  // A titled dialog, or one opened from another, has a header bar
  const hasHeader = $derived(
    Boolean(dialog.options.title) ||
      dialog.stack.length > 0 ||
      Boolean(dialog.backAction),
  );

  // Moving between views of a dialog: a short slide, forward from the right
  // and back from the left. Nothing for a dialog opening by itself.
  const reduceMotion = $derived(prefersReducedMotion.current);
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
          'opacity-0 transition transition-discrete data-[state=open]:opacity-100 starting:data-[state=open]:opacity-0',
      ]}
    />
    <Dialog.Positioner
      class={[
        'fixed inset-0 z-60 flex items-center justify-center',
        side && 'items-stretch justify-end',
      ]}
    >
      <Dialog.Content
        class={[
          'bg-surface-50 dark:bg-surface-950 max-h-dvh space-y-4 overflow-auto max-sm:min-w-screen',
          side
            ? 'h-dvh w-full translate-x-full opacity-0 transition transition-discrete data-[state=open]:translate-x-0 data-[state=open]:opacity-100 sm:w-md starting:data-[state=open]:translate-x-full starting:data-[state=open]:opacity-0'
            : [
                'card shadow-xl',
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
              in:fly={side ? { duration: 0 } : { y: 50, duration: 400 }}
            >
              {#if dialog.type === 'component'}
                {#if hasHeader}
                  <!-- One header for every titled dialog: Back, title, Close -->
                  <header
                    class="bg-surface-50 dark:bg-surface-950 sticky top-0 z-10 mb-0 flex min-h-14 items-center gap-1 px-2 py-2"
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
                  <div class="sticky top-2 z-10 float-right mr-2">
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
