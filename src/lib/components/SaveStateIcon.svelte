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

<!-- The save state on a Project or Palette button, only when there's something
to see: a slow, dimmed spinner while a change waits to save; red for a problem
(a cloud for the account, a screen for this browser only). Saved, or not saving
by itself, is the plain menu icon. The button's label says the state. -->

<script lang="ts">
  import {
    CloudAlertIcon,
    EllipsisVerticalIcon,
    LoaderCircleIcon,
    MonitorXIcon,
  } from '@lucide/svelte';

  let {
    on,
    saveState,
    account,
  }: {
    /** Whether changes save by themselves */
    on: boolean;
    saveState: 'saved' | 'waiting' | 'saving' | 'error' | 'conflict';
    /** Whether they save to the account; otherwise to this browser */
    account: boolean;
  } = $props();
</script>

{#if !on || saveState === 'saved'}
  <EllipsisVerticalIcon />
{:else if saveState === 'error' || saveState === 'conflict'}
  {#if account}
    <CloudAlertIcon class="text-error-700-300" />
  {:else}
    <MonitorXIcon class="text-error-700-300" />
  {/if}
{:else}
  <LoaderCircleIcon class="saving-spin opacity-60" />
{/if}

<style>
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
    :global(.saving-spin) {
      animation: none;
    }
  }
  :global([data-motion='reduce'] .saving-spin) {
    animation: none;
  }
</style>
