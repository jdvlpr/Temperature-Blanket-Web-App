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
  import { getColorsFromInput, getTextColor } from '$lib/utils';

  const colorsCode = `palette:ca2c29a4435b46203cea9d5deec06697b2dc5ea1de3271c51838971a2d46yarn:hobbii-amigo`;
  const colors = getColorsFromInput({ string: colorsCode });
  const ranges = [
    [96, 76],
    [76, 71],
    [71, 66],
    [66, 62],
    [62, 57],
    [57, 49],
    [49, 42],
    [42, 38],
    [38, 35],
    [35, 4],
  ];
</script>

<svelte:head>
  <title>What is a Temperature Blanket?</title>
  <meta
    name="description"
    content="Find out more about beautiful and creative yarn projects based on weather data."
  />

  <meta property="og:title" content="What is a Temperature Blanket?" />
  <meta
    property="og:description"
    content="Find out more about beautiful and creative yarn projects based on weather data."
  />
  <meta
    property="og:url"
    content="{PUBLIC_BASE_URL}/blog/what-is-a-temperature-blanket"
  />
  <meta property="og:type" content="website" />
  <meta
    property="og:image"
    content="{PUBLIC_BASE_URL}/images/blog-images/what-is-a-temperature-blanket/temperature-blanket-featured-image.png"
  />
  <meta property="og:image:width" content="986" />
  <meta property="og:image:height" content="1200" />
</svelte:head>

