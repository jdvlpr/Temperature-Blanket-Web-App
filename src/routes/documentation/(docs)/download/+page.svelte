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

<!-- Download: ExportOptions (the Project menu's Download), PdfOptions,
DownloadExportButton, ExportToGoogleSheetModal. Section ids are the old
single page's (OLD_ANCHORS). -->

<script lang="ts">
  import RelatedGuides from '#lib/components/docs/RelatedGuides.svelte';
</script>

<p>
  Take your project with you: a PDF to print, the weather as a spreadsheet, or a
  picture of the preview. Press <span class="font-bold">Project</span> at the top of
  the Project Planner, then <span class="font-bold">Download</span>, and choose one.
  The same downloads are under the weather table and the preview.
</p>

<section class="flex flex-col gap-3">
  <h2 id="download-gauges-and-weather-data-pdf" class="text-2xl font-bold">
    PDF
  </h2>
  <p>
    Your pattern, ready to print. Choose what goes in it under
    <span class="font-bold">Include</span>:
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Summary page:</span> your project, its place and
      dates, and the preview.
    </li>
    <li>
      <span class="font-bold">Colors and ranges</span> of each gauge, and the
      preview's <span class="font-bold">Additional colors</span> (border and
      accent).
    </li>
    <li>
      <span class="font-bold">Weather data:</span> a table of every day, with each
      value in the color of its range. Choose which weather to list: high, average
      and low temperatures to start with.
    </li>
  </ul>
  <p>And how it looks, under <span class="font-bold">Look</span>:</p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Colors:</span> a <span class="font-bold">List</span>
      (a row for each color) or a <span class="font-bold">Grid</span> (a card for
      each), with <span class="font-bold">Fill with color</span>,
      <span class="font-bold">Days in ranges</span> and
      <span class="font-bold">HTML color codes</span> if you want them.
    </li>
    <li>
      <span class="font-bold">Page Size:</span> US Letter or A4.
    </li>
  </ul>
  <p>
    <span class="font-bold">Your PDF will have</span> sums up your choices. Press
    <span class="font-bold">Download</span>. Your choices are remembered for next time.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="download-weather-data-csv" class="text-2xl font-bold">
    Weather Data (CSV)
  </h2>
  <p>
    Every day's weather as a spreadsheet file, for Excel, Numbers or Google
    Sheets. It's also how you <a
      href="/documentation/weather#import-weather-data"
      class="link">edit many days and import them back</a
    >. With weekly weather, it has a row for each week.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="download-google-sheet" class="text-2xl font-bold">Google Sheet</h2>
  <p>
    The weather and your gauges' colors and ranges, in a new spreadsheet in your
    Google Drive. Choose the weather and gauges to
    include, and whether to show the number of days in each range. Google asks
    you to sign in; if nothing appears, allow pop-ups for this site.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="download-preview-image-png" class="text-2xl font-bold">
    Preview Image (PNG)
  </h2>
  <p>
    A picture of the preview, to share or to keep beside you as you work. It's
    also <span class="font-bold">Download PNG</span> under the preview.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="download-palette" class="text-2xl font-bold">Palettes</h2>
  <p>
    To download or copy a gauge's colors on their own, see
    <a href="/documentation/colors-and-yarn#importexport" class="link"
      >Copy, Export and Paste Colors</a
    >.
  </p>
</section>

<RelatedGuides slugs={['print-and-track', 'move-or-back-up']} />
