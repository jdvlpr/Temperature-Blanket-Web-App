<script lang="ts">
  import { modal } from '$lib/state';
  import { Modal } from '@skeletonlabs/skeleton-svelte';
  import CloseButton from './CloseButton.svelte';
</script>

<Modal
  bind:open={modal.opened}
  triggerBase="hidden"
  contentBase="card bg-surface-100-900 space-y-4 shadow-xl max-h-[90svh] overflow-auto {modal
    .options.size === 'large'
    ? 'max-w-screen-lg'
    : modal.options.size === 'medium'
      ? 'max-w-screen-md'
      : 'max-w-screen-sm'}"
  positionerPadding="p-0"
  backdropClasses="backdrop-blur-md"
  transitionsBackdropOut={{ duration: 0 }}
  transitionsPositionerOut={{ duration: 0 }}
>
  {#snippet content()}
    {#key modal.opened}
      {#if modal.options.showCloseButton}
        <div class="sticky top-2 mr-2">
          <CloseButton
            onClose={() => {
              modal.close();
            }}
          />
        </div>
      {/if}
      <modal.contentComponent.ref {...modal.contentComponent.props} />
    {/key}
  {/snippet}
</Modal>
