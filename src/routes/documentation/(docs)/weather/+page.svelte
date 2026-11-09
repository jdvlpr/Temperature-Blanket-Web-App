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

<!-- Weather: WeatherSection, ChooseWeatherSource, WeatherTableData,
ImportWeatherData. Section ids are the old single page's (OLD_ANCHORS,
HELP_TOPICS). -->

<script lang="ts">
  import GroupingWeather from '#lib/components/docs/help/GroupingWeather.svelte';
  import ImportFileRequirements from '#lib/components/docs/help/ImportFileRequirements.svelte';
  import MixedSnow from '#lib/components/docs/help/MixedSnow.svelte';
  import ProjectIncludes from '#lib/components/docs/help/ProjectIncludes.svelte';
  import SavedWeatherDays from '#lib/components/docs/help/SavedWeatherDays.svelte';
  import DocsClip from '#lib/components/docs/DocsClip.svelte';
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import RelatedGuides from '#lib/components/docs/RelatedGuides.svelte';
  import {
    METEOSTAT_DELAY_DAYS,
    OPEN_METEO_DELAY_DAYS,
    OPEN_METEO_MODELS,
  } from '#lib/constants/weather-constants.js';

  // The model titles carry a badge ("Default", "Beta") as HTML
  const models = OPEN_METEO_MODELS.map((model) => ({
    ...model,
    title: model.title.replace(/<[^>]+>[^<]*<\/[^>]+>/g, '').trim(),
    isDefault: model.value === 'auto',
  }));
</script>

<p>
  Once you've chosen a
  <a href="/documentation/location-and-dates" class="link">place and dates</a>,
  the Project Planner gets every day's weather from a weather service. This page
  covers how to look through it, group it by week, fix days that look wrong, and
  bring in your own.
</p>

<section class="flex flex-col gap-3">
  <h2 id="get-weather-data" class="text-2xl font-bold">Get the Weather</h2>
  <p>
    Press <span class="font-bold">Get Weather Data</span> under your locations. The
    button is ready once every location has a place chosen from the list and dates
    that work. For each day you get the high, average and low temperature, rain, snow,
    daylight (sunrise to sunset) and the phase of the moon.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="saved-weather-days" class="text-2xl font-bold">Saved Weather</h2>
  <SavedWeatherDays />
  <h3 class="text-lg font-bold">Check for Updates</h3>
  <p>
    For a saved project, the main button on the Location step says
    <span class="font-bold">Add 14 New Days</span> (with however many are
    waiting) while a project is still going, or
    <span class="font-bold">Check for Updates</span> when there are none; the
    Project menu offers Check for Updates too. It gets every day again. When no
    saved day is different, the new days are just added. When some are,
    <span class="font-bold">Update Weather Data</span> opens, and nothing
    changes until you press its save button, which says what it will do (like
    <span class="font-bold">Update 5 Days</span> or
    <span class="font-bold">Keep As Is</span>).
  </p>
  <DocsClip
    src="weather/check-for-updates"
    alt="On the Location step, the pointer presses Check for Updates. Update Weather Data opens: Update Past Days says 5 days in the project would change color, and Open-Meteo has newer values for 8 days. Its switch is turned on, and Choose which days to update opens All Changes, each changed value over the saved one struck through, like 7.4 over 3.4, +4. Filters › New color shows 5 of the 8 days. Back, then Update 8 Days: the dialog closes and the message says Updated 8 days."
    caption="Checking a saved project for updates."
  />
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Add 14 new days:</span> on to start. If you turn it
      off, the new days are offered again next time.
    </li>
    <li>
      <span class="font-bold">Update Past Days:</span> off to start. Weather
      sources often correct past days as more station reports come in. It says
      how many days in your project would change color, and which source has
      newer values. If none would, you'll just see a short note with
      <span class="font-bold">Review changes</span>.
    </li>
    <li>
      <span class="font-bold">Choose which days to update</span> (or Review
      changes) opens <span class="font-bold">All Changes</span>: every changed
      day, the new value over the saved one and how much it changed. Filters
      narrow the list (<span class="font-bold">New color</span>,
      <span class="font-bold">Now settled</span>,
      <span class="font-bold">Was missing</span>,
      <span class="font-bold">Now missing</span>, temperatures or rain and snow
      that changed by at least an amount, <span class="font-bold">Kept</span>,
      dates), and <span class="font-bold">Select Shown</span>,
      <span class="font-bold">Clear Shown</span> and
      <span class="font-bold">Invert</span> pick the days shown. With
      <span class="font-bold">Show Colors</span> a changed color shows both ("Color
      2 → 3").
    </li>
    <li>
      <span class="font-bold">Days you've made</span> (with your
      <a href="/documentation/preview#progress" class="link">progress</a> set) stay
      as they are, so your project keeps matching your blanket. You can still pick
      them in All Changes if you want to.
    </li>
    <li>
      <span class="font-bold">Kept days:</span> days you don't update keep their saved
      values, and you won't be asked about them again unless they change again. They're
      marked in the weather table: tap the mark to see both values and use the new
      ones.
    </li>
    <li>
      <span class="font-bold">Auto ranges</span> don't change. When your weather
      no longer matches them, the gauge says so, with
      <span class="font-bold">Update Ranges</span>. If the project has a gallery
      page, you can update it right after.
    </li>
  </ul>
  <h3 id="project-includes" class="text-lg font-bold">
    What a Project Includes
  </h3>
  <ProjectIncludes />
