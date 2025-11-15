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
  import { METEOSTAT_DELAY_DAYS, OPEN_METEO_DELAY_DAYS } from '$lib/constants';
  import { PopoverInstance, weather } from '$lib/state';
  import { TriangleAlertIcon } from '@lucide/svelte';

  let popover = new PopoverInstance();
</script>

<button class="btn-icon" {...popover.reference()}>
  <TriangleAlertIcon class="relative -top-[2px] inline size-4" />
</button>

{#if popover.isOpen()}
  <div
    data-floating
    {...popover.floating()}
    class="preset-filled-warning-200-800 rounded-container max-w-[290px] p-2"
  >
    <p class="text-left">
      Weather data may adjust as new information arrives. Consider working at
      least {weather.source.name === 'Open-Meteo'
        ? OPEN_METEO_DELAY_DAYS
        : weather.source.name === 'Meteostat'
          ? METEOSTAT_DELAY_DAYS
          : 'a few'} days behind to account for possible changes.
    </p>
    <div {...popover.arrow()}></div>
  </div>
{/if}
