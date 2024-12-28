<script lang="ts">
  import { isDesktop } from '$lib/stores';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import CloseButton from './CloseButton.svelte';
  import { onMount, type Snippet } from 'svelte';

  interface Props {
    parent: any;
    size?: 'large' | 'small';
    preventDefaultFocus?: boolean; // used when the yarn grid select component is inside the modal. Focusing on the first element (the default modal behavior) causes the yarn select element to render its' menu in the wrong position, because of the transition time.
    hideCloseButton?: boolean;
    preventScroll?: boolean; // used for the Image Palette modal, so that when the user is moving their finger over the image to select colors, the modal itself won't scroll
    children?: Snippet;
    stickyPart?: Snippet;
  }

  let { parent, size, preventDefaultFocus, hideCloseButton = false, preventScroll = false, children, stickyPart }: Props = $props();

  let width = $state(parent?.width);
  
  const modalStore = getModalStore();

  let shellElement: HTMLElement;

  onMount(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    }
  })

$effect(() => {
  if (!isDesktop.current) width = 'w-[100vw]';
  else if (size === 'large') width = 'w-modal-wide';
  else if (size === 'small') width = 'w-modal-slim';
  else width = parent?.width || '';
})

$effect(() => {
  if (preventDefaultFocus) {
    shellElement.focus();
  }
})
</script>

<!-- TODO: Fix the tabindex warning -->
<div
bind:this={shellElement}
tabindex="0"
  class="{parent?.background} {parent?.rounded} {parent?.position} {width} {parent?.height} {stickyPart ? '' : parent?.padding} {parent?.spacing} {parent?.shadow} max-h-[97svh] overflow-auto focus:!outline-none {preventScroll ? 'overflow-hidden' : ''}"
>
  <div class="{stickyPart ? 'p-4' : ''}">
    {#if !hideCloseButton && $modalStore[0] && !stickyPart}
      <CloseButton
        onClose={() => {
          if ($modalStore[0]) modalStore.close();
        }}
      />
    {/if}
    {#if children}
      {@render children()}
    {/if}
  </div>

  {#if stickyPart}
    {@render stickyPart()}
  {/if}
</div>
