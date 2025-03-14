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
  import { ExternalLinkIcon, ShoppingBagIcon } from '@lucide/svelte';
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
    hex,
    name,
    brandId,
    yarnId,
    brandName,
    yarnName,
    variant_href,
    affiliate_variant_href,
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

<div class="p-4 text-center" bind:this={container}>
  <p class="my-2 text-center text-xs">Color {title}</p>
  {#if affiliate_variant_href}
    <a
      class="mx-auto flex w-fit flex-wrap items-center justify-center gap-2 underline"
      href={affiliate_variant_href}
      target="_blank"
      rel="noreferrer nofollow"
    >
      <ShoppingBagIcon />
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
      class="mx-auto inline-flex w-fit flex-wrap items-center justify-center gap-2 underline"
      href={variant_href}
      target="_blank"
      rel="noreferrer nofollow"
    >
      <ExternalLinkIcon />

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

  <div class="my-2 flex w-full flex-wrap items-center justify-center gap-2">
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
        class="input w-full grow"
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
      <p class="card bg-warning-500/20 my-2 p-4">Please enter a valid color</p>
    {/if}
    <div class="max-sm:pb-2">
      <SaveAndCloseButtons
        onSave={_onOkay}
        onClose={modal.close}
        disabled={!valid}
      />
    </div>
  </div>
</StickyPart>
