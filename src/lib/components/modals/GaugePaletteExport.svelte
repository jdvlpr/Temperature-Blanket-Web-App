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

<!-- One gauge's palette exports, as the Palette menu has them on the Yarn
page. Opened from the Palettes screen (or straight from Download / Export when
a project has just one gauge). -->

<script lang="ts">
  import { gauges } from '#lib/state/gauges-state.svelte.js';
  import { getGaugeRangeLabels } from '#lib/utils/palette-export.js';
  import PaletteExportRows from './PaletteExportRows.svelte';

  let { gaugeId }: { gaugeId: string } = $props();

  const gauge = $derived(gauges.allCreated.find((g) => g.id === gaugeId));
</script>

{#if gauge}
  <PaletteExportRows
    colors={gauge.colors}
    ranges={getGaugeRangeLabels(gauge)}
  />
{/if}
