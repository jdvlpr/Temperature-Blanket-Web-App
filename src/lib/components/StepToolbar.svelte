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
  A planner step's toolbar, one shape on every step: on the left, what it
  shows, each with its value (Units: °C / mm); on the right, what to do with
  it (Edit, Download, Share). Looks like the palette card's toolbar, but
  doesn't stick (only the Colors step's does). Centered under the steps bar;
  on a phone the two sides wrap.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** Settings, each showing its value */
    settings?: Snippet;
    /** Actions, at the far end */
    actions?: Snippet;
    /** Names it for screen readers, e.g. "Weather Data" */
    label: string;
    class?: string;
  }

  let { settings, actions, label, class: className = '' }: Props = $props();
</script>

<div
  role="group"
  aria-label={label}
  class={[
    'rounded-container border-surface-200-800 bg-surface-100 dark:bg-surface-900 flex w-full flex-wrap items-center gap-2 border p-2',
    className,
  ]}
>
  {#if settings}
    <div class="flex flex-wrap items-center gap-2">
      {@render settings()}
    </div>
  {/if}
  {#if actions}
    <div class="flex flex-wrap items-center gap-2 sm:ml-auto">
      {@render actions()}
    </div>
  {/if}
</div>
