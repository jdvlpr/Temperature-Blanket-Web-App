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

<!-- Gallery Terms: what publishing to the Gallery agrees to (App Store
guideline 1.2), asked once per account at its first publish (the Publish
dialogs, here and in the iPhone app) and linked from the sidebar and the app's
Settings › About. Short on purpose. -->

<script lang="ts">
  import { PUBLIC_BASE_DOMAIN_NAME, PUBLIC_BASE_URL } from '$app/env/public';
  import { resolve } from '$app/paths';
  import AppShell from '#lib/components/AppShell.svelte';
  import { PAGE, PAGE_TEXT } from '#lib/constants/class-constants.js';

  const contact = `hello@${PUBLIC_BASE_DOMAIN_NAME}`;
</script>

<svelte:head>
  <title>Gallery Terms</title>
  <meta
    name="description"
    content="What you agree to when you publish to the Temperature Blanket Gallery."
  />
  <meta property="og:title" content="Gallery Terms" />
  <meta property="og:url" content="{PUBLIC_BASE_URL}/terms" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Gallery Terms">
  {#snippet main()}
    <main class={[PAGE, PAGE_TEXT, 'my-2 flex flex-col gap-4']}>
      <h2 class="h2 text-gradient mt-2 max-lg:hidden">Gallery Terms</h2>
      <p>
        The Gallery is where people share their temperature blanket projects and
        yarn palettes. Publishing a page to it, on this website or in the iPhone
        app, means you agree to these terms.
      </p>

      <section class="flex flex-col gap-2" aria-labelledby="terms-rules">
        <h3 id="terms-rules" class="text-xl font-bold">What’s not allowed</h3>
        <p>
          There’s no tolerance for objectionable or abusive content, or for
          people who post it. Don’t publish names, notes or photos that are
          hateful, harassing, sexual, violent, threatening, or spam, or that
          share someone else’s private information. Only publish photos you have
          the right to share.
        </p>
      </section>

      <section class="flex flex-col gap-2" aria-labelledby="terms-action">
        <h3 id="terms-action" class="text-xl font-bold">What we can do</h3>
        <p>
          Reported pages are looked at, usually within a day. A page that breaks
          these terms can be hidden, and a person who keeps breaking them can be
          stopped from publishing, which hides all their pages. Names with
          offensive words can’t be published.
        </p>
      </section>

      <section class="flex flex-col gap-2" aria-labelledby="terms-report">
        <h3 id="terms-report" class="text-xl font-bold">
          How to report or block
        </h3>
        <p>
          On any gallery page, open its ⋮ menu and choose <strong
            >Report Page…</strong
          >
          to tell us what’s wrong, or <strong>Block This Person…</strong> to
          stop seeing their pages. Blocking works on anonymous pages too, and
          the person isn’t told. You can unblock people in
          <a href={resolve('/preferences')} class="link">Preferences</a>.
        </p>
        <p>
          You can also email
          <!-- eslint-disable-next-line svelte/no-navigation-without-resolve -- mailto -->
          <a href="mailto:{contact}" class="link">{contact}</a> or use the
          <a href={resolve('/contact')} class="link">contact page</a>.
        </p>
      </section>

      <section class="flex flex-col gap-2" aria-labelledby="terms-yours">
        <h3 id="terms-yours" class="text-xl font-bold">Your pages</h3>
        <p>
          Your pages stay yours: you can edit, make anonymous, or unpublish them
          at any time. How your data is handled is in the
          <a href={resolve('/privacy')} class="link">Privacy Policy</a>.
        </p>
      </section>
    </main>
  {/snippet}
</AppShell>
