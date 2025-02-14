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
  import chroma from 'chroma-js';

  let { updateGauge, numberOfColors = $bindable() } = $props();

  // const modalStore = getModalStore();

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
  class="text-center flex flex-wrap justify-center items-end scroll-mt-[70px] bg-surface-100-900 pb-4 gap-4 px-2"
>
  <label class="label">
    <span class="flex items-center gap-1">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="w-5 h-5"
        viewBox="0 0 24 24"
        ><path
          fill="currentColor"
          d="M12 22q-2.05 0-3.875-.788t-3.187-2.15q-1.363-1.362-2.15-3.187T2 12q0-2.075.813-3.9t2.2-3.175Q6.4 3.575 8.25 2.788T12.2 2q2 0 3.775.688t3.113 1.9q1.337 1.212 2.125 2.875T22 11.05q0 2.875-1.75 4.413T16 17h-1.85q-.225 0-.312.125t-.088.275q0 .3.375.863t.375 1.287q0 1.25-.687 1.85T12 22m-5.5-9q.65 0 1.075-.425T8 11.5q0-.65-.425-1.075T6.5 10q-.65 0-1.075.425T5 11.5q0 .65.425 1.075T6.5 13m3-4q.65 0 1.075-.425T11 7.5q0-.65-.425-1.075T9.5 6q-.65 0-1.075.425T8 7.5q0 .65.425 1.075T9.5 9m5 0q.65 0 1.075-.425T16 7.5q0-.65-.425-1.075T14.5 6q-.65 0-1.075.425T13 7.5q0 .65.425 1.075T14.5 9m3 4q.65 0 1.075-.425T19 11.5q0-.65-.425-1.075T17.5 10q-.65 0-1.075.425T16 11.5q0 .65.425 1.075T17.5 13M12 20q.225 0 .363-.125t.137-.325q0-.35-.375-.825T11.75 17.3q0-1.05.725-1.675T14.25 15H16q1.65 0 2.825-.962T20 11.05q0-3.025-2.312-5.038T12.2 4Q8.8 4 6.4 6.325T4 12q0 3.325 2.338 5.663T12 20"
        /></svg
      >

      Color Scheme</span
    >
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
          // if ($modalStore[0]) modalStore.close();
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
