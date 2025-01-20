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
  import { getModalStore } from '@skeletonlabs/skeleton';
  import ModalShell from './ModalShell.svelte';
  import { displayNumber } from '$lib/utils';

  const modalStore = getModalStore();

  interface Props {
    value: number;
    title: string;
    onOkay: any;
    parent: any;
    min?: number;
    max: number;
    showSlider?: boolean;
    noMinMax?: boolean;
  }

  let {
    value = $bindable(),
    title,
    onOkay,
    parent,
    min = 1,
    max,
    showSlider = true,
    noMinMax = false,
  }: Props = $props();

  let _value = $state(value);

  function _onOkay() {
    onOkay(value);
    modalStore.close();
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

<ModalShell {parent} size="small">
  <div class="text-center inline-flex flex-col items-center mx-auto w-full">
    <label for="number-input" class="mb-2"><span>{@html title}</span></label>

    <div class="flex flex-col gap-2 justify-center items-center my-2 w-fit">
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
      <div class="flex flex-wrap gap-2 justify-center items-center">
        <button
          class="btn-icon bg-secondary-hover-token"
          onclick={() => (value = displayNumber(value - 20))}
          disabled={noMinMax ? false : value < min + 20}>-20</button
        >
        <button
          class="btn-icon bg-secondary-hover-token"
          onclick={() => (value = displayNumber(value - 5))}
          disabled={noMinMax ? false : value < min + 5}>-5</button
        >
        <button
          class="btn-icon bg-secondary-hover-token"
          onclick={() => (value = displayNumber(value - 1))}
          disabled={noMinMax ? false : value < min + 1}>-1</button
        >
        <button
          class="btn-icon bg-secondary-hover-token"
          onclick={() => (value = displayNumber(value + 1))}>+1</button
        >
        <button
          class="btn-icon bg-secondary-hover-token"
          onclick={() => (value = displayNumber(value + 5))}>+5</button
        >
        <button
          class="btn-icon bg-secondary-hover-token"
          onclick={() => (value = displayNumber(value + 20))}>+20</button
        >
      </div>
    </div>

    <div class="my-4">
      <SaveAndCloseButtons
        onSave={_onOkay}
        disabled={isNaN(value) || noMinMax ? false : value < min}
        onClose={modalStore.close}
      />
    </div>
  </div>
</ModalShell>
