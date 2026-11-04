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
  import DocsClip from '#lib/components/docs/DocsClip.svelte';
  import RelatedReference from '#lib/components/docs/RelatedReference.svelte';
  import {
    METEOSTAT_DELAY_DAYS,
    OPEN_METEO_DELAY_DAYS,
  } from '#lib/constants/weather-constants.js';
</script>

<p>
  Your thermometer or a different weather source might say 18°, while the
  Project Planner says 16°. Neither is necessarily wrong. Here's why, and how to
  use numbers you trust.
</p>

<section class="flex flex-col gap-3">
  <h2 id="why" class="text-2xl font-bold">Why It's Different</h2>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">It's from a different area.</span> Weather services
      work out the weather over an area of several kilometers, or they use stations
      which might be in a different part of your city. Hills, water, shade, or a sunny
      spot all change what a thermometer reads.
    </li>
    <li>
      <span class="font-bold">The newest days aren't settled.</span> Services can
      take up to a week to finish the latest days, so they can change after you first
      look.
    </li>
    <li>
      <span class="font-bold">Past days get corrected.</span> Sometimes a service
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
      Press <span class="font-bold">Source</span> in the toolbar above the weather.
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
  <p>
    Edit Weather Data shows every day's weather in a grid, like a spreadsheet.
    Nothing in your project changes until you press
    <span class="font-bold">Apply</span>.
  </p>
  <h3 id="change-one-day" class="text-lg font-bold">Change one day</h3>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      In the table under the chart, press the value you want to change. Edit
      Weather Data opens on it.
    </li>
    <li>
      Type your reading and press <kbd class="kbd">Enter</kbd>. The new value
      shows over the old one, struck through, with the difference beside it.
    </li>
    <li>
      Change any other days the same way: <kbd class="kbd">Enter</kbd>,
      <kbd class="kbd">Tab</kbd> and the arrow keys move between them.
    </li>
    <li>Press <span class="font-bold">Apply</span>.</li>
  </ol>
  <DocsClip
    src="weather-doesnt-match/change-one-day"
    alt="On the Weather step, the pointer presses January 3's high of 3.4 in the table. Edit Weather Data opens on it, 5.5 is typed in its place, and the cell shows 5.5 over 3.4 struck through, +2.1. Apply is pressed, the dialog closes, and the table shows 5.5 with the message Weather data changed on 1 day."
    caption="Changing one day's high."
  />
  <h3 id="change-several-days" class="text-lg font-bold">
    Change several days at once
  </h3>
  <p>
    If your thermometer reads warmer than the weather service, say by about 2°,
    you can move a run of days by the same amount.
  </p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Select the days: drag down the column, or press the first one and
      <kbd class="kbd">Shift</kbd>-press the last.
    </li>
    <li>
      Above the grid, type the difference in <span class="font-bold">Add</span>
      (a minus number, like -2, takes away) and press
      <span class="font-bold">Add</span>. Or type one value in the box beside
      the selection and press <span class="font-bold">Set</span> to give every selected
      day that value.
    </li>
    <li>Press <span class="font-bold">Apply</span>.</li>
  </ol>
  <DocsClip
    src="weather-doesnt-match/change-several-days"
    alt="In Edit Weather Data, the pointer drags down the High column from January 2 to January 6, and 5 selected shows above the grid. 2 is typed in Add and Add is pressed: each of the five highs goes up by 2, showing the old value struck through and +2. Apply is pressed and the message says Weather data changed on 5 days."
    caption="Adding 2° to five days' highs."
  />
  <h3 id="more-ways-to-edit" class="text-lg font-bold">More ways to edit</h3>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Paste from a spreadsheet:</span> copy the cells there
      and paste them on the first cell they go in. If each row you copy starts with
      a date, it goes to that day.
    </li>
    <li>
      <span class="font-bold">Missing days:</span> when some values are missing,
      <span class="font-bold">Find Missing</span> goes to the next one, and
      <span class="font-bold">Fill In Missing</span> fills them in from the days on
      either side.
    </li>
    <li>
      <span class="font-bold">Only some days:</span>
      <span class="font-bold">Filters</span> shows just the days you want, such as
      the missing ones or a few weeks.
    </li>
    <li>
      <span class="font-bold">Changed your mind?</span> The arrows at the top of
      the editor undo and redo, and <span class="font-bold">Revert</span> puts the
      selected values back as they were. Once you've applied, Undo at the top of the
      page takes back all of it in one step.
    </li>
  </ul>
  <p>
    You can also open the editor with <span class="font-bold">Edit</span> above
    the weather. Every part of it is in
    <a href="/documentation/weather#edit-weather-data" class="link"
      >Edit the Weather</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="use-your-own-readings" class="text-2xl font-bold">
    Use Your Own Readings for Every Day
  </h2>
  <p>
    If you've kept a log, from your own thermometer or a weather station nearby,
    bring it all in at once: download your project's weather as a CSV file, put
    your readings in place of the ones there, and import it. How, step by step,
    is in
    <a href="/documentation/weather#import-weather-data" class="link"
      >Import Your Own Weather</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="keep-it-from-changing" class="text-2xl font-bold">
    Keep the Weather From Changing
  </h2>
  <p>
    A saved project keeps its weather. Opening it never looks the weather up
    again, and its saved days only change if you use
    <a href="/documentation/weather#saved-weather-days" class="link"
      >Check for Updates</a
    > and choose the new values. A gallery page keeps the weather it was published
    with, too.
  </p>
  <p>
    A link doesn't carry the weather, though: whoever opens it gets the weather
    fresh.
  </p>
  {#if __ACCOUNTS_ENABLED__}
    <p>
      The easiest way to share your weather is your project's gallery page:
      <span class="font-bold">Open a Copy</span> there opens it with the weather it
      was published with.
    </p>
  {/if}
  <p>To send someone your weather exactly as it is, without a gallery page:</p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Wait until your last day is about {OPEN_METEO_DELAY_DAYS} days ago with Open-Meteo,
      or {METEOSTAT_DELAY_DAYS} with Meteostat, so it's settled.
    </li>
    <li>
      Press <span class="font-bold">Download</span> at the top of the Weather
      step, then <span class="font-bold">Download CSV</span>, and send them the
      file with the link.
    </li>
    <li>
      They press <span class="font-bold">Edit</span>, then
      <span class="font-bold">Import File</span>, choose that file (without
      changing it), and press
      <span class="font-bold">Apply</span>.
    </li>
  </ol>
  <p>
    Their weather source then shows <span class="font-bold">Custom</span>.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="if-something-goes-wrong" class="text-2xl font-bold">
    If Something Goes Wrong
  </h2>
  <h3 class="text-lg font-bold">Pressing a value does nothing</h3>
  <p>
    With <span class="font-bold">Grouping</span> set to
    <span class="font-bold">Weekly</span>, the table shows weeks, which can't be
    changed. Press <span class="font-bold">Edit</span> above the weather instead:
    Edit Weather Data always shows days.
  </p>
  <h3 class="text-lg font-bold">Apply is greyed out</h3>
  <p>
    Nothing has changed yet. A value typed the same as it was isn't a change.
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
    <span class="font-bold">Get Weather Data</span>, then
    <span class="font-bold">Reload Weather Data</span>, to go back to the
    weather source (your changes are lost), or start a new project.
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
