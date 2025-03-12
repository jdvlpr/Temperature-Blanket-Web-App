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
  import { page } from '$app/state';
  import {
    PUBLIC_BASE_DOMAIN_NAME,
    PUBLIC_BASE_URL,
    PUBLIC_GITHUB_LINK,
    PUBLIC_KOFI_LINK,
  } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Card from '$lib/components/Card.svelte';
  import { ICONS } from '$lib/constants';
  import { ArrowLeftIcon } from '@lucide/svelte';

  const kofiURL = PUBLIC_KOFI_LINK ? new URL(PUBLIC_KOFI_LINK) : null;
  const kofiLink = kofiURL ? `${kofiURL.hostname}${kofiURL.pathname}` : '';
</script>

<svelte:head>
  <title>Now Open Source</title>
  <meta
    name="description"
    content="Making the source code for {PUBLIC_BASE_DOMAIN_NAME} available on GitHub"
  />

  <meta property="og:title" content="Now Open Source" />
  <meta
    property="og:description"
    content="Making the source code for {PUBLIC_BASE_DOMAIN_NAME} available on GitHub"
  />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}/blog/2024-09-03-now-open-source"
  />
  <meta property="og:type" content="website" />
  <meta
    property="og:image"
    content="{PUBLIC_BASE_URL}/images/blog-images/2024-09-03-now-open-source/banner.jpeg"
  />
  <meta property="og:image:width" content="1366" />
  <meta property="og:image:height" content="768" />
</svelte:head>

<AppShell pageName="Now Open Source">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main class="pb-8">
      <a
        href="/blog"
        class="btn hover:preset-tonal mb-2 max-lg:mx-2 max-lg:mt-2"
        ><ArrowLeftIcon /> Blog</a
      >
      <Card>
        {#snippet header()}
          <div>
            <img
              src="/images/blog-images/2024-09-03-now-open-source/banner.jpeg"
              class="h-36 object-cover w-full"
              alt="Now Open Source"
            />
          </div>
        {/snippet}

        {#snippet content()}
          <div class="pb-4 px-2">
            <div class="flex flex-col gap-4">
              <div class="mt-4 flex flex-col gap-2">
                <h2 class="h2 text-gradient">Now Open Source</h2>
                <p class="text-sm">September 03, 2024</p>
              </div>

              <div
                class="p-4 preset-tonal-surface rounded-container flex flex-col gap-2"
              >
                <p>
                  🎉 Temperature-blanket.com is reaching a new milestone! The
                  source code for this web app is now available on GitHub for
                  anyone to view or contribute to. Thanks for the fun journey
                  together so far! I hope open-sourcing this project will lead
                  to an even better crochet and knitting resource for
                  craftspeople everywhere.
                </p>
                <a
                  href={PUBLIC_GITHUB_LINK}
                  class="btn preset-filled-primary-500 w-fit gap-0"
                  target="_blank"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="size-6"
                    viewBox="0 0 24 24"
                    ><path
                      fill="currentColor"
                      d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"
                    /></svg
                  >

                  <span>Open GitHub Repository</span>
                </a>
              </div>

              <h2 class="font-bold text-2xl">A Short History</h2>

              <p>
                From the beginning, the goal of temperature-blanket.com has been
                to provide free, useful tools for crocheters and knitters all
                around the world. Since 2020, the number of users, features, and
                improvement has grown; thousands of craftspeople have used this
                web app to help make their work easier. Feedback and support
                from people like you have been tremendously helpful in
                developing and maintaining the site. Thank you! During the past
                four years, I've enjoyed working on this project as a hobby;
                I've added new features, streamlined my own development process,
                made plenty of mistakes, and learned a lot! Now I believe the
                time is right to share the source code with the world.
              </p>

              <h2 class="font-bold text-2xl">Why Open Source?</h2>

              <blockquote class="blockquote">
                If you want to go fast, work alone. If you want to go far, work
                together.
              </blockquote>

              <ul class="flex flex-col gap-2">
                <li>
                  <span class="font-bold">👥 Collaboration:</span> By allowing other
                  people to contribute their ideas and improvements to this web app,
                  more craftspeople can have access to better tools for their projects.
                  Whether it’s a new feature, an improvement to the user experience,
                  or something I haven’t even thought of yet—other developers can
                  now explore the source code and propose their updates to this web
                  app.
                </li>

                <li>
                  <span class="font-bold">👋 Community:</span> Many people have already
                  contributed in some way to temperature-blanket.com through feedback,
                  support, and encouragement. I see open-sourcing this web app as
                  my way to give back. With the source code on GitHub, others can
                  learn from and participate in the community that makes this project
                  special.
                </li>

                <li>
                  <span class="font-bold">🔄 Continuity:</span> By making this web
                  app open source, someone else could theoretically continue working
                  on it without me. I don't intend to stop developing temperature-blanket.com,
                  but open-sourcing it provides redundancy and allows for other developers
                  to better understand and recreate this project if they want. The
                  source code helps explain how this site is made so that even without
                  me, the tools and features can be recreated in some form.
                </li>
              </ul>

              <h2 class="font-bold text-2xl">How to Get Involved?</h2>

              <p>
                If you discover a bug or want to suggest a new feature, <a
                  href="{PUBLIC_GITHUB_LINK}/issues"
                  class="link"
                  target="_blank">open an issue in the GitHub repository</a
                >. Your comments, suggestions, and ideas are welcome!
              </p>

              <p>
                If you're a developer familiar with—or wanting to learn more
                about—HTML, Javascript, and CSS (particularly <a
                  href="https://kit.svelte.dev/"
                  class="link"
                  target="_blank">SvelteKit</a
                >), you can develop your own local copy of this web app; just
                <a
                  href="{PUBLIC_GITHUB_LINK}?tab=readme-ov-file#-getting-started"
                  class="link"
                  target="_blank">follow the Getting Started instructions</a
                >.
              </p>

              {#if kofiLink}
                <p>
                  You can also become a <a
                    href="/supporters"
                    class="link"
                    target="_blank">supporter</a
                  >
                  through one-time or monthly donations at
                  <a href={PUBLIC_KOFI_LINK} class="link" target="_blank"
                    >{kofiLink}</a
                  >. Thank you!
                </p>
              {/if}

              <h2 class="font-bold text-2xl">What’s Next?</h2>

              <p>
                I plan to continue maintaining and improving
                temperature-blanket.com. Changes to this site will still need to
                be approved by me, but anyone who wants is welcome to
                contribute. I look forward to hearing your ideas!
              </p>
              <p>
                Thank you to everyone who has used the site, provided feedback,
                and supported the project. I'm excited to see where we go from
                here!
              </p>
            </div>
          </div>
        {/snippet}
      </Card>
    </main>
  {/snippet}
</AppShell>
