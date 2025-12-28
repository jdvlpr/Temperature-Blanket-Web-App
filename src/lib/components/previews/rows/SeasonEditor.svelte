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
  import CloseButton from '$lib/components/modals/CloseButton.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import { DEFAULT_SEASONS, MONTH_NAMES } from '$lib/constants/seasons-constants';
  import { localState } from '$lib/state';
  import { CheckIcon, RotateCwIcon } from '@lucide/svelte';

  let { onClose } = $props();

  // Create a working copy of seasons
  let editingSeasons = $state(
    JSON.parse(JSON.stringify(localState.value.seasons)),
  );

  function toggleMonth(seasonIndex: number, month: number) {
    const season = editingSeasons[seasonIndex];
    if (season['months'].includes(month)) {
      season['months'] = season['months'].filter((m: number) => m !== month);
    } else {
      // Remove from other seasons
      editingSeasons.forEach((s: any, index: number) => {
        if (index !== seasonIndex && s['months'].includes(month)) {
          s['months'] = s['months'].filter((m: number) => m !== month);
        }
      });

      season['months'].push(month);
      season['months'].sort((a: number, b: number) => a - b);
    }
  }

  function resetToDefaults() {
    editingSeasons = JSON.parse(JSON.stringify(DEFAULT_SEASONS));
  }

  function saveChanges() {
    localState.value.seasons = JSON.parse(JSON.stringify(editingSeasons));
    onClose();
  }
</script>

<div class="flex flex-col gap-4 p-2 sm:p-4 w-full items-start sm:min-w-[39rem]">
  <div class="">
    <h2 class="text-2xl font-bold">Edit Seasons</h2>
    <p class="text-sm">Click months to toggle them between seasons</p>
  </div>

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 w-full">
    {#each editingSeasons as season, seasonIndex (seasonIndex)}
      <div class="space-y-2">
        <div>
          <p class="font-semibold">{season['label']}</p>
          <p class="text-xs">
            {season['months'].length > 0
              ? season['months'].map((m: number) => MONTH_NAMES[m - 1]).join(', ')
              : 'No months selected'}
          </p>
        </div>
        <div class="grid grid-cols-3 gap-2">
          {#each Array.from({ length: 12 }, (_, i) => i + 1) as month}
            <button
              class="rounded px-3 py-2 text-sm transition-colors"
              class:preset-filled-secondary-400-600={season['months'].includes(month)}
              class:preset-outlined-surface-300-700={!season['months'].includes(
                month,
              )}
              onclick={() => toggleMonth(seasonIndex, month)}
              title={season['months'].includes(month)
                ? `Remove ${MONTH_NAMES[month - 1]} from ${season['label']}`
                : `Add ${MONTH_NAMES[month - 1]} to ${season['label']}`}
            >
              {MONTH_NAMES[month - 1].substring(0, 3)}
            </button>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <button class="btn hover:preset-tonal mx-auto w-fit" onclick={resetToDefaults}>
    <RotateCwIcon />
    Reset to Defaults
  </button>
</div>

<StickyPart position="bottom">
  <div class="flex gap-2 p-2 py-4 w-full flex-wrap items-center justify-center">
    <CloseButton {onClose} text="Cancel" />
    <button
      class="btn preset-filled-primary-500"
      onclick={saveChanges}
    >
      <CheckIcon />
      Save Changes
    </button>
  </div>
</StickyPart>