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

<script>
  import { PUBLIC_BASE_DOMAIN_NAME, PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import { RadioGroup, RadioItem } from '@skeletonlabs/skeleton';
  import { fade } from 'svelte/transition';

  const posts = [
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
      title: 'Now Open Source',
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

  let selectedTag = 'All';

  $: filteredPosts =
    selectedTag === 'All'
      ? posts
      : posts.filter((post) => post.tags?.includes(selectedTag));
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
  <svelte:fragment slot="stickyHeader">
    <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
  </svelte:fragment>

  <main
    slot="main"
    class="max-w-screen-xl m-auto px-2 gap-4 flex flex-col items-center mb-4"
  >
    <RadioGroup
      class="flex wrap gap-y-2 max-lg:mt-4"
      active="bg-secondary-active-token"
    >
      {#each tags as tag}
        <!-- {@const numberOfItems =
            tag === 'All'
              ? posts.length
              : posts.filter((post) => post.tags?.includes(tag)).length} -->
        <RadioItem bind:group={selectedTag} name={tag} value={tag} title={tag}>
          <span class="flex gap-1 justify-center items-center">
            {tag}
          </span>
        </RadioItem>
      {/each}
    </RadioGroup>

    {#key selectedTag}
      <div
        in:fade
        class="max-w-screen-xl m-auto grid grid-cols-1 md:grid-cols-3 gap-4 justify-start"
      >
        {#each filteredPosts as { href, imgSrc, imgAlt, title, date, tags }}
          <div class="flex flex-col gap-4">
            <a
              class="w-full card bg-surface-200-700-token bg-primary-hover-token p-4 whitespace-pre-wrap text-center flex flex-col items-center justify-center gap-2"
              {href}
            >
              <img src={imgSrc} class="h-36 object-cover w-full" alt={imgAlt} />
              <span class="font-bold text-lg">{title}</span>

              {#if tags}
                {#each tags as item}
                  <p
                    class="text-sm inline bg-tertiary-200-700-token px-2 rounded-token"
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
</AppShell>
