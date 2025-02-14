<script lang="ts">
  import { modal } from '$lib/state';
  import { onMount, type Snippet } from 'svelte';
  import CloseButton from './CloseButton.svelte';

  interface Props {
    size?: 'large' | 'small';
    preventDefaultFocus?: boolean; // used when the yarn grid select component is inside the modal. Focusing on the first element (the default modal behavior) causes the yarn select element to render its' menu in the wrong position, because of the transition time.
    hideCloseButton?: boolean;
    preventScroll?: boolean; // used for the Image Palette modal, so that when the user is moving their finger over the image to select colors, the modal itself won't scroll
    children?: Snippet;
    stickyPart?: Snippet;
  }

  let {
    preventDefaultFocus,
    hideCloseButton = false,
    preventScroll = false,
    children,
    stickyPart,
  }: Props = $props();

  let shellElement: HTMLElement;

  onMount(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  });

  $effect(() => {
    if (preventDefaultFocus) {
      shellElement.focus();
    }
  });
</script>

<div
  role="button"
  bind:this={shellElement}
  tabindex="0"
  class={[
    'max-h-[97svh] overflow-auto focus:!outline-none cursor-default',
    preventScroll && 'overflow-hidden',
  ]}
>
  <div class={stickyPart ? 'p-4' : ''}>
    {#if !hideCloseButton && !stickyPart}
      <CloseButton
        onClose={() => {
          modal.close();
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
