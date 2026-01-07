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
  import { UNIT_LABELS } from '$lib/constants';
  import { preferences } from '$lib/storage/preferences.svelte';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
</script>

<SegmentedControl
  value={preferences.value.units}
  onValueChange={(e) => {
    preferences.value.units = e.value;
  }}
>
  <SegmentedControl.Control
    class="bg-surface-100 dark:bg-surface-900 shadown-sm rounded-container border-0"
  >
    <SegmentedControl.Indicator />
    <SegmentedControl.Item value={'metric'}>
      <SegmentedControl.ItemText
        >{`${UNIT_LABELS.temperature.metric} /
  	    ${UNIT_LABELS.height.metric}`}</SegmentedControl.ItemText
      >
      <SegmentedControl.ItemHiddenInput />
    </SegmentedControl.Item>
    <SegmentedControl.Item value={'imperial'}>
      <SegmentedControl.ItemText
        >{`${UNIT_LABELS.temperature.imperial} /
  	    ${UNIT_LABELS.height.imperial}`}</SegmentedControl.ItemText
      >
      <SegmentedControl.ItemHiddenInput />
    </SegmentedControl.Item>
  </SegmentedControl.Control>
</SegmentedControl>