<AppShell pageName="What is a Temperature Blanket?">
  {#snippet stickyHeader()}
    <div class="hidden lg:inline-flex mx-auto"><AppLogo /></div>
  {/snippet}
  {#snippet main()}
    <main class="pb-8">
      <a
        href="/blog"
        class="btn hover:preset-tonal gap-1 mb-2 max-lg:mx-2 max-lg:mt-2"
        >{@html ICONS.arrowBack} Blog</a
      >
      <Card>
        {#snippet header()}
          <div>
            <img
              src="/images/blog-images/what-is-a-temperature-blanket/temperature-blanket-featured-image.png"
              class="h-36 object-fit w-full"
              alt="Preview of a Temperature Blanket Project"
            />
          </div>
        {/snippet}

        {#snippet content()}
          <div class="pb-4 px-2">
            <h2 class="mx-auto py-4 h2 text-gradient">
              What is a Temperature Blanket?
            </h2>
            <div class="flex flex-col gap-4">
              <p>
                A temperature blanket is a crocheted or knit project which uses
                weather data to create a beautiful, creative, and cozy work of
                art! Using various colors of yarn, it shows how the temperature
                of a place changes over time. Each row or section of a
                temperature blanket represents a different day of the year.
                Temperature blankets are unique and completely customizable.
              </p>

              <div
                class="grid grid-cols-1 md:grid-cols-12 md:items-center gap-4 md:gap-2 my-4 bg-surface-100-900 rounded-container p-4 shadow-inner"
              >
                <div
                  class="order-3 md:order-1 col-span-full md:col-span-7 flex flex-col"
                >
                  <img
                    src="/images/blog-images/what-is-a-temperature-blanket/symea_3270.png"
                    alt="Example of a temperature blanket"
                    class=""
                  />
                  <p class="col-span-full text-sm mt-2">
                    Temperature blanket by <a
                      href="https://www.ravelry.com/projects/symea/temperature-blanket---temperaturdecke"
                      class="link"
                      target="_blank">symea</a
                    >
                  </p>
                </div>

                <p
                  class="order-1 md:order-3 text-xl font-light col-span-full md:col-span-4 text-center md:-top-6 md:relative text-balance"
                >
                  These 366 rows of yarn represent the temperature in Göppingen,
                  Germany from May 15, 1943 to May 14, 1944!
                </p>
              </div>

              <p>
                Want help making your own temperature blanket? See <a
                  href="/blog/2024-02-09-how-to-plan-a-temperature-blanket"
                  class="link">How to Plan a Temperature Blanket</a
                >.
              </p>

              <div class="flex flex-col gap-4">
                <div class="">
                  <p class="font-bold text-lg">Yarn Colors & Gauge</p>
                  <p>
                    Any yarn colors can be used to create a temperature blanket.
                    Usually, people choose between 6 and 18 different colors of
                    yarn, but the number of colors is totally up to the
                    individual making the project. Each color is then assigned a
                    temperature range, making what is called a temperature
                    gauge.
                  </p>
                </div>

                <div class="flex flex-col gap-2 max-w-sm">
                  <p class="text-sm">Example of a temperature gauge:</p>
                  <div
                    class="flex flex-col rounded-container overflow-hidden shadow-md"
                  >
                    {#each colors as { hex, brandName, yarnName, name }, _i}
                      {@const textColor = getTextColor(hex)}
                      <div
                        style="background:{hex}; color:{textColor}"
                        class="w-full py-2 flex items-center justify-around"
                      >
                        <div class="col-span-1 flex flex-col">
                          <p class="text-xs">{brandName} - {yarnName}</p>
                          <p>{name}</p>
                        </div>
                        <div class="col-span-1 flex gap-2">
                          <div class="flex flex-col">
                            <p class="text-xs">From</p>
                            <p>{ranges[_i][0]}°</p>
                          </div>
                          <div class="flex flex-col">
                            <p class="text-xs">To</p>
                            <p>{ranges[_i][1]}°</p>
                          </div>
                        </div>
                      </div>
                    {/each}
                  </div>
                </div>

                <div>
                  <p class="font-bold text-lg">Weather Data</p>
                  <p>
                    People either get historical weather data or track the
                    current temperature over time. Then the yarn corresponding
                    to each day's temperature is used in it's place in the
                    project. For example, if the day's temperature is 36°, then
                    according to the temperature gauge above, the Royal Blue
                    yarn would be used for that day's row in the temperature
                    blanket.
                  </p>
                </div>

                <div>
                  <p class="font-bold text-lg">Project Pattern</p>
                  <p>
                    There are countless options for a temperature blanket
                    pattern. A typical project has one row for each day, but
                    zigzags, squares, diagonal designs, or other patterns can be
                    used.
                  </p>
                </div>

                <div class="flex flex-col gap-2">
                  <p class="text-sm">
                    Examples of different types of patterns:
                  </p>
                  <div
                    class="grid grid-cols-2 md:grid-cols-4 gap-4 items-start"
                  >
                    <div>
                      <img
                        src="/images/blog-images/what-is-a-temperature-blanket/chevron.png"
                        alt="Chevron Temperature Blanket"
                        class=""
                      />
                      <p class="text-sm">Chevron Pattern</p>
                    </div>
                    <div>
                      <img
                        src="/images/blog-images/what-is-a-temperature-blanket/cornertocorner.png"
                        alt="Corner to Corner Temperature Blanket"
                        class=""
                      />
                      <p class="text-sm">Corner to Corner Pattern</p>
                    </div>
                    <div>
                      <img
                        src="/images/blog-images/what-is-a-temperature-blanket/squares.png"
                        alt="Squares Temperature Blanket"
                        class=""
                      />
                      <p class="text-sm">Squares Pattern</p>
                    </div>
                    <div>
                      <img
                        src="/images/blog-images/what-is-a-temperature-blanket/daylightrows.png"
                        alt="Daylight Rows Temperature Blanket"
                        class=""
                      />
                      <p class="text-sm">Daylight Rows Pattern</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 class="font-bold text-lg">Variations</h3>
                <p>
                  There are many other ways to customize a temperature blanket:
                </p>
              </div>

              <ul class="ml-4 flex flex-col gap-2">
                <li>
                  - Other weather events besides the temperature, like rain or
                  snow, incorporated into the design
                </li>
                <li>- Sections grouped by weeks or months</li>
                <li>- More than one location</li>
                <li>- A scarf, rug, or sweater instead of a blanket!</li>
              </ul>

              <div>
                <h3 class="font-bold text-lg">Resources</h3>
                <p>
                  Here are some resources for inspiration, tips, and more
                  information about temperature blankets:
                </p>
              </div>

              <ul class="ml-4 flex flex-col gap-2">
                <li>
                  <a class="link" href="/" target="_blank"
                    >temperature-blanket.com</a
                  > (this site) - get weather data, choose yarn colors, and preview
                  your design
                </li>
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
                    >17 Temperature Blanket Ideas and Alternatives [FREE
                    Patterns] from favecrafts.com</a
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
                    href="https://www.facebook.com/groups/272448773170943"
                    target="_blank"
                    >Temperature/ Weather Blanket! Facebook Group</a
                  > – community discussion, project help, inspiration
                </li>
              </ul>

              <p>
                Want help making your own temperature blanket? See <a
                  href="/blog/2024-02-09-how-to-plan-a-temperature-blanket"
                  class="link">How to Plan a Temperature Blanket</a
                >.
              </p>
            </div>
          </div>
        {/snippet}
      </Card>
    </main>
  {/snippet}
</AppShell>
