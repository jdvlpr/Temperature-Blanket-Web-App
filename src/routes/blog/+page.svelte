<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script lang="ts">
  import { PUBLIC_BASE_DOMAIN_NAME, PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';
  import { fade } from 'svelte/transition';

  type BlogPostType = {
    href: string;
    imgSrc: string;
    imgAlt: string;
    title: string;
    tags: ('Help' | 'News')[];
  };
  const posts: BlogPostType[] = [
    {
      href: '/blog/2025-03-20-version-5',
      imgSrc: '/images/blog-images/2025-03-20-version-5/featured-image.png',
      imgAlt: 'Version 5: Refreshed & Rebuilt',
      title: 'Version 5: Refreshed & Rebuilt',
      tags: ['News'],
    },
    {
      href: '/blog/yarn-weights',
      imgSrc: '/images/blog-images/yarn-weights/banner.png',
      imgAlt: 'Yarn Weights',
      title: 'Yarn Weights',
      tags: ['Help'],
    },
    {
      href: '/blog/2024-09-03-now-open-source',
      imgSrc: '/images/blog-images/2024-09-03-now-open-source/banner.jpeg',
      imgAlt: 'Open Source',
      title: 'Version 4: Now Open Source',
      tags: ['News'],
    },
    {
      href: '/blog/2024-02-09-how-to-plan-a-temperature-blanket',
      imgSrc:
        '/images/blog-images/2024-02-09-how-to-plan-a-temperature-blanket/how-to-plan-your-project.png',
      imgAlt: 'Open Source',
      title: 'How to Plan a Temperature Blanket',
      tags: ['Help'],
    },
    {
      href: '/blog/2023-12-19-version-3-unified-site-design',
      imgSrc:
        '/images/blog-images/2023-12-19-version-3-unified-site-design/featured-image.png',
      imgAlt: 'Version 3',
      title: 'Version 3: Unified Site Design',
      tags: ['News'],
    },
    {
      href: '/blog/what-is-a-temperature-blanket',
      imgSrc:
        '/images/blog-images/what-is-a-temperature-blanket/temperature-blanket-featured-image.png',
      imgAlt: 'Preview of a Temperature Blanket Project',
      title: 'What is a Temperature Blanket?',
      tags: ['Help'],
    },
  ];

  const tags = [
    'All',
    ...new Set(posts.filter((post) => post?.tags).flatMap((post) => post.tags)),
  ];

  let selectedTag = $state('All');

  let filteredPosts = $derived(
    selectedTag === 'All'
      ? posts
      : posts.filter((post) => post.tags?.includes(selectedTag)),
  );
</script>

<svelte:head>
  <title>Blog</title>
  <meta
    name="description"
    content="Blog posts from {PUBLIC_BASE_DOMAIN_NAME}."
  />

  <meta property="og:title" content="Blog" />
  <meta
    property="og:description"
    content="Blog posts from {PUBLIC_BASE_DOMAIN_NAME}."
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/blog" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Blog">
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}

  {#snippet main()}
    <main
      class="m-auto mb-4 flex max-w-(--breakpoint-xl) flex-col items-center gap-4 px-2"
    >
      <SegmentedControl
        value={selectedTag}
        onValueChange={(e) => {
          selectedTag = e.value;
        }}
      >
        <SegmentedControl.Control
          class="bg-surface-100 dark:bg-surface-900 rounded-container mt-4 border-none shadow-sm"
        >
          <SegmentedControl.Indicator />
          {#each tags as tag}
            <SegmentedControl.Item value={tag}>
              <SegmentedControl.ItemText>
                <span class="flex items-center justify-center gap-1">
                  {tag}
                </span></SegmentedControl.ItemText
              >
              <SegmentedControl.ItemHiddenInput />
            </SegmentedControl.Item>
          {/each}
        </SegmentedControl.Control>
      </SegmentedControl>

      {#key selectedTag}
        <div
          in:fade
          class="m-auto grid max-w-(--breakpoint-xl) grid-cols-1 justify-start gap-4 md:grid-cols-3"
        >
          {#each filteredPosts as { href, imgSrc, imgAlt, title, tags }}
            <div class="flex flex-col gap-4">
              <a
                class="card bg-surface-50-950 hover:bg-surface-100-900 flex w-full flex-col items-center justify-center gap-2 p-4 text-center whitespace-pre-wrap"
                {href}
              >
                <img
                  src={imgSrc}
                  class="h-36 w-full object-cover"
                  alt={imgAlt}
                />
                <h5 class="h5">{title}</h5>

                {#if tags}
                  {#each tags as item}
                    <p
                      class="bg-tertiary-200 dark:bg-tertiary-800 inline rounded px-2 text-sm"
                    >
                      {item}
                    </p>
                  {/each}
                {/if}
              </a>
            </div>
          {/each}
        </div>
      {/key}
    </main>
  {/snippet}
</AppShell>
