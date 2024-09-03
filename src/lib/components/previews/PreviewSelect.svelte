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
  import { activePreview, activeTheme } from '$lib/stores';
  import { onDestroy, onMount } from 'svelte';
  import { previews } from './previews';
  import { browser } from '$app/environment';

  onMount(() => {
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', handleColorSchemeChange);
  });

  onDestroy(() => {
    if (!browser) return;
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .removeEventListener('change', handleColorSchemeChange);
  });

  function handleColorSchemeChange() {
    theme = getTheme($activeTheme);
  }

  let activePreviewSelectId = $activePreview.id;

  $: theme = getTheme($activeTheme);

  $: if ($activePreview.id !== activePreviewSelectId)
    activePreviewSelectId = $activePreview.id;

  function getTheme(_theme) {
    if (_theme.id !== 'system') return _theme.id;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches)
      return 'dark';
    return 'light';
  }
</script>

<div class="bg-surface-300-600-token rounded-container-token my-2 mb-4 p-2">
  <div class="mb-2 flex flex-wrap justify-center items-center">
    <label class="label">
      <span />
      <select
        class="select w-fit"
        id="select-pattern-type"
        value={activePreviewSelectId}
        on:change={(e) => {
          activePreview.setId(e.target.value);
        }}
      >
        {#each previews as { name, id }}
          <option value={id}>{name}</option>
        {/each}
      </select>
    </label>
  </div>

  <div
    class="preview-image-select flex flex-wrap gap-2 justify-center items-center"
  >
    {#each previews as { img, name, id }}
      {#if img}
        {#key theme}
          <button
            class="flex flex-col p-4 rounded-container-token justify-center gap-2 items-center snap-center {id ===
            $activePreview.id
              ? ''
              : 'bg-surface-hover-token'}"
            class:bg-primary-300-600-token={id === $activePreview.id}
            class:selected={id === $activePreview.id}
            class:shadow={id === $activePreview.id}
            on:click={() => {
              activePreview.setId(id);
            }}
            title="Preview {name} Design"
          >
            <img
              src={img[theme]}
              alt={name}
              class="size-[48px] opacity-40"
              class:!opacity-100={id === $activePreview.id}
            />
          </button>
        {/key}
      {/if}
    {/each}
  </div>
</div>
