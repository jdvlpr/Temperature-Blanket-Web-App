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

<!-- "Anonymous", when publishing to the gallery from an account (bound the
other way round, as `checked` = show the name). Off: its page says "By" and the
display name, and the owner's public gallery page lists it. On: it's published
without a name. -->

<script lang="ts">
  import { DISPLAY_NAME_HREF } from '#lib/accounts/display-name-link.js';
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
    label="Anonymous"
    details={checked
      ? shownName
        ? `Credited “By ${shownName}” and listed on your public gallery page.`
        : 'Listed on your public gallery page once you add a display name.'
      : 'Published without your name, and not on your public gallery page.'}
    bind:checked={() => !checked, (anonymous) => (checked = !anonymous)}
    {disabled}
  />
  <!-- Where the name comes from: in a new tab, so this dialog stays put -->
  {#snippet profileLink()}
    <a href={DISPLAY_NAME_HREF} target="_blank" class="link"
      >Profile settings<ExternalLinkIcon
        class="icon-sm ml-0.5 inline"
        aria-hidden="true"
      /></a
    >
  {/snippet}
  {#if checked && !shownName}
    <p class="text-warning-700-300 px-4 pb-3 text-sm">
      Add a display name in your {@render profileLink()} to show it.
    </p>
  {:else}
    <p class="text-surface-700-300 px-4 pb-3 text-sm">
      Your name comes from your {@render profileLink()}.
    </p>
  {/if}
</div>
