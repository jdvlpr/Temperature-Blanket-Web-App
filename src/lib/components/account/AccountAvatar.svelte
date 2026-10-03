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

<script lang="ts">
  import {
    initialsFor,
    type AccountSummary,
  } from '$lib/accounts/summary.svelte';

  let {
    summary,
    class: className = 'size-8 text-sm',
  }: { summary: AccountSummary; class?: string } = $props();

  let imageFailed = $state(false);
</script>

{#if summary.image && !imageFailed}
  <img
    src={summary.image}
    alt=""
    referrerpolicy="no-referrer"
    class={['shrink-0 rounded-full object-cover', className]}
    onerror={() => (imageFailed = true)}
  />
{:else}
  <span
    aria-hidden="true"
    class={[
      'preset-filled-primary-500 inline-flex shrink-0 items-center justify-center rounded-full font-bold select-none',
      className,
    ]}>{initialsFor(summary)}</span
  >
{/if}
