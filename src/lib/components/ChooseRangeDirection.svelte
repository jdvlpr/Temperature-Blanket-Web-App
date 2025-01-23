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
  import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';

  let { direction = $bindable(), onchange } = $props();
</script>

<p class="flex justify-start items-start gap-1">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    class="w-5 h-5"
  >
    <path
      fill-rule="evenodd"
      d="M2.24 6.8a.75.75 0 001.06-.04l1.95-2.1v8.59a.75.75 0 001.5 0V4.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0L2.2 5.74a.75.75 0 00.04 1.06zm8 6.4a.75.75 0 00-.04 1.06l3.25 3.5a.75.75 0 001.1 0l3.25-3.5a.75.75 0 10-1.1-1.02l-1.95 2.1V6.75a.75.75 0 00-1.5 0v8.59l-1.95-2.1a.75.75 0 00-1.06-.04z"
      clip-rule="evenodd"
    />
  </svg>
  <span>Direction</span>
</p>

<RadioGroup
  class="flex-wrap gap-y-2 justify-start items-start"
  active="bg-secondary-active-token"
>
  <RadioItem
    bind:group={direction}
    {onchange}
    name="direction-high-to-low"
    value={'high-to-low'}
    title="Set gauge direction to High to Low">High to Low</RadioItem
  >
  <RadioItem
    bind:group={direction}
    {onchange}
    name="direction-low-to-high"
    value={'low-to-high'}
    title="Set gauge direction to Low to High">Low to High</RadioItem
  >
</RadioGroup>
