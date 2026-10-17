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
  Stars a gallery page to find it again in My Library (private: never a view,
  never Popular). On cards it's an icon button; with `labelled` (the page
  itself) it says Star or Starred. Signed out it's a link to sign in that comes
  back here. Not shown on the account's own pages, nor without accounts.
-->
<script lang="ts">
  import { page } from '$app/state';
  import { galleryStars } from '#lib/accounts/gallery-stars.svelte.js';
  import { backHereOnClick, signInHref } from '#lib/accounts/redirect.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import type { GalleryPostKind } from '#lib/server/gallery/store.js';
  import { StarIcon } from '@lucide/svelte';

  interface Props {
    postId: number;
    kind: GalleryPostKind;
    /** The page's name, for screen readers (an icon alone) */
    name?: string;
    /** Says Star or Starred beside the icon */
    labelled?: boolean;
  }

  let { postId, kind, name = '', labelled = false }: Props = $props();

  let userId = $derived(__ACCOUNTS_ENABLED__ ? account.summary?.id : undefined);
  // Loaded with the stars (the server refuses a star on one's own page anyway)
  let own = $derived(!!userId && galleryStars.isOwn(postId));
  let starred = $derived(galleryStars.has(postId));
  // While the stars load, or this one saves; after a failed load a tap tries again
  let busy = $derived(
    (!galleryStars.loaded && !galleryStars.failed) ||
      galleryStars.saving(postId),
  );
  /** Said after a change, where the label changing alone may not be */
  let announcement = $state('');

  async function toggle() {
    if (busy) return;
    const now = await galleryStars.toggle(postId, kind);
    if (labelled && now !== null) announcement = now ? 'Starred' : 'Unstarred';
  }

  $effect(() => {
    if (userId) return galleryStars.start();
  });

  const buttonClass = $derived(
    labelled
      ? 'btn hover:preset-tonal-surface'
      : 'btn-icon hover:preset-tonal-surface shrink-0',
  );
</script>

{#snippet icon(filled: boolean)}
  <StarIcon
    aria-hidden="true"
    fill={filled ? 'currentColor' : 'none'}
    class={filled ? 'text-warning-600-400' : undefined}
  />
{/snippet}

<!-- On the page itself, wait for the stars rather than show the owner a star
that then goes -->
{#if __ACCOUNTS_ENABLED__ && !own && !(labelled && userId && busy && !galleryStars.loaded)}
  {#if userId}
    <!-- With a label that changes, the label says the state; an icon alone says
    it with aria-pressed and keeps one name -->
    <button
      type="button"
      class={buttonClass}
      aria-pressed={labelled ? undefined : starred}
      aria-label={labelled ? undefined : `Star ${name}`}
      aria-disabled={busy || undefined}
      title={starred
        ? 'Starred: tap to unstar'
        : 'Star to find it in My Library'}
      data-testid="gallery-star"
      onclick={toggle}
    >
      {@render icon(starred)}
      {#if labelled}{starred ? 'Starred' : 'Star'}{/if}
    </button>
    {#if labelled}
      <p class="sr-only" aria-live="polite">{announcement}</p>
    {/if}
  {:else}
    <a
      href={signInHref(page.url)}
      onclick={backHereOnClick}
      class={buttonClass}
      aria-label={labelled ? undefined : `Sign in to star ${name}`}
      title="Sign in to star"
      data-testid="gallery-star"
    >
      {@render icon(false)}
      {#if labelled}Star{/if}
    </a>
  {/if}
{/if}
