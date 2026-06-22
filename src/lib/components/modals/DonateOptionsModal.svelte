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

<script>
  import { PUBLIC_KOFI_LINK } from '$env/static/public';
  import { dialog } from '$lib/state/page-state.svelte';
</script>

<div class="flex flex-col gap-4 p-4">
  <div>
    <h3 class="h3">Become a Supporter</h3>
    <p class="text-surface-500 mt-1 text-sm">Choose how you'd like to help.</p>
  </div>

  <div class="space-y-3">
    <a
      href="{PUBLIC_KOFI_LINK}/tiers"
      target="_blank"
      rel="noopener noreferrer"
      class="block rounded-container border border-surface-200 p-4 transition hover:preset-tonal-surface"
      onclick={() => dialog.close()}
    >
      <p class="font-semibold">Monthly donation</p>
      <p class="text-surface-500 text-sm">
        • Featured recognition on the Supporters page
      </p>
      <p class="text-surface-500 text-sm">• From $2 per month</p>
    </a>

    <a
      href={PUBLIC_KOFI_LINK}
      target="_blank"
      rel="noopener noreferrer"
      class="block rounded-container border border-surface-200 p-4 transition hover:preset-tonal-surface"
      onclick={() => dialog.close()}
    >
      <p class="font-semibold">One-time donation</p>
      <p class="text-surface-500 text-sm">• A single gift of any amount</p>
    </a>
  </div>

  <p class="text-surface-500 text-sm">
    Donations are processed through Kofi, a secure platform for supporting
    creators: <a
      href={PUBLIC_KOFI_LINK}
      target="_blank"
      rel="noopener noreferrer"
      class="link">{PUBLIC_KOFI_LINK}</a
    >.
  </p>
</div>
