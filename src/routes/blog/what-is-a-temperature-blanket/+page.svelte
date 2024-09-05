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
  <title>What is a Temperature Blanket?</title>
  <meta name="description" content="What is a Temperature Blanket?" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1, maximum-scale=1.0, user-scalable=no"
  />
  <meta property="og:title" content="What is a Temperature Blanket?" />
  <meta property="og:description" content="What is a Temperature Blanket?" />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}/blog/what-is-a-temperature-blanket"
  />
  <meta property="og:type" content="website" />
  <meta
    property="og:image"
    content="{PUBLIC_BASE_URL}/images/blog-images/what-is-a-temperature-blanket/temperature-blanket-featured-image.png"
  />
  <meta property="og:image:width" content="3000" />
  <meta property="og:image:height" content="3650" />
</svelte:head>

<AppShell pageName="What is a Temperature Blanket?">
  <svelte:fragment slot="stickyHeader">
    <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
  </svelte:fragment>
  <main slot="main" class="pb-8">
    <a
      href="/blog"
      class="btn bg-secondary-hover-token gap-1 mb-2 max-lg:mx-2 max-lg:mt-2"
      >{@html ICONS.arrowBack} Blog</a
    >
    <Card>
      <div slot="header">
        <img
          src="/images/blog-images/what-is-a-temperature-blanket/temperature-blanket-featured-image.png"
          class="h-36 object-fit w-full"
          alt="Preview of a Temperature Blanket Project"
        />
      </div>

      <div slot="content" class="pb-4 px-2">
        <h1 class="mx-auto py-4 font-bold text-3xl font-cursive">
          What is a Temperature Blanket?
        </h1>
        <div class="flex flex-col gap-4">
          <p>
            Imagine turning weather data into a cozy and colorful work of art!
            That’s what a temperature blanket is: a crafty way to show how the
            temperature of a place changes over time. Usually one row or section
            represents each day of a year, using different yarn colors for
            different weather conditions. There are many ways to make a
            temperature blanket, but they all have one thing in common: the
            color of each section is based on meteorological events.
          </p>
          <div class="flex flex-col gap-4">
            <h3 class="font-bold text-2xl">Make a Temperature Blanket</h3>
            <p>
              For a detailed guide, read <a
                href="/blog/2024-02-09-how-to-plan-a-temperature-blanket"
                class="link">How to Plan a Temperature Blanket</a
              >. Here's a general overview:
            </p>
            <div>
              <p class="font-bold text-xl">1) Pick Your Colors</p>
              <p>
                The first step to making a temperature blanket is to decide what
                colors of yarn you want to use and what temperatures they will
                represent. You can use as many or as few colors as you like.
                Then make a temperature gauge (also called a color gauge or
                color chart) to keep track of your choices.
              </p>
            </div>
            <img
              src="/images/blog-images/what-is-a-temperature-blanket/temperature-blanket-gauge.png"
              class="w-full"
              alt="Example of a temperature gauge"
            />
            <a href="/yarn" class="btn variant-filled-primary w-fit text-token"
              >Create a Yarn Palette</a
            >
            <div>
              <p class="font-bold text-xl">2) Keep Track of the Weather</p>
              <p>
                Next, write down the temperature over time (or look up the
                weather history using the
                <a href="/" class="link">Project Planner</a>). You can use the
                average temperature of the day, the highest or lowest
                temperature, or something else, like rain or snow. You can even
                use more than one weather factor for each day to make your
                pattern more interesting. It’s up to you how or what you want to
                track; just make sure you do it consistently.
              </p>
            </div>

            <div>
              <p class="font-bold text-xl">3) Create Your Project</p>
              <p>
                When you have the weather data you need, for each day, crochet
                or knit a part of your blanket with the yarn color that matches
                that day’s temperature, based on your color gauge.
              </p>
            </div>
            <p>
              You can make any pattern you want. A typical temperature blanket
              has one row for each day, but you can also try zigzags, squares,
              diagonal designs, mix the highest and lowest temperature in the
              same part, and many other options. The sky is the limit.
            </p>
            <div class="flex flex-wrap gap-2 justify-center items-start">
              <img
                src="/images/blog-images/what-is-a-temperature-blanket/tbchevron.png"
                alt="Chevron Temperature Blanket"
                class="w-48 h-56 object-contain"
              />
              <img
                src="/images/blog-images/what-is-a-temperature-blanket/tbdaylightrows.png"
                alt="Daylight Rows Temperature Blanket"
                class="w-48 h-56 object-contain"
              />
              <img
                src="/images/blog-images/what-is-a-temperature-blanket/tbmonthrows.png"
                alt="Month Rows Temperature Blanket"
                class="w-48 h-56 object-contain"
              />
              <img
                src="/images/blog-images/what-is-a-temperature-blanket/tbsquares.png"
                alt="Squares Temperature Blanket"
                class="w-48 h-56 object-contain"
              />
            </div>
          </div>
          <div>
            <h3 class="font-bold text-lg">Variations</h3>
            <p>
              Temperature blankets are unique and completely customizable. To
              make your project, you could use any of the following principles:
            </p>
          </div>
          <ul class="ml-4">
            <li>
              - Mix in other weather events to the pattern, like rain, snow, or
              even daytime
            </li>
            <li>
              - Group or mark sections to show weeks, months, or other time
              frames
            </li>
            <li>- Put the color gauge in the project itself</li>
            <li>- Put more than one location in the pattern</li>
            <li>
              - Use the color gauge to crochet or knit something else, like a
              scarf, rug, or sweater
            </li>
          </ul>
          <h3 class="font-bold text-lg">More Resources</h3>
          <p>
            The internet is full of inspiration and tips for making temperature
            blankets. If you want to make one or learn more about them, here are
            some places to check out:
          </p>
          <ul class="ml-4 flex flex-col gap-2">
            <li>
              <a
                class="link"
                rel="noreferrer noopener"
                href="https://wunderground.com"
                target="_blank">wunderground.com</a
              > – weather data
            </li>
            <li>
              <a
                class="link"
                rel="noreferrer noopener"
                href="https://www.favecrafts.com/Crochet-Afghans/Temperature-Blanket-Ideas"
                target="_blank"
                >17 Temperature Blanket Ideas and Alternatives [FREE Patterns]
                from favecrafts.com</a
              > – inspiration and patterns
            </li>
            <li>
              <a
                class="link"
                rel="noreferrer noopener"
                href="https://docs.google.com/spreadsheets/d/1CnCpQYalbRlIYv6CNIUiJvPpzWQAXg6y_NkOaDhDhF0/edit?usp=sharing"
                target="_blank">Temp Blanket Tracker (Google Doc)</a
              > – temperature tracking, color gauges
            </li>
            <li>
              <a
                class="link"
                rel="noreferrer noopener"
                href="https://www.reddit.com/r/temperatureblanket/"
                target="_blank">reddit.com/r/temperatureblanket/</a
              > – community discussion, project help, inspiration
            </li>
            <li>
              <a
                class="link"
                rel="noreferrer noopener"
                href="https://www.facebook.com/search/groups?q=temperature%20blanket"
                target="_blank"
                >Search for <em>temperature blanket</em> Facebook groups</a
              > – community discussion, yarn alongs, project help, inspiration
            </li>
          </ul>
        </div>
      </div>
    </Card>
  </main>
</AppShell>
