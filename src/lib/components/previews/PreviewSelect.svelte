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
  import { THEMES } from '$lib/constants';
  import { preferences, previews } from '$lib/state';
  import { onDestroy, onMount } from 'svelte';

  let theme = $state(
    getTheme(THEMES.find((n) => n.id === preferences.value.theme.mode)),
  );

  let activePreviewSelectId = $state(previews.activeId);

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

  // Update theme when the system theme changes
  function handleColorSchemeChange() {
    theme = getTheme(preferences.value.theme.mode);
  }

  function getTheme(id) {
    if (id !== 'system') return id;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches)
      return 'dark';
    return 'light';
  }

  $effect(() => {
    if (previews.activeId !== activePreviewSelectId)
      activePreviewSelectId = previews.activeId;
  });

  // Update theme when user changes the theme mode
  $effect(() => {
    theme = getTheme(preferences.value.theme.mode);
  });
</script>

<div class="bg-surface-300-700 rounded-container my-2 mb-4 p-2">
  <div class="mb-2 flex flex-wrap justify-center items-center">
    <label class="label">
      <select
        class="select w-fit"
        id="select-pattern-type"
        value={activePreviewSelectId}
        onchange={(e) => {
          previews.activeId = e.target.value;
        }}
      >
        {#each previews.all as { name, id }}
          <option value={id}>{name}</option>
        {/each}
      </select>
    </label>
  </div>

  <div
    class="preview-image-select flex flex-wrap gap-2 justify-center items-center"
  >
    {#each previews.all as { img, name, id }}
      {#if img}
        {#key theme}
          <button
            class={[
              'flex flex-col p-4 rounded-container justify-center gap-2 items-center snap-center',
              id === previews.activeId
                ? 'bg-primary-300-700 selected shadow'
                : 'preset-tonal-surface',
            ]}
            onclick={() => {
              previews.activeId = id;
            }}
            title="Preview {name} Design"
          >
            <img
              src={img[theme]}
              alt={name}
              class="size-[48px] opacity-40"
              class:!opacity-100={id === previews.activeId}
            />
          </button>
        {/key}
      {/if}
    {/each}
  </div>
</div>
