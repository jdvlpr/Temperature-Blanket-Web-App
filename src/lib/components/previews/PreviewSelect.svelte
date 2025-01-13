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
  import { browser } from '$app/environment';
  import { activeTheme, preview } from '$lib/state';
  import { onDestroy, onMount } from 'svelte';
  import { previews } from './previews';

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
    theme = getTheme(activeTheme.value);
  }

  let activePreviewSelectId = $state(preview.current.id);

  function getTheme(_theme) {
    if (_theme.id !== 'system') return _theme.id;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches)
      return 'dark';
    return 'light';
  }
  let theme = $derived(getTheme(activeTheme.value));

  $effect(() => {
    if (preview.current.id !== activePreviewSelectId)
      activePreviewSelectId = preview.current.id;
  });
</script>

<div class="bg-surface-300-600-token rounded-container-token my-2 mb-4 p-2">
  <div class="mb-2 flex flex-wrap justify-center items-center">
    <label class="label">
      <select
        class="select w-fit"
        id="select-pattern-type"
        value={activePreviewSelectId}
        onchange={(e) => {
          preview.setId(e.target.value);
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
            preview.current.id
              ? ''
              : 'bg-surface-hover-token'}"
            class:bg-primary-300-600-token={id === preview.current.id}
            class:selected={id === preview.current.id}
            class:shadow={id === preview.current.id}
            onclick={() => {
              preview.setId(id);
            }}
            title="Preview {name} Design"
          >
            <img
              src={img[theme]}
              alt={name}
              class="size-[48px] opacity-40"
              class:!opacity-100={id === preview.current.id}
            />
          </button>
        {/key}
      {/if}
    {/each}
  </div>
</div>
