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
  import { localState, previews } from '$lib/state';
  import { onDestroy, onMount } from 'svelte';

  let theme = $state(
    getTheme(THEMES.find((n) => n.id === localState.value.theme.mode)),
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
    theme = getTheme(localState.value.theme.mode || 'system');
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
    theme = getTheme(localState.value.theme.mode || 'system');
  });
</script>

<div class="my-4 flex flex-col items-center justify-center gap-2">
  <label class="label">
    <select
      class="select mx-auto w-fit min-w-[200px]"
      id="select-pattern-type"
      value={activePreviewSelectId}
      onchange={(e) => {
        previews.activeId = e.target.value;
      }}
    >
      {#each previews.all as { name, id }}
        {@const isBeta = name === 'Square Rounds'}
        <option value={id}>{name} {isBeta ? '(Beta)' : ''}</option>
      {/each}
    </select>
  </label>

  <div
    class="preview-image-select my-2 flex flex-wrap items-center justify-center gap-4"
  >
    {#each previews.all as { img, name, id }}
      {@const isBeta = name === 'Square Rounds'}
      {#if img}
        {#key theme}
          <button
            class={[
              'relative flex snap-center flex-col items-center justify-center gap-1 rounded p-2',
              id === previews.activeId
                ? 'bg-primary-300 dark:bg-primary-700 selected shadow-sm'
                : 'preset-tonal hover:preset-tonal-primary',
            ]}
            onclick={() => {
              previews.activeId = id;
            }}
            title="Preview {name} Design"
          >
            <img
              src={img[theme]}
              alt={name}
              class="size-[52px] opacity-40"
              class:!opacity-100={id === previews.activeId}
            />
            {#if isBeta}
              <span
                class="bg-tertiary-50-950 absolute -top-2 -right-2 rounded-md p-1 text-xs shadow"
                >Beta</span
              >
            {/if}
          </button>
        {/key}
      {/if}
    {/each}
  </div>
</div>
