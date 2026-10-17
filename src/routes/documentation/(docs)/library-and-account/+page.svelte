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

<!-- My Library & Account: saving (save-project, SaveStatus, autosave), the
Project menu (modals/Menu), My Library (MyLibrary, CollectionToolbar,
SavedProjectCard, Trash), Open (OpenProject), Preferences, the Account page
and sync. Section ids are the old single page's (OLD_ANCHORS); account parts
show only in builds with accounts. -->

<script lang="ts">
  import KeyboardShortcuts from '#lib/components/modals/KeyboardShortcuts.svelte';
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import RelatedGuides from '#lib/components/docs/RelatedGuides.svelte';
  import { TRASH_DAYS } from '#lib/storage/trash.js';
</script>

<p>
  Everything you make is kept in My Library. Without an account, it's saved in
  this browser on this device.{#if __ACCOUNTS_ENABLED__}
    Signed in, it's also saved to your account, and on every device where you
    sign in.{/if}
</p>

<section class="flex flex-col gap-3">
  <h2 id="save-project" class="text-2xl font-bold">Save a Project</h2>
  <p>
    A dot on <span class="font-bold">Project</span>, at the top of the Project
    Planner, means the project isn't saved yet. Press
    <span class="font-bold">Project</span>, then
    <span class="font-bold">Save Project</span> (or
    <kbd class="kbd">⌘ Cmd</kbd>/<kbd class="kbd">Ctrl</kbd> +
    <kbd class="kbd">s</kbd>). It needs a place, dates and weather first. From
    then on, changes save automatically, and the icon on
    <span class="font-bold">Project</span> shows where it's saved:
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      a screen: <span class="font-bold">Saved in this browser</span>, on this
      device only.
    </li>
    {#if __ACCOUNTS_ENABLED__}
      <li>
        a cloud: <span class="font-bold">Saved to your account</span>, and
        synced to your devices.
      </li>
    {/if}
  </ul>
  <p>
    To name it, press the pencil beside its name above the Project Planner. A
    project without a name is called by its place and dates.
  </p>
  <p>
    Browsers can clear what sites have saved, especially on phones and in
    private windows.{#if __ACCOUNTS_ENABLED__}
      Signing in keeps a copy in your account.{/if}
    <a href="/documentation/guides/move-or-back-up" class="link"
      >Keeping your projects safe</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="project-menu" class="text-2xl font-bold">The Project Menu</h2>
  <p>
    Press <span class="font-bold">Project</span> at the top of the Project
    Planner (or <kbd class="kbd">.</kbd>):
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Download:</span> the PDF, preview image, Google
      Sheet or weather data.
      <a href="/documentation/download" class="link">Download</a>.
    </li>
    <li>
      <span class="font-bold">Share:</span>
      <span class="font-bold">Copy Link</span>{#if __ACCOUNTS_ENABLED__}, and
        the project's gallery page{/if}.
      <a href="/documentation/gallery-and-ravelry" class="link"
        >Gallery & Ravelry</a
      >.
    </li>
    <li>
      <span class="font-bold">Palettes:</span> each gauge's colors, to save to My
      Palettes, download or copy.
    </li>
    <li>
      <span class="font-bold">Project:</span>
      <span class="font-bold">New Project</span>,
      <span class="font-bold">Open…</span>,
      <span class="font-bold">Duplicate</span> (a copy, leaving this one as it
      is) and <span class="font-bold">Move to Trash</span>.
    </li>
    <li>Getting Started, Keyboard Shortcuts, Guides & Help and Contact.</li>
  </ul>
  <p>
    Starting a new project or opening another asks first if this one has unsaved
    changes.
  </p>
  <DocsShot
    src="library-and-account/project-menu"
    alt="The Project menu: the project's name with Save Project; Download; Share with Copy Link; Palettes with the Temperature Gauge; Project with New Project, Open… and Duplicate; and links to Getting Started, Keyboard Shortcuts, Guides & Help and Contact."
    caption="The Project menu, before the project is saved."
  />
</section>

<section class="flex flex-col gap-3">
  <h2 id="open-project" class="text-2xl font-bold">My Library</h2>
  <p>
    Open <span class="font-bold">My Library</span> in the site menu. It has two
    sides, <span class="font-bold">Projects</span> and
    <span class="font-bold">Yarn Palettes</span>, each a list of cards.
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>Press a card to open it.</li>
    <li>
      Its ⋮ menu has <span class="font-bold">Edit in Project Planner</span>,
      <span class="font-bold">Duplicate</span>, sharing, and
      <span class="font-bold">Move to Trash</span>. The pencil renames it.
    </li>
    <li>
      Search, sort (<span class="font-bold">Recent</span> or
      <span class="font-bold">Name</span>), switch the view, and filter by yarn{#if __ACCOUNTS_ENABLED__},
        whether it's published,{/if} or (for projects) pattern.
    </li>
  </ul>
  <p>
    To open a project without leaving the Project Planner, press
    <span class="font-bold">Project</span>, then
    <span class="font-bold">Open…</span>
    (or <kbd class="kbd">⌘ Cmd</kbd>/<kbd class="kbd">Ctrl</kbd> +
    <kbd class="kbd">o</kbd>), and search for it.
  </p>
  <p>
    A project's link opens it anywhere, too: paste it into your browser's
    address bar. A link is a copy. Changes made from it don't change yours, and
    the weather is looked up again (<a
      href="/documentation/weather#edit-weather-data"
      class="link">edited weather</a
    > isn't included).
  </p>
  {#if __ACCOUNTS_ENABLED__}
    <h3 id="starred" class="text-lg font-bold">Starred</h3>
    <p>
      Signed in, switch <span class="font-bold">Mine</span> to
      <span class="font-bold">Starred</span> above the list to see the gallery
      pages you've starred, sorted by
      <span class="font-bold">Recently starred</span>,
      <span class="font-bold">Newest published</span> or
      <span class="font-bold">Most viewed</span>.
      <a
        href="/documentation/gallery-and-ravelry#star-gallery-pages"
        class="link">About stars</a
      >.
    </p>
  {/if}
</section>

<section class="flex flex-col gap-3">
  <h2 id="trash" class="text-2xl font-bold">Trash</h2>
  <p>
    <span class="font-bold">Move to Trash</span> doesn't delete right away.
    Press
    <span class="font-bold">Trash</span> in My Library to see what's there for
    {TRASH_DAYS} days: <span class="font-bold">Restore</span> it, or
    <span class="font-bold">Delete Forever</span>.
    <span class="font-bold">Empty Trash</span> deletes everything in it.
  </p>
  <p>
    A project or palette with a gallery page takes its page with it: the page is
    hidden while it's in the Trash, comes back when you restore it, and is
    removed for good when it's deleted forever.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="undoredo" class="text-2xl font-bold">Undo and Redo</h2>
  <p>
    Undo any change to a project, or to a palette in the
    <a href="/documentation/palette-creator" class="link"
      >Yarn Palette Creator</a
    >, with <span class="font-bold">Undo</span> and
    <span class="font-bold">Redo</span> at the top of the page.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="navigation" class="text-2xl font-bold">Keyboard Shortcuts</h2>
  <p>
    Shortcuts don't work while you're typing in a box. Press
    <kbd class="kbd">k</kbd> to see them in the Project Planner.
  </p>
  <KeyboardShortcuts />
</section>

<section class="flex flex-col gap-3">
  <h2 id="preferences" class="text-2xl font-bold">Preferences</h2>
  <p>
    Open Preferences from the account button at the top of the page. They apply
    to the whole site{#if __ACCOUNTS_ENABLED__}, and follow you to your other
      devices when you're signed in{/if}.
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Appearance:</span> Mode (Light, Dark or System), Colors,
      Headings, Text Size, Spacing and Border Radius.
    </li>
    <li>
      <span class="font-bold">Default Yarn:</span> the yarn chosen first, for example
      when colors don't have a yarn yet.
    </li>
    <li>
      <span class="font-bold">Reduce Motion:</span> fewer animations.
    </li>
    <li>
      <span class="font-bold">Reset to Defaults</span> puts everything back.
    </li>
  </ul>
  <h3 id="change-theme" class="text-lg font-bold">Light and dark</h3>
  <p>
    Choose <span class="font-bold">Mode</span> in Preferences, or press
    <kbd class="kbd">t</kbd> to go from Light to Dark to System. System follows your
    device's setting.
  </p>
  <h3 id="change-units" class="text-lg font-bold">Units</h3>
  <p>
    Use <span class="font-bold">Units</span> above the weather in the Project
    Planner, or press <kbd class="kbd">u</kbd>, to switch between metric (°C /
    mm) and imperial (°F / in).
  </p>
</section>

{#if __ACCOUNTS_ENABLED__}
  <section class="flex flex-col gap-3">
    <h2 id="account" class="text-2xl font-bold">Your Account</h2>
    <p>
      An account is free and optional. Press <span class="font-bold"
        >Sign In</span
      >
      at the top of the page and continue with Google. There's no password.
    </p>
    <h3 id="sync" class="text-lg font-bold">Syncing</h3>
    <ul class="ml-6 list-disc space-y-1">
      <li>
        Projects, palettes and preferences saved while you're signed in sync to
        your other devices. Open the site there and sign in.
      </li>
      <li>
        Projects saved in this browser before you signed in stay here. To add
        one to your account, open it, press <span class="font-bold"
          >Project</span
        >, then
        <span class="font-bold">Add to Account</span>.
      </li>
      <li>
        Nothing is lost when two devices change the same project: the one that
        couldn't be saved becomes a copy, "(copy from this device…)". If a
        project changed in another tab or on another device, the Project menu
        says so and offers <span class="font-bold">Duplicate</span> or
        <span class="font-bold">Reload the Latest</span>.
      </li>
    </ul>
    <h3 id="account-page" class="text-lg font-bold">The Account page</h3>
    <p>Open it from the account button. It has:</p>
    <ul class="ml-6 list-disc space-y-1">
      <li>
        <span class="font-bold">Profile:</span> your display name, shown only on gallery
        pages where you choose to show it.
      </li>
      <li>
        <span class="font-bold">Sign-in methods</span> and
        <span class="font-bold">Connected accounts</span> (<a
          href="/documentation/gallery-and-ravelry#ravelry"
          class="link">Ravelry</a
        >).
      </li>
      <li>
        <span class="font-bold">Devices and data:</span> sign out here or
        everywhere, and <span class="font-bold">Download my data</span> (your account,
        synced projects and gallery pages, as a file).
      </li>
    </ul>
    <h3 id="delete-account" class="text-lg font-bold">Deleting your account</h3>
    <p>
      <span class="font-bold">Delete account</span>, at the bottom of the
      Account page, deletes it for good and signs you out everywhere. Choose
      whether your gallery pages stay (without your name) or are removed.
      Projects saved in this browser stay in this browser.
    </p>
    <p>
      What's kept and why: the <a href="/privacy" class="link">Privacy Policy</a
      >.
    </p>
  </section>
{/if}

<RelatedGuides
  slugs={['move-or-back-up', 'knit-along-all-year', 'publish-and-share']}
/>
