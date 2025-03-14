<script lang="ts">
  import { run } from 'svelte/legacy';

  import { flip } from 'svelte/animate';

  import { toast } from '$lib/state';
  import { fade } from 'svelte/transition';
  import {
    CircleAlertIcon,
    CircleCheckIcon,
    InfoIcon,
    TriangleAlertIcon,
  } from '@lucide/svelte';

  // Props

  // Props (styles)

  // Props (buttons)

  interface Props {
    /** Set the toast position.
     * @type {'t' | 'b' | 'l' | 'r' | 'tl' | 'tr' | 'bl' | 'br'}
     */
    position?: 't' | 'b' | 'l' | 'r' | 'tl' | 'tr' | 'bl' | 'br';
    /** Maximum toasts that can show at once. */
    max?: number;
    /** Provide classes to set the background color. */
    background?: string;
    /** Provide classes to set width styles. */
    width?: string;
    /** Provide classes to set the text color. */
    color?: string;
    /** Provide classes to set the padding. */
    padding?: string;
    /** Provide classes to set toast horizontal spacing. */
    spacing?: string;
    /** Provide classes to set the border radius styles. */
    rounded?: string;
    /** Provide classes to set the border box shadow. */
    shadow?: string;
    /** Provide a class to override the z-index */
    zIndex?: string;
    /** Provide styles for the action button. */
    buttonAction?: string;
    /** Provide styles for the dismiss button. */
    buttonDismiss?: string;
    /** The button label text. */
    buttonDismissLabel?: string;
  }

  let {
    position = 'b',
    max = 3,
    background = 'preset-filled-surface-100-900',
    width = 'max-w-[640px]',
    color = '',
    padding = 'p-4',
    spacing = 'space-x-4',
    rounded = 'rounded-container',
    shadow = 'shadow-lg',
    zIndex = 'z-9999',
    buttonAction = 'btn preset-filled',
    buttonDismiss = 'btn-icon hover:preset-tonal',
    buttonDismissLabel = '✕',
  }: Props = $props();

  // Base Classes
  const cWrapper =
    'flex fixed top-0 left-0 right-0 bottom-0 pointer-events-none ';
  const cSnackbar = 'flex flex-col gap-y-2';
  const cToast = 'flex justify-between items-center pointer-events-auto';
  const cToastActions = 'flex items-center space-x-2';

  // Local
  let cPosition: string = $state();
  let cAlign: string = $state(); // items-center
  let animAxis = { x: 0, y: 0 };

  // Set Position
  // prettier-ignore
  switch (position) {
		// Middles
		case('t'): cPosition = 'justify-center items-start'; cAlign = 'items-center'; animAxis = { x: 0, y: -100 }; break;
		case('b'): cPosition = 'justify-center items-end'; cAlign = 'items-center'; animAxis = { x: 0, y: 100 }; break;
		case('l'): cPosition = 'justify-start items-center'; cAlign = 'items-start'; animAxis = { x: -100, y: 0 }; break;
		case('r'): cPosition = 'justify-end items-center'; cAlign = 'items-end'; animAxis = { x: 100, y: 0 }; break;
		// Corners
		case ('tl'): cPosition = 'justify-start items-start'; cAlign = 'items-start'; animAxis = { x: -100, y: 0 }; break;
		case ('tr'): cPosition = 'justify-end items-start'; cAlign = 'items-end'; animAxis = { x: 100, y: 0 }; break;
		case ('bl'): cPosition = 'justify-start items-end'; cAlign = 'items-start'; animAxis = { x: -100, y: 0 }; break;
		case ('br'): cPosition = 'justify-end items-end'; cAlign = 'items-end'; animAxis = { x: 100, y: 0 }; break;
	}

  function onAction(index: number): void {
    toast.queue[index]?.action?.response();
    toast.close(toast.queue[index].id);
  }

  function onMouseEnter(index: number): void {
    if (toast.queue[index]?.hoverable) {
      toast.freeze(index);
      classesSnackbar += ' scale-[105%]';
    }
  }

  function onMouseLeave(index: number): void {
    if (toast.queue[index]?.hoverable) {
      toast.unfreeze(index);
      classesSnackbar = classesSnackbar.replace(' scale-[105%]', '');
    }
  }

  let wrapperVisible = $state(false);

  // Reactive
  let classesWrapper = $derived(`${cWrapper} ${cPosition} ${zIndex}`);

  let classesSnackbar = $derived(`${cSnackbar} ${cAlign} ${padding}`);

  let classesToast = $derived(
    `${cToast} ${width} ${color} ${padding} ${spacing} ${rounded} ${shadow}`,
  );
  // Filtered Toast Store
  let filteredToasts = $derived(Array.from(toast.queue).slice(0, max));

  run(() => {
    if (filteredToasts.length) {
      wrapperVisible = true;
    }
  });
</script>

{#if filteredToasts.length > 0 || wrapperVisible}
  <!-- Wrapper -->
  <div class="snackbar-wrapper {classesWrapper}" data-testid="snackbar-wrapper">
    <!-- List -->
    <div class="snackbar {classesSnackbar}">
      {#each filteredToasts as t, i (t)}
        <div
          animate:flip={{ duration: 250 }}
          transition:fade
          onoutroend={() => {
            const outroFinishedForLastToastOnQueue =
              filteredToasts.length === 0;
            if (outroFinishedForLastToastOnQueue) wrapperVisible = false;
          }}
          onmouseenter={() => onMouseEnter(i)}
          onmouseleave={() => onMouseLeave(i)}
          role={t.hideDismiss ? 'alert' : 'alertdialog'}
          aria-live="polite"
        >
          <!-- Toast -->
          <div
            class={[
              'toast',
              classesToast,
              t.category === 'success' && 'preset-filled-success-100-900',
              t.category === 'error' && 'preset-filled-error-50-950',
              t.category === 'info' && 'preset-filled-secondary-100-900',
              !t.category && (t.background || background),
              t.classes,
            ]}
            data-testid="toast"
          >
            {#if t.category === 'success'}
              <div class="flex flex-wrap items-center gap-1 text-base">
                <CircleCheckIcon class="inline" />
                {@html t.message}
              </div>
            {:else if t.category === 'error'}
              <div class="flex flex-wrap items-center gap-1 text-base">
                <CircleAlertIcon class="inline" />
                {@html t.message}
              </div>
            {:else if t.category === 'info'}
              <div class="flex flex-wrap items-center gap-1 text-base">
                <InfoIcon class="inline" />
                {@html t.message}
              </div>
            {:else}
              <div class="text-base">{@html t.message}</div>
            {/if}
            {#if t.action || !t.hideDismiss}
              <div class="toast-actions {cToastActions}">
                {#if t.action}<button
                    class={buttonAction}
                    onclick={() => onAction(i)}>{@html t.action.label}</button
                  >{/if}
                {#if !t.hideDismiss}<button
                    class={buttonDismiss}
                    aria-label="Dismiss toast"
                    onclick={() => toast.close(t.id)}
                    >{buttonDismissLabel}</button
                  >{/if}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}
