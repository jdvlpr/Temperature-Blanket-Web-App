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

<p class="flex justify-start items-center gap-1">
  <ArrowUpDownIcon class="size-4" />
  <span>Direction</span>
</p>

<SegmentedControl
  value={direction}
  classes="flex-wrap gap-y-2 justify-start items-start"
  background="bg-surface-100 dark:bg-surface-900"
  onValueChange={onchange}
>
  <Segment.Item value="high-to-low">High to Low</Segment.Item>
  <Segment.Item value="low-to-high">Low to High</Segment.Item>
</SegmentedControl>
