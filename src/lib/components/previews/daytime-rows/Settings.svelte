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
  import NumberInputButton from '#lib/components/buttons/NumberInputButton.svelte';
  import PreviewInfo from '#lib/components/PreviewInfo.svelte';
  import { gauges } from '#lib/state/gauges-state.svelte.js';
  import { weather } from '#lib/state/weather-state.svelte.js';
  import { capitalizeFirstLetter } from '#lib/utils/other-utils.js';
  import { TableIcon } from '@lucide/svelte';
  import { dialog } from '#lib/state/page-state.svelte.js';
  import StitchTable from './StitchTable.svelte';
  import Preview from './Preview.svelte';
  import { daytimeRowsPreview } from './state.svelte';

  let targets = $derived(gauges.allCreated.map((n) => n.targets).flat());

  function openStitchTable() {
    dialog.trigger({
      type: 'component',
      component: { ref: StitchTable },
      options: { title: 'Stitches Per Row', size: 'large' },
    });
  }
</script>

<PreviewInfo previewTitle={daytimeRowsPreview.name}>
  {#snippet description()}
    <p>
      Each row is split according to the duration of sunlight that {weather.grouping}.
    </p>
  {/snippet}
  {#snippet details()}
    {#if daytimeRowsPreview.settings.daytimePosition === 'left'}
      <p>
        Daytime stitches (left side) = d × <span class="font-semibold"
          >{daytimeRowsPreview.settings.stitchesPerRow}</span
        >
        ∕ 24
      </p>
      <p>
        Night stitches (right side) = <span class="font-semibold"
          >{daytimeRowsPreview.settings.stitchesPerRow}</span
        >
        − Daytime stitches
      </p>
    {:else if daytimeRowsPreview.settings.daytimePosition === 'right'}
      <p>
        Daytime stitches (right side) = d × <span class="font-semibold"
          >{daytimeRowsPreview.settings.stitchesPerRow}</span
        >
        ∕ 24
      </p>
      <p>
        Night stitches (left side) = <span class="font-semibold"
          >{daytimeRowsPreview.settings.stitchesPerRow}</span
        >
        − Daytime stitches
      </p>
    {:else if daytimeRowsPreview.settings.daytimePosition === 'center'}
      <p>
        Daytime stitches = d × <span class="font-semibold"
          >{daytimeRowsPreview.settings.stitchesPerRow}
        </span>∕ 24
      </p>
      <p>
        Night stitches = <span class="font-semibold"
          >{daytimeRowsPreview.settings.stitchesPerRow}
        </span>− Daytime stitches
      </p>
      <div class="my-1">
        <p>
          Left and Right side stitches = Night stitches / 2 (rounded up if not
          an integer)
        </p>
        <p>
          Center stitches = Daytime stitches (minus one stitch if the left and
          right sides' stitches were rounded up)
        </p>
      </div>
    {:else if daytimeRowsPreview.settings.daytimePosition === 'sides'}
      <p>
        Daytime stitches = d × <span class="font-semibold"
          >{daytimeRowsPreview.settings.stitchesPerRow}
        </span>∕ 24
      </p>
      <p>
        Night stitches = <span class="font-semibold"
          >{daytimeRowsPreview.settings.stitchesPerRow}
        </span>− Daytime stitches
      </p>
      <div class="my-1">
        <p>
          Left and Right side stitches = Daytime stitches / 2 (rounded up if not
          an integer)
        </p>
        <p>
          Center stitches = Night stitches (minus one stitch if the left and
          right sides' stitches were rounded up)
        </p>
      </div>
    {/if}

    <span class="mt-1 inline-block text-sm">
      d = Daytime (time from the {weather.grouping}'s sunrise to sunset in
      hours).
      <span class="font-semibold"
        >{daytimeRowsPreview.settings.stitchesPerRow}</span
      >
      is the total stitches per row. 24 is the number of hours in a day. Stitches
      are rounded to the nearest integer.
    </span>

    <div class="mt-2 w-full">
      <button
        type="button"
        class="btn hover:preset-tonal-surface"
        onclick={openStitchTable}
      >
        <TableIcon /> Stitches Per Row
      </button>
    </div>
  {/snippet}
</PreviewInfo>

<div class="w-full"><Preview /></div>

<div
  class="preset-outlined-surface-300-700 card flex flex-col items-start gap-4 p-4"
>
  <p class="text-2xl font-bold">Settings</p>

  <label class="label">
    <span class="label-text">Position of Daytime Stitches</span>
    <select
      class="select w-fit min-w-[150px]"
      id="rsun-daytime-position"
      bind:value={daytimeRowsPreview.settings.daytimePosition}
    >
      <option value={'left'}>← Left Side</option>
      <option value={'right'}>→ Right Side</option>
      <option value={'center'}>→← Center</option>
      <option value={'sides'}>←→ Sides</option>
    </select>
  </label>

  <label class="label">
    <span class="label-text"
      >Color Daytime ({daytimeRowsPreview.daytimeLabel}) Using the {capitalizeFirstLetter(
        weather.grouping,
      )}'s</span
    >
    <select
      class="select w-fit"
      id="rsun-left-params"
      bind:value={daytimeRowsPreview.settings.daytimeTarget}
    >
      {#each targets as { id, label, icon }}
        <option value={id}>{icon} {label}</option>
      {/each}
    </select>
  </label>

  <label class="label">
    <span class="label-text"
      >Color Night ({daytimeRowsPreview.nightLabel}) Using the {capitalizeFirstLetter(
        weather.grouping,
      )}'s</span
    >
    <select
      class="select w-fit"
      id="rsun-right-params"
      bind:value={daytimeRowsPreview.settings.nightTarget}
    >
      {#each targets as { id, label, icon }}
        <option value={id}>{icon} {label}</option>
      {/each}
    </select>
  </label>

  <NumberInputButton
    bind:value={daytimeRowsPreview.settings.stitchesPerRow}
    title="Stitches Per Row"
  />
</div>
