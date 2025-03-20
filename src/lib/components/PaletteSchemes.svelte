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

<script>
  import ColorPalette from '$lib/components/ColorPalette.svelte';
  import SelectNumberOfColors from '$lib/components/SelectNumberOfColors.svelte';
  import { SCHEMES } from '$lib/constants';
  import { modal } from '$lib/state';
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
  ];

  function getPresetPalettes(numberOfColors) {
    return SCHEMES.map((scheme) => {
      const colors = chroma
        .scale(scheme.value)
        .colors(numberOfColors)
        .map((n) => {
          return {
            hex: n,
          };
        });
      return { ...scheme, colors };
    });
  }
  let presets = $derived(getPresetPalettes(numberOfColors));
  let palettes = $derived(
    presets.filter((item) => {
      return item.categories.includes(currentScheme);
    }),
  );
</script>

<div
  class="text-center flex flex-wrap justify-center items-end scroll-mt-[70px] pb-4 gap-4 px-2"
>
  <label class="label">
    <span class="flex items-center gap-2">
      <PaletteIcon class="size-4" />
      Color Scheme
    </span>
    <select
      class="select truncate"
      id="select-sort-by"
      bind:value={currentScheme}
    >
      {#each schemes as scheme}
        <option value={scheme}>{scheme}</option>
      {/each}
    </select>
  </label>

  <SelectNumberOfColors bind:numberOfColors />
</div>
<div
  class="flex flex-col items-center scroll-mt-[58px] lg:scroll-mt-[44px] px-2"
>
  <div class="gap-4 my-2 flex flex-col items-start justify-start w-full">
    {#each palettes as { value, label, colors }}
      <button
        type="button"
        class="cursor-pointer w-full"
        onclick={() => {
          updateGauge({
            _colors: colors,
            _schemeId: value,
          });
          modal.close();
        }}
        title="Use This Palette"
      >
        <ColorPalette {colors} schemeName={label} />
      </button>
    {/each}
  </div>
</div>
<p class="text-sm w-full mt-4">
  Color schemes based on <a
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
