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

<!-- Project, in the top bar: opens the Project menu. Once the project saves by
itself (and Save is gone), its icon is the save state, like Google Docs' cloud:
green when saved, a cloud for the account or a screen for this browser only;
dimmed while a change waits to save, with a little pop when it lands; red for
a problem, which the menu explains. -->

<script lang="ts">
  import { openProjectMenu } from '$lib/state/page-state.svelte';
  import { autosave } from '$lib/storage/autosave.svelte';
  import {
    CloudAlertIcon,
    CloudCheckIcon,
    EllipsisVerticalIcon,
    MonitorCheckIcon,
    MonitorXIcon,
  } from '@lucide/svelte';

  const problem = $derived(
    autosave.state === 'error' || autosave.state === 'conflict',
  );
  const saved = $derived(autosave.state === 'saved');

  /** The save state, for the label */
  const status = $derived(
    !autosave.on
      ? null
      : problem
        ? 'Not saved'
        : saved
          ? autosave.account
            ? 'Saved to your account'
            : 'Saved in this browser'
          : 'Saving…',
  );

  const label = $derived(
    status ? `Project Options (${status})` : 'Project Options',
  );
</script>

<button
  aria-label={label}
  title={label}
  class="btn hover:preset-tonal-surface gap-1"
  onclick={() => openProjectMenu()}
  data-testid="project-button"
  data-save-status={status}
>
  {#if !autosave.on}
    <EllipsisVerticalIcon />
  {:else if problem}
    {#if autosave.account}
      <CloudAlertIcon class="text-error-700-300" />
    {:else}
      <MonitorXIcon class="text-error-700-300" />
    {/if}
  {:else}
    {#key `${saved}${autosave.account}`}
      <span
        class="flex transition-opacity"
        class:saved-pop={saved}
        class:opacity-50={!saved}
      >
        {#if autosave.account}
          <CloudCheckIcon class="text-success-700-300" />
        {:else}
          <MonitorCheckIcon class="text-success-700-300" />
        {/if}
      </span>
    {/key}
  {/if}
  <span>Project</span>
</button>

<style>
  /* Saved: the check lands with a little pop, once per save */
  .saved-pop {
    animation: saved-pop 320ms cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  @keyframes saved-pop {
    from {
      transform: scale(0.6);
      opacity: 0.5;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .saved-pop {
      animation: none;
    }
  }
</style>
