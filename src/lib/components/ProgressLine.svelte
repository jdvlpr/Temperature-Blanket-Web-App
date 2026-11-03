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
  The preview toolbar's Progress. Not started: a Progress button that opens
  the Progress dialog, the one place it's set. Once set, a Progress ▾ menu:
  Edit Progress… (with how far it's made, as in the Project menu), then Show
  my progress, which fades the days not made yet (kept per project).
-->
<script lang="ts">
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
    SquarePenIcon,
  } from '@lucide/svelte';
  import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
</script>

{#if progress.madeThrough}
  <Menu
    positioning={menuPositioning('bottom-end')}
    onSelect={(details) => {
      if (details.value === 'edit-progress') openProgress();
    }}
  >
    <Menu.Trigger class={menuTriggerClass} data-testid="progress-menu">
      <ChartNoAxesColumnIncreasingIcon aria-hidden="true" />
      <span>Progress</span>
      <ChevronDownIcon class="icon-sm" aria-hidden="true" />
    </Menu.Trigger>
    <Portal>
      <Menu.Positioner>
        <Menu.Content class={[menuContentClass, 'w-64']}>
          <Menu.Item value="edit-progress" class={menuItemClass}>
            <SquarePenIcon class="shrink-0" aria-hidden="true" />
            <span class="flex min-w-0 flex-1 flex-col">
              <span>Edit Progress…</span>
              <span class="text-surface-700-300 text-xs"
                >{progress.progress.finished
                  ? `Finished · through ${shortDay(progress.madeThrough)}`
                  : `${progress.progress.percent}% made · through ${shortDay(progress.madeThrough)}`}</span
              >
            </span>
          </Menu.Item>
          <Menu.Separator />
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
        </Menu.Content>
      </Menu.Positioner>
    </Portal>
  </Menu>
{:else}
  <button
    type="button"
    class={menuTriggerClass}
    title="Set how far you’ve made it"
    onclick={() => openProgress()}
    data-testid="progress-button"
  >
    <ChartNoAxesColumnIncreasingIcon aria-hidden="true" />
    <span>Progress</span>
  </button>
{/if}
