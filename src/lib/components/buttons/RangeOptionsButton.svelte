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

<script lang="ts">
  import Tooltip from '$lib/components/Tooltip.svelte';
  import GaugeSettings from '$lib/components/modals/GaugeSettings.svelte';
  import { gauges, modal } from '$lib/state';
  import { Settings2Icon } from '@lucide/svelte';

  function onSaveRangeOptions(e) {
    gauges.activeGauge.ranges = e.ranges;
    gauges.activeGauge.rangeOptions = e.rangeOptions;
  }
</script>

<Tooltip
  classNames="btn preset-filled"
  title="Configure Ranges"
  onclick={() =>
    modal.trigger({
      type: 'component',
      component: {
        ref: GaugeSettings,
        props: {
          onSave: onSaveRangeOptions,
        },
      },
      options: {
        showCloseButton: false,
        size: 'large',
      },
    })}
>
  <div class="flex flex-wrap items-center justify-center gap-2">
    <Settings2Icon />
    Configure Ranges
  </div>
  {#snippet tooltip()}
    <div>
      <p>Change the gauge direction, generate ranges, and more.</p>
    </div>
  {/snippet}
</Tooltip>
