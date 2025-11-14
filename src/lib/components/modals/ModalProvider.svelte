<script lang="ts">
  import { allGaugesAttributes, gauges, modal, weather } from '$lib/state';
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import CloseButton from './CloseButton.svelte';
  import SaveAndCloseButtons from './SaveAndCloseButtons.svelte';

  // The following animation is optional.
  // This may also be included inline.
  const animation =
    'transition transition-discrete opacity-0 translate-y-[100px] starting:data-[state=open]:opacity-0 starting:data-[state=open]:translate-y-[100px] data-[state=open]:opacity-100 data-[state=open]:translate-y-0';
</script>

<Dialog bind:open={modal.opened}>
  <!-- <Dialog.Trigger class="hidden">Trigger</Dialog.Trigger> -->
  <Portal>
    <Dialog.Backdrop
      class="bg-surface-50-950/50 fixed inset-0 z-50 backdrop-blur-md"
    />
    <Dialog.Positioner
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <Dialog.Content
        class="card bg-surface-50 dark:bg-surface-950 max-h-[100svh] space-y-4 overflow-auto shadow-xl max-sm:min-w-[100vw] lg:max-h-[80svh] {animation} {modal
          .options.size === 'large'
          ? 'max-w-(--breakpoint-lg)'
          : modal.options.size === 'medium'
            ? 'max-w-(--breakpoint-md)'
            : 'max-w-(--breakpoint-sm)'}"
      >
        {#if modal.type === 'component'}
          {#if modal.options.showCloseButton}
            <div class="sticky top-2 z-10 mr-2">
              <Dialog.CloseTrigger
                ><CloseButton
                  onClose={() => {
                    modal.close();
                  }}
                /></Dialog.CloseTrigger
              >
            </div>
          {/if}
          {#key modal.contentComponent.ref}
            {#if modal.contentComponent.ref}
              <modal.contentComponent.ref {...modal.contentComponent.props} />
            {/if}
          {/key}
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

            <Dialog.CloseTrigger>
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
            </Dialog.CloseTrigger>
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
            <Dialog.CloseTrigger>
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
            </Dialog.CloseTrigger>
          </div>
        {/if}
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>
