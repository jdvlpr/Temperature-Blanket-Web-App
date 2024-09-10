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
  import { browser } from '$app/environment';
  import {
    PUBLIC_BASE_DOMAIN_NAME,
    PUBLIC_BASE_URL,
    PUBLIC_GITHUB_LINK,
  } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Card from '$lib/components/Card.svelte';
  import ChangelogItem from '$lib/components/ChangelogItem.svelte';
  import ToTopButton from '$lib/components/buttons/ToTopButton.svelte';
  import { onMount } from 'svelte';
  import { entries } from './changelog';

  let container;
  let showScrollToTopButton = false;
  let scrollObserver = browser
    ? new IntersectionObserver((entries, observer) => {
        if (!entries[0].isIntersecting) {
          showScrollToTopButton = true;
        } else {
          showScrollToTopButton = false;
        }
      })
    : '';

  onMount(() => {
    scrollObserver.observe(container);
  });
</script>

<svelte:head>
  <title>Changelog</title>
  <meta
    name="description"
    content="See what's new and review past changes from {PUBLIC_BASE_DOMAIN_NAME}."
  />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no"
  />
  <meta property="og:title" content="Changelog" />
  <meta
    property="og:description"
    content="See what's new and review past changes from {PUBLIC_BASE_DOMAIN_NAME}."
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/changelog" />
  <meta property="og:type" content="website" />
</svelte:head>

{#if showScrollToTopButton}
  <ToTopButton
    onClick={() =>
      container.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })}
  />
{/if}

<AppShell pageName="Changelog">
  <svelte:fragment slot="stickyHeader">
    <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
  </svelte:fragment>
  <main slot="main" class="max-w-screen-xl m-auto text-center mb-6">
    <Card>
      <div
        slot="header"
        class="bg-surface-200-700-token text-token p-4"
        bind:this={container}
      >
        <p class="text-left">
          See what's new and review past changes from {PUBLIC_BASE_DOMAIN_NAME}.
          This changelog includes only certain select milestones.
          <a
            href="{PUBLIC_GITHUB_LINK}/commits/main/"
            class="link"
            target="_blank">Visit the GitHub repository</a
          > to see the full changelog for version 4.
        </p>
      </div>
      <div
        slot="content"
        class="flex flex-col gap-2 text-left items-start py-4"
      >
        {#each entries as { version, date, notes }}
          <ChangelogItem {version} {date} {notes} />
        {/each}
      </div>
    </Card>
  </main>
</AppShell>
