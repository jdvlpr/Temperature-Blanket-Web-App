<script lang="ts">
  import { getModalStore } from '@skeletonlabs/skeleton';
  import CloseButton from './CloseButton.svelte';

  interface Props {
    parent: any;
    children?: import('svelte').Snippet;
    stickyPart?: import('svelte').Snippet;
  }

  let { parent, children, stickyPart }: Props = $props();

  const modalStore = getModalStore();

</script>

<div
  class="{parent?.background} {parent?.rounded} {parent?.position} {parent?.width} {parent?.height} {stickyPart ? '' : parent?.padding} {parent?.spacing} {parent?.shadow} max-h-[95svh] overflow-scroll relative"
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
