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
  import GaugeSettings from '$lib/components/modals/GaugeSettings.svelte';
  import { modal, units } from '$lib/stores';
  import { bind } from 'svelte-simple-modal';

  export let index, colors, ranges, rangeOptions, props;

  function onSaveRangeOptinos(e) {
    ranges = e.ranges;
    rangeOptions = e.rangeOptions;
  }
</script>

<span class="range-input-container">
  <button
    class="btn bg-secondary-hover-token flex gap-2 justify-start items-center"
    title="Adjust Range"
    on:click={(e) => {
      const wasToClicked =
        e.target.id === `range-${index}-to` ||
        e.target.parentElement.id === `range-${index}-to` ||
        e.target.parentElement.parentElement.id === `range-${index}-to` ||
        e.target.parentElement.parentElement.parentElement.id ===
          `range-${index}-to`;

      const focusOn = wasToClicked ? 'to' : 'from';
      modal.set(
        bind(GaugeSettings, {
          index,
          focusOn,
          props,
          ranges,
          colors,
          rangeOptions,
          onSave: onSaveRangeOptinos,
        }),
      );
    }}
  >
    <span class="flex flex-col text-left" id="range-{index}-from"
      ><span class="text-xs">From</span>
      <span class="flex items-start"
        ><span class="text-lg">{ranges[index]?.from}</span>
        <span class="text-xs">{props.unit.label[$units]}</span></span
      ></span
    >
    <span class="flex flex-col text-left" id="range-{index}-to"
      ><span class="text-xs">To</span>
      <span class="flex items-start"
        ><span class="text-lg">{ranges[index]?.to}</span>
        <span class="text-xs">{props.unit.label[$units]}</span></span
      ></span
    ></button
  >
</span>

<style>
  .range-input-container {
    display: flex;
    align-items: center;
    flex: 1 0 auto;
    margin: 0 5px;
    justify-content: center;
    flex-basis: 110px;
  }
</style>
