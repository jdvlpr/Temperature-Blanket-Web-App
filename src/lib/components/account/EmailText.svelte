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

<!-- An email address that wraps after the @ on narrow screens, not mid-word. -->
<script lang="ts">
  let { email, testid }: { email: string; testid?: string } = $props();

  let at = $derived(email.lastIndexOf('@'));
</script>

<strong class="wrap-break-word" data-testid={testid}
  >{#if at > 0}{email.slice(0, at)}<wbr />@{email.slice(
      at + 1,
    )}{:else}{email}{/if}</strong
>
