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

<!-- One gauge's palette, opened from the Project menu's Palettes group: Save
to My Palettes (named after the project and the gauge; one that's saved
already isn't saved again), then its exports, as the Yarn page's Download has
them. -->

<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { PANEL_ROW } from '#lib/constants/class-constants.js';
  import { gauges } from '#lib/state/gauges-state.svelte.js';
  import { toast } from '#lib/state/page-state.svelte.js';
  import {
    MAX_SAVED_PALETTE_NAME_LENGTH,
    PaletteStorage,
  } from '#lib/storage/palettes.svelte.js';
  import { colorsToPaletteCode } from '#lib/utils/color-utils.js';
  import { getGaugeRangeLabels } from '#lib/utils/palette-export.js';
  import { BookmarkPlusIcon, LoaderCircleIcon } from '@lucide/svelte';
  import PaletteExportRows from './PaletteExportRows.svelte';

  let {
    gaugeId,
    projectName = '',
  }: {
    gaugeId: string;
    /** The project's name, for the saved palette's */
    projectName?: string;
  } = $props();

  const gauge = $derived(gauges.allCreated.find((g) => g.id === gaugeId));

  let saving = $state(false);
  async function save() {
    if (!gauge?.colors.length) return;
    saving = true;
    try {
      const { added } = await PaletteStorage.add({
        code: colorsToPaletteCode($state.snapshot(gauge.colors)),
        name: (projectName
          ? `${projectName} ${gauge.label}`
          : gauge.label
        ).slice(0, MAX_SAVED_PALETTE_NAME_LENGTH),
      });
      toast.trigger({
        message: added ? 'Saved to My Palettes' : 'Already in My Palettes',
        category: 'success',
        action: {
          label: 'Open My Palettes',
          response: () => goto(resolve('/my-palettes')),
        },
      });
    } catch (e) {
      console.warn("Can't save the palette", e);
      toast.trigger({
        message: 'Unable to save the palette',
        category: 'error',
      });
    } finally {
      saving = false;
    }
  }
</script>

{#if gauge}
  <PaletteExportRows colors={gauge.colors} ranges={getGaugeRangeLabels(gauge)}>
    {#snippet before()}
      <li>
        <button
          type="button"
          class={PANEL_ROW}
          disabled={saving}
          onclick={save}
          data-testid="save-gauge-palette"
        >
          {#if saving}
            <LoaderCircleIcon class="shrink-0 animate-spin opacity-70" />
          {:else}
            <BookmarkPlusIcon class="shrink-0 opacity-70" />
          {/if}
          <span class="flex flex-1 flex-col">
            <span>Save to My Palettes</span>
            <span class="text-xs opacity-70"
              >To use in other projects, or publish</span
            >
          </span>
        </button>
      </li>
    {/snippet}
  </PaletteExportRows>
{/if}
