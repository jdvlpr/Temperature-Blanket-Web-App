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
  import { weather } from '$lib/state';
  import { Segment } from '@skeletonlabs/skeleton-svelte';
</script>

<div class="flex flex-col items-start">
  <div class="flex items-center gap-1">
    <Segment
      value={weather.grouping}
      onValueChange={(e) => {
        weather.grouping = e.value;
      }}
      background="bg-surface-100 dark:bg-surface-900"
      classes="shadow-sm"
    >
      <Segment.Item value="day">Daily</Segment.Item>
      <Segment.Item value="week">Weekly</Segment.Item>
    </Segment>
  </div>
</div>
