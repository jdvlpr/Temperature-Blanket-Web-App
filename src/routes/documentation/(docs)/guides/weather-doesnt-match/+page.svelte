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

<!-- Weather Doesn't Match My Thermometer (from the FAQ's "Why does the
weather change, or look wrong?"). When saved weather is kept: a project's
weather loads from storage only if every day had passed when it was
created, or the weather is Custom (storage/projects.svelte.ts); a search
replaces it. So keeping weather fixed means importing it (Custom). -->

<script lang="ts">
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import RelatedReference from '#lib/components/docs/RelatedReference.svelte';
  import {
    METEOSTAT_DELAY_DAYS,
    OPEN_METEO_DELAY_DAYS,
  } from '#lib/constants/weather-constants.js';
</script>

<p>
  Your thermometer says 18°, the Project Planner says 16°. Neither is wrong:
  they're measuring different things. Here's why, and how to use the numbers you
  trust.
</p>

<section class="flex flex-col gap-3">
  <h2 id="why" class="text-2xl font-bold">Why It's Different</h2>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">It's for an area, not your garden.</span> Weather services
      work out the weather over an area of several kilometers, or use the stations
      nearest to it. Hills, water, towns and a sunny wall all change what your own
      thermometer reads.
    </li>
    <li>
      <span class="font-bold">The newest days aren't settled.</span> Services can
      take up to a week to finish the latest days, so they can change after you first
      look.
    </li>
    <li>
      <span class="font-bold">Past days get corrected.</span> Now and then a service
      improves its data, and older days change a little.
    </li>
  </ul>
</section>

<section class="flex flex-col gap-3">
  <h2 id="try-another-source" class="text-2xl font-bold">
    Try Another Weather Source
  </h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Press <span class="font-bold">Weather Source</span> above the weather.
    </li>
    <li>
      Choose <span class="font-bold">Meteostat</span> for measurements from real
      weather stations near your place, or another
      <span class="font-bold">Open-Meteo</span> model.
    </li>
    <li>
      Press <span class="font-bold">Save and Search</span>, and compare.
    </li>
  </ol>
  <p>
    See what each source and model is in
    <a href="/documentation/weather#weather-sources" class="link"
      >Weather Sources</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="fix-a-few-days" class="text-2xl font-bold">Fix a Few Days</h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Make sure <span class="font-bold">Grouping</span> is
      <span class="font-bold">Daily</span>.
    </li>
    <li>
      In the table under the chart, press the number you want to change. A box
      opens with that day's value.
    </li>
    <li>
      Type your reading (or use the +1, −1… buttons), then press
      <span class="font-bold">Save</span>.
    </li>
  </ol>
  <DocsShot
    src="weather/edit-day"
    alt="The box for changing one day's weather: 2025-01-01, High Temperature (°C) 11.8, buttons to add or take away 1, 5 or 20, and Cancel and Save."
    caption="Changing one day's high."
  />
</section>

<section class="flex flex-col gap-3">
  <h2 id="use-your-own-readings" class="text-2xl font-bold">
    Use Your Own Readings for Every Day
  </h2>
  <p>
    If you've kept a log, from your own thermometer or a weather station nearby,
    bring it all in at once:
  </p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Press <span class="font-bold">Download</span> under the table, then
      <span class="font-bold">Download CSV</span>.
    </li>
    <li>
      Open the file in Excel, Numbers or Google Sheets. Put your readings in
      place of the ones there, keeping the dates and the column headings, and
      save it as CSV.
    </li>
    <li>
      Press <span class="font-bold">Import Weather Data</span>, and choose your
      file.
    </li>
  </ol>
  <p>
    What the file needs is in
    <a
      href="/documentation/weather#import-weather-data-file-requirements"
      class="link">CSV File Requirements</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="keep-it-from-changing" class="text-2xl font-bold">
    Keep the Weather From Changing
  </h2>
  <p>
    Weather you've edited or imported is yours: it's saved with the project and
    never looked up again. So to keep the weather exactly as it is today, even
    if the service changes it later:
  </p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Wait until your last day is about {OPEN_METEO_DELAY_DAYS} days ago with Open-Meteo,
      or {METEOSTAT_DELAY_DAYS} with Meteostat, so it's settled.
    </li>
    <li>
      Press <span class="font-bold">Download</span> under the table, then
      <span class="font-bold">Download CSV</span>.
    </li>
    <li>
      Press <span class="font-bold">Import Weather Data</span>, and choose that
      same file, without changing it.
    </li>
  </ol>
  <p>
    The weather source now shows <span class="font-bold">Custom</span>. Keep the
    file too: it's a copy of your weather to send someone, or to import again.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="if-something-goes-wrong" class="text-2xl font-bold">
    If Something Goes Wrong
  </h2>
  <h3 class="text-lg font-bold">I can't edit or import</h3>
  <p>
    Weekly weather can't be edited. Set <span class="font-bold">Grouping</span>
    to
    <span class="font-bold">Daily</span> first.
  </p>
  <h3 class="text-lg font-bold">Some rows were skipped</h3>
  <p>
    The import lists the rows it couldn't read. Usually it's a date in another
    format or a heading that was changed. Check them against
    <a
      href="/documentation/weather#import-weather-data-file-requirements"
      class="link">CSV File Requirements</a
    >, and import again.
  </p>
  <h3 class="text-lg font-bold">I can't change the place or dates any more</h3>
  <p>
    They're locked so your weather isn't replaced by accident. Press
    <span class="font-bold">Reload Weather Data</span> to go back to the weather source
    (your changes are lost), or start a new project.
  </p>
  <h3 class="text-lg font-bold">
    Someone opened my link and saw other weather
  </h3>
  <p>
    A link doesn't carry edited weather: it's looked up again. Send them your
    CSV file to import.
  </p>
  <h3 class="text-lg font-bold">It still looks wrong</h3>
  <p>
    Press <span class="font-bold">Weather Data Feedback</span> under the table to
    tell me about it.
  </p>
</section>

<RelatedReference slugs={['weather', 'download', 'credits']} />
