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
  import { localState } from '$lib/state';
  import { DEFAULT_SEASONS, MONTH_NAMES } from '$lib/constants/seasons-constants';

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

<div class="flex flex-col gap-4 p-6">
  <h2 class="text-2xl font-bold">Edit Seasons</h2>
  <p class="text-sm">Click months to toggle them between seasons</p>

  <div class="space-y-6">
    {#each editingSeasons as season, seasonIndex (seasonIndex)}
      <div class="space-y-2">
        <h3 class="font-semibold">{season['label']}</h3>
        <div class="grid grid-cols-3 gap-2">
          {#each Array.from({ length: 12 }, (_, i) => i + 1) as month}
            <button
              class="rounded px-3 py-2 text-sm transition-colors"
              class:preset-tonal={season['months'].includes(month)}
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
        <p class="text-xs">
          {season['months'].length > 0
            ? season['months'].map((m: number) => MONTH_NAMES[m - 1]).join(', ')
            : 'No months selected'}
        </p>
      </div>
    {/each}
  </div>

  <div class="mt-4 flex gap-2">
    <button class="btn hover:preset-tonal" onclick={resetToDefaults}>
      Reset to Defaults
    </button>
    <button class="btn preset-filled" onclick={saveChanges}>Save Changes</button>
  </div>
</div>
