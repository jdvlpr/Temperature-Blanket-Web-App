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
  "By <name> · 1.2K views" on a gallery card, under when it was published, as
  on its gallery page. One line when they fit, else two, with no dot starting
  a line (each dot sits in the space the row's negative margin hides, and
  screen readers skip them). Nothing
  without a name or views.
-->
<script lang="ts">
  import ViewCount from '#lib/components/ViewCount.svelte';

  interface Props {
    /** Who published it, when their name shows on its gallery page */
    author?: string | null;
    views?: number | null;
  }

  let { author, views }: Props = $props();
</script>

{#if author || views}
  <span class="text-surface-700-300 block overflow-hidden text-xs">
    <span class="-ml-3 flex flex-wrap">
      {#if author}
        <span class="max-w-full truncate">{@render dot()}By {author}</span>
      {/if}
      {#if views}
        <span class="whitespace-nowrap"
          >{@render dot()}<ViewCount {views} /></span
        >
      {/if}
    </span>
  </span>
{/if}

{#snippet dot()}<span aria-hidden="true" class="inline-block w-3 text-center"
    >·</span
  >{/snippet}
