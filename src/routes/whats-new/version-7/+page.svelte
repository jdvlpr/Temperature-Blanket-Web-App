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
  import AppShell from '#lib/components/AppShell.svelte';
  import OnThisPageLayout from '#lib/components/docs/OnThisPageLayout.svelte';
  import { PAGE_TEXT } from '#lib/constants/class-constants.js';
  import Card from '#lib/components/Card.svelte';
  import DocsClip from '#lib/components/docs/DocsClip.svelte';
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import {
    VERSION_7_POST,
    VERSION_7_POST_HREF,
  } from '#lib/constants/version-7-post.js';
  import { ArrowLeftIcon, ArrowRightIcon } from '@lucide/svelte';

  const title = VERSION_7_POST.title;
  const description = __ACCOUNTS_ENABLED__
    ? 'Version 7 of temperature-blanket.com: optional accounts to keep your projects on every device, a new My Library, posting projects to Ravelry, gallery pages you can update, weather you can check for updates, colors from a photo, palette images and a new PDF.'
    : 'Version 7 of temperature-blanket.com: a new My Library, weather you can check for updates, colors from a photo, palette images, a new PDF, and simpler navigation and range editing.';
  // At noon, so the date is the same day in every time zone
  const date = new Date(`${VERSION_7_POST.date}T12:00:00`).toLocaleDateString(
    'en-US',
    { month: 'long', day: 'numeric', year: 'numeric' },
  );
  // The header and social previews share one picture
  const featuredImage = VERSION_7_POST.image;

  // Where things moved: what to look for, and where it is now
  const moved = [
    ['Your saved projects', 'My Library, or Project menu › Open… (⌘/Ctrl+O)'],
    ['A new project or palette', 'Create, in the site menu'],
    ...(__ACCOUNTS_ENABLED__
      ? [['Send to Gallery', 'Project or Palette menu › Share']]
      : []),
    ['Downloads (PDF, CSV, image)', 'Project or Palette menu › Download'],
    ['Searching for the weather again', 'Location step › Check for Updates'],
    ['The Globe', 'Gallery › View Globe'],
    ...(__ACCOUNTS_ENABLED__
      ? [
          ['Your display name', 'Person icon › Account'],
          ['Connect Ravelry', 'Person icon › Account'],
        ]
      : [['Preferences', 'Person icon › Preferences']]),
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
  {#snippet main()}
    <OnThisPageLayout
      {title}
      backHref="/whats-new"
      backLabel="All What's New"
      class={PAGE_TEXT}
    >
      <a
        href="/whats-new"
        class="btn hover:preset-tonal-surface mb-2 w-fit max-lg:mt-2"
        ><ArrowLeftIcon /> What's New</a
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
              <h2 class="h2 text-gradient" data-on-this-page-ignore>{title}</h2>
              <p class="text-sm">{date}</p>
            </div>

            <p>
              Hello! This is Thomas, the developer of temperature-blanket.com.
              Version 7 is a big update. Here's the short version:
            </p>
            <ul class="ml-6 list-disc space-y-1">
              <li>
                <span class="font-bold">New:</span>
                {#if __ACCOUNTS_ENABLED__}optional accounts, so your projects
                  and palettes are on every device; My Library; posting projects
                  to Ravelry; gallery pages you can update; stars;{:else}My
                  Library;{/if} weather you can check for updates; colors from a photo;
                palette images; and a new PDF.
              </li>
              <li>
                <span class="font-bold">Changed:</span> a simpler site menu, new ways
                to edit colors and ranges, projects that save by themselves and keep
                their weather, and gallery projects that open with theirs.
              </li>
              <li>
                <span class="font-bold">Removed or fixed:</span>
                {#if __ACCOUNTS_ENABLED__}publishing to the gallery now needs an
                  account, and{/if} a bug with overlapping ranges is fixed, which
                may change some previews.
              </li>
            </ul>

            <hr class="hr my-2" />

            <h2 id="whats-new" class="text-2xl font-bold">What's New</h2>

            {#if __ACCOUNTS_ENABLED__}
              <h3 id="accounts" class="font-bold">Accounts</h3>
              <p>
                Sign in with Google from the person icon in the top right. Your
                projects, palettes and preferences are then on any device you
                sign in on. The first time, you choose which projects and
                palettes already in your browser to add. Your account starts
                with a made-up display name, so your real name is never shown
                unless you choose it. Accounts are optional (see
                <a href="#saving" class="link">Saving</a> below for the difference).
              </p>
            {/if}

            <h3 id="my-library" class="font-bold">My Library</h3>
            <p>
              Everything you've saved, projects and palettes, in one place near
              the top of the site menu{#if __ACCOUNTS_ENABLED__}, with or
                without an account{/if}. Name your projects, see them as cards
              or a list, and filter them. Deleted projects and palettes go to a
              Trash for 30 days, so you can put them back. Find it at
              <a href="/my-projects" class="link">My Library</a>.
            </p>

            {#if __ACCOUNTS_ENABLED__}
              <h3 id="gallery-pages-you-can-update" class="font-bold">
                Gallery pages you can update
              </h3>
              <p>
                If you choose to publish a project or palette, it gets one
                gallery page, showing your display name or anonymous. When you
                make changes, choose
                <span class="italic">Edit Gallery Page</span> to update it, with the
                same link and the same views. Pages that show your name are collected
                on Your Gallery, and a page follows its project into the Trash and
                back.
              </p>

              <h3 id="post-to-ravelry" class="font-bold">Post to Ravelry</h3>
              <p>
                Connect your Ravelry account on your
                <a href="/account" class="link">Account</a> page, then choose
                <span class="italic">Also post to Ravelry</span> when you publish
                a project or edit its gallery page. Your project is added to your
                Ravelry projects with its preview, its yarns and a link back to its
                gallery page. You can add photos of your project, in progress or finished,
                here or on Ravelry, and they show on its gallery page too. Palettes
                can't be posted to Ravelry (yet).
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

              <h3 id="stars" class="font-bold">Stars</h3>
              <p>
                Star other people's projects and palettes to find them again
                under <span class="italic">Starred</span> in My Library. Only you
                see your stars.
              </p>
            {/if}

            <h3 id="weather-you-can-keep-up-to-date" class="font-bold">
              Weather you can keep up to date
            </h3>
            <p>
              A saved project now keeps its weather: opening it never searches
              again by itself, so your colors stay as you planned them. When you
              want newer weather, press
              <span class="italic">Check for Updates</span> on the Location step.
              New days are added, and if the weather source has since refined any
              past days, you see how many would change color and choose whether to
              update them. Days you keep as they were are marked in the weather table.
            </p>
            <DocsClip
              src="weather/check-for-updates"
              alt="On the Location step, the pointer presses Check for Updates. Update Weather Data opens: Update Past Days says 5 days in the project would change color, and Open-Meteo has newer values for 8 days. Its switch is turned on, and Choose which days to update opens All Changes, each changed value over the saved one struck through, like 7.4 over 3.4, +4. Filters › New color shows 5 of the 8 days. Back, then Update 8 Days: the dialog closes and the message says Updated 8 days."
              caption="Checking a saved project for updates."
            />
            <p>
              The weather table has filters (like missing days, or the days in
              one color), and
              <span class="italic">View › Show Colors</span> puts each value's
              color beside it.
              <span class="italic">Edit Weather Data</span> works like a spreadsheet:
              type or paste values, select several days to add to or take away from
              them all, fill in missing days, or import your own readings from a CSV
              file.
            </p>
            <DocsClip
              src="weather-doesnt-match/change-several-days"
              alt="In Edit Weather Data, the pointer drags down the High column from January 2 to January 6, and 5 selected shows above the grid. 2 is typed in Add and Add is pressed: each of the five highs goes up by 2, showing the old value struck through and +2. Apply is pressed and the message says Weather data changed on 5 days."
              caption="Adding 2° to five days' highs."
            />

            <h3 id="colors-from-a-photo" class="font-bold">
              Colors from a photo
            </h3>
            <p>
              <span class="italic">Get Colors › From an Image</span> has been
              rebuilt. Tap your photo where you want a color, draw a line across
              it to take the colors along it, or let
              <span class="italic">Auto</span> pick the colors that best capture it.
              Choose a yarn, and each color is matched to its closest colorway. Your
              photo stays on your device: it's never uploaded.
            </p>
            <DocsClip
              src="match-your-yarn/colors-from-photo"
              alt="In Get Colors from an Image, the pointer presses Your Photo, and a photo of sea, sky and forest opens with 10 colors marked on it and shown in a strip below. A tap on the sea adds an 11th. Under Yarn, Special DK is searched and Stylecraft Special DK chosen: each color changes to its closest colorway, like Khaki 1027. Save is pressed, and the palette lists Black 1002, Graphite 1063, Charcoal 1128 and the rest."
              caption="Colors from a photo, matched to yarn."
            />

            <h3 id="palette-images" class="font-bold">Palette images</h3>
            <p>
              Save a palette as a picture. Find it in the
              <a href="/yarn" class="link">Yarn Palette Creator</a>'s Palette
              menu under Download, or for a gauge's colors in the Project menu
              under Palettes.
            </p>
            <DocsClip
              src="palette-creator/palette-image"
              alt="In the Yarn Palette Creator, the pointer opens Palette, then Download, then Image. Palette Image shows six Stylecraft Special DK colors as a list under the palette's name. Layout is changed to Grid, Shape to Square, and Background to Dark, and the picture changes each time."
              caption="Choosing how a palette image looks."
            />

            <h3 id="a-new-pdf" class="font-bold">A new PDF</h3>
            <p>
              The PDF has been redesigned to match the site, and you choose what
              goes in it.
            </p>
            <DocsShot
              src="download/pdf-options"
              alt="The Download PDF dialog: a preview of the PDF's pages on the left, starting with the summary page, and on the right the Include and Look options, then Cancel and Download."
              caption="Download PDF: its pages beside your choices."
            />

            <hr class="hr my-2" />

            <h2 id="whats-changed" class="text-2xl font-bold">
              What's Changed
            </h2>

            <h3 id="a-simpler-site-menu" class="font-bold">
              A simpler site menu
            </h3>
            <DocsShot
              src="version-7/site-menu"
              alt="The top of the site menu: Create and My Library, then Explore with Gallery, Yarn Colorways and Weather Forecast."
              caption="The new site menu."
            />

            <h3 id="editing-colors-and-ranges" class="font-bold">
              Ranges are now edited right in the gauge.
            </h3>
            <DocsClip
              src="choose-ranges/change-a-range"
              alt="In the Temperature Gauge, the pointer presses the third color's To number, 20°. It opens for typing, 21 is typed, and Save is pressed. The range is now 23° → 21° with fewer days in it, and the next range starts at 21° with more."
              caption="Changing where one range ends."
            />

            <h3 id="saving" class="font-bold">Saving</h3>
            <p>
              Save a project once with <span class="italic">Save</span> in the top
              bar, and after that your changes save by themselves.
            </p>
            {#if __ACCOUNTS_ENABLED__}
              <ul class="ml-6 list-disc space-y-1">
                <li>
                  <span class="font-bold">Without an account</span>, projects
                  and palettes are saved in this browser only, as before. Copy a
                  project's link to keep a backup or to open it somewhere else.
                </li>
                <li>
                  <span class="font-bold">With an account</span>, they're also
                  saved to your account, so they're on every device you sign in
                  on. You can also publish to the gallery, star pages and post
                  to Ravelry.
                </li>
              </ul>
            {:else}
              <p>
                Projects and palettes are saved in this browser only, as before.
                Copy a project's link to keep a backup or to open it somewhere
                else.
              </p>
            {/if}

            <h3 id="gallery-projects-keep-their-weather" class="font-bold">
              Gallery projects keep their weather
            </h3>
            <p>
              Opening a copy of a project from the
              <a href="/gallery" class="link">gallery</a> now loads the weather
              it had when it was published, so you see the project as its maker
              did, even if the weather source has since changed its numbers.
              This works for pages published or updated since January 2026. If
              the project was still in progress, the days since are there to add
              with
              <span class="italic">Check for Updates</span>. {#if __ACCOUNTS_ENABLED__}
                If it's your page,
                <span class="italic">Edit Gallery Page</span> saves your project's
                latest weather to it.{/if}
            </p>

            <h3 id="and-many-smaller-changes" class="font-bold">
              And many smaller changes
            </h3>
            <p>Including:</p>
            <ul class="ml-6 list-disc space-y-1">
              <li>
                a <a href="/preferences" class="link">Preferences</a> page with theme
                previews, a default yarn that's chosen first wherever no yarn is chosen
                yet, and Reduce Motion
              </li>
              <li>
                the <a href="/gallery" class="link">Project Gallery</a> opens sorted
                by Popular (the most viewed this month, or day, week or year), shows
                how many times each project has been viewed, and shows a project's
                name above its places and dates
              </li>
              <li>
                ranges are written the same way everywhere (From → To), with
                which ends each range includes said once above them
              </li>
              <li>
                Paste Colors reads lists of color codes more forgivingly, and
                palettes can be sorted from warm to cool
              </li>
              <li>adding a color before or after another</li>
              <li>
                dialogs that open from the bottom of the screen on phones (drag
                one down to close it)
              </li>
            </ul>

            <hr class="hr my-2" />

            <h2 id="whats-removed-or-fixed" class="text-2xl font-bold">
              What's Removed or Fixed
            </h2>

            {#if __ACCOUNTS_ENABLED__}
              <h3
                id="publishing-to-the-gallery-needs-an-account"
                class="font-bold"
              >
                Publishing to the gallery needs an account
              </h3>
              <p>
                Before, anyone could send a project to the gallery. Now you'll
                need to sign in, so each page has an owner who can update it,
                hide it or take it down. Pages already in the gallery stay
                there.
              </p>
            {/if}

            <h3 id="overlapping-ranges-fixed" class="font-bold">
              Overlapping ranges, fixed
            </h3>
            <p>
              In earlier versions, if you typed in ranges that overlap, a day
              that fit two ranges took the color of the last one, instead of the
              first (highest), as the documentation says. That bug is fixed, so
              if your ranges overlap, some days in your preview may change
              color. Most projects aren't affected. Day counts still include
              every day in each range. Also fixed: with Low to High and Neither,
              a range included its To number.
              <a
                href="/documentation/gauges-and-ranges#range-calculation-methods"
                class="link">More in the documentation</a
              >.
            </p>

            <h3 id="version-6-if-you-need-it" class="font-bold">
              Version 6, if you need it
            </h3>
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

            <h2 id="your-privacy" class="text-2xl font-bold">Your Privacy</h2>
            <p>
              Your data is never sold or used for ads.{#if __ACCOUNTS_ENABLED__}
                You can download everything or delete your account at any time
                from your
                <a href="/account" class="link">Account</a> page. Gallery pages are
                public.{/if} The
              <a href="/privacy" class="link">Privacy Policy</a> has been rewritten
              to be clearer, and has the details.
            </p>

            <hr class="hr my-2" />

            <h2 id="feedback" class="text-2xl font-bold">Feedback</h2>
            <p>
              Thank you to everyone who uses the site and shares ideas; many of
              these changes came from you. If you have feedback or run into any
              issues, please let me know through the
              <a href="/contact" class="link">contact page</a>. Thank you!
            </p>
          </div>
        {/snippet}
      </Card>
      <a href="/whats-new" class="btn hover:preset-tonal-surface mt-4"
        >All What's New<ArrowRightIcon /></a
      >
    </OnThisPageLayout>
  {/snippet}
</AppShell>
