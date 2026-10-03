<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

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
  import Spinner from '$lib/components/Spinner.svelte';
  import { locations } from '$lib/state/location-state.svelte';
  import { weatherSearch } from '$lib/state/weather-search.svelte';
  import { motionDuration } from '$lib/utils/feedback.svelte';
  import { ArrowLeftIcon, CloudOffIcon, XIcon } from '@lucide/svelte';
  import { Dialog, Portal } from '@skeletonlabs/skeleton-svelte';
  import { onDestroy, tick } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { fade, fly } from 'svelte/transition';

  // Where the focus goes back to: what had it when the search started, or the
  // Search button if that's gone (e.g. a dialog it was started from)
  let returnTo: HTMLElement | null = null;
  $effect.pre(() => {
    if (weatherSearch.active)
      returnTo = document.activeElement as HTMLElement | null;
  });

  // Leaving the page stops it
  onDestroy(() => weatherSearch.cancel());

  let cancelButton: HTMLButtonElement | undefined = $state();

  // A failed search swaps Cancel for Back, which takes the focus
  $effect(() => {
    if (weatherSearch.error) tick().then(() => cancelButton?.focus());
  });

  const several = $derived(locations.all.length > 1);

  // Stops the search and puts the project back as it was
  async function back() {
    weatherSearch.cancel();
    await tick();
    const target = returnTo?.isConnected
      ? returnTo
      : document.getElementById('location-action-button');
    target?.focus();
  }
</script>

{#if weatherSearch.active}
  <Dialog
    open
    onOpenChange={(details) => {
      // Escape backs out
      if (!details.open) back();
    }}
    initialFocusEl={() => cancelButton ?? null}
    restoreFocus={false}
  >
    <Portal>
      <!-- Over everything, including the dialog it may have started from -->
      <Dialog.Positioner class="fixed inset-0 z-10000 flex">
        <Dialog.Content class="flex h-dvh w-full">
          <!-- Fades in over the page, its content rising into place -->
          <div
            class="bg-surface-50 dark:bg-surface-950 flex w-full flex-col items-center justify-center gap-6 overflow-auto p-4 pt-[max(--spacing(4),env(safe-area-inset-top))] pb-[max(--spacing(4),env(safe-area-inset-bottom))] text-center"
            in:fade={{ duration: motionDuration(200) }}
          >
            {#key Boolean(weatherSearch.error)}
              <div
                class="flex w-full max-w-sm flex-col items-center gap-6"
                in:fly={{
                  y: 12,
                  duration: motionDuration(300),
                  delay: motionDuration(50),
                  easing: cubicOut,
                }}
              >
                {#if weatherSearch.error}
                  <CloudOffIcon class="text-surface-600-400 size-10" />
                  <!-- The message has its own heading -->
                  <Dialog.Title class="sr-only">No Weather Data</Dialog.Title>
                  <div role="alert">{@html weatherSearch.error}</div>
                  <p class="text-sm">Your project hasn't changed.</p>
                  <button
                    bind:this={cancelButton}
                    type="button"
                    class="btn preset-filled-primary-500"
                    onclick={back}
                  >
                    <ArrowLeftIcon />
                    Back
                  </button>
                {:else}
                  <Spinner size="36" />
                  <div class="flex w-full flex-col items-center gap-2">
                    <Dialog.Title class="text-xl font-bold"
                      >Searching for Weather Data</Dialog.Title
                    >
                    <p role="status" class="min-h-6">
                      {weatherSearch.label}
                      {#if several}
                        <span class="sr-only"
                          >, location {weatherSearch.index + 1} of {locations
                            .all.length}</span
                        >
                      {/if}
                    </p>
                    {#if several}
                      <progress
                        class="progress"
                        aria-hidden="true"
                        value={weatherSearch.index + 1}
                        max={locations.all.length}
                      ></progress>
                      <span class="text-xs" aria-hidden="true">
                        {weatherSearch.index + 1} of {locations.all.length}
                      </span>
                    {/if}
                  </div>
                  <button
                    bind:this={cancelButton}
                    type="button"
                    class="btn hover:preset-tonal-surface"
                    onclick={back}
                  >
                    <XIcon />
                    Cancel
                  </button>
                {/if}
              </div>
            {/key}
          </div>
        </Dialog.Content>
      </Dialog.Positioner>
    </Portal>
  </Dialog>
{/if}
