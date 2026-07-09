<!-- Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

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
  <title>Version 6: Improved Sun Position Accuracy</title>
  <meta
    name="description"
    content="Version 6: Improved Sun Position Accuracy"
  />

  <meta
    property="og:title"
    content="Version 6: Improved Sun Position Accuracy"
  />
  <meta
    property="og:description"
    content="An update to the Temperature Blanket Web App that improves the accuracy of sun position calculations, which may result in different daytime and nighttime stitch counts for some projects."
  />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}/blog/2026-07-09-version-6"
  />
  <meta property="og:type" content="website" />
  <meta
    property="og:image"
    content="{PUBLIC_BASE_URL}/images/blog-images/2026-07-09-version-6/featured-image.jpg"
  />
  <meta property="og:image:width" content="1366" />
  <meta property="og:image:height" content="768" />
</svelte:head>

<AppShell pageName="Version 6 Update: Improved Sun Position Accuracy">
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
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
              src="/images/blog-images/2026-07-09-version-6/featured-image.jpg"
              class="h-36 w-full object-cover object-center"
              alt="Version 6 banner"
            />
          </div>
        {/snippet}

        {#snippet content()}
          <div class="mb-8 flex flex-col gap-4 px-2 pb-4">
            <div class="mt-4 flex flex-col gap-2">
              <h2 class="h2 text-gradient">
                Version 6: Improved Sun Position Accuracy
              </h2>
              <p class="text-sm">July 8, 2026</p>
            </div>

            <p>
              Hello! This is Thomas, the developer of temperature-blanket.com.
              In this post I'll be sharing what's new in Version 6 of the
              Temperature Blanket Web App. It's not a big update compared to
              previous major releases, but it does include a change that may
              affect some saved projects.
            </p>

            <hr class="hr my-2" />

            <p class="font-bold text-2xl">What's in this update?</p>
            <p class="font-bold">Improved Daylight Accuracy</p>
            <p>
              Version 6 improves the accuracy of daylight times for weather data
              in the Project Planner. A dependency update to the sun position
              library (<a
                href="https://github.com/mourner/suncalc"
                class="link"
                target="_blank">SunCalc</a
              >) used in this web app results in more accurate calculations of
              sunrise and sunset times. You may not notice a difference, but now
              Daytime in the weather data is more accurate, and stitch counts
              for Daytime Rows previews are also more accurate.
            </p>

            <div class="max-w-sm flex flex-col gap-1">
              <p class="opacity-70 font-bold">
                Margin of Error for Sunrise/Sunset Times
              </p>
              <table
                class="table w-full border border-surface-200-800 overflow-auto"
              >
                <thead>
                  <tr
                    class=" bg-surface-50-950 divide-x divide-surface-200-800"
                  >
                    <th class="text-left">Version 5</th>
                    <th class="text-left">Version 6</th>
                    <th class="text-left">Improvement</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    class="bg-surface-100-900 divide-x divide-surface-200-800"
                  >
                    <td>~75 seconds</td>
                    <td>~15 seconds</td>
                    <td>~5× better</td>
                  </tr>
                </tbody>
              </table>
              <p class="text-xs italic opacity-50">
                Data from <a
                  href="https://github.com/mourner/suncalc/releases/tag/v2.0.0"
                  class="link"
                  target="_blank">SunCalc 2.0.0 release notes</a
                >
              </p>
            </div>

            <p class="font-bold">Appearance Customization</p>
            <p>
              Along with the improved sun position accuracy, Version 6
              introduces several new customization options for the web app's
              appearance. In Version 5, many of these styles were bundled
              together in a single theme, but now you can customize each aspect
              separately, such as colors, button styles, font styles, and
              spacing.
            </p>
            <div class="flex flex-col gap-1">
              <img
                src="/images/blog-images/2026-07-09-version-6/appearance-menu.png"
                alt="Appearance customization options include: colors, button styles, font styles, and spacing."
                class="max-w-90vw w-xs border rounded-container"
              />
              <p class="text-xs opacity-50">
                These settings can be found by pressing the Appearance button in
                the App Navigation menu.
              </p>
            </div>

            <hr class="hr my-2" />

            <p class="font-bold text-2xl">
              Changes That May Affect Some Saved Projects
            </p>
            <p class="font-bold">Which Projects are Affected?</p>
            <p>
              Most projects will not be affected by the Version 6 update.
              However, the following types of projects may be affected <span
                class="italic">only if fetching new weather data</span
              > (all projects saved locally with weather data are not affected):
            </p>

            <ul class="list-disc ml-8">
              <li>
                Saved projects that used a <a
                  href="/documentation#add-a-gauge"
                  class="link">Daytime Gauge</a
                >
              </li>
              <li>
                Saved projects that used the <a
                  href="/documentation#create-a-preview"
                  class="link">Daytime Rows</a
                > preview
              </li>
            </ul>

            <p>
              A quick way to determine if a project is affected is to check if
              you see the following when opening the project:
            </p>
            <div class="p-4 rounded-container border w-fit">
              <p
                class="flex w-fit flex-wrap items-center justify-center gap-1 text-left text-sm"
              >
                <!----><svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                  class="lucide-icon lucide lucide-circle-check-big text-success-900-100 size-4"
                  ><!----><path d="M21.801 10A10 10 0 1 1 17 3.335"
                  ></path><!----><path d="m9 11 3 3L22 4"
                  ></path><!----><!----></svg
                ><!----> Loaded project and weather<!----> data<!---->
              </p>
            </div>
            <p>
              If you see the <span class="italic"
                >Loaded project and weather data</span
              > notice, then the project is not affected, since it is loading locally
              saved weather data. If you need to click the Search button to get weather
              data, then the project may be affected by the Version 6 update if it
              meets either of the two criteria listed above.
            </p>

            <p class="font-bold">What are the Changes to Affected Projects?</p>
            <p>
              Affected projects' daytime data may be slightly different. This is
              because of the update for how daytime is calculated in Version 6.
            </p>

            <div class="flex flex-col gap-1">
              <p class="font-bold opacity-70">
                Difference in Daytime data from Version 5 to Version 6
              </p>

              <div class="overflow-x-auto">
                <table
                  class="table w-sm max-w-[90vw] border border-surface-200-800 overflow-auto"
                >
                  <thead>
                    <tr
                      class=" bg-surface-50-950 divide-x divide-surface-200-800"
                    >
                      <th class="text-left min-w-25">Date</th>
                      <th class="text-left">Version 5 Daytime</th>
                      <th class="text-left">Version 6 Daytime</th>
                      <th class="text-left">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      class="bg-surface-100-900 divide-x divide-surface-200-800"
                    >
                      <td>2025-01-01</td>
                      <td>5:37</td>
                      <td>5:40</td>
                      <td>3 minutes</td>
                    </tr>
                    <tr
                      class="bg-surface-50-950 divide-x divide-surface-200-800"
                    >
                      <td>2025-01-02</td>
                      <td>5:39</td>
                      <td>5:43</td>
                      <td>4 minutes</td>
                    </tr>
                    <tr
                      class="bg-surface-100-900 divide-x divide-surface-200-800"
                    >
                      <td>2025-01-03</td>
                      <td>5:42</td>
                      <td>5:45</td>
                      <td>3 minutes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="text-xs italic opacity-50">
                Example data from Anchorage, Alaska
              </p>
            </div>

            <p>
              If there is a difference in daytime, it is usually just a few
              minutes difference. Locations closer to the equator will have less
              difference in daylight (and often no difference), whereas
              locations closer to the Earth's poles will have a greater
              difference in daylight.
            </p>

            <p>
              For an affected project using the Daytime Rows preview, the stitch
              count may be slightly different. This is because the stitch count
              relies on the updated daytime data:
            </p>

            <div class="flex flex-col gap-1">
              <p class="font-bold opacity-70">
                Difference in Daytime Rows stitch count from Version 5 to
                Version 6
              </p>

              <div class="overflow-x-auto">
                <table
                  class="table w-sm max-w-[90vw] border border-surface-200-800 overflow-auto"
                >
                  <thead>
                    <tr
                      class=" bg-surface-50-950 divide-x divide-surface-200-800"
                    >
                      <th class="text-left min-w-25">Date</th>
                      <th class="text-left"
                        >Version 5 Daytime stitches (left side)</th
                      >
                      <th class="text-left"
                        >Version 6 Daytime stitches (left side)</th
                      >
                      <th class="text-left">Difference</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      class="bg-surface-100-900 divide-x divide-surface-200-800"
                    >
                      <td>2025-01-01</td>
                      <td>70</td>
                      <td>71</td>
                      <td>1 stitch</td>
                    </tr>
                    <tr
                      class="bg-surface-50-950 divide-x divide-surface-200-800"
                    >
                      <td>2025-01-02</td>
                      <td>71</td>
                      <td>71</td>
                      <td>none</td>
                    </tr>
                    <tr
                      class="bg-surface-100-900 divide-x divide-surface-200-800"
                    >
                      <td>2025-01-03</td>
                      <td>71</td>
                      <td>72</td>
                      <td>1 stitch</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="text-xs italic opacity-50">
                Example data from Anchorage, Alaska
              </p>
            </div>
            <p>
              If there is a difference in the stitch count, it is usually just a
              one-or-two-stitch difference.
            </p>

            <p class="font-bold">
              What Should I Do if my Project was Affected?
            </p>
            <div class="flex flex-col gap-1">
              <p class="font-semibold opacity-50">
                For projects using a Daytime Gauge
              </p>
              <p>
                If a saved project used a Daytime Gauge, the ranges may no
                longer accurately represent the new daytime data, since they
                were originally set (either automatically or manually) using the
                old data. <span class="font-bold"
                  >To fix this: Update the gauge ranges (either automatically or
                  manually) using the Configure Ranges button in the Colors tab.
                </span> Note that if you are currently working on the project, this
                will change your gauge ranges going forward, so you may need to update
                which yarn colorways you use for certain days. You can also choose
                to continue to use the old gauge ranges, and simply decide on-the-spot
                what color to use if you come to a day that doesn't fit into a range.
              </p>
            </div>

            <div class="flex flex-col gap-1">
              <p class="font-semibold opacity-50">
                For projects using the Daytime Rows preview
              </p>
              <p>
                If a saved project used the Daytime Rows preview, <span
                  class="font-bold"
                  >I would recommend simply using the updated stitch count for
                  your project going forward</span
                >. If you've already saved the old stitch count and want to use
                that, you can do that too. Since the difference is usually just
                one or two stitches if any, it won't make that much of a
                difference for your overall project.
              </p>
            </div>

            <p class="font-semibold opacity-50">
              Accessing the Older Version 5
            </p>
            <p>
              If you'd like to keep using the old Version 5 Project Planner,
              I've made it available as an archived site at
              <a href="https://archive-v5.temperature-blanket.com" class="link"
                >archive-v5.temperature-blanket.com</a
              >. To open your saved project, simply add
              <span class="code">archive-v5.</span>
              before the <span class="code">temperature-blanket.com</span> part of
              your saved project's URL.
            </p>

            <hr class="hr my-2" />

            <h2 class="text-2xl font-bold">Feedback</h2>
            <p>
              As always, if you have feedback of any kind, or encounter any
              issues, please let me know through any of the methods listed on
              the <a href="/contact" class="link">contact page</a>. Thank you!
            </p>
          </div>
        {/snippet}
      </Card>
    </main>
  {/snippet}
</AppShell>
