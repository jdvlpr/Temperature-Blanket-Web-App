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
  let { groupLabel, targets, value = $bindable() } = $props();
</script>

<div class="p-4 rounded-container-token bg-surface-200-700-token">
  <div class="text-sm mb-2">{groupLabel}</div>
  <div class="flex flex-col gap-2">
    {#each targets as { id, label, icon }}
      {@const containsId = value.includes(id)}
      <ToggleSwitch
        label={`${icon} ${label}`}
        checked={value.includes(id)}
        disabled={containsId && value.length === 1}
        onchange={() => {
          if (value.includes(id)) {
            value.splice(value.indexOf(id), 1);
            value = value;
          } else {
            value.push(id);
            value = value;
          }
        }}
      />
    {/each}
  </div>
</div>
