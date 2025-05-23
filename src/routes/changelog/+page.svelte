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
  import ChangelogItem from '$lib/components/ChangelogItem.svelte';
  import ToTopButton from '$lib/components/buttons/ToTopButton.svelte';
  import { onMount } from 'svelte';
  import { entries } from './changelog';

  let container = $state();
  let showScrollToTopButton = $state(false);
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

  <meta property="og:title" content="Changelog" />
  <meta
    property="og:description"
    content="See what's new and review past changes from {PUBLIC_BASE_DOMAIN_NAME}."
  />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/changelog" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Changelog">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="m-auto mx-auto mt-2 mb-6 max-w-(--breakpoint-md) px-2 text-center"
    >
      <div class="" bind:this={container}>
        <p class="text-left">
          See what's new and review past changes from {PUBLIC_BASE_DOMAIN_NAME}.
          This changelog includes only select milestones.
          <a
            href="{PUBLIC_GITHUB_LINK}/commits/main/"
            class="link"
            target="_blank">Visit the GitHub repository</a
          > to see the full changelog since version 4.
        </p>
      </div>
      <div class="flex flex-col items-start gap-2 py-4 text-left">
        {#each entries as { version, date, notes }}
          <ChangelogItem {version} {date} {notes} />
        {/each}
      </div>
    </main>
  {/snippet}
</AppShell>

{#if showScrollToTopButton}
  <ToTopButton
    onClick={() =>
      container.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })}
  />
{/if}
