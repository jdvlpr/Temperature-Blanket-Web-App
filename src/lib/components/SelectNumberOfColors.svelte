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
  interface Props {
    numberOfColors: number;
    max?: number;
    allowZero?: boolean;
    onchange?: (event: Event) => void;
  }

  let {
    numberOfColors = $bindable(),
    max = 99,
    allowZero = false,
    onchange,
  }: Props = $props();

  let start = allowZero ? -1 : 0;

  let numEl = $state();
</script>

<label class="label">
  <span>
    <select
      class="select w-fit"
      bind:this={numEl}
      id="number-of-colors"
      bind:value={numberOfColors}
      title="Choose Number of Colors"
      {onchange}
    >
      {#each Array(max + 1) as _, i}
        {#if i > start}
          <option value={i}>
            {i}
            {i === 1 ? 'Color' : 'Colors'}
          </option>
        {/if}
      {/each}
    </select>
  </span></label
>
