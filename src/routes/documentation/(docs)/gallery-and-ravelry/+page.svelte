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

<!-- Gallery & Ravelry: the gallery (GALLERY_SORTS, GalleryCardMenu), share
rows (accounts/share-rows.ts), the Publish / Edit Gallery Page dialogs
(AddToGallery, SharePalette), stars, and Ravelry (RavelryFields,
server/ravelry/sync.ts for when changes come back). Publishing, stars and
Ravelry need accounts, so show only in builds with them. -->

<script lang="ts">
  import RelatedGuides from '#lib/components/docs/RelatedGuides.svelte';
</script>

<p>
  The <a href="/gallery" class="link">Gallery</a> is where people share their
  temperature blanket projects and yarn palettes. Browse it for ideas, and open a
  copy of anything you like to make it your own.
</p>

<section class="flex flex-col gap-3">
  <h2 id="browse-the-gallery" class="text-2xl font-bold">Browse the Gallery</h2>
  <p>
    Open <span class="font-bold">Gallery</span> in the site menu. It has
    <span class="font-bold">Projects</span> and
    <span class="font-bold">Yarn Palettes</span>, with a search, filters (like yarn
    or pattern) and sorting:
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Popular</span> (the default): most viewed first, over
      the past day, week, month or year.
    </li>
    <li>
      <span class="font-bold">Newest:</span> the latest first, or the oldest with
      Reverse.
    </li>
  </ul>
  <p>
    Each card shows when it was published, by whom (unless it's anonymous) and how
    many times it's been viewed. Its ⋮ menu has:
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Open a Copy:</span> opens it in the Project Planner
      or Yarn Palette Creator, as your own. The gallery page doesn't change.
    </li>
    <li>
      <span class="font-bold">More by</span> its maker: their gallery.
    </li>
    <li><span class="font-bold">Copy Link</span> to the gallery page.</li>
  </ul>
</section>

{#if __ACCOUNTS_ENABLED__}
  <section class="flex flex-col gap-3">
    <h2 id="share-to-gallery" class="text-2xl font-bold">Publish a Gallery Page</h2>
    <p>
      Publishing needs a free account, so you can update or unpublish your page
      later. Without one, you can still share with
      <span class="font-bold">Copy Link</span>.
    </p>
    <p>
      In the Project Planner, press <span class="font-bold">Project</span>; in the
      Yarn Palette Creator, <span class="font-bold">Palette</span>; or use a card's ⋮
      in My Library. Under <span class="font-bold">Share</span>:
    </p>
    <ul class="ml-6 list-disc space-y-1">
      <li>
        <span class="font-bold">Copy Link:</span> anyone with the link gets their own
        copy. Yours stays as it is.
      </li>
      <li>
        <span class="font-bold">Publish to Gallery…:</span> choose whether to show
        your name or be <span class="font-bold">Anonymous</span>, then
        <span class="font-bold">Save</span>. A project must be saved to your account
        first.
      </li>
      <li>
        Once published: <span class="font-bold">View Gallery Page</span>,
        <span class="font-bold">Edit Gallery Page…</span> and
        <span class="font-bold">Unpublish…</span>.
      </li>
    </ul>
    <h3 id="gallery-page-rules" class="text-lg font-bold">How gallery pages work</h3>
    <ul class="ml-6 list-disc space-y-1">
      <li>
        Each project or palette has one gallery page. Editing it updates the same
        page: its link and views stay.
      </li>
      <li>
        It doesn't change by itself when you change your project. When they differ,
        My Library and the menus say <span class="font-bold"
          >Changed since publishing</span
        >; press <span class="font-bold">Edit Gallery Page…</span>, then
        <span class="font-bold">Save</span>, to update it.
      </li>
      <li>
        Publishing a project doesn't publish its palettes. Publish a palette on its
        own from the Yarn Palette Creator.
      </li>
      <li>
        Moving the project to the Trash hides its page; restoring it brings the page
        back.
      </li>
      <li>
        Pages showing your name are listed together in
        <span class="font-bold">Your Gallery</span>, linked from My Library. Set the
        name in your <a
          href="/documentation/library-and-account#account-page"
          class="link">Profile</a
        >.
      </li>
      <li>
        A page's views are counted for all time, and shown on its card and page.
      </li>
    </ul>
  </section>

  <section class="flex flex-col gap-3">
    <h2 id="star-gallery-pages" class="text-2xl font-bold">Stars</h2>
    <p>
      Signed in, press the star on someone's gallery project or palette to find it
      again later. Your starred pages are in My Library: switch
      <span class="font-bold">Mine</span> to <span class="font-bold">Starred</span>,
      on Projects or Yarn Palettes. Starred palettes are also in
      <span class="font-bold">Get Colors</span>, under
      <span class="font-bold">My Palettes</span>.
    </p>
    <p>
      Stars are private: only you see them, and they don't count as views. A star
      keeps a link to the page, not a copy, so you always see it as its owner last
      updated it. Press the star again to unstar it. You can star up to 500 pages.
    </p>
  </section>

  <section class="flex flex-col gap-3">
    <h2 id="ravelry" class="text-2xl font-bold">Ravelry</h2>
    <p>
      Post a project to your Ravelry notebook, with its yarns and a picture, linking
      back to its gallery page.
    </p>
    <ol class="ml-6 list-decimal space-y-1">
      <li>
        On the <a href="/account" class="link">Account</a> page, under
        <span class="font-bold">Connected accounts</span>, press
        <span class="font-bold">Connect</span> beside Ravelry, and allow it on
        Ravelry.
      </li>
      <li>
        Publish the project's gallery page, showing your name (Ravelry links to it
        under your name, so it can't be anonymous).
      </li>
      <li>
        In <span class="font-bold">Edit Gallery Page…</span>, turn on
        <span class="font-bold">Also post to Ravelry</span>, then
        <span class="font-bold">Save</span>.
      </li>
    </ol>
    <h3 id="ravelry-fields" class="text-lg font-bold">What you can edit here</h3>
    <p>
      Once it's on Ravelry, <span class="font-bold">Edit Gallery Page…</span> shows its
      <span class="font-bold">Status</span>, <span class="font-bold">Craft</span>,
      dates, <span class="font-bold">Progress</span>, notes,
      <span class="font-bold">Yarns</span> and <span class="font-bold">Photos</span>
      (add, remove and reorder them). The notes always end with "Planned with
      Temperature Blanket" and a link to the gallery page. The pattern, needles,
      gauge and private notes on Ravelry aren't changed from here.
    </p>
    <h3 id="ravelry-timing" class="text-lg font-bold">When changes show up</h3>
    <ul class="ml-6 list-disc space-y-1">
      <li>
        <span class="font-bold">Edited here:</span> sent to Ravelry when you press
        <span class="font-bold">Save</span> in Edit Gallery Page. Nothing is sent by
        itself.
      </li>
      <li>
        <span class="font-bold">Edited on Ravelry:</span> photos, notes and yarns come
        back here the next time you open My Library, usually within a few hours. A
        project deleted on Ravelry is unlinked here.
      </li>
    </ul>
    <p>
      To stop, press <span class="font-bold">Unlink</span> in Edit Gallery Page: the
      project stays on Ravelry but isn't updated from here, and its photos leave the
      gallery page. Unpublishing the gallery page unlinks it too.
      <span class="font-bold">Disconnect</span> on the Account page disconnects
      Ravelry altogether.
    </p>
  </section>
{/if}

<RelatedGuides slugs={['publish-and-share', 'ravelry-sync']} />
