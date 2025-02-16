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
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import YarnGridSelect from '$lib/components/modals/YarnGridSelect.svelte';
  import { modal } from '$lib/state';
  import chroma from 'chroma-js';

  interface Props {
    index?: any;
    hex: any;
    name: any;
    brandId: any;
    yarnId: any;
    brandName: any;
    yarnName: any;
    variant_href: any;
    affiliate_variant_href: any;
    onChangeColor: any;
  }

  let {
    index = null,
    hex = $bindable(),
    name = $bindable(),
    brandId = $bindable(),
    yarnId = $bindable(),
    brandName = $bindable(),
    yarnName = $bindable(),
    variant_href = $bindable(),
    affiliate_variant_href = $bindable(),
    onChangeColor,
  }: Props = $props();

  let container: HTMLElement = $state();

  let valid = $state(true);
  let inputTypeColorValue = $state(hex);
  let inputTypeTextValue = $state(hex);
  let selectedColors = $state([
    {
      hex,
      name,
      brandId,
      yarnId,
      brandName,
      yarnName,
      variant_href,
      affiliate_variant_href,
    },
  ]);
  let title = index !== null ? `${index + 1}` : '';
  let _brandId = brandId;
  let _yarnId = yarnId;

  function inputTypeColorOnChange({ value, color }) {
    name = color?.name;
    brandId = color?.brandId;
    yarnId = color?.yarnId;
    brandName = color?.brandName;
    yarnName = color?.yarnName;
    variant_href = color?.variant_href;
    affiliate_variant_href = color?.affiliate_variant_href;

    let __color = value;

    if (!chroma.valid(__color)) {
      valid = false;
      return;
    }
    valid = true;
    inputTypeColorValue = __color;
    inputTypeTextValue = __color;
    hex = chroma(inputTypeColorValue).hex('rgb'); // use 'rgb' to prevent alpha hex codes
  }

  function inputTypeTextOnChange({ value, color }) {
    name = color?.name;
    brandId = color?.brandId;
    yarnId = color?.yarnId;
    brandName = color?.brandName;
    yarnName = color?.yarnName;
    variant_href = color?.variant_href;
    affiliate_variant_href = color?.affiliate_variant_href;

    let __color = value;
    if (!chroma.valid(__color)) {
      valid = false;
      return;
    }
    valid = true;
    inputTypeTextValue = __color;
    inputTypeColorValue = chroma(inputTypeTextValue).hex('rgb'); // use 'rgb' to prevent alpha hex codes
    hex = chroma(inputTypeTextValue).hex('rgb'); // use 'rgb' to prevent alpha hex codes
  }

  function _onOkay() {
    if (index !== null)
      onChangeColor({
        index,
        hex,
        name,
        brandId,
        yarnId,
        brandName,
        yarnName,
        variant_href,
        affiliate_variant_href,
      });
    else onChangeColor({ hex });
  }

  let currentColor = $derived({ hex });
</script>

<div class="p-4" bind:this={container}>
  <p class="my-2 text-center text-xs">Color {title}</p>
  {#if affiliate_variant_href}
    <a
      class="btn hover:preset-tonal flex flex-wrap justify-center items-center gap-2 underline w-fit mx-auto"
      href={affiliate_variant_href}
      target="_blank"
      rel="noreferrer nofollow"
    >
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
          d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
        />
      </svg>
      <span class="flex flex-col items-start">
        <p class="text-xs">
          {#if brandName}
            {brandName}
            -
          {/if}
          {#if yarnName}
            {yarnName}
          {/if}
        </p>
        {#if name}
          <p class="text-2xl">{name}</p>
        {/if}
      </span>
    </a>
  {:else if variant_href}
    <a
      class="btn hover:preset-tonal flex flex-wrap justify-center items-center gap-2 underline w-fit mx-auto"
      href={variant_href}
      target="_blank"
      rel="noreferrer nofollow"
    >
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
          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
        />
      </svg>

      <span class="flex flex-col items-start">
        <p class="text-xs">
          {#if brandName}
            {brandName}
            -
          {/if}
          {#if yarnName}
            {yarnName}
          {/if}
        </p>
        {#if name}
          <p class="text-2xl">{name}</p>
        {/if}
      </span>
    </a>
  {/if}

  <div class="flex flex-wrap items-center justify-center gap-2 my-2 w-full">
    <label class="color-select-label" title="Choose a Color">
      <input
        type="color"
        class="input"
        value={inputTypeColorValue}
        onchange={(e) =>
          inputTypeColorOnChange({
            value: e.target.value,
          })}
      />
    </label>
    <label class="color-text-label flex-1" title="Enter a Color">
      <input
        type="text"
        class="input mb-2 mt-1 grow w-full"
        value={inputTypeTextValue}
        onkeyup={(e) =>
          inputTypeTextOnChange({
            value: e.target.value,
          })}
      />
    </label>
  </div>

  <YarnGridSelect
    limit={true}
    bind:selectedColors
    selectedBrandId={_brandId}
    selectedYarnId={_yarnId}
    incomingColor={currentColor}
    onClickScrollToTop={() => {
      container.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }}
    onSelection={(e) => {
      const color = e[0];
      inputTypeColorOnChange({ value: color.hex, color });
    }}
    scrollToTopButtonBottom="4rem"
  />
</div>

<StickyPart position="bottom">
  <div class="p-2">
    {#if !valid}
      <p class="card preset-tonal-warning p-4 my-2">
        Please enter a valid color
      </p>
    {/if}
    <SaveAndCloseButtons
      onSave={_onOkay}
      onClose={modal.close}
      disabled={!valid}
    />
  </div>
</StickyPart>
