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

<script>
  import { PUBLIC_BASE_URL } from '$app/env/public';
  import AppLogo from '#lib/components/AppLogo.svelte';
  import AppShell from '#lib/components/AppShell.svelte';
  import Card from '#lib/components/Card.svelte';
  import {
    VERSION_7_POST,
    VERSION_7_POST_HREF,
  } from '#lib/constants/version-7-post.js';
  import { ArrowLeftIcon } from '@lucide/svelte';

  const title = VERSION_7_POST.title;
  const description =
    'Version 7 of temperature-blanket.com: sign in to keep your temperature blanket projects, yarn palettes and preferences on every device, find them all in My Library, publish them to the gallery under a name you choose, and post projects to Ravelry. Accounts are optional and in beta.';
  // At noon, so the date is the same day in every time zone
  const date = new Date(`${VERSION_7_POST.date}T12:00:00`).toLocaleDateString(
    'en-US',
    { month: 'long', day: 'numeric', year: 'numeric' },
  );
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />

  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content="{PUBLIC_BASE_URL}{VERSION_7_POST_HREF}" />
  <meta property="og:type" content="website" />
</svelte:head>

<AppShell pageName="Version 7">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main class="pb-8">
      <a
        href="/blog"
        class="btn hover:preset-tonal-surface mb-2 max-lg:mx-2 max-lg:mt-2"
        ><ArrowLeftIcon /> Blog</a
      >
      <Card>
        {#snippet header()}
          <div>
            <img
              src="/images/blog-images/{VERSION_7_POST.slug}/featured-image.svg"
              class="h-36 w-full object-cover object-center"
              alt="Temperature blanket stripes with a cloud and a check mark"
            />
          </div>
        {/snippet}

        {#snippet content()}
          <div class="mb-8 flex flex-col gap-4 px-2 pb-4">
            <div class="mt-4 flex flex-col gap-2">
              <h2 class="h2 text-gradient">{title}</h2>
              <p class="text-sm">{date}</p>
            </div>

            <p>
              Hello! This is Thomas, the developer of temperature-blanket.com.
              One of the most requested features has been a way to get to your
              projects from more than one device, like starting a plan on your
              computer and checking your colors on your phone while you crochet
              or knit. Version 7 does just that, with accounts (in beta), and
              brings a lot more along with it: a new home for everything you
              save, gallery pages you can update, and a way to post your
              projects to Ravelry.
            </p>

            <hr class="hr my-2" />

            <p class="text-2xl font-bold">Your account</p>

            <p class="font-bold">Sign in with Google</p>
            <p>
              Press the person icon in the top right corner, then
              <span class="italic">Sign In</span>. There's no password to make
              up or remember. When you're done, you're back on the page you
              started from.
            </p>

            <p class="font-bold">A name of your choosing</p>
            <p>
              The first time you sign in, you'll be welcomed and asked for a
              display name. To start, it's a made-up one, like
              <span class="italic">Cozy Purl 27</span>, so your real name never
              shows anywhere unless you put it there. Keep it, or type your own.
              It's only shown on gallery pages you publish, and only if you want
              it to be. You can change it at any time on your
              <a href="/account" class="link">Account</a> page.
            </p>

            <p class="font-bold">Projects you've already saved</p>
            <p>
              Projects and palettes saved in your browser before you signed in
              stay there. When you first sign in, you'll see each of them with a
              checkbox, so you can choose which to add to your account. You can
              also add them later from
              <a href="/my-projects" class="link">My Library</a>.
            </p>

            <p class="font-bold">Your projects on every device</p>
            <p>
              When you're signed in, projects and yarn palettes you save are
              kept in your account. Sign in on another computer, phone or tablet
              and they're there. Syncing happens by itself in the background.
              Press your picture or initials in the top bar to see when it last
              synced. Your preferences follow you too, like your default yarn
              and your theme.
            </p>

            <p class="font-bold">Changes save automatically</p>
            <p>
              Save a new project once, using <span class="italic">Save</span> in
              the top bar. After that, any changes you make save on their own a
              moment after you stop editing. The
              <span class="italic">Project</span> menu shows whether the latest change
              is saved. New projects don't save until you save them yourself, so trying
              out ideas won't fill up your account.
            </p>
            <p>
              If you'd like to try something different without changing the
              original, use <span class="italic">Save a copy</span> in the
              <span class="italic">Project</span> menu. You'll keep working on the
              copy, and the original stays as it was.
            </p>

            <p class="font-bold">Editing on two devices at once</p>
            <p>
              If a project is changed on another device while you have it open,
              the app won't overwrite those changes. Instead, you can save your
              version as a copy, or reload to get the latest version.
            </p>

            <hr class="hr my-2" />

            <p class="text-2xl font-bold">My Library</p>

            <p>
              <a href="/my-projects" class="link">My Library</a>, at the top of
              the site menu, has everything you've saved: your projects on one
              tab and your yarn palettes on the other. Show them as cards or as
              a list, filter them, and give your projects names. You don't need
              an account for any of this; signed out, they're kept in your
              browser.
            </p>
            <p>
              Projects and palettes you delete go to the Trash for 30 days, and
              you can put them back, from any device if you're signed in.
              Changed your mind right away? Press <span class="italic"
                >Undo</span
              >.
            </p>

            <hr class="hr my-2" />

            <p class="text-2xl font-bold">Sharing</p>

            <p class="font-bold">One Share button</p>
            <p>
              Every project and palette has a <span class="italic">Share</span>
              button: on its card in My Library, in the Project Planner's
              <span class="italic">Project</span> menu, and next to the preview.
              <span class="italic">Copy Link</span> gives you a link anyone can open
              to get their own copy. Yours never changes.
            </p>

            <p class="font-bold">Gallery pages you can update</p>
            <p>
              <span class="italic">Publish to Gallery</span> gives your project
              or palette a page in the
              <a href="/gallery" class="link">gallery</a>, and you'll need to be
              signed in to publish. Each project or palette has just one page.
              When you change your project, press
              <span class="italic">Edit Gallery Page</span> and save to update it:
              same link, same views. Yarn palettes can be published on their own,
              too.
            </p>
            <p>
              A page says “By” and your display name, unless you tick
              <span class="italic">Anonymous</span>. Pages that show your name
              are collected on <span class="italic">Your Gallery</span>, a page
              of your own you can share, linked from My Library. You choose for
              each page, and you can change your mind at any time.
            </p>
            <p>
              If you move a project or palette to the Trash, its gallery page is
              hidden, and it comes back if you put the project back.
              <span class="italic">Unpublish</span> takes a page down for good.
            </p>

            <p class="font-bold">Popular, and views</p>
            <p>
              The gallery now opens sorted by
              <span class="italic">Popular</span>, the most viewed in the past
              month (or day, week or year), and works together with search and
              the yarn and pattern filters. Each card shows how many times it's
              been viewed, and a project's name, if you've given it one, shows
              above its locations and dates. Gallery pages are public, so pick a
              name you're happy for anyone to see.
            </p>

            <p class="font-bold">Post to Ravelry</p>
            <p>
              If you're on Ravelry, press
              <span class="italic">Connect Ravelry</span> on your
              <a href="/account" class="link">Account</a> page. Then, when you
              publish a project or edit its gallery page, choose
              <span class="italic">Also post to Ravelry</span> to add it to your Ravelry
              projects, with its picture, your photos and your yarns, and a link back
              to its gallery page, which needs to show your name rather than be anonymous.
              Edit the gallery page again to update it there too. Ravelry is only
              linked for posting; you still sign in with Google.
            </p>

            <hr class="hr my-2" />

            <p class="text-2xl font-bold">Also new</p>

            <p class="font-bold">Yarn palette tools</p>
            <p>
              Save yarn palettes to use again later, copy a palette's link in
              one click, and save a palette as an image with a choice of
              layouts. <span class="italic">Paste Colors</span> reads lists of
              hex codes forgivingly,
              <span class="italic">Get Colors From an Image</span> has been rebuilt
              around markers on the photo, and palettes can be sorted from warm to
              cool.
            </p>

            <p class="font-bold">Preferences</p>
            <p>
              Preferences have their own page, opened from the person icon in
              the top bar, with a preview of each theme. Choose a default yarn,
              which is picked first wherever no yarn is chosen yet, and turn off
              motion with <span class="italic">Reduce Motion</span>.
            </p>

            <p class="font-bold">A new PDF</p>
            <p>
              The PDF has been redesigned to match the site, with a summary page
              showing the project and its preview, numbered round swatches, yarn
              names that are never cut off, and a choice of US Letter or A4
              paper.
            </p>

            <p class="font-bold">Easier on phones</p>
            <p>
              On phones, dialogs open as sheets from the bottom of the screen.
              Drag one down to close it.
            </p>

            <hr class="hr my-2" />

            <p class="text-2xl font-bold">A change to how ranges work</p>

            <p class="font-bold">Ranges read the same everywhere</p>
            <p>
              A gauge's ranges are now written the same way everywhere they
              appear, in the Project Planner, the gallery, palette images, PDFs
              and Google Sheets: From → To, like 105°F → 92°F. Which ends each
              range includes (by default its From number, not its To) is said
              once, just above the ranges.
            </p>

            <p class="font-bold">If your ranges overlap</p>
            <p>
              If a day's weather fits two ranges, it now takes the color of the
              first one, the highest on the gauge, as the
              <a href="/documentation#range-calculation-methods" class="link"
                >documentation</a
              >
              has always said. Before, it took the color of the last one. This only
              happens if you've typed in ranges that overlap, or chose
              <span class="italic">Both From and To</span> under
              <span class="italic">Each range includes</span> in the Ranges menu.
              If so, some days in your preview may change color, so it's worth a look
              before you keep going. The number of days shown for each range hasn't
              changed: it still counts every day that fits it.
            </p>
            <p>
              Also fixed: with <span class="italic">Low to High</span> and
              <span class="italic">Neither</span>, a range wrongly included its
              To number.
            </p>

            <hr class="hr my-2" />

            <p class="text-2xl font-bold">Accounts are optional</p>
            <p>
              You don't need an account to use the Project Planner, My Library
              or anything else on the site, apart from publishing to the
              gallery. Without one, everything works as it always has: projects
              save in your browser, and you can share or bookmark a project's
              link.
            </p>

            <p class="font-bold">Signing out</p>
            <p>
              When you sign out, your account's projects and palettes are
              removed from that browser, which is handy on a shared computer.
              They stay in your account for next time. If any changes haven't
              reached your account yet, you'll be asked first, and those stay in
              the browser.
            </p>

            <p class="font-bold">Your data</p>
            <p>
              From your <a href="/account" class="link">Account</a> page you can
              change your display name, download everything in your account, or
              delete your account and its projects. When you delete your
              account, you can choose to remove what you've published in the
              gallery or leave it there without your name. An account can hold
              up to 200 projects. The
              <a href="/privacy" class="link">Privacy Policy</a> explains what's stored
              and why. In short, it's what's needed to sign you in and keep your projects,
              and nothing is sold or used for ads.
            </p>

            <hr class="hr my-2" />

            <p class="text-2xl font-bold">About the beta</p>
            <p>
              Accounts will be in beta for the next few weeks while I make sure
              everything works well. During the beta, things may change a bit
              and there may be the occasional bug. Your projects are also kept
              in your browser, so they stay safe even if syncing has a hiccup.
            </p>

            <h2 class="text-2xl font-bold">Feedback</h2>
            <p>
              This is a big update, and I'd love to hear how it works for you.
              If you have feedback of any kind, or run into any issues, please
              let me know through any of the methods listed on the
              <a href="/contact" class="link">contact page</a>. Thank you!
            </p>
          </div>
        {/snippet}
      </Card>
    </main>
  {/snippet}
</AppShell>
