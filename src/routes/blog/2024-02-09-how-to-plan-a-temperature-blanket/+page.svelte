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

<script lang="ts">
  import { PUBLIC_BASE_URL } from '$env/static/public';
  import AppLogo from '$lib/components/AppLogo.svelte';
  import AppShell from '$lib/components/AppShell.svelte';
  import Card from '$lib/components/Card.svelte';
  import { ICONS } from '$lib/constants';
  import { ArrowLeftIcon } from '@lucide/svelte';
  import { Dialog } from '@skeletonlabs/skeleton-svelte';

  let openTableOfContents = $state(false);
</script>

<svelte:head>
  <title>How to Plan a Temperature Blanket</title>
  <meta
    name="description"
    content="Using temperature-blanket.com to help you plan your crochet or knitting project."
  />

  <meta property="og:title" content="How to Plan a Temperature Blanket" />
  <meta
    property="og:description"
    content="Using temperature-blanket.com to help you plan your crochet or knitting project."
  />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}/blog/2024-02-09-how-to-plan-a-temperature-blanket"
  />
  <meta property="og:type" content="website" />
  <meta
    property="og:image"
    content="{PUBLIC_BASE_URL}/images/blog-images/2024-02-09-how-to-plan-a-temperature-blanket/og-cover.png"
  />
  <meta property="og:image:width" content="1366" />
  <meta property="og:image:height" content="768" />
</svelte:head>

<svelte:document
  onclick={(event) => {
    if (event.target.classList.contains('toc-anchor')) {
      openTableOfContents = false;
    }
  }}
/>

