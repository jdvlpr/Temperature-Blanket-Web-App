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
  import PaletteStrip from '$lib/components/PaletteStrip.svelte';
  import ProjectNameField from '$lib/components/ProjectNameField.svelte';
  import { MAXIMUM_YARN_DETAILS_DESCRIPTIONS } from '$lib/constants/color-constants';
  import { getColorsFromInput } from '$lib/utils/color-utils';
  import { extraColorsFromProjectHref } from '$lib/utils/extra-colors-utils';
  import { pluralize } from '$lib/utils/string-utils';
  import type { Color } from '$lib/types/yarn-types';
  import SyncIcon from '$lib/components/sync/SyncIcon.svelte';
  import type { SyncLabel } from '$lib/sync/status.svelte';
  import { PencilIcon, Trash2Icon } from '@lucide/svelte';

  interface Props {
    project: any;
    canRemove?: boolean;
    newTab?: boolean;
    onclick?: () => void;
    /** Shows a Rename button; called with the new name ('' clears it) */
    onrename?: (name: string) => void;
    /** Where the project is kept, e.g. "Synced" (see $lib/sync) */
    syncLabel?: SyncLabel;
  }

  let {
    project,
    canRemove = true,
    newTab = true,
    onclick,
    onrename,
    syncLabel,
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

  const colorsCount = $derived(colors ? colors.length + extraColors.length : 0);

  // Each yarn once, up to a few
  const yarnDetails = $derived.by(() => {
    const all = [
      ...new Set(
        [...(colors || []), ...extraColors]
          .filter((color) => color?.brandId && color?.yarnId)
          .map(
            (color) => (color.brandName ?? '') + ' - ' + (color.yarnName ?? ''),
          ),
      ),
    ];
    return {
      shown: all.slice(0, MAXIMUM_YARN_DETAILS_DESCRIPTIONS),
      hasMore: all.length > MAXIMUM_YARN_DETAILS_DESCRIPTIONS,
    };
  });
</script>

<div
  class="bg-surface-100 dark:bg-surface-900 rounded-container flex w-full items-center justify-start gap-2 p-4"
>
  <div class="flex w-full flex-col">
    <!-- A full page load: the planner reads the project from the URL it starts
    with, so arriving by client-side navigation skips the saved weather -->
    {#if editing}
      <div class="mb-1">
        <ProjectNameField
          bind:value={editingName}
          placeholder={title}
          onsave={saveName}
          oncancel={() => (editing = false)}
        />
      </div>
    {:else}
      <div class="flex items-start gap-2">
        {#if syncLabel}
          <span class="mt-1"><SyncIcon label={syncLabel} /></span>
        {/if}
        <a
          {href}
          data-sveltekit-reload
          target={newTab ? '_blank' : undefined}
          rel="noopener noreferrer"
          class="line-clamp-4 min-w-0 underline">{label}</a
        >
      </div>
    {/if}
    {#if syncLabel?.tone === 'error'}
      <p class="text-error-700-300 text-sm">{syncLabel.text}</p>
    {/if}
    {#if colors !== false}
      {#snippet description()}
        <span class="flex flex-wrap items-center justify-start gap-x-4 text-xs">
          {#if name && title}<span>{title}</span>{/if}
          <span>Saved {date}</span>
          {#if isCustomWeatherData}<span>Custom Weather Data</span>{/if}
          <span>{colorsCount} {pluralize('color', colorsCount)}</span>
          {#each yarnDetails.shown as yarnDetail (yarnDetail)}
            <span>{yarnDetail}</span>
          {/each}
          {#if yarnDetails.hasMore}<span>...</span>{/if}
        </span>
      {/snippet}
      <PaletteStrip {colors} height="24px" label={description} />
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
  <!-- Not while renaming, which gets the room -->
  {#if canRemove && !editing}
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
