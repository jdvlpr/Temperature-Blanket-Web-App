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

<!-- "Include this project/palette on my public gallery", when adding one to the
gallery from an account. On: its page says "By" and the display name, and the
owner's public gallery page lists it. Off: it's in the gallery anonymously. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import ToggleSwitch from '$lib/components/buttons/ToggleSwitch.svelte';
  import { ExternalLinkIcon } from '@lucide/svelte';

  let {
    kind,
    checked = $bindable(false),
    name,
    disabled = false,
  }: {
    kind: 'project' | 'palette';
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
    label="Include this {kind} on my public gallery"
    details={checked
      ? shownName
        ? `Its page will say “By ${shownName}” and your public gallery page will list it. If you change your display name, it changes here too.`
        : 'Your public gallery page will list it once you add a display name.'
      : `It will be in the gallery without your name, and not on your public gallery page.`}
    bind:checked
    {disabled}
  />
  {#if checked && !shownName}
    <p class="text-warning-700-300 px-4 pb-3 text-sm">
      Add a display name on your
      <a href={resolve('/account')} target="_blank" class="link"
        >Account page <ExternalLinkIcon class="inline size-3" /></a
      >
      to show it.
    </p>
  {/if}
  <p class="px-4 pb-3 text-sm opacity-70">
    You can change this later in My Projects.
  </p>
</div>
