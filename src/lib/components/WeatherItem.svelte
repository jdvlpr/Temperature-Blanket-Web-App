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
  import RecentWeatherDataTooltip from '$lib/components/RecentWeatherDataTooltip.svelte';
  import { MOON_PHASE_NAMES } from '$lib/constants';

  interface Props {
    id: any;
    icon: any;
    label: any;
    value: any;
    units?: string | undefined;
    isRecentDate?: boolean;
    date?: import('svelte').Snippet;
    details?: import('svelte').Snippet;
  }

  let {
    id,
    icon,
    label,
    value,
    units = undefined,
    isRecentDate = false,
    date,
    details,
  }: Props = $props();

  // Colors from tailwind.config.js
  const colors = {
    tmin: '#38bdf8',
    tavg: '#a3a3a3',
    tmax: '#f87171',
    prcp: '#818cf8',
    snow: '#94a3b8',
    dayt: '#facc15',
  };

  let displayValue = id === 'moon' ? MOON_PHASE_NAMES[value] : value;
</script>

<span class="flex flex-col items-center justify-start p-2">
  <div
    class={['flex', isRecentDate && '!bg-warning-500/20']}
    class:rounded-container={isRecentDate}
    class:p-1={isRecentDate}
  >
    <span class="text-xl font-semibold tracking-wide"
      ><span style="color:{colors[id]}" class="mr-1">{icon}</span
      >{displayValue}</span
    >
    {#if units}<span class="">{units}</span>{/if}
    {#if isRecentDate}
      <RecentWeatherDataTooltip />
    {/if}
  </div>
  <span class="ml-1 text-sm">{label}</span>
  {@render date?.()}
  {@render details?.()}
</span>
