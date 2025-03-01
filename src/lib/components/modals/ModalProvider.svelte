<script lang="ts">
  import { modal } from '$lib/state';
  import { Modal } from '@skeletonlabs/skeleton-svelte';
  import CloseButton from './CloseButton.svelte';
  import SaveAndCloseButtons from './SaveAndCloseButtons.svelte';
</script>

<Modal
  open={modal.opened}
  onOpenChange={(e) => {
    modal.opened = e.open;
  }}
  triggerBase="hidden"
  contentBase="card bg-surface-50-950 space-y-4 shadow-xl max-h-[100svh] lg:max-h-[80svh] overflow-auto max-sm:min-w-[100vw] {modal
    .options.size === 'large'
    ? 'max-w-(--breakpoint-lg)'
    : modal.options.size === 'medium'
      ? 'max-w-(--breakpoint-md)'
      : 'max-w-(--breakpoint-sm)'}"
  positionerPadding="p-0"
  backdropClasses="backdrop-blur-md"
  transitionsBackdropOut={{ duration: 0 }}
  transitionsPositionerOut={{ duration: 0 }}
>
  {#snippet content()}
    {#if modal.type === 'component'}
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
    {:else if modal.type === 'confirm'}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modal.title ?? ''}
        class="p-4 flex flex-col gap-4"
      >
        {#if modal.title}
          <h4 class="h4">{modal.title}</h4>
        {/if}
        {#if modal.body}
          <p>{modal.body}</p>
        {/if}
        <SaveAndCloseButtons
          saveText="Yes"
          onSave={() => {
            modal.response(true);
            modal.close();
          }}
          onClose={() => {
            modal.response(false);
            modal.close();
          }}
        />
      </div>
    {/if}
  {/snippet}
</Modal>
