<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 5 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script>
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Card from '$lib/components/Card.svelte';
  import { ArrowLeftIcon, ArrowRightIcon } from '@lucide/svelte';
</script>

<svelte:head>
  <title>Version 5: Refreshed & Rebuilt</title>
  <meta name="description" content="Version 5: Refreshed & Rebuilt" />

  <meta property="og:title" content="Version 5: Refreshed & Rebuilt" />
  <meta property="og:description" content="Version 5: Refreshed & Rebuilt" />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}/blog/2025-03-20-version-5"
  />
  <meta property="og:type" content="website" />
  <meta
    property="og:image"
    content="{PUBLIC_BASE_URL}/images/blog-images/2025-03-20-version-5/featured-image.png"
  />
  <meta property="og:image:width" content="1366" />
  <meta property="og:image:height" content="768" />
</svelte:head>

<AppShell pageName="Version 5: Refreshed & Rebuilt">
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main class="pb-8">
      <a
        href="/blog"
        class="btn hover:preset-tonal mb-2 max-lg:mx-2 max-lg:mt-2"
        ><ArrowLeftIcon /> Blog</a
      >
      <Card>
        {#snippet header()}
          <div>
            <img
              src="/images/blog-images/2025-03-20-version-5/featured-image.png"
              class="h-36 w-full object-cover object-left-bottom"
              alt="Version 5 banner"
            />
          </div>
        {/snippet}

        {#snippet content()}
          <div class="mb-8 flex flex-col gap-4 px-2 pb-4">
            <div class="mt-4 flex flex-col gap-2">
              <h2 class="h2 text-gradient">Version 5: Refreshed & Rebuilt</h2>
              <p class="text-sm">March 20, 2025</p>
            </div>

            <p>
              Hello! This is Thomas, the developer of temperature-blanket.com.
              I'm thrilled to announce a new version of this web app, released
              March 20, 2025. This update features a refreshed design and
              several new and improved features. Behind the scenes, the code has
              been almost completely rewritten in order to take advantage of the
              latest web technologies. There are no breaking changes—projects
              created using earlier versions can still be opened and edited with
              the new version—but I think it is a significant enough update to
              justify a new major release: version 5!
            </p>

            <p>
              Thanks to those of you who tested the version 5 beta (<a
                class="link"
                href="https://github.com/jdvlpr/Temperature-Blanket-Web-App/discussions/5"
                target="_blank">see the announcement</a
              >) and provided feedback before this update! Thanks as well to
              generous
              <a href="/supporters" class="link">supporters like you!</a>
            </p>

            <hr class="hr my-2" />

            <h2 class="text-2xl font-bold">Updated Design</h2>
            <p class="font-bold">Logo</p>
            <p>
              The first thing you might notice is a new logo, along with a new
              heading font:
            </p>

            <img
              src="/images/blog-images/2025-03-20-version-5/version-5-logo-update.png"
              alt="new version 5 logo compared to old version 4 logo"
              class="max-w-screen-sm"
            />

            <p>
              The colors in the logo are inspired by yarn colorways from one of
              the most popular project gallery pages: <a
                href="/gallery/14729"
                class="link"
                target="_blank"
                >The Hague, South Holland, The Netherlands from 1/1/2023 to
                12/31/2023
              </a>. Thanks to the user who created the beautiful project preview
              and yarn palette!
            </p>

            <p class="font-bold">Icons & Components</p>

            <p>
              Along with a new logo, this update includes updated icons with
              consistent line-widths, redesigned components such as inputs,
              buttons, and toggles with improved usability, and a few other
              subtle visual changes throughout the site.
            </p>

            <hr class="hr my-2" />

            <h2 class="text-2xl font-bold">New Features</h2>

            <p class="font-bold">Move Gauge Colors</p>

            <p>
              You can now move a gauge color by dragging it. This was only
              possible before in a gauge by using the sort button or the smaller
              palette preview.
            </p>

            <img
              src="/images/blog-images/2025-03-20-version-5/move-colors.png"
              alt="showing how to move colorways"
              class="mb-4 max-w-[500px]"
            />

            <p class="font-bold">Search Ahead & Location Details</p>

            <p>
              When searching for a location, you don't have to type the entire
              name any more. For example, now typing <span class="code"
                >Sea</span
              >
              brings up
              <span class="code">Seattle, Washington, United States</span>. You
              can also click the details button under the location to view
              latitude, longitude, type of location, and population details, if
              available.
            </p>

            <p class="font-bold">Other New Features</p>

            <ul class="ml-2 list-inside list-disc">
              <li>A fullscreen editor for palettes</li>

              <li>
                Click-to-copy yarn names and hex codes in the
                <a
                  href="https://next.temperature-blanket.com/yarn-colorway-finder"
                  class="link"
                >
                  Yarn Colorway Finder</a
                >
              </li>

              <li>Inline color details in the weather data table</li>

              <li>
                Cycle through Light <ArrowRightIcon
                  class="relative -top-[1px] inline size-4"
                /> Dark
                <ArrowRightIcon class="relative -top-[1px] inline size-4" /> System
                themes by using the keyboard shortcut
                <span class="kbd">t</span> on any page
              </li>
            </ul>

            <p class="font-bold">Depreciated Feature</p>

            <p>
              The one feature that has been removed in version 5 is the option
              to always display all sections of the Project Planner at once. It
              was removed because it caused some performance issues, and I think
              it was a rarely used feature.
            </p>

            <hr class="hr my-2" />

            <h2 class="text-2xl font-bold">Code Overhaul</h2>

            <h2 class="font-bold">
              Svelte 4 <ArrowRightIcon
                class="relative -top-[1px] inline size-4"
              /> 5
            </h2>
            <p>
              Almost all code has been affected in some way by an update from <a
                href="https://svelte.dev/"
                class="link"
                target="_blank">Svelte</a
              >
              4 to 5. There are
              <a
                href="https://github.com/jdvlpr/Temperature-Blanket-Web-App/compare/main...next"
                target="_blank"
                class="link"
                >more than 280 changed files with more than 26,000 additions and
                24,100 deletions</a
              >. The web app benefits from improved performance that comes with
              Svelte 5. I've also found the developer experience improved, which
              will hopefully lead to easier maintenance and better features.
            </p>

            <h2 class="font-bold">
              Skeleton 2 <ArrowRightIcon
                class="relative -top-[1px] inline size-4"
              /> 3
            </h2>
            <p>
              Components and styles are rewritten to use <a
                href="https://www.skeleton.dev"
                class="link"
                target="_blank">Skeleton 3</a
              >. This includes new spacing features for themes, richer theme
              colors, and improved accessibility. Special thanks to the Skeleton
              team for their hard work on their version 3 release! This site
              benefits greatly from their efforts.
            </p>

            <hr class="hr my-2" />

            <h2 class="text-2xl font-bold">Upcoming Features</h2>
            <p>
              There are several new features planned for upcoming versions of
              this site. Thanks to those of you who have contributed your ideas!
              You can visit the <a
                href="https://github.com/jdvlpr/Temperature-Blanket-Web-App/discussions/categories/ideas"
                class="link"
                target="_blank">ideas discussions on GitHub</a
              >
              to see what might be coming up. You're welcome to also share your own
              new ideas, questions, or thoughts by opening a
              <a
                href="https://github.com/jdvlpr/Temperature-Blanket-Web-App/discussions/new/choose"
                class="link"
                target="_blank">new GitHub discussion</a
              >.
            </p>

            <hr class="hr my-2" />

            <h2 class="text-2xl font-bold">Feedback</h2>
            <p>
              As always, if you have feedback of any kind, or encounter any
              issues, please let me know through any of the methods listed on
              the <a href="/contact" class="link">contact page</a>. Thank you to
              those of you who have already provided feedback! I look forward to
              hearing from you.
            </p>
          </div>
        {/snippet}
      </Card>
    </main>
  {/snippet}
</AppShell>
