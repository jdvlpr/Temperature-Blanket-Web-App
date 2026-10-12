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

<!-- "Show my name", when publishing to the gallery from an account. On: its
page says "By" and the display name, and the owner's public gallery page lists
it. Off: it's published without a name. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import ToggleSwitch from '#lib/components/buttons/ToggleSwitch.svelte';
  import { ExternalLinkIcon } from '@lucide/svelte';

  let {
    checked = $bindable(false),
    name,
    disabled = false,
  }: {
    checked?: boolean;
    /** The account's display name, as it is now */
    name: string;
    disabled?: boolean;
  } = $props();

  let shownName = $derived(name.trim());
</script>

<div class="bg-surface-100-900 rounded-container flex flex-col text-left">
  <ToggleSwitch
    bare
    label="Show my name"
    details={checked
      ? shownName
        ? `Its page will say “By ${shownName}” and your public gallery page will list it.`
        : 'Your public gallery page will list it once you add a display name.'
      : 'It will be published without your name.'}
    bind:checked
    {disabled}
  />
  {#if checked && !shownName}
    <p class="text-warning-700-300 px-4 pb-3 text-sm">
      Add a display name on your

      <a href={resolve('account')} target="_blank" class="link">
        Account page
        <ExternalLinkIcon class="inline size-3" />
      </a>

      to show it.
    </p>
  {/if}
</div>
