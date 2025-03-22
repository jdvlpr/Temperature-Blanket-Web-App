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
  import ColorPaletteEditable from '$lib/components/ColorPaletteEditable.svelte';
  import DefaultYarnSet from '$lib/components/DefaultYarnSet.svelte';
  import SelectNumberOfColors from '$lib/components/SelectNumberOfColors.svelte';
  import SelectYarn from '$lib/components/SelectYarn.svelte';
  import Spinner from '$lib/components/Spinner.svelte';
  import SaveAndCloseButtons from '$lib/components/modals/SaveAndCloseButtons.svelte';
  import StickyPart from '$lib/components/modals/StickyPart.svelte';
  import { MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES } from '$lib/constants';
  import { defaultYarn, modal } from '$lib/state';
  import {
    getColorways,
    getTextColor,
    stringToBrandAndYarnDetails,
  } from '$lib/utils';
  import {
    CameraIcon,
    RefreshCcwIcon,
    Trash2Icon,
    WandSparklesIcon,
    XIcon,
  } from '@lucide/svelte';
  import chroma from 'chroma-js';
  import { onMount, tick } from 'svelte';
  import { fade } from 'svelte/transition';
  import SelectYarnWeight from '../SelectYarnWeight.svelte';

  let { updateGauge, numberOfColors } = $props();

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
  let key = $state(false);
  let numberOfColorsKey = $state(false);

  let warningMessage = $state<String | null>(null);

  let containerElement = $state(null);

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
    tick().then(() => {
      // Allows for animation
      if (colorHoverDiv) {
        colorHoverDiv?.classList.add('scale-0');
        setTimeout(() => {
          colorHoverDiv?.classList.remove('scale-0');
        }, 70); // time in milliseconds
      }
    });
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
    color.locked = false;
    matchingYarnColors.push(color);
    numberOfColors = matchingYarnColors.length;
  }

  function showColor(e) {
    if (!ctx) return;
    debounce(() => {
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
        y: e.pageY - rect.top - window.scrollY,
      };
    }, 0);
  }

  function showColorTouch(e) {
    if (!ctx) return;
    debounce(() => {
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
        y: e.touches[0].pageY - rect.top - window.scrollY,
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
    key = !key;
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

    let lockedIndexes = [];

    matchingYarnColors?.forEach((n, i) => {
      if (n.locked) lockedIndexes.push(i);
    });

    _yarnColors = _yarnColors.map((color, index) => {
      if (lockedIndexes.includes(index)) {
        color = matchingYarnColors[index];
        color.locked = true;
      } else {
        color.locked = false;
      }
      return color;
    });

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
    key = !key;
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

<div class="p-2" bind:this={containerElement}>
  <div class="flex justify-center">
    <input
      type="file"
      accept="image/*"
      hidden
      bind:this={input}
      onchange={handleImageChange}
    />
    <button class="btn hover:preset-tonal" onclick={getRandomImage}>
      <RefreshCcwIcon />
      Random Image</button
    >
    <button
      class="btn hover:preset-tonal"
      onclick={() => {
        if (typeof input !== 'undefined') input.click();
      }}
    >
      <CameraIcon />
      Choose Image
    </button>
  </div>

  {#if !loading}
    <div
      class="no-scroll my-2 grid w-full grid-cols-12 items-end justify-center gap-4"
    >
      <div
        class="order-1 col-span-full w-full md:col-span-9"
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
        <div class="order-2 col-span-full w-full md:order-3">
          <DefaultYarnSet {selectedBrandId} {selectedYarnId} />
        </div>
      {/if}

      {#key selectedBrandId}
        <div
          class="order-3 col-span-full w-full md:order-2 md:col-span-3"
          class:hidden={!!selectedBrandId && !!selectedYarnId}
        >
          <SelectYarnWeight
            {selectedBrandId}
            bind:selectedYarnWeightId
            onchange={onYarnFilterChange}
          />
        </div>
      {/key}
    </div>
  {/if}

  <p class="my-2 text-sm" class:hidden={!ctx || loading}>
    Touch-and-drag or click on the image to choose colors.
  </p>

  <div
    class="relative mx-12 mb-2 flex flex-col items-center sm:mx-16 lg:mx-44"
    class:hidden={!ctx}
  >
    {#if showCursor === false}
      <div bind:this={hoverDiv} in:fade>
        <p
          bind:this={hoverName}
          class="rounded-container pointer-events-none absolute z-10 box-border flex max-w-[180px] min-w-[140px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center p-2 shadow-lg"
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
          class="rounded-container pointer-events-none absolute box-border h-10 w-10 -translate-x-1/2 -translate-y-1/2 shadow-lg transition-transform"
          style="left:{coords.x}px;top:{coords.y}px;background:{cursorColor.hex};border:2px solid {getTextColor(
            cursorColor.hex,
          )}"
        ></div>
      </div>
    {/if}
    <canvas
      bind:this={canvas}
      class="h-full w-full cursor-crosshair select-none"
      onmousedown={(e) => {
        e.preventDefault();
        addColor(e);
      }}
      onmousemove={(e) => {
        e.preventDefault();
        showColor(e);
      }}
      ontouchmove={(e) => {
        showColorTouch(e);
      }}
      onmouseenter={(e) => {
        e.preventDefault();
        showColor(e);
        showCursor = false;
      }}
      ontouchstart={(e) => {
        e.preventDefault();
        containerElement.parentElement.style.overflowY = 'hidden';
        showColorTouch(e);
        showCursor = false;
      }}
      onmouseleave={(e) => {
        e.preventDefault();
        showCursor = true;
      }}
      ontouchend={(e) => {
        e.preventDefault();
        containerElement.parentElement.style.overflowY = '';
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
    <div class="mt-4 mb-2 flex flex-wrap items-center justify-center gap-2">
      {#key numberOfColorsKey}
        <SelectNumberOfColors
          {numberOfColors}
          max={MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES}
          allowZero={true}
          onchange={(e) => {
            e.preventDefault();

            const value = parseInt(e.target.value);
            const lastLockedIndex = matchingYarnColors.findLastIndex(
              (color) => color.locked,
            );

            if (value - 1 < lastLockedIndex) {
              warningMessage = `Cannot decrease number of colors because it would delete a locked color`;
              numberOfColorsKey = !numberOfColorsKey;
              return;
            }

            numberOfColors = value;

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
              matchingYarnColors = [
                ...$state.snapshot(matchingYarnColors),
                ...newColors,
              ];
            }
            key = !key;
          }}
        />
      {/key}

      {#if warningMessage}
        <div class="text-warning-900-100 flex gap-2">
          <p>{warningMessage}</p>
          <button
            class="btn hover:preset-tonal"
            aria-label="close"
            onclick={() => (warningMessage = null)}
          >
            <XIcon />
          </button>
        </div>
      {/if}

      <button
        class="btn hover:preset-tonal"
        onclick={() => {
          if (numberOfColors < 2) numberOfColors = 2;
          matchingYarnColors = getMatchingYarnColors({
            img,
            numberOfColors,
          });
          key = !key;
        }}
      >
        <WandSparklesIcon />
        Auto Palette
      </button>

      <button
        class="btn hover:preset-tonal"
        onclick={() => {
          matchingYarnColors = matchingYarnColors.filter(
            (color) => color.locked,
          );
          if (matchingYarnColors.length)
            numberOfColors = matchingYarnColors.length;
        }}
      >
        <Trash2Icon />
        Delete Colors
      </button>
    </div>
  {/if}

  <p class="my-2 text-center text-sm">
    Random images from <a
      href="https://unsplash.com"
      class="link"
      target="_blank"
      rel="nofollower noreferrer">unsplash.com</a
    >. All images are processed on your device.
  </p>
</div>
<StickyPart position="bottom">
  <div class="p-2">
    {#if matchingYarnColors.length && !loading}
      <div class="mb-2">
        {#key numberOfColors}
          {#key key}
            <ColorPaletteEditable
              canUserEditColor={false}
              bind:colors={matchingYarnColors}
              onchanged={() => {
                if (matchingYarnColors.length !== numberOfColors)
                  numberOfColors = matchingYarnColors.length;
              }}
            />
          {/key}
        {/key}
      </div>
    {/if}
    <SaveAndCloseButtons
      disabled={!ctx || loading || !matchingYarnColors.length}
      onSave={() => {
        updateGauge({
          _colors: $state.snapshot(matchingYarnColors).map((n) => {
            delete n.id;
            delete n.locked;
            return n;
          }),
        });
        modal.close();
      }}
      onClose={modal.close}
    />
  </div>
</StickyPart>
