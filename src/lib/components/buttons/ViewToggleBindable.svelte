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
  import { LayoutGridIcon, LayoutListIcon } from '@lucide/svelte';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
  let { value = $bindable() } = $props();
</script>

<SegmentedControl
  {value}
  onValueChange={(e) => {
    value = e.value;
  }}
>
  <SegmentedControl.Control
    class="bg-surface-100 dark:bg-surface-900 rounded-container border-none shadow-sm"
  >
    <SegmentedControl.Indicator />

    <SegmentedControl.Item value="list">
      <SegmentedControl.ItemText
        ><div class="flex items-center justify-center gap-1">
          <LayoutListIcon />
          <span class="">List</span>
        </div></SegmentedControl.ItemText
      >
      <SegmentedControl.ItemHiddenInput />
    </SegmentedControl.Item>
    <SegmentedControl.Item value="grid">
      <SegmentedControl.ItemText
        ><div class="flex items-center justify-center gap-1">
          <LayoutGridIcon />
          <span class="">Grid</span>
        </div></SegmentedControl.ItemText
      >
      <SegmentedControl.ItemHiddenInput />
    </SegmentedControl.Item>
  </SegmentedControl.Control>
</SegmentedControl>
