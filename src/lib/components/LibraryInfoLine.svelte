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
  Under a My Library card's name, in the same order as a gallery card and
  page: published, Ravelry's mark when it's on Ravelry and a warning ⟳ (the
  out-of-sync icon's color) when it changed since its page was published or
  updated, then a globe and "Published <date>", then a line with its views.
  Not published: "Saved <date>". The marks aren't buttons: each says what it
  means to screen readers and on hover.
-->
<script lang="ts">
  import RavelryMark from '#lib/components/RavelryMark.svelte';
  import ViewCount from '#lib/components/ViewCount.svelte';
  import { pluralize } from '#lib/utils/string-utils.js';
  import { GlobeIcon, RefreshCwIcon } from '@lucide/svelte';

  interface Props {
    /** When it was saved, e.g. "Saved Oct 3, 2026" (shown when not published) */
    saved: string;
    /** When its gallery page was published; none, not published */
    publishedAt?: number | null;
    /** Its gallery page's views, all time */
    views?: number | null;
    /** It changed after its page was published or updated */
    changed?: boolean;
    /** On Ravelry: its photos there; null or none, not on Ravelry */
    ravelryPhotos?: number | null;
  }

  let {
    saved,
    publishedAt = null,
    views,
    changed = false,
    ravelryPhotos = null,
  }: Props = $props();

  // As gallery cards and pages write it
  let publishedOn = $derived(
    publishedAt
      ? `Published ${new Date(publishedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}`
      : '',
  );
  let ravelryLabel = $derived(
    ravelryPhotos === null
      ? ''
      : `On Ravelry, ${ravelryPhotos} ${pluralize('photo', ravelryPhotos)}`,
  );
  const CHANGED = 'Changed since publishing';
</script>

<span class="text-surface-700-300 flex min-w-0 items-center text-xs">
  {#if publishedOn && ravelryLabel}
    <span class="flex shrink-0" title={ravelryLabel}>
      <RavelryMark />
      <span class="sr-only">{ravelryLabel}</span>
    </span>
  {/if}
  {#if publishedOn && changed}
    <span class="text-warning-700-300 mr-1 flex shrink-0" title={CHANGED}>
      <RefreshCwIcon class="icon-sm" aria-hidden="true" />
      <span class="sr-only">{CHANGED}</span>
    </span>
  {/if}
  {#if publishedOn}
    <GlobeIcon class="icon-sm mr-1 shrink-0" aria-hidden="true" />
  {/if}
  <span class="clamp-2">{publishedOn || saved}</span>
</span>
{#if publishedOn && views}
  <span class="text-surface-700-300 flex min-w-0 items-center text-xs">
    <span class="truncate"><ViewCount {views} /></span>
  </span>
{/if}
