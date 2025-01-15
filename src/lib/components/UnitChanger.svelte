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
  import { project } from '$lib/state';
  import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
</script>

<RadioGroup class="flex-wrap gap-y-2" active="bg-secondary-active-token">
  <RadioItem
    bind:group={project.units}
    name="units-metric"
    value={'metric'}
    title="Set units to metric"
    >{`${UNIT_LABELS.temperature.metric} /
	    ${UNIT_LABELS.height.metric}`}</RadioItem
  >
  <RadioItem
    bind:group={project.units}
    name="units-imperial"
    value={'imperial'}
    title="Set units to imperial"
    >{`${UNIT_LABELS.temperature.imperial} /
	    ${UNIT_LABELS.height.imperial}`}</RadioItem
  >
</RadioGroup>
