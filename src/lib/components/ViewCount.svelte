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

<!-- @component
  A gallery page's views, all time, like "1.2K views": short on screen, the
  whole number for screen readers and on hover. Nothing when there are none
  yet, or when the gallery doesn't say (a plugin before 1.11.0).
-->
<script lang="ts">
  import { pluralize } from '#lib/utils/string-utils.js';

  interface Props {
    views?: number | null;
    class?: string;
  }

  let { views, class: className }: Props = $props();

  let noun = $derived(pluralize('view', views ?? 0));
  let full = $derived(views ? `${views.toLocaleString()} ${noun}` : '');
  let short = $derived(
    views
      ? `${new Intl.NumberFormat(undefined, {
          notation: 'compact',
          maximumFractionDigits: 1,
        }).format(views)} ${noun}`
      : '',
  );
</script>

{#if views}
  {#if short === full}
    <span class={className}>{full}</span>
  {:else}
    <span class={className} title={full}
      ><span aria-hidden="true">{short}</span><span class="sr-only">{full}</span
      ></span
    >
  {/if}
{/if}
