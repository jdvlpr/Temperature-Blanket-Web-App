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
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import Tooltip from '$lib/components/Tooltip.svelte';
  import {
    displayNumber,
    getSecondaryTargetIndexes,
    getTextColor,
    setSecondaryTargets,
  } from '$lib/utils';
  import { getContext } from 'svelte';

  export let targets,
    squareSize,
    primaryTarget,
    secondaryTargets,
    primaryTargetAsBackup,
    onOkay;

  const { close } = getContext('simple-modal');
  const colors = {
    tmin: '#38bdf8',
    tavg: '#a3a3a3',
    tmax: '#f87171',
    prcp: '#818cf8',
    snow: '#94a3b8',
    dayt: '#facc15',
  };

  $: secondaryTargetIndexes = getSecondaryTargetIndexes(secondaryTargets);

  $: squares = createSquares(squareSize, secondaryTargetIndexes, primaryTarget);
  $: maxGridItemWidth = displayNumber((1 / squareSize) * 800);

  function reset() {
    secondaryTargets = [];
  }

  function createSquares(_squareSize, _secondaryTargetIndexes, _primaryTarget) {
    const _squares = [];
    for (let i = 0; i < _squareSize * _squareSize; i++) {
      let targetId;
      if (
        _secondaryTargetIndexes &&
        _secondaryTargetIndexes.some((item) => item.index === i)
      ) {
        targetId = _secondaryTargetIndexes.filter((item) => item.index === i)[0]
          .targetId;
      } else {
        targetId = _primaryTarget;
      }
      const icon = targets.filter((target) => target.id === targetId)[0].icon;
      const label = targets.filter((target) => target.id === targetId)[0]
        .shortLabel;
      _squares.push({
        icon,
        label,
        targetId,
      });
    }
    return _squares;
  }

  function _onOkay() {
    onOkay({
      squareSize,
      primaryTarget,
      secondaryTargets,
      primaryTargetAsBackup,
    });
    close();
  }
</script>

<div class="p-2 sm:p-4 mt-8">
  <p class="italic my-2">
    Each sqaure in your layout will use the following properties.
  </p>

  <div class="flex flex-col gap-4 justify-center items-center">
    <div class="flex flex-wrap gap-4 justify-center w-full">
      <label class="label">
        <span>Square Size</span>
        <select class="select w-fit" id="square-size" bind:value={squareSize}>
          {#each Array(17) as _, i}
            {#if i > 0}
              <option value={i}>
                {i} x {i}
              </option>
            {/if}
          {/each}
        </select>
      </label>

      <label class="label">
        <span>Primary (Background) Color Using the Day's</span>
        <select
          class="select w-fit"
          id="primary-target"
          bind:value={primaryTarget}
        >
          {#each targets as { id, label, icon }}
            <option value={id}>{icon} {label} </option>
          {/each}
        </select>
      </label>
    </div>

    <p class="italic">
      Tap the sections below to use a secondary color for that part of each
      square.
    </p>

    <div
      class="grid gap-1 max-w-[500px] max-h-[500px] aspect-square my-2"
      style="grid-template-columns:repeat({squareSize},minmax(1rem,{maxGridItemWidth}px));"
    >
      {#key secondaryTargets}
        {#each squares as { icon, label, targetId }, index (index)}
          <button
            class="flex flex-col justify-center items-center select-none outline-none cursor-pointer rounded-container-token shadow aspect-square"
            style="background-color: {colors[targetId]};color:{getTextColor(
              colors[targetId],
            )}"
            data-param={targetId}
            type="button"
            on:click={() => {
              const currentTarget = targets.filter(
                (target) => target.id === targetId,
              )[0];
              const targetIndex = targets.indexOf(currentTarget);
              const nextTargetIndex =
                targetIndex + 1 === targets.length ? 0 : targetIndex + 1;
              const nextTarget = targets[nextTargetIndex];
              secondaryTargets = setSecondaryTargets(
                [nextTarget.id, index],
                secondaryTargets,
              );
            }}
          >
            <p
              class="text-lg sm:text-3xl aspect-square"
              class:!text-sm={squareSize > 10}
              class:!text-xs={squareSize > 14}
            >
              {icon}
            </p>
          </button>
        {/each}
      {/key}
    </div>

    <Tooltip on:click={reset} class="btn bg-secondary-hover-token gap-2">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
        />
      </svg>
      Reset Sections
      <p slot="tooltip">
        All square sections will be reset to the primary color.
      </p>
    </Tooltip>
  </div>

  <div
    class="flex flex-col gap-2 justify-center items-center bg-surface-100-800-token rounde-container-token p-4 mt-2"
  >
    <ToggleSwitch
      bind:checked={primaryTargetAsBackup}
      label="Use Primary as Backup"
      details="Use primary color if secondary color's value is not available, or if it's a height-type paramter with a value
    of 0."
    />
  </div>
</div>

<StickyPart position="bottom">
  <div class="p-2 sm:p-4">
    <SaveAndCloseButtons onSave={_onOkay} onClose={close} />
  </div>
</StickyPart>
