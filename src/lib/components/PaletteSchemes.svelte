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
  import { PALETTE_LIST } from '#lib/constants/class-constants.js';
  import ChoiceMenu from '#lib/components/buttons/ChoiceMenu.svelte';
  import ViewMenu from '#lib/components/buttons/ViewMenu.svelte';
  import PaletteCard from '#lib/components/PaletteCard.svelte';
  import SelectNumberOfColors from '#lib/components/SelectNumberOfColors.svelte';
  import { SCHEMES } from '#lib/constants/color-constants.js';
  import { preferences } from '#lib/storage/preferences.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { PaletteIcon } from '@lucide/svelte';
  import chroma from 'chroma-js';

  let { updateGauge, numberOfColors = $bindable() } = $props();

  let currentScheme = $state('Creative');
  const schemes = [
    ...new Set(
      SCHEMES.map((item) => item.categories)
        .flat()
        .sort(),
    ),
  ].map((scheme) => ({ value: scheme, label: scheme }));

  function getPresetPalettes(numberOfColors: number) {
    return SCHEMES.map((scheme) => {
      const scale = chroma.scale(scheme.value as chroma.BrewerPaletteName);
      const colors: Color[] = (scale.colors(numberOfColors) as string[]).map(
        (n) => {
          return {
            hex: n,
          };
        },
      );
      return { ...scheme, colors };
    });
  }
  let presets = $derived(getPresetPalettes(numberOfColors));
  let palettes = $derived(
    presets.filter((item) => {
      return item.categories.includes(currentScheme);
    }),
  );

  // Laid out as My Library's palettes are (one View setting)
  let layout = $derived(preferences.value.myProjectsLayout ?? 'grid');
</script>

<div class="flex flex-col items-center px-2">
  <div class="my-2 flex w-full flex-wrap items-center justify-center gap-2">
    <ChoiceMenu
      label="Gradients"
      icon={PaletteIcon}
      options={schemes}
      value={currentScheme}
      onchange={(scheme) => (currentScheme = scheme)}
    />
    <SelectNumberOfColors bind:numberOfColors />
    <ViewMenu
      bind:value={
        () => layout, (value) => (preferences.value.myProjectsLayout = value)
      }
      compact
    />
  </div>
  <ul
    class={[
      'my-2 w-full',
      layout === 'grid'
        ? 'grid grid-cols-2 items-start gap-x-3 gap-y-6 sm:gap-x-4 lg:grid-cols-3'
        : PALETTE_LIST,
    ]}
    aria-label="{currentScheme} gradients"
  >
    {#each palettes as { value, label, colors } (value)}
      <li class="flex w-full min-w-0">
        <PaletteCard
          {colors}
          name={label}
          summary={false}
          {layout}
          card
          title="Use This Palette"
          onclick={() => updateGauge({ _colors: colors, _schemeId: value })}
        />
      </li>
    {/each}
  </ul>
</div>
<p class="text-surface-700-300 mt-4 w-full px-2 text-center text-xs">
  Gradients based on <a
    href="https://colorbrewer2.org/"
    target="_blank"
    rel="noopener noreferrer"
    class="link">ColorBrewer2.org</a
  >
  by Cynthia A. Brewer, Geography, Pennsylvania State University, licenced under
  <a
    href="https://www.apache.org/licenses/LICENSE-2.0"
    target="_blank"
    rel="noopener noreferrer"
    class="link">Apache 2</a
  >.
</p>
