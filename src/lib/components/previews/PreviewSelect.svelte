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
  import { previews } from '$lib/state';
  import { preferences } from '$lib/storage/preferences.svelte';
  import { onDestroy, onMount } from 'svelte';

  let theme = $state(
    getTheme(THEMES.find((n) => n.id === preferences.value.theme.mode)),
  );

  let activePreviewSelectId = $state(previews.activeId);

  // Update theme when the system theme changes
  function handleColorSchemeChange() {
    theme = getTheme(preferences.value.theme.mode || 'system');
  }

  function getTheme(id) {
    if (id !== 'system') return id;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches)
      return 'dark';
    return 'light';
  }

  function onChangePattern(newId) {
    previews.activeId = newId;
  }

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

  $effect(() => {
    if (previews.activeId !== activePreviewSelectId)
      activePreviewSelectId = previews.activeId;
  });

  // Update theme when user changes the theme mode
  $effect(() => {
    theme = getTheme(preferences.value.theme.mode || 'system');
  });
</script>

<div class="my-4 flex flex-col items-center justify-center gap-2">
  <label class="label">
    <select
      class="select mx-auto w-fit min-w-[200px]"
      id="select-pattern-type"
      value={activePreviewSelectId}
      onchange={(e) => {
        onChangePattern(e.target.value);
      }}
    >
      {#each previews.all as { name, id }}
        <option value={id}>{name}</option>
      {/each}
    </select>
  </label>

  <div
    class="relative mx-auto my-2 flex w-fit snap-x justify-start gap-2 overflow-auto pb-2"
  >
    {#each previews.all as { img, name, id }}
      {#if img}
        {#key theme}
          <button
            class={[
              'relative shrink-0 snap-start rounded p-2',
              id === previews.activeId
                ? 'bg-primary-200 dark:bg-primary-800 selected shadow-sm'
                : 'preset-tonal hover:preset-tonal-primary',
            ]}
            id={previews.activeId === id ? 'active-preview-button' : ''}
            onclick={() => {
              onChangePattern(id);
            }}
            title="Preview {name} Layout"
          >
            <img
              src={img[theme]}
              alt={name}
              class="size-[52px] opacity-40"
              class:!opacity-100={id === previews.activeId}
            />
          </button>
        {/key}
      {/if}
    {/each}
  </div>
</div>
