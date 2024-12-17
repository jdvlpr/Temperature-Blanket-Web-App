<script lang="ts">
  import { getModalStore } from '@skeletonlabs/skeleton';
  import CloseButton from './CloseButton.svelte';

  export let parent: any;

  const modalStore = getModalStore();
</script>

<div
  class="{parent?.background} {parent?.rounded} {parent?.position} {parent?.width} {parent?.height} {parent?.padding} {parent?.spacing} {parent?.shadow} max-h-[90svh] overflow-scroll"
>
  <CloseButton
    onClose={() => {
      if ($modalStore[0]) modalStore.close();
    }}
  />
  <slot></slot>
</div>
