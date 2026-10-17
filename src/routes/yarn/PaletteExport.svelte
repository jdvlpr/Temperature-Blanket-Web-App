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

<!-- The Palette menu's Download / Export screen, as the Project menu's: the
palette as an image, its HTML color codes, or its yarn colorway names (when
some colors are yarn colorways). -->

<script lang="ts">
  import { PANEL_LIST, PANEL_ROW } from '#lib/constants/class-constants.js';
  import {
    hasColorwayNames,
    openPaletteExport,
    type PaletteExport,
  } from '#lib/utils/palette-export.js';
  import {
    ChevronRightIcon,
    ClipboardCopyIcon,
    CodeIcon,
    ImageIcon,
  } from '@lucide/svelte';
  import { yarnPageState } from './state.svelte';

  const rows = [
    {
      type: 'image',
      label: 'Image',
      details: 'Download a PNG image',
      icon: ImageIcon,
    },
    {
      type: 'html',
      label: 'HTML Color Codes',
      details: 'Copy codes for web and design',
      icon: CodeIcon,
    },
    {
      type: 'colorway',
      label: 'Yarn Colorway Names',
      details: 'Copy colorway names',
      icon: ClipboardCopyIcon,
    },
  ] as const;

  const named = $derived(hasColorwayNames(yarnPageState.gauge.colors));

  function open(type: PaletteExport) {
    openPaletteExport(type, {
      colors: $state.snapshot(yarnPageState.gauge.colors),
      name: yarnPageState.title,
    });
  }
</script>

<div class="flex w-full flex-col gap-6 p-4 pt-2 text-left">
  <ul class={PANEL_LIST}>
    {#each rows as row (row.type)}
      {#if row.type !== 'colorway' || named}
        <li>
          <button
            type="button"
            class={PANEL_ROW}
            onclick={() => open(row.type)}
          >
            <row.icon class="shrink-0 opacity-70" />
            <span class="flex flex-1 flex-col">
              <span>{row.label}</span>
              <span class="text-xs opacity-70">{row.details}</span>
            </span>
            <ChevronRightIcon class="icon-sm shrink-0 opacity-50" />
          </button>
        </li>
      {/if}
    {/each}
  </ul>
</div>
