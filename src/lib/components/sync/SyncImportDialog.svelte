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

<!-- "Add what's in this browser to your account?" Each project and palette has
its own checkbox, all checked to start. Shown once per account and device after
signing in (as the welcome's second step for a new account), and whenever
someone asks to add them from My Library (`later`). -->

<script lang="ts">
  import { ROW_FOCUS } from '#lib/constants/class-constants.js';
  import PaletteStrip from '#lib/components/PaletteStrip.svelte';
  import ProjectPicture from '#lib/components/ProjectPicture.svelte';
  import { savedLine } from '#lib/utils/saved-line.js';
  import { ensureYarnData } from '#lib/data/yarns/colorways.svelte.js';
  import { dialog, toast } from '#lib/state/page-state.svelte.js';
  import { PaletteStorage } from '#lib/storage/palettes.svelte.js';
  import { ProjectPictures } from '#lib/storage/project-pictures.svelte.js';
  import {
    ProjectStorage,
    type StoredProjectIndexItem,
  } from '#lib/storage/projects.svelte.js';
  import { sync } from '#lib/sync/status.svelte.js';
  import { addToAccount, markImportAsked } from '#lib/sync/sync.svelte.js';
  import type { Color } from '#lib/types/yarn-types.js';
  import {
    getColorsFromInput,
    getPaletteFallbackName,
  } from '#lib/utils/color-utils.js';
  import { ClockIcon, CloudUploadIcon, XIcon } from '@lucide/svelte';
  import { onMount, tick, untrack } from 'svelte';

  let {
    userId,
    ids,
    paletteIds = [],
    later = false,
    step,
  }: {
    userId: string;
    ids: string[];
    paletteIds?: string[];
    later?: boolean;
    /** "Step 2 of 2", when it follows the welcome; the title takes focus */
    step?: string;
  } = $props();

  type PaletteRow = { id: string; label: string; colors: Color[] };

  let projects = $state<StoredProjectIndexItem[]>([]);
  let palettes = $state<PaletteRow[]>([]);
  // Everything is chosen to start with
  let chosenProjects = $state<string[]>(untrack(() => [...ids]));
  let chosenPalettes = $state<string[]>(untrack(() => [...paletteIds]));
  let busy = $state(false);
  let title = $state<HTMLElement>();

  let total = $derived(ids.length + paletteIds.length);
  let chosenCount = $derived(chosenProjects.length + chosenPalettes.length);

  onMount(async () => {
    if (step) {
      await tick();
      title?.focus();
    }
    const index = await ProjectStorage.getIndex();
    projects = index.filter((item) => ids.includes(item.id)).reverse();
    if (!paletteIds.length) return;
    // Yarn names in a palette's code need the yarn data
    await ensureYarnData();
    const saved = await PaletteStorage.getAll();
    palettes = saved
      .filter((palette) => paletteIds.includes(palette.id))
      .map((palette) => {
        const colors = getColorsFromInput({ string: palette.code }) || [];
        return {
          id: palette.id,
          colors,
          label: palette.name || getPaletteFallbackName(colors),
        };
      });
  });

  // Projects' pictures, as on My Library, drawn here if they have none yet
  const pictures = new ProjectPictures();
  $effect(() =>
    pictures.draw(projects.map(({ id, meta }) => ({ id, href: meta.href }))),
  );

  function chooseAll(all: boolean) {
    chosenProjects = all ? [...ids] : [];
    chosenPalettes = all ? [...paletteIds] : [];
  }

  // The first and last rows round their own outer corners, so the first row's
  // fill fits inside the list's border
  const ROW = `flex w-full items-start gap-3 px-4 py-3 text-left transition-colors first:rounded-t-container last:rounded-b-container disabled:opacity-50 ${ROW_FOCUS}`;
  const ICON = 'mt-0.5 shrink-0';
  const DETAIL = 'block text-sm';
  const CHOICE = 'flex cursor-pointer items-center gap-3';
  // Its picture (a palette, its colors) beside its name, as in the Trash
  const NAME = 'line-clamp-2 text-sm font-semibold break-words';
  const projectLabel = (project: StoredProjectIndexItem) =>
    project.meta.name || project.meta.title || 'Untitled Project';

  const plural = (n: number) => (n === 1 ? 'project' : 'projects');
  const palettesLabel = (n: number) =>
    `${n} ${n === 1 ? 'palette' : 'palettes'}`;
  /** "2 projects and 1 palette" */
  const describe = (projects: number, palettes: number) =>
    [
      projects && `${projects} ${plural(projects)}`,
      palettes && palettesLabel(palettes),
    ]
      .filter(Boolean)
      .join(' and ');

  async function answer(add: string[], addPaletteIds: string[] = []) {
    busy = true;
    await markImportAsked(userId);
    dialog.close();
    if (!add.length && !addPaletteIds.length) return;
    await addToAccount(userId, add, addPaletteIds);
    const added = describe(add.length, addPaletteIds.length);
    // Problems have toasts of their own (see $lib/sync/sync.svelte)
    if (sync.state === 'idle')
      toast.trigger({
        message: `Added ${added} to your account`,
        category: 'success',
      });
    else if (sync.state === 'offline')
      toast.trigger({
        message: `${added} will be added to your account when you’re back online`,
        category: 'info',
      });
  }
</script>

<div
  class="flex flex-col gap-4 p-4"
  role="dialog"
  aria-modal="true"
  aria-labelledby="sync-import-title"
>
  <div class="flex items-start gap-3">
    <CloudUploadIcon class="text-primary-500 mt-1 shrink-0" />
    <div class="flex flex-col gap-1">
      {#if step}<p class="text-sm opacity-70">{step}</p>{/if}
      <h2
        id="sync-import-title"
        class="h4 focus:outline-none"
        tabindex="-1"
        bind:this={title}
      >
        {later
          ? 'Add to your account'
          : `Add what’s in this browser to your account?`}
      </h2>
      <p class="text-sm opacity-80">
        This browser has {describe(ids.length, paletteIds.length)} that
        {total === 1 ? 'isn’t' : 'aren’t'} in your account yet. Choose which to add.
      </p>
    </div>
  </div>

  <fieldset class="flex flex-col gap-3">
    <legend class="sr-only">Projects and palettes to add</legend>
    {#if total > 1}
      <label class="{CHOICE} border-surface-200-800 border-b pb-3">
        <input
          type="checkbox"
          class="checkbox shrink-0"
          checked={chosenCount === total}
          indeterminate={chosenCount > 0 && chosenCount < total}
          onchange={(e) => chooseAll(e.currentTarget.checked)}
        />
        <span class="font-bold">Select all</span>
      </label>
    {/if}
    <!-- Their pictures, as in My Library, so projects are easy to tell apart -->
    {#each projects as project (project.id)}
      <label class={CHOICE}>
        <input
          type="checkbox"
          class="checkbox shrink-0"
          value={project.id}
          aria-label="Add {projectLabel(project)}"
          bind:group={chosenProjects}
        />
        <ProjectPicture
          id={project.id}
          href={project.meta.href}
          picturesVersion={pictures.version}
          pictureSettled={pictures.isSettled(project.id, project.meta.href)}
          imageClass="h-24 w-20 shrink-0 object-contain"
          coverClass="h-24 w-20 shrink-0"
          stripHeight="50px"
        />
        <span class="flex min-w-0 flex-1 flex-col">
          <span class={NAME}>{projectLabel(project)}</span>
          <span class="text-surface-700-300 line-clamp-1 text-xs"
            >{savedLine(project)}</span
          >
        </span>
      </label>
    {/each}
    {#each palettes as palette (palette.id)}
      <label class={CHOICE}>
        <input
          type="checkbox"
          class="checkbox shrink-0"
          value={palette.id}
          bind:group={chosenPalettes}
        />
        <span class="flex h-12 w-28 items-center" aria-hidden="true">
          <span class="w-full">
            <PaletteStrip colors={palette.colors} height="50px" insideControl />
          </span>
        </span>
        <span class="min-w-0 flex-1 {NAME}">{palette.label}</span>
      </label>
    {/each}
  </fieldset>

  <!-- Each choice is one row: what it does, and what that means. Pinned to the
  bottom of the dialog, so they stay in reach while scrolling a long list. -->
  <div
    class="bg-surface-50 dark:bg-surface-950 sticky bottom-0 -mx-4 -mb-4 px-4 pt-2 pb-4"
  >
    <div
      class="rounded-container border-surface-200-800 divide-surface-200-800 flex flex-col divide-y border"
    >
      <button
        type="button"
        class="bg-primary-50-950 hover:bg-primary-100-900 {ROW}"
        disabled={busy || !chosenCount}
        onclick={() => answer(chosenProjects, chosenPalettes)}
      >
        <CloudUploadIcon class={ICON} />
        <span class="flex-1">
          <span class="block font-bold">
            {chosenCount
              ? `Add ${describe(chosenProjects.length, chosenPalettes.length)}`
              : 'Choose something to add'}
          </span>
          <span class={DETAIL}> Synced to every device you sign in on. </span>
        </span>
      </button>

      <button
        type="button"
        class="hover:bg-surface-100-900 {ROW}"
        disabled={busy}
        onclick={() => answer([])}
      >
        {#if later}
          <XIcon class={ICON} />
        {:else}
          <ClockIcon class={ICON} />
        {/if}
        <span class="flex-1">
          <span class="block font-bold">{later ? 'Cancel' : 'Not now'}</span>
          <span class={DETAIL}>
            They stay in this browser. Add them later from My Library.
          </span>
        </span>
      </button>
    </div>
  </div>
</div>
