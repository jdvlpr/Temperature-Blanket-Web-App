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

<!-- @component
  The filters that are on, as chips that each remove theirs, shown while the
  filter panel is closed. `onremove` runs after any chip's, since that chip
  goes away (e.g. to focus the Filters button).
-->
<script module lang="ts">
  import { getBrands } from '#lib/data/yarns/colorways.svelte.js';

  /** A yarn filter's chip text, e.g. "Only Malabrigo Rios"; '' when none */
  export function yarnChipLabel(
    brandId: string,
    yarnId: string,
    only = false,
  ): string {
    if (!brandId && !yarnId) return '';
    const brand = getBrands().find((brand) => brand.id === brandId);
    const yarnName = brand?.yarns.find((yarn) => yarn.id === yarnId)?.name;
    const name = [brand?.name, yarnName].filter(Boolean).join(' ') || 'Yarn';
    return only ? `Only ${name}` : name;
  }
</script>

<script lang="ts">
  import { XIcon } from '@lucide/svelte';

  let {
    chips,
    disabled = false,
    onremove,
  }: {
    chips: { label: string; remove: () => void }[];
    disabled?: boolean;
    onremove?: () => void;
  } = $props();
</script>

{#if chips.length}
  <ul class="flex flex-wrap justify-center gap-2" aria-label="Filters on">
    {#each chips as chip (chip.label)}
      <li>
        <button
          type="button"
          class="btn btn-sm preset-tonal rounded-full"
          aria-label="Remove filter: {chip.label}"
          {disabled}
          onclick={() => {
            chip.remove();
            onremove?.();
          }}
        >
          <span>{chip.label}</span>
          <XIcon aria-hidden="true" />
        </button>
      </li>
    {/each}
  </ul>
{/if}
