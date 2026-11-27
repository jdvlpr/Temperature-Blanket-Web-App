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

<!-- Someone's gallery ("Ada’s Gallery"; their own is Your Gallery): every
gallery page and palette they published from their account with their name,
linked from "By <name>" on their gallery pages: their projects and their yarn
palettes, each on a page of its own. Someone else's has a ⋮ with Block This
Person… (made from one of their pages, so it hides only those showing their
name); once blocked, their pages aren't shown, with Unblock. -->

<script lang="ts">
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import AppShell from '#lib/components/AppShell.svelte';
  import { PAGE, PAGE_WIDE } from '#lib/constants/class-constants.js';
  import CollectionNav from '#lib/components/CollectionNav.svelte';
  import { galleryBlocks } from '#lib/accounts/gallery-blocks.svelte.js';
  import { galleryStars } from '#lib/accounts/gallery-stars.svelte.js';
  import { account } from '#lib/accounts/summary.svelte.js';
  import MoreMenu from '#lib/components/buttons/MoreMenu.svelte';
  import { confirmBlock, unblock } from '#lib/utils/gallery-report.js';
  import { ArrowLeftIcon, UserRoundXIcon } from '@lucide/svelte';
  import { onMount, type Snippet } from 'svelte';
  import type { LayoutData } from './$types';
  import { ownerFilters } from './owner-filters.svelte.js';

  let { data, children }: { data: LayoutData; children: Snippet } = $props();

  const current = $derived(
    page.url.pathname.endsWith('/palettes') ? 'palettes' : 'projects',
  );
  const ownerId = $derived(page.params.ownerId ?? '');
  // Another person's pages start with no filters
  $effect.pre(() => ownerFilters.forOwner(ownerId));

  onMount(() => void galleryBlocks.ensure());
  // One of their pages, which a block is made from
  const firstPage = $derived<{
    postId: number;
    kind: 'project' | 'palette';
  } | null>(
    data.postIds[0]
      ? { postId: data.postIds[0], kind: 'project' }
      : data.paletteIds[0]
        ? { postId: data.paletteIds[0], kind: 'palette' }
        : null,
  );
  const own = $derived(
    !!firstPage &&
      !!account.summary?.id &&
      galleryStars.isOwn(firstPage.postId),
  );
  const blocked = $derived(
    !!firstPage && galleryBlocks.hides(firstPage.postId),
  );
  let menu = $state<HTMLElement>();
</script>

<AppShell pageName="Gallery">
  {#snippet main()}
    <main class={[PAGE, PAGE_WIDE, 'flex flex-col justify-start gap-4 pb-8']}>
      <a
        href={resolve('/gallery')}
        class="btn hover:preset-tonal-surface mt-2 flex w-fit items-center lg:mt-0"
      >
        <ArrowLeftIcon />
        Gallery</a
      >
      <div class="flex items-start justify-between gap-2">
        <h1 class="h2 text-gradient">
          {data.name}’s Gallery
        </h1>
        {#if __ACCOUNTS_ENABLED__ && firstPage && !own && !blocked}
          <div bind:this={menu}>
            <MoreMenu
              label="More for {data.name}’s Gallery"
              items={[
                {
                  value: 'block',
                  label: 'Block This Person…',
                  icon: UserRoundXIcon,
                  onselect: () =>
                    confirmBlock(
                      { ...firstPage, title: `${data.name}’s Gallery` },
                      () => menu?.querySelector('button') ?? null,
                    ),
                },
              ]}
            />
          </div>
        {/if}
      </div>
      {#if blocked && firstPage}
        <p
          class="preset-tonal-surface rounded-container flex flex-wrap items-center gap-x-2 gap-y-1 p-3"
        >
          <span>You blocked this person, so their pages aren’t shown.</span>
          <button
            type="button"
            class="btn btn-sm hover:preset-tonal-surface"
            onclick={() => unblock(firstPage.postId)}>Unblock</button
          >
        </p>
      {:else}
        <CollectionNav
          label="Gallery pages by {data.name}"
          {current}
          projectsHref={resolve('/gallery/by/[ownerId]', { ownerId })}
          palettesHref={resolve('/gallery/by/[ownerId]/palettes', { ownerId })}
          projectsCount={data.postIds.length}
          palettesCount={data.paletteIds.length}
        />
        {@render children()}
      {/if}
    </main>
  {/snippet}
</AppShell>
