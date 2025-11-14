<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script lang="ts">
  import { allGaugesAttributes, gauges, dialog, weather } from '$lib/state';
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import { fly } from 'svelte/transition';
  import CloseButton from './CloseButton.svelte';
  import SaveAndCloseButtons from './SaveAndCloseButtons.svelte';
</script>

<Dialog open={dialog.opened} onOpenChange={(e) => (dialog.opened = e.open)}>
  <Portal>
    <Dialog.Backdrop
      class="bg-surface-50-950/50 fixed inset-0 z-50 backdrop-blur-md"
    />
    <Dialog.Positioner
      class="fixed inset-0 z-50 flex items-center justify-center"
    >
      <Dialog.Content
        class="card bg-surface-50 dark:bg-surface-950 max-h-[100svh] space-y-4 overflow-auto shadow-xl max-sm:min-w-[100vw] lg:max-h-[80svh] {dialog
          .options.size === 'large'
          ? 'max-w-(--breakpoint-lg)'
          : dialog.options.size === 'medium'
            ? 'max-w-(--breakpoint-md)'
            : 'max-w-(--breakpoint-sm)'}"
      >
        {#snippet element(attributes)}
          {#if !attributes.hidden}
            <div {...attributes} in:fly={{ y: 200, duration: 150 }}>
              {#if dialog.type === 'component'}
                {#if dialog.options.showCloseButton}
                  <Dialog.CloseTrigger
                    class="sticky top-2 z-10 float-right mr-2"
                  >
                    <CloseButton
                      onClose={() => {
                        dialog.close();
                      }}
                    />
                  </Dialog.CloseTrigger>
                {/if}
                {#key dialog.contentComponent.ref}
                  {#if dialog.contentComponent.ref}
                    <dialog.contentComponent.ref
                      {...dialog.contentComponent.props}
                    />
                  {/if}
                {/key}
              {:else if dialog.type === 'choose-weather-params'}
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label={dialog.title ?? ''}
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
                        dialog.response(true);
                        dialog.close();
                      }}
                      onClose={() => {
                        dialog.response(false);
                        dialog.close();
                      }}
                    />
                  </Dialog.CloseTrigger>
                </div>
              {:else if dialog.type === 'confirm'}
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label={dialog.title ?? ''}
                  class="flex flex-col gap-4 p-4"
                >
                  {#if dialog.title}
                    <h4 class="h4">{dialog.title}</h4>
                  {/if}
                  {#if dialog.body}
                    <p>{dialog.body}</p>
                  {/if}
                  <Dialog.CloseTrigger>
                    <SaveAndCloseButtons
                      saveText="Yes"
                      onSave={() => {
                        dialog.response(true);
                        dialog.close();
                      }}
                      onClose={() => {
                        dialog.response(false);
                        dialog.close();
                      }}
                    />
                  </Dialog.CloseTrigger>
                </div>
              {/if}
            </div>
          {/if}
        {/snippet}
      </Dialog.Content>
    </Dialog.Positioner>
  </Portal>
</Dialog>