{#snippet tableOfContents()}
  <nav data-testid="toc" class="toc max-w-[60vw] space-y-4 p-4">
    <div class="font-bold">Table of Contents</div>
    <ul class="toc-list space-y-2">
      <li class="toc-list-item block">
        <a
          href="#the-project-blanket-scarf-socks"
          class="toc-anchor opacity-60 hover:opacity-100"
          >The Project: Blanket? Scarf? Socks?</a
        >
      </li>
      <li class="toc-list-item block">
        <a
          href="#the-place-location-location-location"
          class="toc-anchor opacity-60 hover:opacity-100"
          >The Place: Location, Location, Location</a
        >
      </li>
      <li class="toc-list-item block">
        <a
          href="#the-time-this-year-last-year-50-years-ago"
          class="toc-anchor opacity-60 hover:opacity-100"
          >The Time: This Year? Last Year? 50 Years Ago?</a
        >
      </li>
      <li class="toc-list-item block">
        <a
          href="#the-weather-whether-weather-matters"
          class="toc-anchor opacity-60 hover:opacity-100"
          >The Weather: Whether Weather Matters</a
        >
      </li>
      <li class="toc-list-item block">
        <a
          href="#the-yarn-colors-galore"
          class="toc-anchor opacity-60 hover:opacity-100"
          >The Yarn: Colors Galore</a
        >
      </li>
      <li class="toc-list-item block">
        <a
          href="#the-preview-a-sneak-peek"
          class="toc-anchor opacity-60 hover:opacity-100"
          >The Preview: A Sneak Peek</a
        >
      </li>
      <li class="toc-list-item block">
        <a
          href="#the-end-get-started"
          class="toc-anchor opacity-60 hover:opacity-100"
          >The End: Get Started!</a
        >
      </li>
    </ul>
  </nav>
{/snippet}

<AppShell pageName="">
  {#snippet stickyHeader()}
    <div class="mx-auto hidden lg:inline-flex"><AppLogo /></div>
    <div class="sm:hidden">
      <Dialog
        open={openTableOfContents}
        onOpenChange={(e) => {
          openTableOfContents = e.open;
        }}
        triggerBase="hover:preset-tonal"
        contentBase="bg-surface-50 dark:bg-surface-950 p-4 space-y-4 shadow-xl w-fit h-screen overflow-auto"
        positionerJustify="justify-end"
        positionerAlign=""
        positionerPadding=""
        transitionsPositionerIn={{ x: 480, duration: 200 }}
        transitionsPositionerOut={{ x: 480, duration: 200 }}
      >
        {#snippet trigger()}
          <div class="flex flex-wrap items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-6 w-6"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="M3 9h14V7H3zm0 4h14v-2H3zm0 4h14v-2H3zm16 0h2v-2h-2zm0-10v2h2V7zm0 6h2v-2h-2z"
              /></svg
            >

            <span class="">Content</span>
          </div>{/snippet}
        {#snippet content()}
          <div class="mb-20">
            {@render tableOfContents()}
          </div>
        {/snippet}
      </Dialog>
    </div>
  {/snippet}
  {#snippet main()}
    <main class="pb-8">
      <a
        href="/blog"
        class="btn hover:preset-tonal mb-2 max-lg:mx-2 max-lg:mt-2"
        ><ArrowLeftIcon /> Blog</a
      >
      <div class="flex gap-4 pb-4 text-left">
        <div class="flex w-full flex-col gap-8">
          <Card>
            {#snippet header()}
              <div>
                <img
                  src="/images/blog-images/2024-02-09-how-to-plan-a-temperature-blanket/cover.jpg"
                  class="h-36 w-full object-cover"
                  alt="How to Plan a Temperature Blanket"
                />
              </div>
            {/snippet}

            {#snippet content()}
              <div class="px-2 pb-4">
                <div class="flex flex-col gap-4">
                  <div class="mt-4 flex flex-col gap-2">
                    <h2 class="h2 text-gradient">
                      How to Plan a Temperature Blanket
                    </h2>
                    <p class="text-secondary-800-200 font-bold">
                      With temperature-blanket.com
                    </p>
                    <p class="text-sm">February 9, 2024</p>
                  </div>
                  <p>
                    Starting a temperature blanket can be a daunting task. Maybe
                    you're thinking of starting, but you feel overwhelmed by
                    some of these questions:
                  </p>
                  <p
                    class="preset-filled-surface-100-900 rounded-container p-4"
                  >
                    🤔
                    <span class="italic">Which colors should I pick?</span>
                    <span class="italic">How much yarn will I need?</span>
                    <span class="italic">Where do I find weather data?</span>
                    <span class="italic">What pattern should I use?</span>
                    <span class="italic"
                      >Should I have 5 or 10 degree increments?</span
                    >
                    <span class="italic"
                      >Should I use the high, average, or low temperature?</span
                    >
                    <a
                      href="/blog/what-is-a-temperature-blanket"
                      class="italic underline"
                      title="What is a Temperature Blanket?"
                      >What even is a temperature blanket?</a
                    >
                  </p>

                  <div
                    class="variant-outline-warning rounded-container flex flex-wrap items-center justify-center gap-4 p-4"
                  >
                    <img
                      src="/images/blog-images/2024-02-09-how-to-plan-a-temperature-blanket/profile.webp"
                      class="h-24 w-24 rounded-full"
                      alt="profile"
                    />
                    <p class="sm:flex-1">
                      Hello! I'm Thomas (J), the developer of
                      temperature-blanket.com, and in this guide I'll walk you
                      through using the <a href="/" class="link"
                        >Project Planner</a
                      >
                      tool on this site to hopefully remove some of the stress of
                      starting a new project. By the end, I hope you feel educated,
                      equipped, and excited to start creating!
                    </p>
                  </div>

                  <h2
                    id="the-project-blanket-scarf-socks"
                    class="text-secondary-800-200 scroll-mt-[70px] text-3xl font-bold"
                  >
                    The Project: Blanket? Scarf? Socks?
                  </h2>

                  <p>
                    Yes, it's called a temperature <span class="italic"
                      >blanket</span
                    >, but have you considered making some other weather-based
                    project? If a scarf, socks, shawl, or even a ssssnake sounds
                    more doable to you, you're free to change your idea!
                    Blankets are fantastic but can be a big commitment. Pick a
                    project you're likely to finish. The
                    <a href="/" class="link">Project Planner</a> was designed with
                    blankets in mind, but it can help you plan other weather-inspired
                    creations too.
                  </p>

                  <h2
                    id="the-place-location-location-location"
                    class="text-secondary-800-200 scroll-mt-[70px] text-3xl font-bold"
                  >
                    The Place: Location, Location, Location
                  </h2>

                  <div class="flex flex-wrap gap-4">
                    <div class="flex-1">
                      <p>
                        Ok, first step: go to
                        <a href="/" class="link">temperature-blanket.com</a>.
                        Here is the Project Planner. You'll see a bit of
                        information at the top about temperature blankets, and
                        under that a section called Location:
                      </p>
                      <img
                        class="rounded-container border-surface-100-900 my-2 h-auto max-h-fit w-full border-6 shadow-lg"
                        src="/images/blog-images/2024-02-09-how-to-plan-a-temperature-blanket/location-temperature-blanket.png"
                        alt="Location Section"
                      />
                    </div>
                    <div
                      class="preset-filled-surface-100-900 rounded-container h-fit p-4 md:basis-1/3"
                    >
                      <p>
                        🤔
                        <span class="italic">What device should I use?</span>
                      </p>
                      <p>
                        You can use the Project Planner on a mobile phone,
                        tablet, or bigger computer. I recommend using the
                        largest screen available to you.
                      </p>
                      <div class="my-4"></div>
                      <p>
                        🤔
                        <span class="italic">Is there an app?</span>
                      </p>
                      <p>
                        The website is the app. It's not in the Apple or Google
                        app store, but you can
                        <a
                          href="https://support.google.com/chrome/answer/9658361"
                          target="_blank"
                          class="link"
                          >install temperature-blanket.com like an app on your
                          device</a
                        >.
                      </p>
                    </div>
                  </div>

                  <p>
                    Enter a city, region, or landmark, and select a result from
                    the list. Great job! You're now able to press that Search
                    button and get weather data.
                  </p>

                  <h2
                    id="the-time-this-year-last-year-50-years-ago"
                    class="text-secondary-800-200 scroll-mt-[70px] text-3xl font-bold"
                  >
                    The Time: This Year? Last Year? 50 Years Ago?
                  </h2>

                  <p>
                    Wait! Before you search for weather, notice the Year, Month,
                    and Day options. The default is January 1st, last year.
                  </p>
                  <p>
                    Now, you may want to make a project using this year's
                    weather data, so you change the year to this year. Right?
                    Well, you are free to do that, but I recommend a different
                    approach.
                  </p>
                  <div class="flex flex-wrap gap-4">
                    <div class="flex flex-1 flex-col gap-4">
                      <p>
                        I recommend selecting last year or an older year—at
                        least in the beginning when you're planning your
                        project. Here's why: all the weather data for this year
                        isn't available yet, so you won't be able to fully take
                        advantage of the Project Planner if you change the date
                        to this year.
                      </p>
                      <p>
                        If you do want this year's weather data, you can always
                        come back and change the date after going through the
                        other sections of the Project Planner. All your color
                        and pattern settings are saved even if you change the
                        date later and search for new weather.
                      </p>
                    </div>
                    <div
                      class="preset-filled-surface-100-900 rounded-container h-fit w-fit p-4 md:basis-1/3"
                    >
                      <p>
                        🤔
                        <span class="italic">How far back can I go?</span>
                      </p>
                      <p>
                        It depends on the location. For some places, the oldest
                        available weather data is about 1940.
                      </p>
                    </div>
                  </div>

                  <div
                    class="preset-outlined-primary-500 rounded-container w-fit p-4"
                  >
                    <p class="font-bold">💡 Handy Hints</p>
                    <div class="ml-4">
                      <p>
                        - Choose a custom duration to make a smaller project.
                      </p>
                      <p>
                        - If you're traveling, why not add multiple locations?
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2
                      id="the-weather-whether-weather-matters"
                      class="text-secondary-800-200 scroll-mt-[70px] text-3xl font-bold"
                    >
                      The Weather: Whether Weather Matters
                    </h2>
                    <p class="text-xs">(It does)</p>
                  </div>

                  <p>
                    So you've chosen your location and dates. Hurray! Now press
                    that Search button.
                  </p>
                  <p>
                    Beep boop beep...searching...searching....wait for it...
                    Whoa! Numbers and graphs and tables! This is the Weather
                    section.
                  </p>
                  <div class="flex flex-wrap gap-4">
                    <div class="flex-1">
                      <img
                        class="rounded-container border-surface-100-900 mb-2 h-auto max-h-fit w-full border-6 shadow-lg"
                        src="/images/blog-images/2024-02-09-how-to-plan-a-temperature-blanket/weather-section.png"
                        alt="Weather Section"
                      />
                      <div class="flex flex-col gap-4">
                        <p>
                          Hey, notice those buttons at the bottom of the screen?
                          From now on, you can use those navigation buttons to
                          jump back and forth between any section of the Project
                          Planner. Want to get right into picking yarn colors?
                          Move on past the weather data by pressing the Colors
                          button!
                        </p>
                      </div>
                    </div>
                    <div
                      class="preset-filled-surface-100-900 rounded-container h-fit p-4 md:basis-1/3"
                    >
                      <p>
                        🤔
                        <span class="italic">Is the weather accurate?</span>
                      </p>
                      <p>
                        I've tried to find the highest quality and most
                        cost-effective weather sources. The data comes from
                        <a
                          href="https://open-meteo.com"
                          class="link"
                          target="_blank">Open-Meteo</a
                        >
                        and
                        <a
                          href="https://meteostat.net"
                          class="link"
                          target="_blank">Meteostat</a
                        >, and they obtain their information from a variety of
                        open sources. There is sometimes a delay of about a week
                        for recent weather data, so if something seems off,
                        check back in a few days.
                      </p>
                      <div class="my-4"></div>
                    </div>
                  </div>

                  <p>
                    You can investigate the weather info as much or as little as
                    you like. The highest and lowest temperature at the top can
                    be useful to keep in mind when you make your ranges. The
                    data here is what the Project Planner uses to generate
                    automatic ranges and a preview of your project.
                  </p>

                  <div
                    class="preset-outlined-primary-500 rounded-container w-fit p-4"
                  >
                    <p class="font-bold">💡 Handy Hints</p>
                    <div class="ml-4">
                      <p>
                        - You can download the weather data as a CSV file and
                        open it as a spreadsheet.
                      </p>
                      <p>
                        - Want to use custom weather data? Click on a cell in
                        the table to change the value, or
                        <a
                          href="/documentation#import-weather-data"
                          class="link">upload your own CSV file</a
                        >.
                      </p>
                    </div>
                  </div>

                  <h2
                    id="the-yarn-colors-galore"
                    class="text-secondary-800-200 scroll-mt-[70px] text-3xl font-bold"
                  >
                    The Yarn: Colors Galore
                  </h2>
                  <p>
                    There's a lot to cover in this section, but bear with me. If
                    you haven't already, go ahead and press the Colors button at
                    the bottom of the Project Planner.
                  </p>
                  <p>
                    If you're just getting started and don't know where to
                    begin, here's a helpful order of operation:
                  </p>
                  <div class="ml-4">
                    <p>
                      1. Choose <span class="font-bold">how many</span> colors you
                      want.
                    </p>
                    <p>
                      2. Pick <span class="font-bold">which</span> colors you want.
                    </p>
                    <p>
                      2. Assign <span class="font-bold">ranges</span> to each color.
                    </p>
                  </div>
                  <p>
                    I'll start with the first two: <span class="font-bold"
                      >how many</span
                    >
                    and
                    <span class="font-bold">which</span> colors to use. A typical
                    project uses between 7 and 15 colors (from now on I'll call them
                    colorways, since we're talking about yarn). But you are free
                    to use more or less colorways if you want. In the Project Planner,
                    there are several ways you can pick colorways:
                  </p>
                  <div class="ml-4">
                    <p>
                      <span class="font-bold">All at once</span> - use the tools
                      in the toolbar to choose how many and which colorways to use.
                    </p>
                    <img
                      class="rounded-container border-surface-100-900 my-2 h-auto max-h-fit w-full max-w-[540px] border-6 shadow-lg"
                      src="/images/blog-images/2024-02-09-how-to-plan-a-temperature-blanket/colors-toolbar.png"
                      alt="Colors Toolbar"
                    />
                  </div>
                  <div class="ml-4">
                    <p>
                      <span class="font-bold">One by one</span> - use the tools in
                      each individual colorway to change or remove it.
                    </p>
                    <div class="flex flex-wrap gap-4">
                      <img
                        class="rounded-container border-surface-100-900 my-2 h-full max-h-fit w-full max-w-64 border-6 shadow-lg"
                        src="/images/blog-images/2024-02-09-how-to-plan-a-temperature-blanket/find-matching-yarn.png"
                        alt="Find Matching Yarn"
                      />
                      <img
                        class="rounded-container border-surface-100-900 my-2 h-full max-h-fit w-full max-w-64 border-6 shadow-lg"
                        src="/images/blog-images/2024-02-09-how-to-plan-a-temperature-blanket/individual-color-tools.png"
                        alt="Find Matching Yarn"
                      />
                    </div>
                  </div>
                  <p>
                    I recommend starting with one of the all-at-once tools, and
                    then editing colorways one by one as needed. For example,
                    use the Browse Palette tool to pick a pre-made colorway
                    combination, and then change one or two colors to fit your
                    liking. Or pick all your colorways from scratch by using the
                    Choose Colorways tool, and then later you can edit
                    individual colorways if you want.
                  </p>
                  <p>
                    There are no right or wrong color choices, but here are some
                    general guidelines:
                  </p>
                  <div class="ml-4">
                    <p>
                      - Choose a brand of yarn first to help narrow down the
                      available colorway choices. You'll probably want to use
                      the same or similar yarn for all your colorways.
                    </p>
                    <p>
                      - Organize the colorways in some way. ROYGBIV (the order
                      of the rainbow) is a good place to start, but you could
                      try lightest-to-darkest, similar hues together, or based
                      on one of the combinations from the <a
                        href="https://www.canva.com/colors/color-wheel/"
                        target="_blank"
                        class="link">color wheel</a
                      >.
                    </p>
                    <p>
                      - Visit the <a href="/gallery" class="link"
                        >project gallery</a
                      > for ideas an inspiration.
                    </p>
                  </div>

                  <div
                    class="preset-outlined-primary-500 rounded-container w-fit p-4"
                  >
                    <p class="font-bold">💡 Handy Hints</p>
                    <div class="ml-4">
                      <div>
                        <p>
                          - If you know which brand and yarn you'll use, set it
                          as the default yarn when you're choosing colorways.
                          Now that yarn will be automatically selected when you
                          open other tools in the Project Planner.
                        </p>
                        <img
                          class="rounded-container border-surface-100-900 my-2 h-auto max-h-fit w-full max-w-96 border-6 shadow-lg"
                          src="/images/blog-images/2024-02-09-how-to-plan-a-temperature-blanket/default-yarn.png"
                          alt="Default Yarn"
                        />
                      </div>
                      <p>
                        - A good-looking color palette is nice, but don't get
                        too attached. You may decide to change some colorways
                        after seeing the preview of your project. That's ok!
                        Hold your colorway choices loosely until you're ready to
                        start working on your project.
                      </p>
                    </div>
                  </div>

                  <p>
                    Now for the last step regarding your colorways: <span
                      class="font-bold">assigning ranges</span
                    >. As you may know, each colorway needs to have an assigned
                    a temperature range. That'll determine which colorway is
                    used on which day of your project, based on the weather for
                    that day.
                  </p>
                  <p>
                    The Project Planner tries to help you assign ranges by
                    generating automatic ranges, and letting you adjust each
                    range if you want. Press the Customize Ranges button to get
                    started.
                  </p>
                  <div class="max-w-screen-md">
                    <img
                      class="rounded-container border-surface-100-900 my-2 border-6 shadow-lg"
                      src="/images/blog-images/2024-02-09-how-to-plan-a-temperature-blanket/ranges-configuration.png"
                      alt="Ranges Configuration"
                    />
                  </div>
                  <p>
                    On the right inside each colorway are little groups of
                    numbers. Keep an eye on those if you adjust range settings.
                    Those numbers can help you gauge relatively how much of each
                    yarn colorway you'll need for your project.
                  </p>

                  <div class="flex flex-wrap gap-4">
                    <div class="flex flex-1 flex-col gap-4">
                      <p>
                        By default, the Project Planner assumes a couple things,
                        but you can change these if you want:
                      </p>

                      <div class="ml-4">
                        <p>
                          - It assumes you want to use each colorway about the
                          same number of times.
                        </p>
                        <p>
                          - And it assumes you want to use the daily high
                          temperatures for your project.
                        </p>
                      </div>

                      <p>
                        Want to instead use the daily low temperatures? Or want
                        each range to be the same (for example 5 or 10 degree
                        increments for each colorway)? Change those settings in
                        the Setup Ranges section.
                      </p>
                    </div>
                    <div
                      class="preset-filled-surface-100-900 rounded-container h-fit p-4 md:basis-1/2"
                    >
                      <p>
                        🤔
                        <span class="italic"
                          >Why do the ranges repeat values?</span
                        >
                      </p>
                      <p>
                        By default, a colorway's To value is the same as the
                        next colorway's From value. This is because a
                        temperature counts as inside a range if it is
                        <span class="italic">greater than-or-equal</span>
                        to the From value and
                        <span class="italic">less-than-and-not-equal-to</span>
                        the To value. If those numbers didn't repeat, a temperature
                        that falls in between wouldn't be in any range. If you want
                        more details,
                        <a
                          href="https://www.reddit.com/r/temperatureblanket/comments/10mliw0/if_a_gauge_says_1115_red_then_1620_blue_which/"
                          class="link"
                          target="_blank"
                          >read this survey and discussion about it</a
                        >. It's also possible to change the
                        <a
                          href="/documentation#range-calculation-methods"
                          class="link">Range Calculation Method</a
                        >.
                      </p>
                    </div>
                  </div>
                  <p>
                    How you adjust the ranges will affect what your project
                    preview looks like. Don't worry, you don't have to finalize
                    all your ranges right now. You can always come back to the
                    Colors section and adjust the ranges.
                  </p>

                  <div
                    class="preset-outlined-primary-500 rounded-container w-fit p-4"
                  >
                    <p class="font-bold">💡 Handy Hints</p>
                    <div class="ml-4">
                      <p>
                        - If you change the Balance Focus setting, you probably
                        also want to adjust the preview to use the same weather
                        parameter in the Preview section.
                      </p>

                      <p>
                        - Want to represent more than just temperatures in your
                        project? Try making a gauge for rainfall, snowfall, or
                        daytime at the top of the Colors section.
                      </p>
                    </div>
                  </div>

                  <h2
                    id="the-preview-a-sneak-peek"
                    class="text-secondary-800-200 scroll-mt-[70px] text-3xl font-bold"
                  >
                    The Preview: A Sneak Peek
                  </h2>

                  <p>
                    Now is a good time to press the Preview button at the bottom
                    of the Project Planner. This is the final (and probably the
                    most fun) section.
                  </p>
                  <p>
                    These are the options for the different kinds of layouts the
                    Project Planner can show you.
                  </p>
                  <img
                    class="rounded-container border-surface-100-900 my-2 h-auto max-h-fit w-full max-w-md border-6 shadow-lg"
                    src="/images/blog-images/2024-02-09-how-to-plan-a-temperature-blanket/preview.png"
                    alt="Preview"
                  />
                  <p>
                    Each layout is unique and customizable. Select a different
                    one at any time to change the preview. Some layouts can be
                    adjusted to be smaller, larger, or different dimensions.
                    Some let you use the high, average, or low daily
                    temperatures in different parts of the pattern.
                  </p>

                  <div
                    class="preset-outlined-primary-500 rounded-container w-fit p-4"
                  >
                    <p class="font-bold">💡 Handy Hints</p>
                    <div class="ml-4">
                      <p>
                        - Tap or click on the preview image to see more details.
                      </p>
                      <p>
                        -
                        <a href="/documentation#save-project" class="link"
                          >Save your project</a
                        >
                        or
                        <a href="//documentation#share-to-gallery" class="link"
                          >share it to the gallery</a
                        >
                        so you don't loose your work.
                      </p>
                    </div>
                  </div>

                  <div class="flex flex-wrap gap-4">
                    <div class="flex flex-1 flex-col gap-4">
                      <p>
                        Seeing and adjusting the preview can help you make
                        decisions before you start your project. You may decide
                        you want to use different yarn colorways, or you may
                        decide you want to record the daily low instead of the
                        daily high temperature. You may want to go back to the
                        Colors section and adjust the ranges. Go ahead! Nobody
                        is stopping you.
                      </p>

                      <p>
                        Have fun exploring and customizing your project. You can
                        jump between the Colors section and the Preview section
                        to see how tweaking the colorways and ranges changes the
                        preview.
                      </p>
                    </div>
                    <div
                      class="preset-filled-surface-100-900 rounded-container h-fit p-4 md:basis-1/2"
                    >
                      <p>
                        🤔
                        <span class="italic"
                          >Where's the pattern I should follow?</span
                        >
                      </p>
                      <p>
                        The Project Planner doesn't give you a specific pattern
                        to follow. You can search the internet to find that
                        elsewhere. Instead the preview is meant to give you a
                        general idea of what your project could look like, and
                        to help you decide which colorways and ranges to use.
                      </p>
                    </div>
                  </div>

                  <h2
                    id="the-end-get-started"
                    class="text-secondary-800-200 scroll-mt-[70px] text-3xl font-bold"
                  >
                    The End: Get Started!
                  </h2>
                  <p>
                    When you're happy with the colorway and layout choices,
                    you're ready to start making your project! Gather your yarn
                    and get creating! It's always a good idea to make a test
                    swatch to see if you want to adjust the size or dimensions
                    of your project.
                  </p>

                  <div
                    class="preset-outlined-primary-500 rounded-container w-fit p-4"
                  >
                    <p class="font-bold">💡 Handy Hint</p>
                    <div class="">
                      <p>
                        <a
                          href="/documentation#download-gauges-and-weather-data-pdf"
                          class="link">Download the PDF</a
                        >
                        to follow along with as you make your project. It contains
                        a temperature gauge with your colorways and ranges, the daily
                        weather data, and it tells you which colorways to use on
                        which days.
                      </p>
                    </div>
                  </div>

                  <p>
                    Well, that's it! I hope you have a better understanding of
                    how to plan a temperature blanket using the Project Planner
                    on temperature-blanket.com. And I hope it takes some of the
                    stress out of thinking about starting your project.
                  </p>
                  <p>
                    If there's anything you think I missed, or something you'd
                    like to see more details about in this guide, send me an
                    email at hello@temperature-blanket.com.
                  </p>

                  <div
                    class="rounded-container preset-tonal-tertiary border-tertiary-500 flex flex-col gap-4 border p-4"
                  >
                    <p>
                      🎥 Are you a video creator? Let's collaborate! Make a
                      video tutorial based on this post and I'd love to feature
                      it. Contact me at hello@temperature-blanket.com or at <a
                        href="https://facebook.com/temperatureblanket"
                        class="link"
                        target="_blank">facebook.com/temperatureblanket</a
                      >.
                    </p>
                  </div>
                </div>
              </div>
            {/snippet}
          </Card>
        </div>
        <div
          class="sticky top-16 hidden h-auto w-1/5 min-w-[200px] self-start sm:inline-block"
        >
          <div class="max-h-[90svh] overflow-auto pb-20">
            {@render tableOfContents()}
          </div>
        </div>
      </div>
    </main>
  {/snippet}
</AppShell>
