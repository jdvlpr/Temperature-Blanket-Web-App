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
  import ColorPaletteEditable from '$lib/components/ColorPaletteEditable.svelte';
  import DefaultYarnSet from '$lib/components/DefaultYarnSet.svelte';
  import SelectNumberOfColors from '$lib/components/SelectNumberOfColors.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import { ICONS, MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES } from '$lib/constants';
  import { defaultYarn } from '$lib/state';
  import {
    getColorways,
    getTextColor,
    stringToBrandAndYarnDetails,
  } from '$lib/utils';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import chroma from 'chroma-js';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import SelectYarnWeight from '../SelectYarnWeight.svelte';
  import ModalShell from './ModalShell.svelte';

  let { updateGauge, numberOfColors = $bindable(), parent } = $props();

  const modalStore = getModalStore();

  let debounceTimer;
  const debounce = (callback, time) => {
    window.clearTimeout(debounceTimer);
    debounceTimer = window.setTimeout(callback, time);
  };

  let coords = $state({ x: 0, y: 0 });
  let canvas = $state();
  let ctx = $state();
  let matchingYarnColors = $state([]);
  let rect;
  let img = $state();
  let cursorColor = $state({});
  let cursorX, cursorY;
  let input = $state();
  let showCursor = $state(null);
  let ColorThief;
  let loading = $state(true);
  let touching = $state(false);
  let selectedBrandId = $state();
  let selectedYarnId = $state();
  let selectedYarnWeightId = $state();
  let colorways = $state(
    getColorways({
      selectedBrandId: null,
      selectedYarnId: null,
      selectedYarnWeightId: null,
    }),
  );
  let hoverDiv = $state();
  let colorHoverDiv = $state();
  let hoverName = $state();

  onMount(async () => {
    const ct = await import(
      '../../../../node_modules/getimagepalette/dist/color-thief.mjs'
    );
    ColorThief = ct.default;

    if (numberOfColors > MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES)
      numberOfColors = MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES;
    if (numberOfColors < 2) numberOfColors = 2;

    img = new Image();
    img.crossOrigin = 'Anonymous';
    img.cache;
    img.onload = function () {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx = canvas.getContext('2d', {
        willReadFrequently: true,
      });
      ctx.drawImage(img, 0, 0);
      matchingYarnColors = getMatchingYarnColors({
        img,
        numberOfColors,
      });
      loading = false;
    };
    img.src = `https://picsum.photos/720/480?random=${Math.floor(Math.random() * 100)}`;

    if (defaultYarn.value) {
      const details = stringToBrandAndYarnDetails(defaultYarn.value);
      selectedBrandId = details.brandId;
      selectedYarnId = details.yarnId;
      colorways = getColorways({
        selectedBrandId,
        selectedYarnId,
      });
    }
  });

  function getColor(x, y) {
    let data = ctx.getImageData(x, y, 1, 1).data;
    return chroma(data[0], data[1], data[2]).hex();
  }

  function addColor(e) {
    if (matchingYarnColors.length === MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES)
      return;
    debounce(() => {
      if (colorHoverDiv) {
        colorHoverDiv?.classList.add('scale-0');
        setTimeout(() => {
          colorHoverDiv?.classList.remove('scale-0');
        }, 70); // time in milliseconds
      }
    }, 0);
    rect = canvas.getBoundingClientRect();
    let ratio = rect.width / canvas.width;
    let x = (e.clientX - rect.left) / ratio;
    let y = (e.clientY - rect.top) / ratio;
    let color = {
      hex: getColor(x, y),
    };
    handelAddColor({ color });
  }

  function addColorTouch(e) {
    if (matchingYarnColors.length === MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES)
      return;
    rect = canvas.getBoundingClientRect();
    let x = cursorX;
    let y = cursorY;
    if (x < 0 || x > canvas.width || y < 0 || y > canvas.height) return;
    let color = {
      hex: getColor(x, y),
    };
    handelAddColor({ color });
  }

  function handelAddColor({ color }) {
    color = getBestMatch({ color });
    color.id = new Date().getTime();
    matchingYarnColors = [...matchingYarnColors, color];
    numberOfColors = matchingYarnColors.length;
  }

  function showColor(e) {
    debounce(() => {
      if (!ctx) return;
      rect = canvas.getBoundingClientRect();
      let ratio = rect.width / canvas.width;
      let x = (e.clientX - rect.left) / ratio;
      let y = (e.clientY - rect.top) / ratio;
      let color = {
        hex: getColor(x, y),
      };
      color = getBestMatch({ color });
      cursorColor = color;
      coords = {
        x: e.pageX - rect.left,
        y: e.pageY - rect.top,
      };
    }, 0);
  }

  function showColorTouch(e) {
    debounce(() => {
      if (!ctx) return;
      if (hoverName && hoverName.classList?.contains('hidden'))
        hoverName.classList.remove('hidden');
      rect = canvas.getBoundingClientRect();
      let ratio = rect.width / canvas.width;
      let x = (e.touches[0].clientX - rect.left) / ratio;
      let y = (e.touches[0].clientY - rect.top) / ratio;
      cursorX = x;
      cursorY = y;
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
        cursorColor = { hex: '#ffffff00' };
        hoverName?.classList.add('hidden');
        return;
      }
      let color = {
        hex: getColor(x, y),
      };
      color = getBestMatch({ color });
      cursorColor = color;
      coords = {
        x: e.touches[0].pageX - rect.left,
        y: e.touches[0].pageY - rect.top,
      };
    }, 0);
  }

  function handleImageChange(e) {
    var reader = new FileReader();
    reader.onload = function (event) {
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = function () {
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx = canvas.getContext('2d', {
          willReadFrequently: true,
        });
        ctx.drawImage(img, 0, 0);
        matchingYarnColors = getMatchingYarnColors({
          img,
          numberOfColors,
        });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(e.target.files[0]);
  }

  function getPalette({ img, numberOfColors }) {
    const colorThief = new ColorThief();
    const palette = colorThief.getPalette(img, numberOfColors);
    return palette.map((n, i) => {
      return {
        hex: chroma(n[0], n[1], n[2]).hex(),
        id: i,
      };
    });
  }

  function getMatchingYarnColors({ img, numberOfColors }) {
    let _yarnColors = [];

    let index = 0;
    let skip = 0;
    const colors = getPalette({ img, numberOfColors });

    while (_yarnColors.length < numberOfColors) {
      const _anyColor = colors[index];
      const _color = getBestMatch({
        color: _anyColor,
        index: skip,
      });
      const id = `${_color.brandId}${_color.yarnId}${_color.name}${_color.hex}`;
      const isDuplicate = _yarnColors
        .map((n) => `${n.brandId}${n.yarnId}${n.name}${n.hex}`)
        .includes(id);
      if (!isDuplicate || skip >= colorways.length) {
        _yarnColors.push(_color);
        index++;
        skip = 0;
      } else {
        skip++;
      }
    }
    return _yarnColors;
  }

  function getBestMatch({ color, index = 0 }) {
    const sortedColorways = colorways
      .map((n) => ({
        ...n,
        delta: chroma.deltaE(color.hex, n.hex),
      }))
      .sort((a, b) => a.delta - b.delta);
    if (index >= sortedColorways.length)
      return sortedColorways[sortedColorways.length - 1];
    return sortedColorways[index];
  }

  function onYarnFilterChange(e) {
    colorways = getColorways({
      selectedBrandId,
      selectedYarnId,
      selectedYarnWeightId,
    });
    matchingYarnColors = getMatchingYarnColors({
      img,
      numberOfColors,
    });
  }

  function getRandomImage() {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = 'none';
    loading = true;
    img = new Image();
    img.crossOrigin = 'Anonymous';
    img.cache;
    img.onload = function () {
      canvas.style.display = 'inline';
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx = canvas.getContext('2d', {
        willReadFrequently: true,
      });
      ctx.drawImage(img, 0, 0);
      loading = false;
      matchingYarnColors = getMatchingYarnColors({
        img,
        numberOfColors,
      });
    };
    img.src = `https://picsum.photos/720/480?random=${Math.floor(Math.random() * 100)}`;
  }
</script>

<ModalShell {parent} size="large" preventScroll={touching}>
  <div class="flex justify-center">
    <input
      type="file"
      accept="image/*"
      hidden
      bind:this={input}
      onchange={handleImageChange}
    />
    <button class="btn bg-secondary-hover-token gap-1" onclick={getRandomImage}>
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
          d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
        />
      </svg>

      Random Image</button
    >
    <button
      class="btn bg-secondary-hover-token gap-1"
      onclick={() => {
        if (typeof input !== 'undefined') input.click();
      }}
      ><svg
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
          d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z"
        />
      </svg>
      Choose Image
    </button>
  </div>

  {#if !loading}
    <div
      class="grid grid-cols-12 gap-4 justify-center items-end w-full my-2 no-scroll"
    >
      <div
        class="w-full col-span-full md:col-span-9 order-1"
        class:md:col-span-full={!!selectedBrandId && !!selectedYarnId}
      >
        <SelectYarn
          context="modal"
          bind:selectedBrandId
          bind:selectedYarnId
          onselectautocomplete={onYarnFilterChange}
          {selectedYarnWeightId}
        />
      </div>

      {#if selectedBrandId && selectedYarnId}
        <div class="w-full col-span-full order-2 md:order-3">
          <DefaultYarnSet {selectedBrandId} {selectedYarnId} />
        </div>
      {/if}

      {#key selectedBrandId}
        <div
          class="w-full col-span-full md:col-span-3 order-3 md:order-2"
          class:hidden={!!selectedBrandId && !!selectedYarnId}
        >
          <SelectYarnWeight
            {selectedBrandId}
            bind:selectedYarnWeightId
            on:change={onYarnFilterChange}
          />
        </div>
      {/key}
    </div>
  {/if}

  <p class="text-sm my-2" class:hidden={!ctx || loading}>
    Touch-and-drag or click on the image to choose colors.
  </p>

  <div
    class="relative mx-12 sm:mx-16 lg:mx-44 mb-2 flex flex-col items-center"
    class:hidden={!ctx}
  >
    {#if showCursor === false}
      <div bind:this={hoverDiv} in:fade>
        <p
          bind:this={hoverName}
          class="z-10 shadow-lg rounded-container-token min-w-[140px] max-w-[180px] absolute pointer-events-none box-border -translate-x-1/2 -translate-y-1/2 p-2 flex flex-col justify-center items-center"
          style="left:{coords.x}px;top:{coords.y -
            70}px;background:{cursorColor.hex};color:{getTextColor(
            cursorColor.hex,
          )};"
        >
          {#if cursorColor.name && cursorColor.brandName && cursorColor.yarnName}
            <span class="text-xs"
              >{cursorColor.brandName}
              - {cursorColor.yarnName}</span
            >
            <span class="">{cursorColor.name}</span>
            <span class="text-xs"
              >{Math.floor(100 - cursorColor?.delta)}% Match</span
            >
          {:else}
            <span class="">{cursorColor.hex}</span>
          {/if}
        </p>
        <div
          bind:this={colorHoverDiv}
          class="shadow-lg rounded-container-token w-10 h-10 absolute pointer-events-none box-border -translate-x-1/2 -translate-y-1/2 transition-transform"
          style="left:{coords.x}px;top:{coords.y}px;background:{cursorColor.hex};border:2px solid {getTextColor(
            cursorColor.hex,
          )}"
        ></div>
      </div>
    {/if}
    <canvas
      bind:this={canvas}
      class="w-full h-full cursor-crosshair select-none"
      onmousedown={(e) => {
        e.preventDefault();
        addColor(e);
      }}
      onmousemove={(e) => {
        e.preventDefault();
        showColor(e);
      }}
      ontouchmove={(e) => {
        e.preventDefault();
        showColorTouch(e);
      }}
      onmouseenter={(e) => {
        e.preventDefault();
        showColor(e);
        showCursor = false;
      }}
      ontouchstart={(e) => {
        touching = true;
        showColorTouch(e);
        showCursor = false;
      }}
      onmouseleave={(e) => {
        e.preventDefault();
        showCursor = true;
      }}
      ontouchend={(e) => {
        touching = false;
        addColorTouch(e);
        showCursor = true;
      }}
    ></canvas>
  </div>

  {#if matchingYarnColors.length === MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES && !loading}
    <p class="text-error-400">Maximum number of colors selected.</p>
  {/if}

  {#if loading}
    <div class="my-12 text-center">
      <Spinner />
      <p class="my-2">Loading Image...</p>
    </div>
  {:else}
    <div class="mt-4 mb-2 flex flex-wrap gap-2 justify-center items-center">
      <SelectNumberOfColors
        bind:numberOfColors
        max={MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES}
        allowZero={true}
        onchange={() => {
          if (numberOfColors < matchingYarnColors.length) {
            matchingYarnColors.length = numberOfColors;
          } else {
            const _yarnColors = getMatchingYarnColors({
              img,
              numberOfColors,
            });
            const newColors = _yarnColors
              .slice(matchingYarnColors.length)
              .map((color, i) => {
                return {
                  ...color,
                  id: i + matchingYarnColors.length,
                };
              });
            matchingYarnColors = [...matchingYarnColors, ...newColors];
          }
        }}
      />

      <button
        class="btn bg-secondary-hover-token gap-1"
        onclick={() => {
          if (numberOfColors < 2) numberOfColors = 2;
          matchingYarnColors = getMatchingYarnColors({
            img,
            numberOfColors,
          });
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="size-6"
          viewBox="0 0 24 24"
          ><path
            fill="currentColor"
            d="M7.5 5.6L5 7l1.4-2.5L5 2l2.5 1.4L10 2L8.6 4.5L10 7zm12 9.8L22 14l-1.4 2.5L22 19l-2.5-1.4L17 19l1.4-2.5L17 14zM22 2l-1.4 2.5L22 7l-2.5-1.4L17 7l1.4-2.5L17 2l2.5 1.4zm-8.66 10.78l2.44-2.44l-2.12-2.12l-2.44 2.44zm1.03-5.49l2.34 2.34c.39.37.39 1.02 0 1.41L5.04 22.71c-.39.39-1.04.39-1.41 0l-2.34-2.34c-.39-.37-.39-1.02 0-1.41L12.96 7.29c.39-.39 1.04-.39 1.41 0"
          /></svg
        >

        Auto Palette
      </button>
      <button
        class="btn bg-secondary-hover-token gap-1"
        onclick={() => {
          matchingYarnColors = [];
        }}
      >
        {@html ICONS.trash}
        Reset Colors
      </button>
    </div>
  {/if}

  <p class="text-sm my-2 text-center">
    Random images from <a
      href="https://unsplash.com"
      class="link"
      target="_blank"
      rel="nofollower noreferrer">unsplash.com</a
    >. All images are processed on your device.
  </p>

  {#snippet stickyPart()}
    <StickyPart position="bottom">
      <div class="p-2 sm:px-4">
        {#if matchingYarnColors.length && !loading}
          <div class="mb-2">
            <ColorPaletteEditable
              canUserEditColor={false}
              bind:colors={matchingYarnColors}
              onchanged={() => {
                if (matchingYarnColors.length !== numberOfColors)
                  numberOfColors = matchingYarnColors.length;
              }}
            />
          </div>
        {/if}
        <SaveAndCloseButtons
          disabled={!ctx || loading || !matchingYarnColors.length}
          onSave={() => {
            updateGauge({
              _colors: matchingYarnColors.map((n) => {
                delete n.id;
                return n;
              }),
            });
            modalStore.close();
          }}
          onClose={modalStore.close}
        />
      </div>
    </StickyPart>
  {/snippet}
</ModalShell>
