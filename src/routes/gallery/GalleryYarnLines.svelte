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

<!-- @component
  The yarns in a gallery page's colors, a line each: "Brand Yarn · DK ·
  8 colorways", the weight linking to the yarn weights chart. The colorways
  themselves show with the palettes.
-->
<script lang="ts">
  import { ALL_YARN_WEIGHTS } from '#lib/constants/color-constants.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import { pluralize } from '#lib/utils/string-utils.js';

  let { colors }: { colors: Color[] } = $props();

  let yarns = $derived.by(() => {
    const found: Record<
      string,
      { name: string; weight?: string; hexes: string[] }
    > = {};
    for (const color of colors) {
      if (!color?.brandName || !color?.yarnName) continue;
      const key = `${color.brandId ?? color.brandName}/${color.yarnId ?? color.yarnName}`;
      found[key] ??= {
        name: `${color.brandName} ${color.yarnName}`,
        weight: ALL_YARN_WEIGHTS.find((w) => w.id === color.yarnWeightId)?.name,
        hexes: [],
      };
      // A colorway used twice (e.g. as the border too) counts once
      const hex = color.hex?.toLowerCase() ?? '';
      if (!found[key].hexes.includes(hex)) found[key].hexes.push(hex);
    }
    return Object.values(found);
  });
</script>

{#each yarns as { name, weight, hexes } (name)}
  <p>
    {name}
    <span class="text-surface-600-400 text-sm"
      >{#if weight}
        · <a
          href="/blog/yarn-weights?highlight={weight}"
          class="link"
          title="See the yarn weights chart">{weight}</a
        >{/if}
      · {hexes.length}
      {pluralize('colorway', hexes.length)}</span
    >
  </p>
{/each}
