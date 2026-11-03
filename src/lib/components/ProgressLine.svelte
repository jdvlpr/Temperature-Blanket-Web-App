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
  The preview's progress, under its toolbar: one button showing it ("62% made
  · through Mar 12" and a bar; Not started: Set Progress) that opens the
  Progress dialog, the one place it's set. Once set, All Colors | My Progress:
  My Progress fades the days not made yet (kept per project).
-->
<script lang="ts">
  import ProgressBar from '#lib/components/ProgressBar.svelte';
  import { progress } from '#lib/state/progress-state.svelte.js';
  import { openProgress } from '#lib/utils/open-progress.js';
  import { shortDay } from '#lib/utils/project-progress.js';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
</script>

<div
  class="mx-auto flex w-fit max-w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm"
  data-testid="progress-line"
>
  <button
    type="button"
    class="btn hover:preset-tonal-surface h-auto flex-col items-stretch gap-1 py-1.5"
    title="Set how far you've made it"
    onclick={() => openProgress()}
    data-testid="progress-button"
  >
    {#if progress.madeThrough}
      <span>
        {#if progress.progress.finished}
          <strong>Finished</strong>
        {:else}
          <strong>{progress.progress.percent}% made</strong>
        {/if}
        · through {shortDay(progress.madeThrough)}
      </span>
      <ProgressBar percent={progress.progress.percent} class="w-full" />
    {:else}
      <span
        ><span class="text-surface-700-300">Not started ·</span> Set Progress</span
      >
    {/if}
  </button>

  {#if progress.madeThrough}
    <SegmentedControl
      value={progress.show ? 'progress' : 'all'}
      onValueChange={(e) => progress.setShow(e.value === 'progress')}
    >
      <SegmentedControl.Control
        class="bg-surface-100 dark:bg-surface-900"
        aria-label="What the preview shows"
      >
        <SegmentedControl.Indicator />
        <SegmentedControl.Item value="all">
          <SegmentedControl.ItemText>All Colors</SegmentedControl.ItemText>
          <SegmentedControl.ItemHiddenInput />
        </SegmentedControl.Item>
        <SegmentedControl.Item value="progress">
          <SegmentedControl.ItemText>My Progress</SegmentedControl.ItemText>
          <SegmentedControl.ItemHiddenInput />
        </SegmentedControl.Item>
      </SegmentedControl.Control>
    </SegmentedControl>
  {/if}
</div>
