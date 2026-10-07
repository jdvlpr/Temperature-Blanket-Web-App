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
  import ColorSearchField from '$lib/components/ColorSearchField.svelte';
  import PickColorFromImage from '$lib/components/modals/PickColorFromImage.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import YarnGridSelect from '$lib/components/modals/YarnGridSelect.svelte';
  import { dialog } from '$lib/state/page-state.svelte';
  import type { Color } from '$lib/types/yarn-types';
  import { ExternalLinkIcon, ShoppingCartIcon } from '@lucide/svelte';
  import { tick } from 'svelte';

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

  let container: HTMLElement | undefined = $state();

  /** The color the colorways are matched to. Choosing one of them doesn't
   * change it, so the list stays where it is while they're compared; typing
   * a color or picking one from a photo does. */
  // svelte-ignore state_referenced_locally
  let matchTarget = $state<string>(hex ?? '');

  // Copies, so that choosing a colorway doesn't change the filters
  // svelte-ignore state_referenced_locally
  const brandIdCopy = brandId;
  // svelte-ignore state_referenced_locally
  const yarnIdCopy = yarnId;

  /** Picking a color from a photo, shown in this dialog's place */
  let pickingFromPhoto = $state(false);

  let selectedColors = $derived([
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

  let href = $derived(affiliate_variant_href || variant_href);

  /** Use a colorway, or (without one) a color of the user's own */
  function setColor(value: string, color?: Color) {
    name = color?.name;
    brandId = color?.brandId;
    yarnId = color?.yarnId;
    brandName = color?.brandName;
    yarnName = color?.yarnName;
    variant_href = color?.variant_href;
    affiliate_variant_href = color?.affiliate_variant_href;
    hex = value;
  }

  async function closePhoto() {
    pickingFromPhoto = false;
    await tick();
    container
      ?.querySelector<HTMLElement>('[data-photo-button]')
      ?.focus({ preventScroll: true });
  }

  function _onOkay() {
    const color = {
      hex,
      name,
      brandId,
      yarnId,
      brandName,
      yarnName,
      variant_href,
      affiliate_variant_href,
    };
    if (index !== null) onChangeColor({ index, ...color });
    else onChangeColor(color);
  }
</script>

{#if pickingFromPhoto}
  <PickColorFromImage
    onPick={(picked: string) => {
      setColor(picked);
      matchTarget = picked;
    }}
    onBack={closePhoto}
  />
{/if}

<div class="p-4" bind:this={container} hidden={pickingFromPhoto}>
  {#if href}
    <!-- eslint-disable svelte/no-navigation-without-resolve -- yarn shops' and makers' own pages -->
    <a
      class="mx-auto mb-2 flex w-fit items-center justify-center gap-2 underline"
      {href}
      target="_blank"
      rel="noreferrer nofollow"
    >
      {#if affiliate_variant_href}
        <ShoppingCartIcon aria-hidden="true" />
      {:else}
        <ExternalLinkIcon aria-hidden="true" />
      {/if}
      <span class="flex flex-col items-start text-left">
        {#if name}
          <span class="text-lg leading-tight font-semibold">{name}</span>
        {/if}
        {#if brandName || yarnName}
          <span class="text-surface-700-300 text-xs">
            {[brandName, yarnName].filter(Boolean).join(' · ')}
          </span>
        {/if}
      </span>
      <span class="sr-only">(opens in a new tab)</span>
    </a>
    <!-- eslint-enable svelte/no-navigation-without-resolve -->
  {/if}

  <ColorSearchField
    label="Color"
    bind:hex={
      () => hex ?? '',
      (value: string) => {
        setColor(value);
        matchTarget = value;
      }
    }
    onphoto={() => (pickingFromPhoto = true)}
  />

  <YarnGridSelect
    limit={true}
    bind:selectedColors
    selectedBrandId={brandIdCopy}
    selectedYarnId={yarnIdCopy}
    matchHex={matchTarget}
    onClickScrollToTop={() => {
      container?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }}
    onSelection={(colors: Color[]) => {
      const color = colors[0];
      setColor(color.hex ?? '#ffffff', color);
    }}
    scrollToTopButtonBottom="4rem"
  />
</div>

{#if !pickingFromPhoto}
  <StickyPart position="bottom">
    <div class="p-2">
      {#if !hex}
        <p class="card bg-warning-500/20 my-2 p-4">
          Please enter a valid color
        </p>
      {/if}
      <div class="max-sm:pb-2">
        <SaveAndCloseButtons
          onSave={_onOkay}
          onClose={dialog.close}
          disabled={!hex}
        />
      </div>
    </div>
  </StickyPart>
{/if}
