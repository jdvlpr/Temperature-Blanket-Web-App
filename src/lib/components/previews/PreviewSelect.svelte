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

<script>
  import { browser } from '$app/environment';
  import { THEMES } from '$lib/constants/page-constants';
  import { previews } from '$lib/state/preview-state.svelte';
  import { preferences } from '$lib/storage/preferences.svelte';
  import { onDestroy, onMount, tick } from 'svelte';

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

<div class="flex flex-col items-center justify-center gap-2">
  <label class="label">
    <span class="label-text"> Pattern</span>
    <div class="relative flex items-center">
      <select
        class="select truncate"
        id="select-pattern-type"
        value={activePreviewSelectId}
        onchange={(e) => {
        onChangePattern(e.target.value);
        tick().then(() => {
          const activePreviewBtn = document.getElementById(
            'active-preview-button',
          );
          if (activePreviewBtn) {
            activePreviewBtn.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'center',
            });
          }
        });
      }}
    >
      {#each previews.all as { name, id }}
        {#if id === 'twsr'}
        <option value={id}>{name} (New)</option>
        {:else}
        <option value={id}>{name}</option>
        {/if}
      {/each}
    </select>
          </div>
        </label>


  <div
    class="relative mx-auto my-2 flex w-fit snap-x justify-start overflow-auto pb-3"
  >
    {#each previews.all as { img, name, id }}
      {#if img}
        {#key theme}
          <button
            class={[
              'relative mx-1 shrink-0 snap-center rounded p-2',
              id === previews.activeId
                ? 'bg-primary-200 dark:bg-primary-800 selected shadow-sm'
                : 'hover:preset-tonal-surface',
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
              class="size-[48px] opacity-40"
              class:!opacity-100={id === previews.activeId}
            />
            {#if id === 'twsr'}
                <span class="badge bg-tertiary-100-900 absolute left-2 -bottom-3">New</span>
            {/if}
          </button>
          {/key}
          {/if}
          {/each}
  </div>
</div>
