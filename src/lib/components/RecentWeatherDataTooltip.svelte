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
  import Tooltip from '$lib/components/Tooltip.svelte';
  import { METEOSTAT_DELAY_DAYS, OPEN_METEO_DELAY_DAYS } from '$lib/constants';
  import { defaultWeatherSource } from '$lib/stores';
</script>

<Tooltip minWidth="290px" tooltipBg="bg-warning-50-900-token">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    class="w-5 h-5 inline mr-1 text-warning-700-200-token"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
    />
  </svg>
  <p slot="tooltip" class="text-base">
    Weather data may adjust as new information arrives. Consider working at
    least {$defaultWeatherSource === 'Open-Meteo'
      ? OPEN_METEO_DELAY_DAYS
      : $defaultWeatherSource === 'Meteostat'
        ? METEOSTAT_DELAY_DAYS
        : 'a few'} days behind to account for possible changes.
  </p>
</Tooltip>
