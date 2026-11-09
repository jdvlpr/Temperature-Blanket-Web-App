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

<!-- Help text, shown in a help dialog (openYarnSources, searched for a yarn)
and on Data Sources & Credits -->

<script lang="ts">
  import YarnSourcesList from '#lib/components/YarnSourcesList.svelte';
  import { ShoppingCartIcon } from '@lucide/svelte';

  let { search = '' }: { search?: string } = $props();
</script>

<div class="flex flex-col gap-4">
  <div class=" flex flex-col gap-2">
    <p>
      Each yarn's colors came from the site listed with it, on the day shown.
      Real yarn will look different from colors on a screen, and colorways can
      change or be discontinued, so treat these as a close guide. Yarn and
      colorway names and trademarks belong to their companies.
    </p>
    <p>
      Buying through a link with a cart <ShoppingCartIcon
        class="icon-sm relative -top-px inline"
        aria-label="shopping cart"
      /> supports the developer at no extra cost to you. If a yarn is missing, anyone
      can ask for it with the
      <!-- In a new tab, so nothing open in a dialog is left behind -->
      <a href="/yarn-search-request" target="_blank" class="link"
        >yarn request form<span class="sr-only"> (opens in a new tab)</span></a
      >.
    </p>
  </div>
  <YarnSourcesList {search} />
</div>
