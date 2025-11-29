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
  import {
    PUBLIC_BASE_DOMAIN_NAME,
    PUBLIC_BASE_URL,
    PUBLIC_FACEBOOK_LINK,
    PUBLIC_GITHUB_LINK,
    PUBLIC_SITE_TITLE,
  } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import {
  CloudAlertIcon,
    ExternalLinkIcon,
    FacebookIcon,
    GithubIcon,
    MailIcon,
    MessageCirclePlusIcon,
  } from '@lucide/svelte';

  let email = $state('Loading...');

  $effect(() => {
    email = `hello@${PUBLIC_BASE_DOMAIN_NAME}`;
  });
</script>

<svelte:head>
  <title>Contact</title>
  <meta name="description" content="Contact" />

  <meta property="og:title" content="Contact " />
  <meta property="og:description" content="Contact" />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/contact" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Contact">
  {#snippet stickyHeader()}
      <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main
      class="mx-auto flex max-w-(--breakpoint-sm) flex-col gap-4 px-4 lg:px-0"
    >
      <div>
        <h2 class="h2 text-gradient max-lg:hidden mt-2">Contact</h2>
        <div class="mt-2 flex flex-col gap-4">
          <p class="font-bold">General Communication</p>

          <a href="mailto:{email}" class="btn hover:preset-tonal w-fit">
            <MailIcon />
            {email}
          </a>

           <p class="font-bold">Forms</p>

          <a href="/yarn-search-request" class="btn hover:preset-tonal w-fit">
            <MessageCirclePlusIcon />
            Request Yarn
          </a>

           <a href="/contact/forms/2025-03-weather-data" class="btn hover:preset-tonal w-fit">
            <CloudAlertIcon />
            Weather Data Feedback
          </a>

          {#if PUBLIC_GITHUB_LINK}
            <p class="font-bold">Bug Reports</p>
            <a
              href="{PUBLIC_GITHUB_LINK}/issues"
              target="_blank"
              rel="noreferrer"
              class="btn hover:preset-tonal w-fit text-left"
            >
              <GithubIcon />
              GitHub Issues
              <ExternalLinkIcon class="relative -top-[1px] size-5" />
            </a>

            <p class="font-bold">
              Development Ideas, Feedback, Questions, and Discussions
            </p>
            <a
              href="{PUBLIC_GITHUB_LINK}/discussions"
              target="_blank"
              rel="noreferrer"
              class="btn hover:preset-tonal w-fit text-left"
            >
              <GithubIcon />
              GitHub Discussions
              <ExternalLinkIcon class="relative -top-[1px] size-5" />
            </a>
          {/if}

          {#if PUBLIC_FACEBOOK_LINK}
            <p class="font-bold">Social Media</p>
            <a
              href={PUBLIC_FACEBOOK_LINK}
              target="_blank"
              rel="noreferrer"
              class="btn hover:preset-tonal w-fit text-left"
            >
              <FacebookIcon />
              {PUBLIC_SITE_TITLE}
              <ExternalLinkIcon class="relative -top-[1px] size-5" />
            </a>
          {/if}

         
        </div>
      </div>
      <div class="rounded-container bg-surface-100-900 my-4 w-fit p-2">
        <p>
          See the <a href="/faq" class="link">Frequently Asked Questions</a> for
          answers to common questions.
        </p>
      </div>
    </main>
  {/snippet}
</AppShell>
