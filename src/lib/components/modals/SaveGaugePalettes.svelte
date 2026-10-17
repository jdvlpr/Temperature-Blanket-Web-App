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

<!-- Save Palettes to My Palettes, from the planner's Project menu: the
project's gauges' palettes, chosen with checkboxes, each saved as a palette of
its own, named after the project and the gauge. One that's saved already isn't
saved again. Publishing one is then on My Palettes or the Yarn page. -->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import { gauges } from '#lib/state/gauges-state.svelte.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import {
    MAX_SAVED_PALETTE_NAME_LENGTH,
    PaletteStorage,
  } from '#lib/storage/palettes.svelte.js';
  import { colorsToPaletteCode } from '#lib/utils/color-utils.js';
  import { pluralize } from '#lib/utils/string-utils.js';
  import { BookmarkIcon, LoaderCircleIcon } from '@lucide/svelte';

  let {
    projectName = '',
  }: { /** The project's name, for theirs */ projectName?: string } = $props();

  // All of them to start with: usually it's the one or two there are
  let chosen = $state<string[]>(gauges.allCreated.map((gauge) => gauge.id));
  let saving = $state(false);

  const nameFor = (label: string) =>
    (projectName ? `${projectName} ${label}` : label).slice(
      0,
      MAX_SAVED_PALETTE_NAME_LENGTH,
    );

  async function save() {
    saving = true;
    let added = 0;
    let already = 0;
    try {
      for (const gauge of gauges.allCreated) {
        if (!chosen.includes(gauge.id) || !gauge.colors.length) continue;
        const result = await PaletteStorage.add({
          code: colorsToPaletteCode($state.snapshot(gauge.colors)),
          name: nameFor(gauge.label),
        });
        if (result.added) added++;
        else already++;
      }
    } catch (e) {
      console.warn("Can't save palettes", e);
      toast.trigger({
        message: 'Unable to save the palettes',
        category: 'error',
      });
      saving = false;
      return;
    }
    dialog.close();
    toast.trigger({
      message: [
        added &&
          `Saved ${added} ${pluralize('palette', added)} to My Palettes.`,
        already &&
          `${already} ${already === 1 ? 'was' : 'were'} in My Palettes already.`,
      ]
        .filter(Boolean)
        .join(' '),
      category: 'success',
      action: {
        label: 'Open My Palettes',
        response: () => goto(resolve('/my-palettes')),
      },
    });
  }
</script>

<form
  class="flex w-full flex-col gap-4 p-4 pt-2 text-left"
  onsubmit={(event) => {
    event.preventDefault();
    void save();
  }}
>
  <fieldset class="flex flex-col gap-2">
    <legend class="mb-2 text-sm"
      >Choose the palettes to keep in My Palettes, where you can use them in any
      project, or publish them to the gallery.</legend
    >
    {#each gauges.allCreated as gauge (gauge.id)}
      <label
        class="bg-surface-100 dark:bg-surface-900 rounded-container card-border flex cursor-pointer items-center gap-3 px-4 py-3"
      >
        <input
          type="checkbox"
          class="checkbox"
          value={gauge.id}
          bind:group={chosen}
        />
        <span class="min-w-0 flex-1">{gauge.label}</span>
        <span class="w-16 shrink-0" aria-hidden="true">
          <PaletteStrip
            colors={gauge.colors}
            height="24px"
            corners="small"
            insideControl
          />
        </span>
      </label>
    {/each}
  </fieldset>

  <button
    type="submit"
    class="btn preset-filled-primary-500 self-start"
    disabled={saving || !chosen.length}
  >
    {#if saving}
      <LoaderCircleIcon class="animate-spin" />
    {:else}
      <BookmarkIcon />
    {/if}
    Save {chosen.length === 1 ? 'Palette' : 'Palettes'}
  </button>
</form>
