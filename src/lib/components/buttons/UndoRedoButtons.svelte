<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- Undo and Redo in the top bar, for the Project Planner and the Yarn page:
icon buttons on smaller screens, never wrapping. Cmd/Ctrl+Z and
Cmd/Ctrl+Shift+Z do the same (see handleKeyDown). -->

<script lang="ts">
  import { RedoIcon, UndoIcon } from '@lucide/svelte';

  let {
    canUndo,
    canRedo,
    onUndo,
    onRedo,
  }: {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
  } = $props();
</script>

<div class="mx-auto flex shrink-0 gap-2 sm:mx-0">
  <button
    aria-label="Undo"
    class="max-md:btn-icon md:btn hover:preset-tonal-surface"
    title="Undo [Cmd ⌘]+[z] or [Ctrl]+[z]"
    id="undo"
    disabled={!canUndo}
    onclick={onUndo}
  >
    <UndoIcon />
    <span class="inline-block max-md:hidden">Undo</span>
  </button>

  <button
    aria-label="Redo"
    class="max-md:btn-icon md:btn hover:preset-tonal-surface"
    id="redo"
    title="Redo [Cmd ⌘]+[Shift ⇧]+[z] or [Ctrl]+[Shift ⇧]+[Z]"
    disabled={!canRedo}
    onclick={onRedo}
  >
    <RedoIcon />
    <span class="inline-block max-md:hidden">Redo</span>
  </button>
</div>
