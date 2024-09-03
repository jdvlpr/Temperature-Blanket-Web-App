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

<script lang="ts">
  import { pluralize } from '$lib/utils';

  export let yarns,
    showAllOption: boolean = false;

  $: numberOfAllYarnColorways = showAllOption
    ? yarns
        .flatMap((n) => n.colorways.map((m) => m.colors.length))
        .reduce((partialSum, a) => partialSum + a, 0)
    : 0;
</script>

{#if showAllOption && yarns.length > 1}
  <option value=""
    >All ({numberOfAllYarnColorways}
    {pluralize('colorway', numberOfAllYarnColorways)})</option
  >
{/if}
{#each yarns as { id, name, colorways }}
  {@const unavailable = colorways.some((n) => !!n.source?.unavailable)}
  {@const numberOfColorways = colorways
    .map((n) => n.colors.length)
    .reduce((partialSum, a) => partialSum + a, 0)}
  <option value={id}>
    {name} ({numberOfColorways}
    {pluralize('colorway', numberOfColorways)})
    {#if unavailable}[{pluralize('Link', colorways.length)} Unavailable]{/if}
  </option>
{/each}
