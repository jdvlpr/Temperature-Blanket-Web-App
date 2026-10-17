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
  A My Library card's one info line, under its name, as a gallery card's is.
  Published: "Published · 12 views", then a muted yarn mark when it's on
  Ravelry, then a warning ⟳ when it changed since its page was published or
  updated. Not published: "Saved <date>". The marks aren't buttons: each says
  what it means to screen readers and on hover.
-->
<script lang="ts">
  import ViewCount from '#lib/components/ViewCount.svelte';
  import { pluralize } from '#lib/utils/string-utils.js';
  import { yarnBall } from '@lucide/lab';
  import { Icon, RefreshCwIcon } from '@lucide/svelte';

  interface Props {
    /** When it was saved, e.g. "Saved Oct 3, 2026" (shown when not published) */
    saved: string;
    /** It has a gallery page */
    published?: boolean;
    /** Its gallery page's views, all time */
    views?: number | null;
    /** It changed after its page was published or updated */
    changed?: boolean;
    /** On Ravelry: its photos there; null or none, not on Ravelry */
    ravelryPhotos?: number | null;
  }

  let {
    saved,
    published = false,
    views,
    changed = false,
    ravelryPhotos = null,
  }: Props = $props();

  let ravelryLabel = $derived(
    ravelryPhotos === null
      ? ''
      : `On Ravelry, ${ravelryPhotos} ${pluralize('photo', ravelryPhotos)}`,
  );
  const CHANGED = 'Changed since publishing';
</script>

<span class="text-surface-700-300 flex min-w-0 items-center gap-1 text-xs">
  {#if published}
    <span class="truncate"
      >Published{#if views}<span aria-hidden="true" class="mx-1">·</span
        ><ViewCount {views} />{/if}</span
    >
    {#if ravelryLabel}
      <span class="flex shrink-0 opacity-60" title={ravelryLabel}>
        <Icon iconNode={yarnBall} class="icon-sm" aria-hidden="true" />
        <span class="sr-only">{ravelryLabel}</span>
      </span>
    {/if}
    {#if changed}
      <span class="text-warning-700-300 flex shrink-0" title={CHANGED}>
        <RefreshCwIcon class="icon-sm" aria-hidden="true" />
        <span class="sr-only">{CHANGED}</span>
      </span>
    {/if}
  {:else}
    <span class="truncate">{saved}</span>
  {/if}
</span>
