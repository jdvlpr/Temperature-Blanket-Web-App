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
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import {
    VERSION_7_POST,
    VERSION_7_POST_HREF,
  } from '#lib/constants/version-7-post.js';
  import { ArrowLeftIcon } from '@lucide/svelte';

  const title = VERSION_7_POST.title;
  const description =
    'Version 7 of temperature-blanket.com: optional accounts to keep your projects on every device, a new My Library, posting projects to Ravelry, gallery pages you can update, and simpler navigation and range editing.';
  // At noon, so the date is the same day in every time zone
  const date = new Date(`${VERSION_7_POST.date}T12:00:00`).toLocaleDateString(
    'en-US',
    { month: 'long', day: 'numeric', year: 'numeric' },
  );
  // The header and social previews share one picture
  const featuredImage = `/images/blog-images/${VERSION_7_POST.slug}/featured-image.jpg`;

  // Where things moved: what to look for, and where it is now
  const moved = [
    ['Your saved projects', 'My Library, or Project menu › Open… (⌘/Ctrl+O)'],
    ['A new project or palette', 'Create, in the site menu'],
    ['Send to Gallery', 'Project or Palette menu › Share'],
    ['Downloads (PDF, CSV, image)', 'Project or Palette menu › Download'],
    ['The Globe', 'Gallery › View Globe'],
    ['Your display name', 'Person icon › Account'],
    ['Connect Ravelry', 'Person icon › Account'],
  ];
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />

  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content="{PUBLIC_BASE_URL}{VERSION_7_POST_HREF}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="{PUBLIC_BASE_URL}{featuredImage}" />
  <meta property="og:image:width" content="1366" />
  <meta property="og:image:height" content="768" />
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
              src={featuredImage}
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
              Version 7 is a big update. Here's the short version:
            </p>
            <ul class="ml-6 list-disc space-y-1">
              <li>
                <span class="font-bold">New:</span> optional accounts, so your projects
                and palettes are on every device; My Library; posting projects to
                Ravelry; gallery pages you can update; and stars.
              </li>
              <li>
                <span class="font-bold">Changed:</span> a simpler site menu, new ways
                to edit colors and ranges, projects that save by themselves, and gallery
                projects that keep their weather.
              </li>
              <li>
                <span class="font-bold">Removed or fixed:</span> publishing to the
                gallery now needs an account, and a bug with overlapping ranges is
                fixed, which may change some previews.
              </li>
            </ul>

            <hr class="hr my-2" />

            <h2 class="text-2xl font-bold">What's New</h2>

            <h3 class="font-bold">Accounts</h3>
            <p>
              Sign in with Google from the person icon in the top right. Your
              projects, palettes and preferences are then on any device you sign
              in on. Accounts are optional (see
              <a href="#saving" class="link">Saving</a> below for the difference).
            </p>

            <h3 class="font-bold">My Library</h3>
            <p>
              Everything you've saved, projects and palettes, in one place near
              the top of the site menu, with or without an account. Find it at
              <a href="/my-projects" class="link">My Library</a>.
            </p>

            <h3 class="font-bold">Post to Ravelry</h3>
            <p>
              Connect your Ravelry account on your
              <a href="/account" class="link">Account</a> page, then choose
              <span class="italic">Also post to Ravelry</span> when you publish a
              project or edit its gallery page. Your project is added to your Ravelry
              projects with its preview, its yarns and a link back to its gallery
              page. You can add photos of your project, in progress or finished, here
              or on Ravelry, and they show on its gallery page too. Palettes can't
              be posted to Ravelry (yet).
            </p>
            <!-- If linking existing Ravelry projects ships before launch:
            <p>
              Already have the project on Ravelry? Link it instead of starting a
              new one.
            </p> -->
            <!-- Shot needed (owner's real data): a gallery page of a project
            posted to Ravelry, showing its Ravelry photos (two or three) under
            the preview, at desktop width, light and dark, captured as
            static/images/docs/version-7/ravelry-photos-{light,dark}.png with
            its size in docs-shots.json; then
            <DocsShot src="version-7/ravelry-photos" alt="A gallery page:
            the project's name, By <name> · views, its preview, and its
            Ravelry photos in a row, with On Ravelry beside them." /> -->

            <h3 class="font-bold">Gallery pages you can update</h3>
            <p>
              If you choose to publish a project or palette, it gets one gallery
              page. When you make changes, choose
              <span class="italic">Edit Gallery Page</span> to update it, with the
              same link and the same views.
            </p>

            <h3 class="font-bold">Stars</h3>
            <p>
              Star other people's projects and palettes to find them again under
              <span class="italic">Starred</span> in My Library. Only you see your
              stars.
            </p>

            <hr class="hr my-2" />

            <h2 class="text-2xl font-bold">What's Changed</h2>

            <h3 class="font-bold">A simpler site menu</h3>
            <p>
              The site menu is now grouped into
              <span class="italic">Create</span> (a new project or palette),
              <span class="italic">My Library</span>, and
              <span class="italic">Explore</span> (the Gallery, Yarn Colorways and
              Weather Forecast). Projects and yarn palettes now work the same way:
              each has its own tool, a matching menu (Project or Palette), and the
              same ways to share and download.
            </p>
            <DocsShot
              src="version-7/site-menu"
              alt="The site menu: Create and My Library at the top; Explore with Gallery, Yarn Colorways and Weather Forecast; then Supporters, and small links to the Blog, Guides & Help, What's New, Contact, Privacy, Data Sources & Credits, API and GitHub."
              caption="The new site menu."
            />

            <h3 class="font-bold">Editing colors and ranges</h3>
            <p>
              Ranges are now edited right in the gauge. Tap a range's number,
              change it and press <span class="italic">Save</span>, and the next
              range follows along. The
              <span class="italic">Configure Ranges</span> dialog is replaced by
              a
              <span class="italic">Ranges</span> menu (it reads Auto, Manual or
              Edited), where you can choose auto ranges (<span class="italic"
                >Equal size</span
              >
              or <span class="italic">Equal days</span>), set
              <span class="italic">Manual steps</span>, flip the direction, or
              choose which ends each range includes. All the ways to get or
              import colors are now under
              <span class="italic">Get Colors</span>.
            </p>
            <DocsShot
              src="gauges-and-ranges/edit-range"
              alt="The Temperature Gauge as a list of ten colors, each with its range and how many days fall in it. The third color's range, 23° → 20°, has its To number open for typing, with ✕ and Save beside it."
              caption="Changing a range right in the gauge."
            />
            <DocsShot
              src="gauges-and-ranges/ranges-menu"
              alt="The Ranges menu: Auto ranges (now Equal days · High Temperature), Manual steps…, Direction with High to low checked and Low to high, Linked ranges turned on, and Each range includes (From, not To)."
              caption="The Ranges menu."
            />

            <h3 id="saving" class="scroll-mt-20 font-bold">Saving</h3>
            <p>
              Save a project once with <span class="italic">Save</span> in the top
              bar, and after that your changes save by themselves.
            </p>
            <ul class="ml-6 list-disc space-y-1">
              <li>
                <span class="font-bold">Without an account</span>, projects and
                palettes are saved in this browser only, as before. Copy a
                project's link to keep a backup or to open it somewhere else.
              </li>
              <li>
                <span class="font-bold">With an account</span>, they're also
                saved to your account, so they're on every device you sign in
                on. You can also publish to the gallery, star pages and post to
                Ravelry.
              </li>
            </ul>

            <h3 class="font-bold">Gallery projects keep their weather</h3>
            <p>
              Opening a project from the
              <a href="/gallery" class="link">gallery</a> now loads the weather
              it had when it was published, so you see the project as its maker
              did, even if the weather source has since changed its numbers.
              This works for pages published or updated since January 2026, but
              not for projects still in progress (like one for this year), which
              search for weather as usual. Projects with weather you typed in or
              imported always open as published, since that weather can't be
              searched again. You can always get the latest weather by searching
              again, and if it's your page,
              <span class="italic">Edit Gallery Page</span> saves the new weather
              to it.
            </p>

            <h3 class="font-bold">And many smaller changes</h3>
            <p>Including:</p>
            <ul class="ml-6 list-disc space-y-1">
              <li>
                a <a href="/preferences" class="link">Preferences</a> page with theme
                previews and a default yarn
              </li>
              <li>a redesigned PDF</li>
              <li>adding a color before or after another</li>
              <li>dialogs that open from the bottom of the screen on phones</li>
            </ul>

            <hr class="hr my-2" />

            <h2 class="text-2xl font-bold">Where to Find Things</h2>
            <div class="rounded-container border-surface-200-800 border">
              <table class="w-full text-left">
                <thead class="max-sm:sr-only">
                  <tr class="bg-surface-50-950">
                    <th class="p-2">Looking for…</th>
                    <th class="p-2">Now it's here</th>
                  </tr>
                </thead>
                <tbody class="divide-surface-200-800 divide-y">
                  {#each moved as [lookingFor, nowHere] (lookingFor)}
                    <tr class="max-sm:block max-sm:py-2">
                      <td class="p-2 max-sm:block max-sm:py-0 max-sm:font-bold"
                        >{lookingFor}</td
                      >
                      <td class="p-2 max-sm:block max-sm:py-0">{nowHere}</td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>

            <hr class="hr my-2" />

            <h2 class="text-2xl font-bold">What's Removed or Fixed</h2>

            <h3 class="font-bold">
              Publishing to the gallery needs an account
            </h3>
            <p>
              Before, anyone could send a project to the gallery. Now you'll
              need to sign in, so each page has an owner who can update it, hide
              it or take it down. Pages already in the gallery stay there.
            </p>

            <h3 class="font-bold">Overlapping ranges, fixed</h3>
            <p>
              In earlier versions, if you typed in ranges that overlap, a day
              that fit two ranges took the color of the last one, instead of the
              first (highest), as the documentation says. That bug is fixed, so
              if your ranges overlap, some days in your preview may change
              color. Most projects aren't affected.
              <a
                href="/documentation/gauges-and-ranges#range-calculation-methods"
                class="link">More in the documentation</a
              >.
            </p>

            <h3 class="font-bold">Version 6, if you need it</h3>
            <p>
              If something doesn't work for you, Version 6 is still at
              <a href="https://archive-v6.temperature-blanket.com" class="link"
                >archive-v6.temperature-blanket.com</a
              >. To open a project there, add
              <span class="code">archive-v6.</span> before
              <span class="code">temperature-blanket.com</span> in its link. Projects
              saved only in your browser don't show up there, so copy the project's
              link first.
            </p>

            <hr class="hr my-2" />

            <h2 class="text-2xl font-bold">Your Privacy</h2>
            <p>
              Your data is never sold or used for ads. You can download
              everything or delete your account at any time from your
              <a href="/account" class="link">Account</a> page. Gallery pages
              are public. The <a href="/privacy" class="link">Privacy Policy</a> has
              the details.
            </p>

            <hr class="hr my-2" />

            <h2 class="text-2xl font-bold">Feedback</h2>
            <p>
              Thank you to everyone who uses the site and shares ideas; many of
              these changes came from you. If you have feedback or run into any
              issues, please let me know through the
              <a href="/contact" class="link">contact page</a>. Thank you!
            </p>
          </div>
        {/snippet}
      </Card>
    </main>
  {/snippet}
</AppShell>
