<script lang="ts">
  import { modal } from '$lib/state';
  import { Modal } from '@skeletonlabs/skeleton-svelte';
  import type { Snippet } from 'svelte';
  import CloseButton from './CloseButton.svelte';
</script>

<Modal
  bind:open={modal.opened}
  triggerBase="hidden"
  contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-h-[90svh] overflow-auto max-w-screen-sm"
  positionerPadding="p-0"
  backdropClasses="backdrop-blur-sm"
>
  {#snippet content()}
    {#key modal.opened}
      {#if modal.contentComponent.ref}
        <div class={modal.contentComponent.props?.stickyPart ? 'p-4' : ''}>
          {#if modal.options.showCloseButton && !modal.contentComponent.props?.stickyPart}
            <div class="sticky top-2 right-2">
              <CloseButton
                onClose={() => {
                  modal.close();
                }}
              />
            </div>
          {/if}
          <modal.contentComponent.ref {...modal.contentComponent.props} />
        </div>
        {#if modal.contentComponent.props?.stickyPart}
          {@render modal.contentComponent.props.stickyPart()}
        {/if}
      {/if}
    {/key}
  {/snippet}
</Modal>
