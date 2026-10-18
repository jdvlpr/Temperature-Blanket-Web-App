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

<!-- Print the Pattern and Track Your Progress: PdfOptions, the CSV and
Google Sheet downloads, the preview PNG. The site has no row tracker of its
own (only Ravelry's Progress), so tracking is on paper or in a
spreadsheet. -->

<script lang="ts">
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import RelatedReference from '#lib/components/docs/RelatedReference.svelte';
</script>

<p>
  Take your pattern off the screen: a PDF to print and mark as you go, or a
  spreadsheet to tick off. Plus how to work out how much of each yarn to buy.
</p>

<section class="flex flex-col gap-3">
  <h2 id="print" class="text-2xl font-bold">Print the Pattern</h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Press <span class="font-bold">Project</span>, then
      <span class="font-bold">Download</span>, then
      <span class="font-bold">PDF</span>.
    </li>
    <li>
      Press <span class="font-bold">Customize</span>. Under
      <span class="font-bold">Include</span>, keep
      <span class="font-bold">Weather data</span> on: it's a table of every day, each
      value in the color of its yarn.
    </li>
    <li>
      Under <span class="font-bold">Look</span>, choose
      <span class="font-bold">Page Size</span> (US Letter or A4).
    </li>
    <li>Press <span class="font-bold">Download</span>, and print it.</li>
  </ol>
  <DocsShot
    src="download/pdf-options"
    alt="The Download PDF panel: Your PDF will have a summary page, the Temperature Gauge's colors and ranges as a list with days in each range, a weather table of high, average and low temperatures, on US Letter paper. Customize is open, with the Include and Look options, then Cancel and Download."
    caption="Download PDF, with Customize open."
  />
  <p>
    To save paper, list only the weather your preview uses, like just the high
    temperature.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="keep-your-place" class="text-2xl font-bold">Keep Your Place</h2>
  <p>
    The site doesn't keep track of which rows you've made, so pick what suits
    you:
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">On paper:</span> cross off each day in the PDF's weather
      table as you finish it, or keep a pencil mark at the last one.
    </li>
    <li>
      <span class="font-bold">In a spreadsheet:</span> press
      <span class="font-bold">Download</span> under the weather table, then
      <span class="font-bold">Download CSV</span>, open it in Excel, Numbers or
      Google Sheets, and add a column to tick off.
    </li>
    <li>
      <span class="font-bold">In Google Sheets directly:</span> choose
      <span class="font-bold">Google Sheet</span> in the Download menu. It makes a
      spreadsheet in your Google Drive with the weather and your colors and ranges.
    </li>
    {#if __ACCOUNTS_ENABLED__}
      <li>
        <span class="font-bold">On Ravelry:</span> post your project, and update
        its <span class="font-bold">Progress</span> from Edit Gallery Page.
        <a href="/documentation/guides/ravelry-sync" class="link"
          >Keeping Ravelry in sync</a
        >.
      </li>
    {/if}
  </ul>
  <p>
    Making it as the year goes? Download a new PDF each month for the new days.
    <a href="/documentation/guides/knit-along-all-year" class="link"
      >Crocheting or knitting along all year</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="how-much-yarn" class="text-2xl font-bold">How Much of Each Yarn</h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      In the gauge, each color shows its number of days and its share of the
      blanket. (If they're hidden, press <span class="font-bold">View</span>,
      and turn on <span class="font-bold">Days in ranges</span>.)
    </li>
    <li>
      Work out how much yarn a row (or square) takes, and multiply by each
      color's days. Add a little extra for borders and joining.
    </li>
  </ol>
  <p>
    In the PDF, turn on <span class="font-bold">Days in ranges</span> under
    <span class="font-bold">Look</span> to take the numbers to the shop.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="share-a-picture" class="text-2xl font-bold">Share a Picture</h2>
  <p>
    <span class="font-bold">Download PNG</span>, under the preview, saves it as
    a picture: for social media, a Ravelry project page, or to keep beside you
    as you work.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="if-something-goes-wrong" class="text-2xl font-bold">
    If Something Goes Wrong
  </h2>
  <h3 class="text-lg font-bold">The printed colors look off</h3>
  <p>
    Printers rarely match screens. Go by the yarn names in the PDF, not the
    printed color.
  </p>
  <h3 class="text-lg font-bold">Nothing happens with Google Sheet</h3>
  <p>
    Google asks you to sign in in a new window. Allow pop-ups for this site, and
    try again.
  </p>
  <h3 class="text-lg font-bold">The PDF is very long</h3>
  <p>
    The weather table has a row for every day. Turn off weather you don't need,
    or turn off <span class="font-bold">Weather data</span> and print the colors and
    ranges only.
  </p>
</section>

<RelatedReference slugs={['download', 'gauges-and-ranges', 'preview']} />