</section>

<section class="flex flex-col gap-3">
  <h2 id="weather-sources" class="text-2xl font-bold">Weather Sources</h2>
  <p>
    Press <span class="font-bold">Source</span> in the toolbar above the weather
    to choose where it comes from, then get the weather data again. The button
    shows the source in use, or <span class="font-bold">Custom</span> once you've
    edited or imported weather.
  </p>
  <h3 class="text-lg font-bold">Open-Meteo</h3>
  <p>
    This is the default. It has weather for anywhere in the world going back to
    1940, worked out from weather models and observations. Choose a model:
  </p>
  <ul class="ml-6 list-disc space-y-1">
    {#each models as { value, title, timespan, resolution, isDefault } (value)}
      <li>
        <span class="font-bold">{title}</span
        >{#if isDefault}&nbsp;(default){/if}:
        {timespan}, {resolution}.
        {#if isDefault}
          It combines several models, so it's the most complete, but a model
          upgrade can change past days a little.
        {:else}
          Past days are less likely to change, but some days may be missing.
        {/if}
      </li>
    {/each}
  </ul>
  <h3 class="text-lg font-bold">Meteostat</h3>
  <p>
    Meteostat combines measurements from real weather stations near your place.
    <span class="font-bold">Fill Missing Data</span> (on by default) fills days the
    stations missed with model data. Meteostat's snow is the depth of snow on the
    ground, not how much fell.
  </p>
  <h3 class="text-lg font-bold">If one source has nothing</h3>
  <p>
    With <span class="font-bold"
      >If data is not available, automatically try the other weather source</span
    > turned on, the Project Planner tries the other source when the first has no
    weather for your place and dates, and tells you it did.
  </p>
  <p>
    Weather from any source can change, since services correct past days and
    upgrade their models. See
    <a href="/documentation/credits" class="link">Data Sources & Credits</a> for the
    licenses.
  </p>
  <DocsShot
    src="weather/weather-source"
    alt="The Weather Source dialog: Open-Meteo chosen, with a 5 day delay, its website and license; the switch to try the other weather source, turned off; and Choose a Model, with Best Match (Default) selected above ERA5 Land and ERA5."
    caption="Weather Source, with Open-Meteo's models."
  />
</section>

<section class="flex flex-col gap-3">
  <h2 id="grouping-weather-data" class="text-2xl font-bold">
    Daily or Weekly Weather
  </h2>
  <p>
    Choose <span class="font-bold">Grouping</span> above the weather.
  </p>
  <GroupingWeather />
  <DocsClip
    src="weather/grouping"
    alt="Above the weather, the pointer opens Grouping: Daily and chooses Weekly. The chart redraws with one point a week, and a note says Weekly: starts Wed, Jan 1, 2025 · 53 weeks, which can make a shorter project."
    caption="Grouping the weather by week."
  />
  <p>
    Editing and importing always change days, whichever grouping the table
    shows.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="view-weather-data" class="text-2xl font-bold">View the Weather</h2>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Summary:</span> the highest, average and lowest temperatures,
      total rain and snow, and the average daylight of your whole project, with the
      date of the hottest and coldest day.
    </li>
    <li>
      <span class="font-bold">Chart:</span> every day's weather. To hide or show
      a value (<span class="font-bold">High</span>,
      <span class="font-bold">Rain</span>,
      <span class="font-bold">Moon Phase</span>…) in the chart, the summary and
      the table, use <span class="font-bold">View</span> ›
      <span class="font-bold">Values</span> above the table.
    </li>
    <li>
      <span class="font-bold">Table:</span> every day, one row each. Filters
      above it narrow the days (<span class="font-bold">Missing</span>,
      <span class="font-bold">Made</span>,
      <span class="font-bold">May change</span>,
      <span class="font-bold">Kept</span>, a date range, a location, or a
      <span class="font-bold">Color</span>: the days in one of a gauge's colors,
      in any of its values or just one, like the High). Press a heading to sort
      by it, or <span class="font-bold">Go to</span> a date.
      <span class="font-bold">Show Colors</span> puts each value's color beside it
      ("Color 3"); press a color for its yarn and name. Every weather table (here,
      Edit Weather Data, the list of changed days, a range's days) has the same filters
      and colors, and Show Colors is one setting for all of them.
    </li>
  </ul>
  <DocsClip
    src="weather/table-filters"
    alt="Above the weather table, the pointer opens Filters, checks Color and picks color 3: the table shows 73 of 365 days. Filters closes, leaving a Color 3 chip. View › Show Colors puts a colored circle and its color number beside each value, and pressing the circle beside April 4's high shows Color 3 of 10."
    caption="Showing the days in one color."
  />
  <p>
    To switch between °C / mm and °F / in, use
    <span class="font-bold">Units</span> above the weather (or press
    <kbd class="kbd">u</kbd>). It changes the units everywhere on the site.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="edit-weather-data" class="text-2xl font-bold">Edit the Weather</h2>
  <p>
    Press <span class="font-bold">Edit</span> at the top of the Weather step, or
    press a value in the table to start on it.
    <span class="font-bold">Edit Weather Data</span> opens every day's weather
    in a grid, like a spreadsheet. For step-by-step help, see
    <a
      href="/documentation/guides/weather-doesnt-match#fix-a-few-days"
      class="link">Fix a Few Days</a
    >.
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Typing:</span> type over a value and press
      <kbd class="kbd">Enter</kbd>; Enter, Tab and the arrow keys move. Daylight
      is hours:minutes, like 08:12. Leave a value empty for missing. The moon
      phase can't be edited.
    </li>
    <li>
      <span class="font-bold">Set</span> and
      <span class="font-bold">Add:</span> for the selected values (drag, or
      Shift-press), give them all one value, or add a number to each (negative
      takes away).
      <kbd class="kbd">Delete</kbd> clears them.
    </li>
    <li>
      <span class="font-bold">Paste:</span> cells copied from Excel, Numbers or Google
      Sheets go from the cell you paste on. Rows that start with dates go to their
      days.
    </li>
    <li>
      <span class="font-bold">Find Missing</span> and
      <span class="font-bold">Fill In Missing:</span> go to the next empty value,
      or fill the selected ones (all of them, with one value selected) from the days
      on either side. They show only while some values are missing.
    </li>
    <li>
      <span class="font-bold">Filters:</span> the same as the table's, plus
      <span class="font-bold">Edited</span>, for the values you've changed.
    </li>
    <li>
      <span class="font-bold">Show Colors:</span> each value's color beside it, and
      the selected value's yarn named above the grid as you type. A changed value
      shows what it was, crossed out.
    </li>
    <li>
      <span class="font-bold">Apply:</span> nothing changes in your project
      until you press it. Until then, Undo and Redo in the editor work on your
      changes,
      <span class="font-bold">Revert</span> puts the selected values back, and closing
      asks before leaving them. Once applied, Undo above the project takes them back
      in one step.
    </li>
  </ul>
  <h3 class="text-lg font-bold">Once you've edited the weather</h3>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      The weather source shows <span class="font-bold">Custom</span>, and the
      places and dates are locked so your changes aren't replaced by accident.
    </li>
    <li>
      Your weather is saved with the project: in this browser, and in your
      account when you're signed in.
    </li>
    <li>
      A copied link doesn't include it. Whoever opens the link gets the weather
      from the weather source. To give someone your weather, send them the
      spreadsheet too.
    </li>
    <li>
      To start over with the source's weather, press
      <span class="font-bold">Get Weather Data</span> on the Location step, then
      <span class="font-bold">Reload Weather Data</span>. It asks first, because
      your changes are replaced.
    </li>
  </ul>
</section>

<section class="flex flex-col gap-3">
  <h2 id="import-weather-data" class="text-2xl font-bold">
    Import Your Own Weather
  </h2>
  <p>
    Use readings from your own thermometer, a local weather station or any other
    source. Your weather needs to be <span class="font-bold">Daily</span>.
  </p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Press <span class="font-bold">Download</span> at the top of the Weather
      step, then <span class="font-bold">Download CSV</span>. This is your
      project's weather as a spreadsheet.
    </li>
    <li>
      Open it in Excel, Numbers or Google Sheets, change what you want, and save
      it as CSV.
    </li>
    <li>
      Press <span class="font-bold">Edit</span>, then
      <span class="font-bold">Import File</span>, and choose the file, or drag
      it onto the box.
    </li>
    <li>
      The values that differ are marked in the grid. Check them, then press
      <span class="font-bold">Apply</span>.
    </li>
  </ol>
  <DocsClip
    src="weather/import-csv"
    alt="On the Weather step, the pointer presses Edit, and Edit Weather Data opens. Import File shows a box to select or drag a CSV file; a file is chosen with Browse Files, and it says Read 7 days. Import File is pressed again to fold the box away: the first days' highs show their new values over the old ones struck through, with the changes, and 7 values changed on 7 days. Apply is pressed: the source shows Custom, and the message says Weather data changed on 7 days."
    caption="Importing a CSV file of your own readings."
  />
  <p>
    Rows that can't be read are left out, and listed. You can also skip the file
    and paste the cells from your spreadsheet straight into Edit Weather Data.
  </p>
  <h3 id="import-weather-data-file-requirements" class="text-lg font-bold">
    CSV File Requirements
  </h3>
  <ImportFileRequirements />
</section>

<section class="flex flex-col gap-3">
  <h2 id="weather-errors" class="text-2xl font-bold">
    When the Weather Doesn't Look Right
  </h2>
  <h3 class="text-lg font-bold">"Something Went Wrong"</h3>
  <p>
    The weather service had nothing for your place and dates, or couldn't be
    reached. Try:
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>dates in the past only (not today or later),</li>
    <li>a bigger town or a place nearby,</li>
    <li>
      the other <a href="#weather-sources" class="link">weather source</a>,
    </li>
    <li>or again in a few minutes.</li>
  </ul>
  <p>
    <span class="font-bold">Dates Out of Range</span> means the source has no
    weather that far back (Open-Meteo starts in 1940), and
    <span class="font-bold">Service Temporarily Unavailable</span> means it's busy:
    try again shortly.
  </p>
  <h3 class="text-lg font-bold">"There's some missing data"</h3>
  <p>
    Some days are missing a value, and it says which. Try another source or
    model, a place nearby, or <a href="#edit-weather-data" class="link"
      >fill them in yourself</a
    >. You can keep going as it is, too.
  </p>
  <h3 class="text-lg font-bold">The newest days change</h3>
  <p>
    Weather services can take up to a week to settle the latest days. When your
    project includes recent days, the Project Planner says so, and once they've
    settled it suggests <a href="#saved-weather-days" class="link"
      >Check for Updates</a
    >. Saved days never change on their own. To be safe, stay about
    {OPEN_METEO_DELAY_DAYS} days behind with Open-Meteo, or {METEOSTAT_DELAY_DAYS}
    with Meteostat.
  </p>
  <h3 class="text-lg font-bold">It's different from my thermometer</h3>
  <p>
    The weather is for an area around your place, not your garden.
    <a href="/documentation/guides/weather-doesnt-match" class="link"
      >What to do when the weather doesn't match</a
    >.
  </p>
  <p>
    If something still looks wrong, press <span class="font-bold"
      >Weather Data Feedback</span
    > under the table to let me know.
  </p>
  <h3 id="mixed-snow-parameters" class="text-lg font-bold">
    Error: Mixed Parameters
  </h3>
  <MixedSnow />
</section>

<RelatedGuides
  slugs={['weather-doesnt-match', 'knit-along-all-year', 'rain-snow-sunshine']}
/>
