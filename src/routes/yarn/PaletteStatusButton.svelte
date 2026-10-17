<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- Palette, in the Yarn page's top bar, as Project is in the planner's: its
icon shows the save state only when there's something to see (SaveStateIcon),
and until the palette is saved, a dot says so. It opens the palette's name and
where it saves, or Save Palette. -->

<script lang="ts">
  import SaveStateIcon from '#lib/components/SaveStateIcon.svelte';
  import SaveStatus from '#lib/components/SaveStatus.svelte';
  import { menuPositioning } from '#lib/components/menu-styles.js';
  import { safeSlide } from '#lib/features/transitions/safeSlide.js';
  import { Popover } from '@skeletonlabs/skeleton-svelte';
  import { BookmarkPlusIcon, RotateCwIcon } from '@lucide/svelte';
  import PaletteTitle from './PaletteTitle.svelte';
  import {
    addOpenPaletteToAccount,
    paletteAutosave,
    retryPaletteSave,
  } from './autosave.svelte';

  let { onsave }: { /** Opens Save Palette */ onsave: () => void } = $props();

  let open = $state(false);

  const status = $derived(
    !paletteAutosave.id
      ? 'Not saved'
      : paletteAutosave.state === 'error'
        ? 'Not saved'
        : paletteAutosave.state === 'saved'
          ? paletteAutosave.account
            ? 'Saved to your account'
            : 'Saved in this browser'
          : 'Saving…',
  );
  const label = $derived(`Palette Options (${status})`);
</script>

<Popover
  {open}
  positioning={menuPositioning('bottom-end')}
  onOpenChange={(e) => (open = e.open)}
>
  <Popover.Trigger
    class="btn hover:preset-tonal-surface relative shrink-0 gap-1"
    aria-label={label}
    title={label}
    data-testid="palette-button"
    data-save-status={status}
  >
    <SaveStateIcon
      on={Boolean(paletteAutosave.id)}
      saveState={paletteAutosave.state}
      account={paletteAutosave.account}
    />
    <span>Palette</span>
    {#if !paletteAutosave.id}
      <span
        class="bg-primary-500 absolute top-1 right-1 size-2 rounded-full"
        aria-hidden="true"
        data-testid="unsaved-dot"
      ></span>
    {/if}
  </Popover.Trigger>
  <Popover.Positioner>
    <Popover.Content
      class="card bg-surface-100-900 w-96 max-w-[calc(100vw-2rem)] shadow-xl"
    >
      {#snippet element(attributes)}
        {#if !attributes.hidden}
          <div {...attributes} transition:safeSlide>
            <div class="flex flex-col gap-4 p-4">
              <PaletteTitle field />
              {#if !paletteAutosave.id}
                <div class="flex flex-col gap-2 text-sm">
                  <p class="font-bold">Not saved</p>
                  <p class="opacity-70">
                    Save it to keep it in My Library. Changes then save
                    automatically.
                  </p>
                  <button
                    type="button"
                    class="btn preset-filled-primary-500 self-start"
                    onclick={() => {
                      open = false;
                      onsave();
                    }}
                  >
                    <BookmarkPlusIcon />
                    Save Palette
                  </button>
                </div>
              {:else if paletteAutosave.state === 'error'}
                <div class="flex flex-col gap-2 text-sm">
                  <p class="text-error-700-300 font-bold">Not saved</p>
                  <p class="opacity-70">
                    The latest changes couldn’t be saved in this browser.
                  </p>
                  <button
                    type="button"
                    class="btn preset-tonal-primary self-start"
                    onclick={retryPaletteSave}
                  >
                    <RotateCwIcon />
                    Try Again
                  </button>
                </div>
              {:else}
                <SaveStatus
                  saveState={paletteAutosave.state}
                  account={paletteAutosave.account}
                  addToAccount={addOpenPaletteToAccount}
                />
              {/if}
            </div>
          </div>
        {/if}
      {/snippet}
    </Popover.Content>
  </Popover.Positioner>
</Popover>
