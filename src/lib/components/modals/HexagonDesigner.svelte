<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

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
  import { dialog } from '$lib/state/page-state.svelte';
  import type { WeatherParam } from '$lib/types/gauge-types';
  import type { SecondaryTarget } from '$lib/types/preview-types';
  import { getTextColor } from '$lib/utils/color-utils';
  import {
    getSquareSectionTargetIds,
    setSecondaryTargets,
  } from '$lib/utils/preview-utils.svelte';
  import { RefreshCwIcon } from '@lucide/svelte';
  import { untrack } from 'svelte';

  interface Props {
    targets: WeatherParam[];
    hexagonSize: number;
    primaryTarget: WeatherParam['id'];
    secondaryTargets: SecondaryTarget[];
    primaryTargetAsBackup: boolean;
    onOkay: (e: {
      hexagonSize: number;
      primaryTarget: WeatherParam['id'];
      secondaryTargets: SecondaryTarget[];
      primaryTargetAsBackup: boolean;
    }) => void;
  }

  let {
    targets,
    hexagonSize: initialHexagonSize,
    primaryTarget: initialPrimaryTarget,
    secondaryTargets: initialSecondaryTargets,
    primaryTargetAsBackup: initialPrimaryTargetAsBackup,
    onOkay,
  }: Props = $props();

  const colors: Record<string, string> = {
    tmin: '#38bdf8',
    tavg: '#a3a3a3',
    tmax: '#f87171',
    prcp: '#818cf8',
    snow: '#94a3b8',
    dayt: '#facc15',
    moon: '#282828',
  };

  // Copies of the props, so nothing changes until the user presses Save
  let hexagonSize = $state(untrack(() => initialHexagonSize));
  let primaryTarget = $state(untrack(() => initialPrimaryTarget));
  let secondaryTargets = $state(untrack(() => initialSecondaryTargets));
  let primaryTargetAsBackup = $state(
    untrack(() => initialPrimaryTargetAsBackup),
  );

  // The weather parameter used by each round, from the center outward
  let rounds = $derived(
    getSquareSectionTargetIds(hexagonSize, primaryTarget, secondaryTargets).map(
      (targetId) => ({
        targetId,
        target: targets.find((target) => target.id === targetId),
      }),
    ),
  );

  // Returns the corner points of a hexagon centered in the diagram
  function getPoints(radius: number) {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 90);
      points.push(
        `${100 + radius * Math.cos(angle)},${100 + radius * Math.sin(angle)}`,
      );
    }
    return points.join(' ');
  }

  // Switches a round to the next available weather parameter
  function cycleRound(round: number) {
    const currentIndex = targets.findIndex(
      (target) => target.id === rounds[round].targetId,
    );
    const nextTarget = targets[(currentIndex + 1) % targets.length];
    secondaryTargets =
      setSecondaryTargets([nextTarget.id, round], secondaryTargets) || [];
  }

  function reset() {
    secondaryTargets = [];
  }

  function _onOkay() {
    onOkay({
      hexagonSize,
      primaryTarget,
      // Remove any rounds that no longer exist
      secondaryTargets: secondaryTargets
        .map((item) => ({
          ...item,
          indexes: item.indexes.filter((index) => index < hexagonSize),
        }))
        .filter((item) => item.indexes.length),
      primaryTargetAsBackup,
    });
    dialog.close();
  }
</script>

<div class="p-4">
  <p class="my-2 text-center italic">
    Each hexagon in your layout will use the following properties.
  </p>

  <div class="mb-4 flex flex-col items-center justify-center gap-4">
    <div class="flex w-full flex-wrap items-end justify-center gap-4">
      <label class="label">
        <span class="label-text">Hexagon Size</span>
        <select
          class="select min-w-[100px]"
          id="hexagon-size"
          bind:value={hexagonSize}
        >
          {#each Array(16), i}
            <option value={i + 1}>
              {i + 1}
              {i === 0 ? 'round' : 'rounds'}
            </option>
          {/each}
        </select>
      </label>

      <label class="label">
        <span class="label-text"
          >Primary (Background) Color Using the Day's</span
        >
        <select
          class="select w-fit min-w-[220px] truncate"
          id="primary-target"
          bind:value={primaryTarget}
        >
          {#each targets as { id, label, icon } (id)}
            <option value={id}>{icon} {label} </option>
          {/each}
        </select>
      </label>
    </div>

    <p class="italic">
      Tap a round below to use a secondary color for that round of each hexagon.
    </p>

    <!-- Keyboard users can use the buttons for each round below -->
    <svg
      class="aspect-square w-full max-w-[320px] cursor-pointer"
      viewBox="0 0 200 200"
      aria-hidden="true"
      onclick={(e) => {
        if (!(e.target instanceof SVGElement)) return;
        const round = e.target.dataset.round;
        if (round !== undefined) cycleRound(+round);
      }}
    >
      <!-- Rounds are drawn from the outside in, so each one covers the center of the previous -->
      {#each [...rounds].reverse() as { targetId }, reversedRound (reversedRound)}
        {@const round = rounds.length - 1 - reversedRound}
        <polygon
          points={getPoints((95 * (round + 1)) / rounds.length)}
          fill={colors[targetId]}
          stroke="white"
          stroke-width="1"
          data-round={round}
        />
      {/each}
    </svg>

    <div class="flex w-full flex-col items-center gap-2">
      {#each rounds as { targetId, target }, round (round)}
        <button
          class="btn rounded-container h-auto w-full max-w-[320px] flex-wrap justify-between gap-x-2 text-left whitespace-normal shadow-sm"
          style="background-color: {colors[targetId]};color:{getTextColor(
            colors[targetId],
          )}"
          type="button"
          onclick={() => cycleRound(round)}
        >
          <span class="font-semibold">
            Round {round + 1}{round === 0 ? ' (center)' : ''}{round ===
              rounds.length - 1 && round !== 0
              ? ' (outside)'
              : ''}
          </span>
          <span>{target?.icon} {target?.shortLabel ?? target?.label}</span>
        </button>
      {/each}
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
