<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

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
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Card from '$lib/components/Card.svelte';
  import { ICONS } from '$lib/constants';
</script>

<svelte:head>
  <title>Version 3: Unified Site Design</title>
  <meta name="description" content="Version 3: Unified Site Design" />

  <meta property="og:title" content="Version 3: Unified Site Design" />
  <meta property="og:description" content="Version 3: Unified Site Design" />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}/blog/2023-12-19-version-3-unified-site-design"
  />
  <meta property="og:type" content="website" />
  <meta
    property="og:image"
    content="{PUBLIC_BASE_URL}/images/blog-images/2023-12-19-version-3-unified-site-design/featured-image.png"
  />
  <meta property="og:image:width" content="1366" />
  <meta property="og:image:height" content="768" />
</svelte:head>

<AppShell pageName="Version 3 Update">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main class="pb-8">
      <a
        href="/blog"
        class="btn preset-tonal-secondary gap-1 mb-2 max-lg:mx-2 max-lg:mt-2"
        >{@html ICONS.arrowBack} Blog</a
      >
      <Card>
        {#snippet header()}
          <div>
            <img
              src="/images/blog-images/2023-12-19-version-3-unified-site-design/featured-image.png"
              class="h-36 object-cover w-full"
              alt="Version 3"
            />
          </div>
        {/snippet}

        {#snippet content()}
          <div class="pb-4 px-2">
            <div class="flex flex-col gap-4">
              <div class="mt-4 flex flex-col gap-2">
                <h1 class=" font-bold text-3xl">
                  Version 3: Unified Site Design
                </h1>
                <p class="text-sm">December 19, 2023</p>
              </div>
              <p>
                Thanks to the support of people like you, on December 18th, 2023
                version 3 of temperature-blanket.com was released!
              </p>
              <p>
                Version 3 is all about unifying the experience of using
                temperature-blanket.com. Everything should act and feel
                integrated and intuitive. The update includes a complete
                overhaul of the project gallery and gallery pages, a new sidebar
                menu for easy access to different features of the site, improved
                navigation between pages, and improved sharing capabilities.
              </p>

              <h2 class="font-bold text-lg">Updated Project Gallery Pages</h2>
              <p>
                Hundreds of user-created projects have been shared to the <a
                  href="/gallery"
                  class="link">Project Gallery</a
                >
                since it opened in June, 2022. Previously, all the project gallery
                pages were hosted on a separate website (formerly at temperature-blanket.com/info).
                In version 3, the separate site is gone and instead project gallery
                pages are integrated into the main site. So now project gallery pages
                look and feel like the rest of the site. All the old project gallery
                pages will automatically be redirected to their new addresses.
              </p>
              <p>For example, an old project url like this:</p>
              <p class="ml-4 code w-fit whitespace-pre-wrap">
                www.temperature-blanket.com/info/project/123/my-saved-project
              </p>
              <p>is now:</p>
              <p class="ml-4 code w-fit whitespace-pre-wrap">
                temperature-blanket.com/gallery/123
              </p>
              <p>
                There are two benefits to this change. First, the project
                gallery pages look better. They can take advantage of whatever
                theme you've chosen, and they act like a first-class citizen of
                the site. The other benefit is that they are easier to maintain.
                I don't have to maintain two separate sites.
              </p>
              <h2 class="font-bold text-lg">
                Improved Navigation Between Pages
              </h2>
              <p>
                There's a new site-wide menu for switching between different
                tools and pages. On smaller screens open the top menu, and on
                bigger screens you can easily show or hide the navigation
                sidebar on the left. Switching between pages is also now faster
                and smoother.
              </p>

              <h2 class="font-bold text-lg">
                Easily Share a Yarn Palette, Colorway Search, or Weather
                Forecast Page
              </h2>
              <p>
                In the Yarn Colorway Finder, Yarn Palette Creator, or Weather
                Forecast tools, click the share icon at the top of the page to
                get a shareable link to that page.
              </p>
              <h2 class="font-bold text-lg">
                Bug Fixes, Performance Improvements, and More
              </h2>
              <p>
                Version 3 includes dozens of other small changes and
                improvements. It's faster and more stable. Supporters are also
                featured on the <a href="/supporters" class="link">Supporters</a
                > page.
              </p>

              <p>
                I'm grateful for your support to continue improving this service
                for people all around the world. If you have any questions or
                issues with version 3 of the site, feel free to email me at
                hello@temperature-blanket.com.
              </p>
            </div>
          </div>
        {/snippet}
      </Card>
    </main>
  {/snippet}
</AppShell>
