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
  The yarns in some colors, inline: "Himalaya Everyday · Aran", the weight
  linking to the yarn weights chart, several yarns separated by commas.
-->
<script lang="ts">
  import { ALL_YARN_WEIGHTS } from '#lib/constants/color-constants.js';
  import type { Color } from '#lib/types/yarn-types.js';

  let { colors }: { colors: Color[] } = $props();

  let yarns = $derived.by(() => {
    const found: Record<string, { name: string; weight?: string }> = {};
    for (const color of colors) {
      if (!color?.brandName || !color?.yarnName) continue;
      found[
        `${color.brandId ?? color.brandName}/${color.yarnId ?? color.yarnName}`
      ] ??= {
        name: `${color.brandName} ${color.yarnName}`,
        weight: ALL_YARN_WEIGHTS.find((w) => w.id === color.yarnWeightId)?.name,
      };
    }
    return Object.values(found);
  });
</script>

{#each yarns as { name, weight }, i (name)}{#if i}<span class="mr-1">,</span
    >{/if}<span
    >{name}{#if weight}<span class="mx-1" aria-hidden="true">·</span><a
        href="/blog/yarn-weights?highlight={weight}"
        class="link"
        title="See the yarn weights chart">{weight}</a
      >{/if}</span
  >{/each}
