<!-- Copyright (c) 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. -->

<!-- About the Beta: what trying the next version here means, plainly, before
anyone saves their work on it. Only in the beta's build (+page.ts). -->

<script lang="ts">
  import { PUBLIC_BASE_DOMAIN_NAME } from '$app/env/public';
  import AppShell from '#lib/components/AppShell.svelte';
  import BetaWhatsNew from '#lib/components/BetaWhatsNew.svelte';
  import { VERSION_7_POST_HREF } from '#lib/constants/version-7-post.js';
  import { PAGE, PAGE_TEXT } from '#lib/constants/class-constants.js';
  import { MAIN_SITE_ORIGIN } from '#lib/constants/site.js';
  import { openBetaFeedback } from '#lib/utils/open-beta-feedback.js';
  import {
    ExternalLinkIcon,
    MailIcon,
    MessageSquareIcon,
  } from '@lucide/svelte';
  import { onMount } from 'svelte';

  const mainSite = MAIN_SITE_ORIGIN ?? 'https://temperature-blanket.com';
  const mainName = new URL(mainSite).host;

  // Written in the browser, as on Contact, so it isn't in the page's HTML
  let mounted = $state(false);
  onMount(() => (mounted = true));
  const email = $derived(mounted ? `hello@${PUBLIC_BASE_DOMAIN_NAME}` : '');
</script>

<svelte:head>
  <title>About the Beta</title>
  <meta
    name="description"
    content="Try the next version of the temperature blanket planner early."
  />
</svelte:head>

<AppShell pageName="About the Beta">
  {#snippet main()}
    <main class={[PAGE, PAGE_TEXT, 'mt-2 mb-8 flex flex-col gap-6']}>
      <div class="flex flex-col gap-2">
        <h2 class="h2 text-gradient mt-2 max-lg:hidden">About the Beta</h2>
        <p>
          This is the next version of the site, released early so it can be
          tried before it replaces <a href={mainSite} class="link">{mainName}</a
          >. Once it does, this beta site closes.
        </p>
      </div>

      <section class="flex flex-col gap-2" aria-labelledby="beta-new">
        <h3 id="beta-new" class="h4">What’s New</h3>
        <BetaWhatsNew />
        <a href={VERSION_7_POST_HREF} class="link w-fit"
          >Read more about Version 7</a
        >
      </section>

      <section class="flex flex-col gap-2" aria-labelledby="beta-expect">
        <h3 id="beta-expect" class="h4">What to Expect</h3>
        <ul class="list-disc space-y-2 pl-6">
          <li>Things may change or break.</li>
          <li>
            Projects saved here stay in this browser, on this site. They don't
            show on {mainName}, and its projects don't show here unless you
            bring them (below). {#if __ACCOUNTS_ENABLED__}
              Sign in to keep them in your account, on every device and on {mainName}
              once this version is there.{/if}
          </li>
          <li>
            Gallery pages {#if __ACCOUNTS_ENABLED__}
              and Ravelry posts{/if} made here are real and public, and they stay.
            Their links point to {mainName}.
          </li>
          <li>
            Project links copied here open only on this beta site until this
            version reaches {mainName}.
          </li>
        </ul>
      </section>

      <section class="flex flex-col gap-2" aria-labelledby="beta-bring">
        <h3 id="beta-bring" class="h4">Import Your Projects</h3>
        <p>
          Using the browser that has your projects, click the button below to
          open the import page on {mainName}.
        </p>
        <a href="{mainSite}/bring-to-beta" class="btn preset-tonal w-fit">
          Import My Projects
          <ExternalLinkIcon class="icon-sm" />
        </a>
      </section>

      <section
        id="feedback"
        class="flex flex-col gap-2"
        aria-labelledby="beta-feedback"
      >
        <h3 id="beta-feedback" class="h4">Send Feedback</h3>
        <p>
          Something broken, confusing or missing? Or is it working well? Tell us
          what you did and what happened. It’s how we’ll know when this version
          is ready for {mainName}. Thanks for your feedback!
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="btn preset-filled-primary-500 w-fit"
            onclick={() => openBetaFeedback()}
          >
            <MessageSquareIcon />
            Send Feedback
          </button>
          {#if email}
            <a
              href="mailto:{email}?subject={encodeURIComponent(
                'Beta feedback',
              )}"
              class="btn hover:preset-tonal-surface w-fit max-w-full text-left whitespace-normal"
            >
              <MailIcon />
              <!-- Wraps on a phone, the address breaking anywhere if need be -->
              <span class="min-w-0 [overflow-wrap:anywhere]">Email {email}</span
              >
            </a>
          {/if}
        </div>
        <p class="text-sm opacity-80">
          A screenshot helps with things that look wrong: email it, with what
          you see.
        </p>
      </section>

      <a
        href={mainSite}
        class="btn preset-tonal w-fit max-w-full text-left whitespace-normal"
      >
        Switch back to {mainName}
        <ExternalLinkIcon class="icon-sm" />
      </a>
    </main>
  {/snippet}
</AppShell>
