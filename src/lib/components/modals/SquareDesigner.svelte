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
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import { dialog } from '$lib/state';
  import {
    displayNumber,
    getSecondaryTargetIndexes,
    getTextColor,
    setSecondaryTargets,
  } from '$lib/utils';
  import { RefreshCwIcon } from '@lucide/svelte';

  let {
    targets,
    squareSize,
    primaryTarget,
    secondaryTargets,
    primaryTargetAsBackup,
    onOkay,
  } = $props();

  const colors = {
    tmin: '#38bdf8',
    tavg: '#a3a3a3',
    tmax: '#f87171',
    prcp: '#818cf8',
    snow: '#94a3b8',
    dayt: '#facc15',
    moon: '#282828',
  };

  let _secondaryTargets = $state(getSecondaryTargetsCopy());

  let secondaryTargetIndexes = $derived(
    getSecondaryTargetIndexes(_secondaryTargets),
  );

  let squares = $derived(
    createSquares(squareSize, secondaryTargetIndexes, primaryTarget),
  );

  let maxGridItemWidth = $derived(displayNumber((1 / squareSize) * 800));

  function getSecondaryTargetsCopy() {
    return secondaryTargets;
  }

  function reset() {
    _secondaryTargets = [];
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
      secondaryTargets: _secondaryTargets,
      primaryTargetAsBackup,
    });
    dialog.close();
  }
</script>

<div class="p-4">
  <p class="my-2 text-center italic">
    Each square in your layout will use the following properties.
  </p>

  <div class="mb-4 flex flex-col items-center justify-center gap-4">
    <div class="flex w-full flex-wrap items-end justify-center gap-4">
      <label class="label">
        <span>Square Size</span>
        <select
          class="select min-w-[100px]"
          id="square-size"
          bind:value={squareSize}
        >
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
          class="select w-fit min-w-[220px] truncate"
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
      class="my-2 grid aspect-square max-h-[400px] max-w-[400px] gap-1"
      style="grid-template-columns:repeat({squareSize},minmax(1rem,{maxGridItemWidth}px));"
    >
      {#key _secondaryTargets}
        {#each squares as { icon, label, targetId }, index (index)}
          <button
            class="rounded-container flex aspect-square cursor-pointer flex-col items-center justify-center shadow-sm outline-hidden select-none"
            style="background-color: {colors[targetId]};color:{getTextColor(
              colors[targetId],
            )}"
            data-param={targetId}
            type="button"
            onclick={() => {
              const currentTarget = targets.filter(
                (target) => target.id === targetId,
              )[0];
              const targetIndex = targets.indexOf(currentTarget);
              const nextTargetIndex =
                targetIndex + 1 === targets.length ? 0 : targetIndex + 1;
              const nextTarget = targets[nextTargetIndex];
              _secondaryTargets = setSecondaryTargets(
                [nextTarget.id, index],
                _secondaryTargets,
              );
            }}
          >
            <p
              class="aspect-square text-lg sm:text-3xl"
              class:!text-sm={squareSize > 10}
              class:!text-xs={squareSize > 14}
            >
              {icon}
            </p>
          </button>
        {/each}
      {/key}
    </div>
  </div>

  <div
    class="card preset-filled-surface-100-900 my-2 grid items-center gap-2 p-2"
    style="grid-template-columns: auto 1fr;"
  >
    <button onclick={reset} class="btn preset-tonal-primary h-fit w-fit gap-2">
      <RefreshCwIcon />
      Reset
    </button>
    <p class=" text-sm">
      Replace any secondary colors you have set with the primary color.
    </p>
  </div>

  <ToggleSwitch
    bind:checked={primaryTargetAsBackup}
    label="Use Primary as Backup"
    details="Use primary color if secondary color's value is not available, or if it's a height-type paramter with a value
        of 0."
  />
</div>
<StickyPart position="bottom">
  <div class="p-2">
    <SaveAndCloseButtons onSave={_onOkay} onClose={dialog.close} />
  </div>
</StickyPart>
