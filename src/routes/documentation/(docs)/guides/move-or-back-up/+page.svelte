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

<!-- Move or Back Up Your Projects. There's no file to export or import
projects: without an account, links are the backup (they carry everything
but edited weather, project-state's URL); the account's Download my data
can't be imported back. Account parts show only in builds with accounts. -->

<script lang="ts">
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import RelatedReference from '#lib/components/docs/RelatedReference.svelte';
  import { TRASH_DAYS } from '#lib/storage/trash.js';
</script>

<p>
  Without an account, your projects and palettes are saved in this browser, on
  this device. Browsers sometimes clear what sites have saved, especially on
  phones and in private windows. Here's how to keep a copy, and how to move a
  project to another device.
</p>

{#if __ACCOUNTS_ENABLED__}
  <section class="flex flex-col gap-3">
    <h2 id="sign-in" class="text-2xl font-bold">The Easy Way: Sign In</h2>
    <p>
      An account is free. Signed in, everything you save is also kept in your
      account, and on every device where you sign in.
    </p>
    <ol class="ml-6 list-decimal space-y-1">
      <li>
        Press <span class="font-bold">Sign In</span> at the top of the page, and continue
        with Google.
      </li>
      <li>
        Projects saved before you signed in stay in this browser. Open each one,
        press <span class="font-bold">Project</span>, then
        <span class="font-bold">Add to Account</span>.
      </li>
      <li>
        On your other device, open the site and sign in. Your projects are in My
        Library.
      </li>
    </ol>
    <p>
      The icon on <span class="font-bold">Project</span> shows a cloud when a project
      is saved to your account, and a screen when it's only in this browser.
    </p>
  </section>
{/if}

<section class="flex flex-col gap-3">
  <h2 id="links-as-backups" class="text-2xl font-bold">
    Keep a Link of Each Project
  </h2>
  <p>
    A project's link holds everything about it: its places and dates, colors,
    ranges and preview. Keep it, and you can open the project again anywhere.
  </p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Open the project, press <span class="font-bold">Project</span>, then
      <span class="font-bold">Copy Link</span>.
    </li>
    <li>
      Paste it somewhere safe: an email to yourself, a note, or a document of
      all your projects.
    </li>
    <li>
      Copy it again after big changes: a link is the project as it was when you
      copied it.
    </li>
  </ol>
  <p>
    Palettes work the same way: in the Yarn Palette Creator, press
    <span class="font-bold">Palette</span>, then
    <span class="font-bold">Copy Link</span>.
  </p>
  <DocsShot
    src="library-and-account/project-menu"
    alt="The Project menu: the project's name with Save Project; Download; Share with Copy Link and Sign In to Publish; Palettes with the Temperature Gauge; Project with New Project, Open… and Duplicate; and links to Getting Started, Keyboard Shortcuts, Guides & Help and Contact."
    caption="Copy Link is under Share in the Project menu."
  />
  <h3 id="edited-weather" class="text-lg font-bold">
    If you edited or imported weather
  </h3>
  <p>
    A link doesn't hold weather: it's looked up again when the link is opened.
    Keep your weather too: press <span class="font-bold">Download</span> under
    the weather table, then <span class="font-bold">Download CSV</span>. To
    restore it, open the link, then press
    <span class="font-bold">Import Weather Data</span> and choose the file.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="move-to-another-device" class="text-2xl font-bold">
    Move a Project to Another Device
  </h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>Copy its link, and send it to yourself (by email or a message).</li>
    <li>Open the link on the other device.</li>
    <li>
      Press <span class="font-bold">Search</span> for the weather, then
      <span class="font-bold">Project</span>,
      <span class="font-bold">Save Project</span>.
    </li>
  </ol>
  <p>
    The project on each device is now separate: changes on one don't show on the
    other{#if __ACCOUNTS_ENABLED__}, unless you're signed in on both{/if}.
  </p>
</section>

{#if __ACCOUNTS_ENABLED__}
  <section class="flex flex-col gap-3">
    <h2 id="download-my-data" class="text-2xl font-bold">
      A Copy of Your Account
    </h2>
    <p>
      On the Account page, <span class="font-bold">Download my data</span> saves your
      account, synced projects and gallery pages as a file. It's a record of what's
      kept about you, not a backup to load again: the site can't open it. Your account
      already keeps your synced projects safe.
    </p>
  </section>
{/if}

<section class="flex flex-col gap-3">
  <h2 id="trash" class="text-2xl font-bold">Get Back a Deleted Project</h2>
  <p>
    <span class="font-bold">Move to Trash</span> keeps a project for {TRASH_DAYS}
    days. In My Library, press <span class="font-bold">Trash</span>, then
    <span class="font-bold">Restore</span>. After that, or after
    <span class="font-bold">Delete Forever</span>, it's gone, except from links
    you've kept.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="if-something-goes-wrong" class="text-2xl font-bold">
    If Something Goes Wrong
  </h2>
  <h3 class="text-lg font-bold">My projects are gone</h3>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      Are you in the same browser as before? Projects saved in Safari aren't in
      Chrome, and ones saved on your phone aren't on your computer.
    </li>
    <li>A private or incognito window forgets everything when it's closed.</li>
    <li>
      Clearing your browser's history or site data clears saved projects too.
    </li>
    <li>Check the Trash.</li>
    {#if __ACCOUNTS_ENABLED__}
      <li>Signed in? Sign in again: what you'd synced comes back.</li>
    {/if}
  </ul>
  <p>Open the links you've kept, and save them again.</p>
  {#if __ACCOUNTS_ENABLED__}
    <h3 class="text-lg font-bold">
      There's a project called "(copy from this device…)"
    </h3>
    <p>
      The same project was changed on two devices at once. Nothing is lost: the
      changes that couldn't be saved became a copy. Keep the one you want, and
      move the other to the Trash.
    </p>
  {/if}
</section>

<RelatedReference slugs={['library-and-account', 'download', 'weather']} />
