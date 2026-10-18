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

<!-- Keep Your Ravelry Project in Sync: AddToGallery's Also post to Ravelry,
RavelryFields (sent with the dialog's Save), and server/ravelry/sync.ts
(Ravelry's changes come back only when someone looks: the list at most
every 6 hours). Needs accounts, so the steps show only in builds with
them. -->

<script lang="ts">
  import RelatedReference from '#lib/components/docs/RelatedReference.svelte';
</script>

{#if __ACCOUNTS_ENABLED__}
  <p>
    Post your project to your Ravelry notebook, with its preview, its yarns and
    a link back to its gallery page. Then keep both up to date as you work.
  </p>

  <section class="flex flex-col gap-3">
    <h2 id="what-you-need" class="text-2xl font-bold">What You Need</h2>
    <ul class="ml-6 list-disc space-y-1">
      <li>A free account here, and a Ravelry account.</li>
      <li>
        The project saved to your account, and published to the gallery showing
        your name (Ravelry links to it under your name, so it can't be
        anonymous).
        <a href="/documentation/guides/publish-and-share" class="link"
          >Publishing a gallery page</a
        >.
      </li>
    </ul>
  </section>

  <section class="flex flex-col gap-3">
    <h2 id="connect" class="text-2xl font-bold">1. Connect Ravelry</h2>
    <ol class="ml-6 list-decimal space-y-1">
      <li>
        Open the <a href="/account" class="link">Account</a> page from the account
        button at the top.
      </li>
      <li>
        Under <span class="font-bold">Connected accounts</span>, press
        <span class="font-bold">Connect</span> beside Ravelry.
      </li>
      <li>Allow it on Ravelry. You're brought back here.</li>
    </ol>
  </section>

  <section class="flex flex-col gap-3">
    <h2 id="post" class="text-2xl font-bold">2. Post Your Project</h2>
    <ol class="ml-6 list-decimal space-y-1">
      <li>
        Open the project, press <span class="font-bold">Project</span>, then
        <span class="font-bold">Edit Gallery Page…</span> (or
        <span class="font-bold">Publish to Gallery…</span>, if it isn't
        published yet).
      </li>
      <li>
        Turn on <span class="font-bold">Also post to Ravelry</span>.
      </li>
      <li>Press <span class="font-bold">Save</span>.</li>
    </ol>
    <p>
      It's added to your Ravelry projects. Its notes end with "Planned with
      Temperature Blanket" and a link to the gallery page.
    </p>
    <!-- Shot needed (owner's real data): Edit Gallery Page for a project
    already posted to Ravelry, with a connected Ravelry account, at desktop
    width, light and dark, as ravelry-sync/edit-gallery-page. Show the
    Ravelry fields: Status, Craft, dates, Progress, notes, Yarns and Photos
    with two or three photos.
    alt: "Edit Gallery Page for a project on Ravelry: Status In progress,
    Craft Crochet, a start date, Progress 40%, notes, two yarns, and three
    photos in a row, with Unlink and Save." -->
  </section>

  <section class="flex flex-col gap-3">
    <h2 id="update" class="text-2xl font-bold">3. Keep It Up to Date</h2>
    <p>
      Once it's posted, <span class="font-bold">Edit Gallery Page…</span> shows its
      Ravelry details. Change them here as you work:
    </p>
    <ul class="ml-6 list-disc space-y-1">
      <li>
        <span class="font-bold">Status</span>, and the start and finish dates.
      </li>
      <li>
        <span class="font-bold">Progress</span>: how far along you are.
      </li>
      <li>Notes and <span class="font-bold">Yarns</span>.</li>
      <li>
        <span class="font-bold">Photos</span>: add photos of your blanket,
        remove them or change their order. They show on the gallery page too.
      </li>
    </ul>
    <p>Press <span class="font-bold">Save</span> to send your changes.</p>
  </section>

  <section class="flex flex-col gap-3">
    <h2 id="when-changes-show-up" class="text-2xl font-bold">
      When Changes Show Up
    </h2>
    <ul class="ml-6 list-disc space-y-1">
      <li>
        <span class="font-bold">Edit here and save:</span> Ravelry updates right away.
        Nothing is sent until you press Save.
      </li>
      <li>
        <span class="font-bold">Edit on Ravelry:</span> photos, notes and yarns show
        here the next time you open My Library, usually within a few hours.
      </li>
    </ul>
    <p>
      The pattern, needles, gauge and private notes on Ravelry are never changed
      from here.
    </p>
  </section>

  <section class="flex flex-col gap-3">
    <h2 id="stop" class="text-2xl font-bold">Stop Syncing</h2>
    <ul class="ml-6 list-disc space-y-1">
      <li>
        <span class="font-bold">Unlink</span>, in Edit Gallery Page: the project
        stays on Ravelry but isn't updated from here, and its photos leave the
        gallery page. Unpublishing the gallery page unlinks it too.
      </li>
      <li>
        <span class="font-bold">Disconnect</span>, on the Account page: stops
        Ravelry for all your projects.
      </li>
    </ul>
  </section>

  <section class="flex flex-col gap-3">
    <h2 id="if-something-goes-wrong" class="text-2xl font-bold">
      If Something Goes Wrong
    </h2>
    <h3 class="text-lg font-bold">Also post to Ravelry isn't there</h3>
    <p>
      Connect Ravelry on the Account page first, and make sure the gallery page
      shows your name.
    </p>
    <h3 class="text-lg font-bold">A change on Ravelry isn't showing</h3>
    <p>
      Changes come back when you open My Library, and the list of projects is
      checked every few hours. Open My Library again later.
    </p>
    <h3 class="text-lg font-bold">The project disappeared from Ravelry</h3>
    <p>
      If it was deleted on Ravelry, it's unlinked here the next time you look.
      Post it again from Edit Gallery Page if you want it back.
    </p>
  </section>
{:else}
  <p>
    Posting to Ravelry needs an account, which isn't available on this version
    of the site.
  </p>
{/if}

<RelatedReference slugs={['gallery-and-ravelry', 'library-and-account']} />
