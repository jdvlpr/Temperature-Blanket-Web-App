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
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import { defaultYarn } from '$lib/stores';
  export let selectedBrandId, selectedYarnId;
</script>

<div class="mt-1 flex flex-col gap-1 items-start text-left">
  <ToggleSwitch
    label="Set as Default Yarn"
    details="Automatically select this yarn for certain areas of this site, like for colors with no assigned yarn."
    onchange={(e) => {
      if (e.target.checked) {
        defaultYarn.value = `${selectedBrandId}-${selectedYarnId}`;
      } else defaultYarn.value = '';
    }}
    checked={defaultYarn.value === `${selectedBrandId}-${selectedYarnId}`}
  />
</div>
