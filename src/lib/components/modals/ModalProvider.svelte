<script lang="ts">
  import { allGaugesAttributes, gauges, modal, weather } from '$lib/state';
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
  contentBase="card bg-surface-50 dark:bg-surface-950 space-y-4 shadow-xl max-h-[100svh] lg:max-h-[80svh] overflow-auto max-sm:min-w-[100vw] {modal
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
    {:else if modal.type === 'choose-weather-params'}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modal.title ?? ''}
        class="flex flex-col gap-4 p-4"
      >
        <h2 class="h2">Download PDF</h2>

        <div class="flex flex-col gap-2">
          <p class="font-bold">Gauges</p>
          <div class="flex flex-col gap-1">
            {#each gauges.allCreated as { id, label }}
              <label class="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="id"
                  class="checkbox"
                  value={id}
                  bind:group={weather.pdfOptions.gauges}
                />
                <p>{label}</p>
              </label>
            {/each}
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <p class="font-bold">Weather Data</p>
          <div class="flex flex-col gap-1">
            {#each allGaugesAttributes as { targets }}
              {#each targets as { id, label }}
                <label class="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="id"
                    class="checkbox"
                    value={id}
                    bind:group={weather.pdfOptions.weatherDataParams}
                  />

                  <p>{label}</p>
                </label>
              {/each}
            {/each}
          </div>
        </div>

        <SaveAndCloseButtons
          saveText="Download"
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
    {:else if modal.type === 'confirm'}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modal.title ?? ''}
        class="flex flex-col gap-4 p-4"
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
