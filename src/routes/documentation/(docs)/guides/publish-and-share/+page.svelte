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

<!-- Publish and Share a Gallery Page: the share rows (accounts/share-rows.ts:
Copy Link, then the gallery page by state), AddToGallery / SharePalette,
UnpublishDialog, stars. Publishing needs an account, so everything past
Copy Link shows only in builds with accounts. The old anchor
share-to-gallery lands here. -->

<script lang="ts">
  import RelatedReference from '#lib/components/docs/RelatedReference.svelte';
</script>

<p>
  Show a friend your project, or share it with everyone in the
  <a href="/gallery" class="link">Gallery</a>.
</p>

<section class="flex flex-col gap-3">
  <h2 id="share-a-link" class="text-2xl font-bold">Share a Link</h2>
  <p>The quickest way, for one person or a group.</p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      In the Project Planner, press <span class="font-bold">Project</span> (in
      the Yarn Palette Creator, <span class="font-bold">Palette</span>).
    </li>
    <li>
      Under <span class="font-bold">Share</span>, press
      <span class="font-bold">Copy Link</span>.
    </li>
    <li>Paste it in a message, email or post.</li>
  </ol>
  <p>
    Whoever opens it gets their own copy, to change as they like. Yours stays as
    it is. Weather you've edited or imported isn't included: they get the
    weather source's.
  </p>
</section>

{#if __ACCOUNTS_ENABLED__}
  <section class="flex flex-col gap-3">
    <h2 id="publish" class="text-2xl font-bold">Publish to the Gallery</h2>
    <p>
      A gallery page shows your project or palette to everyone, and you can
      update or remove it any time. It needs a free account.
    </p>
    <ol class="ml-6 list-decimal space-y-1">
      <li>
        Press <span class="font-bold">Sign In</span> at the top of the page.
      </li>
      <li>
        Save your project to your account: press
        <span class="font-bold">Project</span>, then
        <span class="font-bold">Save Project</span> (or
        <span class="font-bold">Add to Account</span> if it was saved before you signed
        in).
      </li>
      <li>
        Under <span class="font-bold">Share</span>, press
        <span class="font-bold">Publish to Gallery…</span>
      </li>
      <li>
        Choose whether to show your name, or check
        <span class="font-bold">Anonymous</span>, then press
        <span class="font-bold">Save</span>.
      </li>
    </ol>
    <p>
      To publish a palette, do the same from the
      <span class="font-bold">Palette</span> menu in the Yarn Palette Creator. Publishing
      a project doesn't publish its palettes.
    </p>
    <p>
      Pages with your name are listed together in
      <span class="font-bold">Your Gallery</span>. The name comes from your
      <a href="/documentation/library-and-account#account-page" class="link"
        >Profile</a
      >.
    </p>
  </section>

  <section class="flex flex-col gap-3">
    <h2 id="keep-it-up-to-date" class="text-2xl font-bold">
      Keep It Up to Date
    </h2>
    <p>
      Your gallery page doesn't change by itself when you change your project.
      When they differ, My Library and the menus say
      <span class="font-bold">Changed since publishing</span>. To update it:
    </p>
    <ol class="ml-6 list-decimal space-y-1">
      <li>
        Under <span class="font-bold">Share</span>, press
        <span class="font-bold">Edit Gallery Page…</span>
      </li>
      <li>Press <span class="font-bold">Save</span>.</li>
    </ol>
    <p>It's the same page: its link and its views stay.</p>
  </section>

  <section class="flex flex-col gap-3">
    <h2 id="unpublish" class="text-2xl font-bold">Unpublish</h2>
    <p>
      Under <span class="font-bold">Share</span>, press
      <span class="font-bold">Unpublish…</span>, and confirm. The page is
      removed from the gallery; your project stays in My Library. Moving the
      project to the Trash hides its page too, and restoring it brings the page
      back.
    </p>
  </section>

  <section class="flex flex-col gap-3">
    <h2 id="star" class="text-2xl font-bold">Star Pages You Like</h2>
    <p>
      Press the star on someone's gallery page to find it again later, under
      <span class="font-bold">Starred</span> in My Library. Only you see your
      stars. To make it your own, press ⋮, then
      <span class="font-bold">Open a Copy</span>.
    </p>
  </section>
{:else}
  <section class="flex flex-col gap-3">
    <h2 id="browse-the-gallery" class="text-2xl font-bold">
      Browse the Gallery
    </h2>
    <p>
      See what others have made in the <a href="/gallery" class="link"
        >Gallery</a
      >. To make one your own, press its ⋮, then
      <span class="font-bold">Open a Copy</span>.
    </p>
  </section>
{/if}

<section class="flex flex-col gap-3">
  <h2 id="if-something-goes-wrong" class="text-2xl font-bold">
    If Something Goes Wrong
  </h2>
  <h3 class="text-lg font-bold">My friend sees different weather</h3>
  <p>
    The link looks the weather up again, and edited weather isn't in it. Send
    them your weather as a CSV file too.
    <a href="/documentation/guides/move-or-back-up" class="link"
      >Keeping edited weather</a
    >.
  </p>
  {#if __ACCOUNTS_ENABLED__}
    <h3 class="text-lg font-bold">Publish to Gallery… can't be pressed</h3>
    <p>
      It says why underneath: usually the project isn't saved to your account
      yet.
    </p>
    <h3 class="text-lg font-bold">I can't make it Anonymous</h3>
    <p>
      A project posted to Ravelry links to its page under your name. Unlink it
      from Ravelry first, in <span class="font-bold">Edit Gallery Page…</span>
    </p>
  {/if}
</section>

<RelatedReference slugs={['gallery-and-ravelry', 'library-and-account']} />
