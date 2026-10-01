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
  import ColorPalette from '$lib/components/ColorPalette.svelte';
  import { MAXIMUM_YARN_DETAILS_DESCRIPTIONS } from '$lib/constants/color-constants';
  import { getColorsFromInput } from '$lib/utils/color-utils';
  import { extraColorsFromProjectHref } from '$lib/utils/extra-colors-utils';
  import { MAX_SAVED_PROJECT_NAME_LENGTH } from '$lib/storage/projects.svelte';
  import { escapeHtml, pluralize } from '$lib/utils/string-utils';
  import type { Color } from '$lib/types/yarn-types';
  import { CheckIcon, PencilIcon, Trash2Icon, XIcon } from '@lucide/svelte';

  interface Props {
    project: any;
    canRemove?: boolean;
    newTab?: boolean;
    onclick?: () => void;
    /** Shows a Rename button; called with the new name ('' clears it) */
    onrename?: (name: string) => void;
  }

  let {
    project,
    canRemove = true,
    newTab = true,
    onclick,
    onrename,
  }: Props = $props();

  const href = $derived(project.href);
  // The title comes from the project's locations; a name someone gave it wins
  const title = $derived(project.title);
  const name = $derived(project.name || '');
  const label = $derived(name || title || 'Untitled Project');

  let editing = $state(false);
  let editingName = $state('');

  function saveName() {
    editing = false;
    onrename?.(editingName);
  }
  const date = $derived(project.date);
  const isCustomWeatherData = $derived(project.isCustomWeatherData);

  const colors: Color[] | false = $derived(
    getColorsFromInput({ string: href }),
  );

  // The preview's accent/border colors (only in projects saved after the
  // `x` param was added)
  const extraColors: Color[] = $derived(
    extraColorsFromProjectHref(href).map((extra) => extra.color),
  );

  function getProjectDescription({
    colors,
    date,
  }: {
    colors: Color[];
    date: string;
  }) {
    let schemeName =
      "<p class='flex flex-wrap justify-start items-center gap-x-4'>";
    if (name && title) schemeName += `<span>${escapeHtml(title)}</span>`;
    schemeName += `<span class="inline-flex items-center justify-center gap-1"> Saved ${date}</span>`;
    if (isCustomWeatherData)
      schemeName += `<span class="">Custom Weather Data</span>`;
    const colorsCount = colors.length + extraColors.length;
    schemeName += `<span class="">${colorsCount} ${pluralize('color', colorsCount)}</span>`;

    let yarnDetails = [...colors, ...extraColors]
      .filter((color) => color?.brandId && color?.yarnId)
      .map((color) => {
        return (color.brandName ?? '') + ' - ' + (color.yarnName ?? '');
      });
    if (yarnDetails.length) {
      yarnDetails = [...new Set([...yarnDetails])];
      let hasMore = false;
      if (yarnDetails.length > MAXIMUM_YARN_DETAILS_DESCRIPTIONS) {
        yarnDetails.length = MAXIMUM_YARN_DETAILS_DESCRIPTIONS;
        hasMore = true;
      }
      yarnDetails.forEach((yarnDetail: string) => {
        schemeName += `<span class="">${yarnDetail}</span>`;
      });

      if (hasMore) schemeName += `<span>...</span>`;
    }

    schemeName += '</p>';
    return schemeName;
  }
</script>

<div
  class="bg-surface-100 dark:bg-surface-900 rounded-container flex w-full items-center justify-start gap-2 p-4"
>
  <div class="flex w-full flex-col">
    <!-- A full page load: the planner reads the project from the URL it starts
    with, so arriving by client-side navigation skips the saved weather -->
    {#if editing}
      <div class="input-group mb-1 grid-cols-[1fr_auto_auto]">
        <!-- svelte-ignore a11y_autofocus -->
        <input
          type="text"
          class="ig-input"
          aria-label="Project name"
          autocomplete="off"
          autofocus
          maxlength={MAX_SAVED_PROJECT_NAME_LENGTH}
          placeholder={title}
          bind:value={editingName}
          onkeydown={(e) => {
            if (e.key === 'Enter') saveName();
            if (e.key === 'Escape') {
              e.stopPropagation();
              editing = false;
            }
          }}
        />
        <button
          type="button"
          class="ig-btn hover:preset-tonal-surface"
          title="Save Name"
          onclick={saveName}
        >
          <CheckIcon />
        </button>
        <button
          type="button"
          class="ig-btn hover:preset-tonal-surface"
          title="Cancel"
          onclick={() => (editing = false)}
        >
          <XIcon />
        </button>
      </div>
    {:else}
      <a
        {href}
        data-sveltekit-reload
        target={newTab ? '_blank' : undefined}
        rel="noopener noreferrer"
        class="line-clamp-4 underline">{label}</a
      >
    {/if}
    {#if colors !== false}
      <ColorPalette
        {colors}
        height="24px"
        schemeName={getProjectDescription({ colors, date })}
      />
    {/if}
  </div>
  {#if onrename && !editing}
    <button
      type="button"
      class="btn-icon hover:preset-tonal-surface"
      title="Rename Project"
      aria-label="Rename {label}"
      onclick={() => {
        editingName = name;
        editing = true;
      }}
    >
      <PencilIcon />
    </button>
  {/if}
  {#if canRemove}
    <button
      class="btn-icon hover:preset-tonal-surface"
      title="Delete Project"
      aria-label="Delete {label}"
      {onclick}
    >
      <Trash2Icon />
    </button>
  {/if}
</div>
