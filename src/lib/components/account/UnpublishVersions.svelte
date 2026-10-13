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

<!-- @component
  Publishing a new version: which of the versions there now (gallery pages,
  newest first) to unpublish once it's in, one checkbox each, with when it was
  published and its colors then.
-->
<script lang="ts">
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import { getColorsFromInput } from '#lib/utils/color-utils.js';

  let {
    versions,
    selected = $bindable([]),
    disabled = false,
  }: {
    versions: { postId: number; publishedAt: number; link?: string | null }[];
    /** The post IDs to unpublish */
    selected?: number[];
    disabled?: boolean;
  } = $props();

  const publishedOn = (time: number) =>
    new Date(time).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

  const colorsOf = (link?: string | null) =>
    (link && getColorsFromInput({ string: link })) || null;
</script>

<fieldset class="bg-surface-100-900 rounded-container flex flex-col" {disabled}>
  <legend class="sr-only">Unpublish older versions</legend>
  <p class="px-4 pt-3 font-bold" aria-hidden="true">Unpublish older versions</p>
  <p class="px-4 pb-1 text-sm opacity-80">
    Checked versions come off the gallery when you publish.
  </p>
  <div class="divide-surface-200-800 flex flex-col divide-y">
    {#each versions as version, i (version.postId)}
      {@const colors = colorsOf(version.link)}
      <label class="flex cursor-pointer items-center gap-3 px-4 py-3">
        <input
          type="checkbox"
          class="checkbox"
          checked={selected.includes(version.postId)}
          onchange={(event) =>
            (selected = event.currentTarget.checked
              ? [...selected, version.postId]
              : selected.filter((id) => id !== version.postId))}
        />
        <span class="flex min-w-0 flex-1 flex-col gap-1">
          <span class="flex flex-col">
            <span>Published {publishedOn(version.publishedAt)}</span>
            {#if i === 0 && versions.length > 1}
              <span class="text-xs opacity-70">Latest</span>
            {/if}
          </span>
          {#if colors}
            <span class="block w-40" aria-hidden="true">
              <PaletteStrip {colors} height="12px" insideControl />
            </span>
          {/if}
        </span>
      </label>
    {/each}
  </div>
</fieldset>
