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

<!-- Download / Export's Palettes screen: the project's gauges, each opening
that gauge's palette exports. -->

<script lang="ts">
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import { PANEL_LIST, PANEL_ROW } from '#lib/constants/class-constants.js';
  import { gauges } from '#lib/state/gauges-state.svelte.js';
  import { ChevronRightIcon } from '@lucide/svelte';

  import { openGaugePalette } from './gauge-palette.js';
</script>

<div class="flex w-full flex-col gap-6 p-4 pt-2 text-left">
  <ul class={PANEL_LIST}>
    {#each gauges.allCreated as gauge (gauge.id)}
      <li>
        <button
          type="button"
          class={PANEL_ROW}
          onclick={() => openGaugePalette(gauge.id, gauge.label)}
        >
          <span class="w-16 shrink-0" aria-hidden="true">
            <PaletteStrip
              colors={gauge.colors}
              height="24px"
              corners="small"
              insideControl
            />
          </span>
          <span class="min-w-0 flex-1">{gauge.label}</span>
          <ChevronRightIcon class="icon-sm shrink-0 opacity-50" />
        </button>
      </li>
    {/each}
  </ul>
</div>
