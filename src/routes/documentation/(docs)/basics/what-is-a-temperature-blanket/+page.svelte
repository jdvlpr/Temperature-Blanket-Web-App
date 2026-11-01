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

<!-- What Is a Temperature Blanket?: the idea itself, for people who've never
seen one (Basics; once a blog post, and where /info/what-is-a-temperature-blanket
goes) -->

<script lang="ts">
  import { getColorsFromInput, getTextColor } from '#lib/utils/color-utils.js';

  const colorsCode = `palette:ca2c29a4435b46203cea9d5deec06697b2dc5ea1de3271c51838971a2d46yarn:hobbii-amigo`;
  const colors = getColorsFromInput({ string: colorsCode }) || [];
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

  const patterns = [
    { src: 'chevron', name: 'Chevron' },
    { src: 'cornertocorner', name: 'Corner to Corner' },
    { src: 'squares', name: 'Squares' },
    { src: 'daylightrows', name: 'Daylight Rows' },
  ];
</script>

<p>
  A temperature blanket is a crocheted or knitted project that uses weather data
  to make a beautiful, creative and cozy work of art. Using different colors of
  yarn, it shows how the temperature of a place changes over time. Each row or
  section stands for one day, so every temperature blanket is unique.
</p>

<div
  class="bg-surface-100 dark:bg-surface-900 rounded-container grid grid-cols-1 gap-4 p-4 shadow-inner md:grid-cols-12 md:items-center md:gap-2"
>
  <figure class="order-3 col-span-full flex flex-col md:order-1 md:col-span-7">
    <img
      src="/images/blog-images/what-is-a-temperature-blanket/symea_3270.png"
      alt="A knitted temperature blanket of thin stripes: reds, oranges and purples at each end for the warm months, and blues across the middle for the cold ones"
    />
    <figcaption class="mt-2 text-sm">
      Temperature blanket by <a
        href="https://www.ravelry.com/projects/symea/temperature-blanket---temperaturdecke"
        class="link"
        target="_blank"
        rel="noopener noreferrer">symea</a
      >
    </figcaption>
  </figure>
  <p
    class="order-1 col-span-full text-center text-xl font-light text-balance md:relative md:-top-6 md:order-3 md:col-span-4"
  >
    These 366 rows of yarn are the temperature in Göppingen, Germany, from May
    15, 1943 to May 14, 1944!
  </p>
</div>

<section class="flex flex-col gap-3">
  <h2 id="yarn-colors-and-gauge" class="text-2xl font-bold">
    Yarn Colors and a Gauge
  </h2>
  <p>
    Any yarn colors can be used. Most people choose between 6 and 18 colors, but
    it's up to you. Each color is given a range of temperatures, and together
    they make a temperature gauge.
  </p>
  <div class="flex max-w-sm flex-col gap-2">
    <p class="text-sm">An example of a temperature gauge:</p>
    <div class="rounded-container flex flex-col overflow-hidden shadow-md">
      {#each colors as color, i (i)}
        {@const hex = color.hex ?? '#000000'}
        <div
          style="background:{hex}; color:{getTextColor(hex)}"
          class="flex w-full items-center justify-around py-2"
        >
          <div class="flex flex-col">
            <p class="text-xs">{color.brandName} - {color.yarnName}</p>
            <p>{color.name}</p>
          </div>
          <div class="flex gap-2">
            <div class="flex flex-col">
              <p class="text-xs">From</p>
              <p>{ranges[i][0]}°</p>
            </div>
            <div class="flex flex-col">
              <p class="text-xs">To</p>
              <p>{ranges[i][1]}°</p>
            </div>
          </div>
        </div>
      {/each}
    </div>
  </div>
</section>

<section class="flex flex-col gap-3">
  <h2 id="weather-data" class="text-2xl font-bold">Weather Data</h2>
  <p>
    People either look up the weather of days gone by, or track the temperature
    as the days go. Each day is then made in the yarn for its temperature. For
    example, with the gauge above, a day of 36° would be a row of Royal Blue.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="pattern" class="text-2xl font-bold">The Pattern</h2>
  <p>
    There are countless patterns. A typical project has one row for each day,
    but zigzags, squares, diagonals and more all work.
  </p>
  <ul class="grid grid-cols-2 items-start gap-4 md:grid-cols-4">
    {#each patterns as { src, name } (src)}
      <li>
        <figure>
          <img
            src="/images/blog-images/what-is-a-temperature-blanket/{src}.png"
            alt="A {name} temperature blanket"
          />
          <figcaption class="text-sm">{name}</figcaption>
        </figure>
      </li>
    {/each}
  </ul>
</section>

<section class="flex flex-col gap-3">
  <h2 id="variations" class="text-2xl font-bold">Variations</h2>
  <p>There are many other ways to make a temperature blanket your own:</p>
  <ul class="ml-6 list-disc space-y-1">
    <li>Other weather besides the temperature, like rain or snow</li>
    <li>Sections grouped by week or month</li>
    <li>More than one place</li>
    <li>A scarf, rug or sweater instead of a blanket!</li>
  </ul>
</section>

<section class="flex flex-col gap-3">
  <h2 id="resources" class="text-2xl font-bold">Resources</h2>
  <p>For inspiration, tips and more about temperature blankets:</p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <a class="link" href="/">temperature-blanket.com</a> (this site): get the weather,
      choose yarn colors and preview your design
    </li>
    <li>
      <a
        class="link"
        rel="noreferrer noopener"
        href="https://wunderground.com"
        target="_blank">wunderground.com</a
      >: weather data
    </li>
    <li>
      <a
        class="link"
        rel="noreferrer noopener"
        href="https://www.favecrafts.com/Crochet-Afghans/Temperature-Blanket-Ideas"
        target="_blank"
        >17 Temperature Blanket Ideas and Alternatives [FREE Patterns] from
        favecrafts.com</a
      >: inspiration and patterns
    </li>
    <li>
      <a
        class="link"
        rel="noreferrer noopener"
        href="https://docs.google.com/spreadsheets/d/1CnCpQYalbRlIYv6CNIUiJvPpzWQAXg6y_NkOaDhDhF0/edit?usp=sharing"
        target="_blank">Temp Blanket Tracker (Google Doc)</a
      >: temperature tracking, color gauges
    </li>
    <li>
      <a
        class="link"
        rel="noreferrer noopener"
        href="https://www.reddit.com/r/temperatureblanket/"
        target="_blank">reddit.com/r/temperatureblanket</a
      >: community discussion, project help, inspiration
    </li>
    <li>
      <a
        class="link"
        rel="noreferrer noopener"
        href="https://www.facebook.com/groups/272448773170943"
        target="_blank">Temperature/ Weather Blanket! Facebook Group</a
      >: community discussion, project help, inspiration
    </li>
  </ul>
</section>

<p>
  Ready to make your own? Start with
  <a href="/documentation/guides/plan-a-blanket" class="link"
    >Plan a Blanket, Start to Finish</a
  >.
</p>
