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
  The preview toolbar's progress: a small button showing it ("62% · Mar 12"
  over a thin bar; Not started: Progress) that opens the Progress dialog, the
  one place it's set. Once set, a View menu beside it: Show my progress fades
  the days not made yet (kept per project), and Edit Progress….
-->
<script lang="ts">
  import ProgressBar from '#lib/components/ProgressBar.svelte';
  import MenuCheckbox from '#lib/components/buttons/MenuCheckbox.svelte';
  import {
    menuContentClass,
    menuItemClass,
    menuPositioning,
    menuTriggerClass,
  } from '#lib/components/menu-styles.js';
  import { progress } from '#lib/state/progress-state.svelte.js';
  import { openProgress } from '#lib/utils/open-progress.js';
  import { shortDay } from '#lib/utils/project-progress.js';
  import {
    ChartNoAxesColumnIncreasingIcon,
    ChevronDownIcon,
    EyeIcon,
    SquarePenIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
</script>

<button
  type="button"
  class="btn hover:preset-tonal-surface"
  title={progress.madeThrough
    ? 'Change how far you’ve made it'
    : 'Set how far you’ve made it'}
  onclick={() => openProgress()}
  data-testid="progress-button"
>
  <ChartNoAxesColumnIncreasingIcon aria-hidden="true" />
  {#if progress.madeThrough}
    <span class="flex flex-col items-stretch gap-0.5">
      <span class="text-sm leading-tight">
        {progress.progress.finished
          ? 'Finished'
          : `${progress.progress.percent}%`} · {shortDay(progress.madeThrough)}
      </span>
      <ProgressBar percent={progress.progress.percent} class="h-1 w-full" />
    </span>
  {:else}
    <span>Progress</span>
  {/if}
</button>

{#if progress.madeThrough}
  <Menu
    positioning={menuPositioning('bottom-end')}
    onSelect={(details) => {
      if (details.value === 'edit-progress') openProgress();
    }}
  >
    <Menu.Trigger class={menuTriggerClass} data-testid="preview-view-menu">
      <EyeIcon aria-hidden="true" />
      <span>View</span>
      <ChevronDownIcon class="icon-sm" aria-hidden="true" />
    </Menu.Trigger>
    <Portal>
      <Menu.Positioner>
        <Menu.Content class={[menuContentClass, 'w-64']}>
          <!-- Stays open, so the check shows it took -->
          <Menu.OptionItem
            type="checkbox"
            value="progress"
            checked={progress.show}
            closeOnSelect={false}
            onCheckedChange={(checked) => progress.setShow(checked)}
            class={menuItemClass}
          >
            <span class="flex min-w-0 flex-1 flex-col">
              <span>Show my progress</span>
              <span class="text-surface-700-300 text-xs"
                >Fades the days not made yet</span
              >
            </span>
            <MenuCheckbox checked={progress.show} />
          </Menu.OptionItem>
          <Menu.Separator />
          <Menu.Item value="edit-progress" class={menuItemClass}>
            <SquarePenIcon class="shrink-0" aria-hidden="true" />
            <span>Edit Progress…</span>
          </Menu.Item>
        </Menu.Content>
      </Menu.Positioner>
    </Portal>
  </Menu>
{/if}
