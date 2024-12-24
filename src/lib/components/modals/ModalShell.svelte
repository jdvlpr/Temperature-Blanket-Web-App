<script lang="ts">
  import { isDesktop } from '$lib/stores';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import CloseButton from './CloseButton.svelte';

  interface Props {
    parent: any;
    size?: string;
    preventDefaultFocus?: boolean;
    children?: import('svelte').Snippet;
    stickyPart?: import('svelte').Snippet;
  }

  let { parent, size, preventDefaultFocus, children, stickyPart }: Props = $props();

  let width = $state(parent?.width);
  const modalStore = getModalStore();

  let shellElement;

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

<div
bind:this={shellElement}
tabindex="0"
  class="{parent?.background} {parent?.rounded} {parent?.position} {width} {parent?.height} {stickyPart ? '' : parent?.padding} {parent?.spacing} {parent?.shadow} max-h-[100svh] sm:max-h-[96svh] overflow-auto focus:!outline-none"
>
  <div class="{stickyPart ? 'p-4' : ''}">
    {#if $modalStore[0] && !stickyPart}
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
