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
  <div class="flex gap-1 items-center">
    <Segment class="flex-wrap gap-y-2" active="preset-filled-secondary-500">
      <Segment.Item
        bind:group={weather.grouping}
        name="weatherGrouping"
        value={'day'}
        title="Set weather grouping to days">Daily</Segment.Item
      >
      <Segment.Item
        bind:group={weather.grouping}
        name="weatherGrouping"
        value={'week'}
        title="Set weather grouping to weeks">Weekly</Segment.Item
      >
    </Segment>
  </div>
</div>
