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
  import { ArrowUpDownIcon } from '@lucide/svelte';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';

  let { direction, onchange } = $props();
</script>

<SegmentedControl value={direction} onValueChange={onchange}>
  <SegmentedControl.Label
    ><p class="flex items-center justify-start gap-1">
      <ArrowUpDownIcon class="size-4" />
      <span>Direction</span>
    </p></SegmentedControl.Label
  >
  <SegmentedControl.Control
    class="bg-surface-100 dark:bg-surface-900 rounded-container flex-wrap items-start justify-start gap-y-2 border-none shadow-sm"
  >
    <SegmentedControl.Indicator />
    <SegmentedControl.Item value="high-to-low">
      <SegmentedControl.ItemText title="Set Gauge Direction to High to Low"
        >High to Low</SegmentedControl.ItemText
      >
      <SegmentedControl.ItemHiddenInput />
    </SegmentedControl.Item>
    <SegmentedControl.Item value="low-to-high">
      <SegmentedControl.ItemText title="Set Gauge Direction to Low to High"
        >Low to High</SegmentedControl.ItemText
      >
      <SegmentedControl.ItemHiddenInput />
    </SegmentedControl.Item>
  </SegmentedControl.Control>
</SegmentedControl>
