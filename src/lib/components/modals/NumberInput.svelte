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
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import { dialog } from '$lib/state';
  import { displayNumber } from '$lib/utils';

  interface Props {
    value: number;
    title: string;
    onOkay: any;
    min?: number;
    max: number;
    showSlider?: boolean;
    noMinMax?: boolean;
  }

  let {
    value = $bindable(),
    title,
    onOkay,
    min = 1,
    max,
    showSlider = true,
    noMinMax = false,
  }: Props = $props();

  let _value = $state(value);

  function _onOkay() {
    onOkay(value);
    dialog.close();
  }

  function getMaxValue(value: number) {
    if (value < 1) return 20;
    if (value < 5) return value * 10;
    return value * 2;
  }

  $effect(() => {
    // Weather values which are not available are represented by a string '-'. Modify them to a number 0;
    if (typeof value !== 'number') value = 0;
  });

  $effect(() => {
    if (value > getMaxValue(_value)) _value = value;
  });
</script>

<div class="mx-auto inline-flex w-full flex-col items-center px-4 text-center">
  <label for="number-input" class="mb-2"><span>{@html title}</span></label>

  <div class="my-2 flex w-fit flex-col items-center justify-center gap-2">
    <input
      type="number"
      class="input w-fit text-2xl"
      id="number-input"
      min={noMinMax ? '' : min}
      max={noMinMax ? '' : max || getMaxValue(_value)}
      {title}
      bind:value
    />
    {#if showSlider}
      <input
        type="range"
        class="w-full"
        {min}
        max={max || getMaxValue(_value)}
        bind:value
      />
    {/if}
    <div class="flex flex-wrap items-center justify-center gap-2">
      <button
        class="btn-icon hover:preset-tonal-surface"
        onclick={() => (value = displayNumber(value - 20))}
        disabled={noMinMax ? false : value < min + 20}>-20</button
      >
      <button
        class="btn-icon hover:preset-tonal-surface"
        onclick={() => (value = displayNumber(value - 5))}
        disabled={noMinMax ? false : value < min + 5}>-5</button
      >
      <button
        class="btn-icon hover:preset-tonal-surface"
        onclick={() => (value = displayNumber(value - 1))}
        disabled={noMinMax ? false : value < min + 1}>-1</button
      >
      <button
        class="btn-icon hover:preset-tonal-surface"
        onclick={() => (value = displayNumber(value + 1))}>+1</button
      >
      <button
        class="btn-icon hover:preset-tonal-surface"
        onclick={() => (value = displayNumber(value + 5))}>+5</button
      >
      <button
        class="btn-icon hover:preset-tonal-surface"
        onclick={() => (value = displayNumber(value + 20))}>+20</button
      >
    </div>
  </div>

  <div class="my-4">
    <SaveAndCloseButtons
      onSave={_onOkay}
      disabled={isNaN(value) || noMinMax ? false : value < min}
      onClose={dialog.close}
    />
  </div>
</div>
