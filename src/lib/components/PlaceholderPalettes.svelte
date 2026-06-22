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
  interface Props {
    items?: Number;
    maxWFull?: Boolean;
    wFull?: Boolean;
    height?: string;
  }

  let {
    items = 10,
    maxWFull = false,
    wFull = false,
    height = '90px',
  }: Props = $props();
</script>

<div
  class="mb-2 flex w-[calc(100vw-1rem)] max-w-[calc(1024px-1rem)] flex-col items-start justify-start gap-4"
  class:!max-w-full={maxWFull}
  class:!w-full={wFull}
>
  {#each Array(items) as _, index}
    <div
      class="placeholder rounded-container w-full animate-pulse"
      style="height:{height}"
    ></div>
  {/each}
</div>
