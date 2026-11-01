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

<!-- The Contents sheet, from the bar under the top bar on smaller screens:
the same as beside the page on wide screens, the page's sections then the link
back to where the page is listed (All Guides & Help, All What's New). Choosing
a link closes it (onNavigate). -->

<script lang="ts">
  import OnThisPage from '#lib/components/docs/OnThisPage.svelte';
  import { goFromSheet } from '#lib/docs/on-this-page.svelte.js';
  import { ArrowLeftIcon } from '@lucide/svelte';

  let {
    title,
    backHref,
    backLabel,
    onNavigate,
  }: {
    title: string;
    backHref: string;
    backLabel: string;
    onNavigate?: () => void;
  } = $props();
</script>

<div class="flex flex-col gap-4 px-2 pb-6">
  <OnThisPage heading={`On this page · ${title}`} {onNavigate} />
  <a
    href={backHref}
    class="rounded-base hover:bg-surface-200-800 flex items-center gap-2 px-3 py-1.5 text-sm transition-colors"
    onclick={(event) => onNavigate && goFromSheet(event, backHref, onNavigate)}
    ><ArrowLeftIcon class="icon-sm" />{backLabel}</a
  >
</div>
