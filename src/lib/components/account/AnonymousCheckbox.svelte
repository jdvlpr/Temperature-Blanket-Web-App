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
other way round, as `checked` = show the name): a quiet checkbox, with what it
means under it unless the dialog says so by the name (`detail` false). -->

<script lang="ts">
  import { anonymousDetail } from '#lib/accounts/anonymous.js';

  let {
    checked = $bindable(false),
    name,
    disabled = false,
    detail = true,
    describedby,
  }: {
    checked?: boolean;
    /** The account's display name, as it is now */
    name: string;
    disabled?: boolean;
    /** Show what it means under it */
    detail?: boolean;
    /** What says what it means instead, by the name */
    describedby?: string;
  } = $props();
</script>

<label class="flex items-start gap-3 text-left">
  <input
    type="checkbox"
    class="checkbox mt-0.5 shrink-0"
    bind:checked={() => !checked, (anonymous) => (checked = !anonymous)}
    {disabled}
    aria-describedby={describedby}
  />
  <span class="flex flex-1 flex-col">
    <span class={detail ? '' : 'text-sm'}>Anonymous</span>
    {#if detail}
      <span class="text-xs opacity-70"
        >{anonymousDetail(!checked, name.trim())}</span
      >
    {/if}
  </span>
</label>
