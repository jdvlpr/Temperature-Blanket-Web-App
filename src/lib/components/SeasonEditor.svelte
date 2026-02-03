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
  import { MONTHS } from '$lib/constants';
  import { SEASON_PRESETS } from '$lib/constants/seasons-constants';
  import { preferences } from '$lib/storage/preferences.svelte';
  import { formatDateRange } from '$lib/utils/seasons-utils.svelte';
  import { CheckIcon } from '@lucide/svelte';

  let { onClose } = $props();

  // Convert presets object to array for iteration
  const presetsList = Object.values(SEASON_PRESETS);

  // Create a working copy of seasons
  let editingSeasons = $state(
    JSON.parse(JSON.stringify(preferences.value.seasons)),
  );

  // Check if a preset matches the current editing seasons
  function isPresetSelected(preset: (typeof presetsList)[0]): boolean {
    if (editingSeasons.length !== preset.seasons.length) return false;
    return editingSeasons.every(
      (season: { startDate: string; endDate: string }, index: number) =>
        season.startDate === preset.seasons[index].startDate &&
        season.endDate === preset.seasons[index].endDate,
    );
  }

  // Parse MM-DD date string into month and day
  function parseDateString(dateStr: string): { month: number; day: number } {
    const [month, day] = dateStr.split('-').map(Number);
    return { month, day };
  }

  // Format month and day to MM-DD string
  function toDateString(month: number, day: number): string {
    return `${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  }

  // Get days in a month (using leap year for max days)
  function getDaysInMonth(month: number): number {
    // Use a leap year (2000) to get max possible days
    return new Date(2000, month, 0).getDate();
  }

  // Handler for month/day changes
  function updateSeasonDate(
    seasonIndex: number,
    field: 'startDate' | 'endDate',
    month: number,
    day: number,
  ) {
    const maxDays = getDaysInMonth(month);
    const clampedDay = Math.min(day, maxDays);
    editingSeasons[seasonIndex][field] = toDateString(month, clampedDay);
  }

  // Apply a preset
  function applyPreset(preset: (typeof presetsList)[0]) {
    editingSeasons = JSON.parse(JSON.stringify(preset.seasons));
  }

  function saveChanges() {
    preferences.value.seasons = JSON.parse(JSON.stringify(editingSeasons));
    onClose();
  }
</script>

<div class="flex w-full flex-col items-start gap-4 p-2 sm:p-4">
  <div class="">
    <h2 class="text-2xl font-bold">Edit Seasons</h2>
    <p class="text-sm">
      Choose a preset or customize the start and end dates for each season.
    </p>
  </div>

  <!-- Presets -->
  <div class="w-full">
    <p class="mb-2 text-sm font-medium">Select a preset to apply</p>
    <div class="flex flex-col gap-2">
      {#each presetsList as preset}
        {@const selected = isPresetSelected(preset)}
        <button
          class={[
            'btn flex h-auto gap-2 py-2 text-left',
            selected
              ? 'preset-filled-secondary-500'
              : 'preset-outlined-surface-300-700',
          ]}
          onclick={() => applyPreset(preset)}
        >
          <div class="flex flex-1 flex-col items-start gap-0">
            <span class="font-medium whitespace-pre-wrap">{preset.label}</span>
            <span class="text-xs whitespace-pre-wrap opacity-70"
              >{preset.description}</span
            >
          </div>
          {#if selected}
            <span class="flex items-center gap-1 text-xs">
              <CheckIcon class="size-4" />
            </span>
          {/if}
        </button>
      {/each}
    </div>
  </div>

  <hr class="border-surface-300-700 w-full" />

  <!-- Custom Date Ranges -->
  <div class="w-full">
    <p class="mb-2 text-sm font-medium">Custom Date Ranges</p>
    <div class="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
      {#each editingSeasons as season, seasonIndex (seasonIndex)}
        {@const startParsed = parseDateString(season.startDate)}
        {@const endParsed = parseDateString(season.endDate)}
        <div class="preset-outlined-surface-300-700 space-y-3 rounded-lg p-4">
          <div>
            <p class="text-lg font-semibold">{season.label}</p>
            <p class="text-surface-500 text-xs">
              {formatDateRange(season.startDate, season.endDate)}
            </p>
          </div>

          <!-- Start Date -->
          <div class="label">
            <span class="label-text">Start Date</span>
            <div class="flex gap-2">
              <select
                class="select w-fit"
                value={startParsed.month}
                onchange={(e) => {
                  const newMonth = parseInt(
                    (e.target as HTMLSelectElement).value,
                  );
                  updateSeasonDate(
                    seasonIndex,
                    'startDate',
                    newMonth,
                    startParsed.day,
                  );
                }}
              >
                {#each MONTHS as { name, value }}
                  <option {value}>{name}</option>
                {/each}
              </select>
              <select
                class="select w-fit"
                value={startParsed.day}
                onchange={(e) => {
                  const newDay = parseInt(
                    (e.target as HTMLSelectElement).value,
                  );
                  updateSeasonDate(
                    seasonIndex,
                    'startDate',
                    startParsed.month,
                    newDay,
                  );
                }}
              >
                {#each Array.from({ length: getDaysInMonth(startParsed.month) }, (_, i) => i + 1) as day}
                  <option value={day}>{day}</option>
                {/each}
              </select>
            </div>
          </div>

          <!-- End Date -->
          <div class="label">
            <span class="label-text">End Date</span>
            <div class="flex gap-2">
              <select
                class="select w-fit"
                value={endParsed.month}
                onchange={(e) => {
                  const newMonth = parseInt(
                    (e.target as HTMLSelectElement).value,
                  );
                  updateSeasonDate(
                    seasonIndex,
                    'endDate',
                    newMonth,
                    endParsed.day,
                  );
                }}
              >
                {#each MONTHS as { name, value }}
                  <option {value}>{name}</option>
                {/each}
              </select>
              <select
                class="select w-fit"
                value={endParsed.day}
                onchange={(e) => {
                  const newDay = parseInt(
                    (e.target as HTMLSelectElement).value,
                  );
                  updateSeasonDate(
                    seasonIndex,
                    'endDate',
                    endParsed.month,
                    newDay,
                  );
                }}
              >
                {#each Array.from({ length: getDaysInMonth(endParsed.month) }, (_, i) => i + 1) as day}
                  <option value={day}>{day}</option>
                {/each}
              </select>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<StickyPart position="bottom">
  <div class="flex w-full flex-wrap items-center justify-center gap-2 p-2 py-4">
    <CloseButton {onClose} text="Cancel" />
    <button class="btn preset-filled-primary-500" onclick={saveChanges}>
      <CheckIcon />
      Save
    </button>
  </div>
</StickyPart>
