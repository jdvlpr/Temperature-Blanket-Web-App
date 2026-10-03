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
a cloud for the account or a screen for this browser only, in the text color,
since saved is the usual state; a slow, dimmed spinner while a change waits
to save, with a little pop when it lands; red only for a problem, which the menu explains. -->

<script lang="ts">
  import { openProjectMenu } from '$lib/state/page-state.svelte';
  import { autosave } from '$lib/storage/autosave.svelte';
  import {
    CloudAlertIcon,
    CloudCheckIcon,
    EllipsisVerticalIcon,
    LoaderCircleIcon,
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
  {:else if saved}
    {#key autosave.account}
      <span class="saved-pop flex">
        {#if autosave.account}
          <CloudCheckIcon />
        {:else}
          <MonitorCheckIcon />
        {/if}
      </span>
    {/key}
  {:else}
    <LoaderCircleIcon class="saving-spin opacity-60" />
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
  /* Saving: a slow turn, calmer than a busy spinner, since it shows after every change */
  :global(.saving-spin) {
    animation: saving-spin 1.6s linear infinite;
  }
  @keyframes saving-spin {
    to {
      transform: rotate(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .saved-pop,
    :global(.saving-spin) {
      animation: none;
    }
  }
  :global([data-motion='reduce']) .saved-pop,
  :global([data-motion='reduce'] .saving-spin) {
    animation: none;
  }
</style>
