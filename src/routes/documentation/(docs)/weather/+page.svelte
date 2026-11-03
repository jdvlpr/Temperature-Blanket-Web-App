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
  The weather is the heart of a temperature blanket. Once you've chosen a
  <a href="/documentation/location-and-dates" class="link">place and dates</a>,
  the Project Planner gets the weather of every day from a weather service. You
  can look through it, group it into weeks, fix days that look wrong, or bring
  in weather of your own.
</p>

<section class="flex flex-col gap-3">
  <h2 id="get-weather-data" class="text-2xl font-bold">Get the Weather</h2>
  <p>
    Press <span class="font-bold">Search</span> under your locations. The button is
    ready once every location has a place chosen from the list and dates that work.
    Press it again after changing a place, the dates or the weather source: it gets
    every day for them.
  </p>
  <p>
    For each day you get the high, average and low temperature, rain, snow,
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
    <span class="font-bold">Check for Updates</span> when there are none; the Project
    menu offers Check for Updates too. It gets every day again. When no saved day
    is different, the new days are just added.
  </p>
  <p>
    If any saved day is different now, <span class="font-bold"
      >Update Weather Data</span
    >
    opens, so nothing is saved without your say. New days come first (on to start).
    Weather sources correct readings as stations report in, which is normal, so how
    much space the changed days take depends on your blanket: when none of them changes
    color, it's a short note with
    <span class="font-bold">Review changes</span>; when some do,
    <span class="font-bold">Update Past Days</span> (off to start) says how many days
    in your blanket would change color, and which source has newer values. Turn everything
    off to change nothing; the new days are still offered later.
  </p>
  <p>
    <span class="font-bold">View All Changes</span> (or Review changes) shows
    every changed day, the new value over the saved one and how much it changed.
    Filters narrow the list (days whose colors change, days that have settled,
    gaps filled, data removed, temperatures or rain and snow that changed by at
    least an amount, a date range, days you kept before), and
    <span class="font-bold">Select Shown</span>,
    <span class="font-bold">Clear Shown</span> and
    <span class="font-bold">Invert</span> pick the days shown.
    <span class="font-bold">Show Colors</span> adds each value's color, and both colors
    where it changes. Nothing changes until you save; Cancel leaves everything as
    it was.
  </p>
  <p>
    Days you don't update keep their saved values, and you won't be asked about
    them again unless their values change again. They're marked in the weather
    table: tap the mark to see both values and use the new ones. The next time
    you check, View All Changes' <span class="font-bold">Kept before</span> filter
    shows them too. Your project's gallery page can be updated right after, too.
  </p>
  <p>
    Updating days doesn't change Auto ranges. When your weather no longer
    matches them, the gauge says so, with
    <span class="font-bold">Update Ranges</span>.
  </p>
  <h3 id="project-includes" class="text-lg font-bold">
    What a Project Includes
  </h3>
  <ProjectIncludes />
</section>

<section class="flex flex-col gap-3">
  <h2 id="weather-sources" class="text-2xl font-bold">Weather Sources</h2>
  <p>
    Press <span class="font-bold">Weather Source</span> above the weather to
    choose where it comes from, then get the weather data again. The button
    shows the source in use, or <span class="font-bold">Custom</span> once you've
    edited or imported weather.
  </p>
  <h3 class="text-lg font-bold">Open-Meteo</h3>
  <p>
    The default. Weather for anywhere in the world, worked out from weather
    models and observations, going back to 1940. Choose a model:
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
    Measurements from real weather stations near your place, combined.
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
    Weather from any source can change: services correct past days and upgrade
    their models. See
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
      <span class="font-bold">Chart:</span> every day's weather. Press a name
      under the chart (<span class="font-bold">High Temps</span>,
      <span class="font-bold">Rain</span>,
      <span class="font-bold">Moon Phase</span>…) to hide or show it, in the
      chart, the summary and the table.
    </li>
    <li>
      <span class="font-bold">Table:</span> every day, one row each. Turn on
      <span class="font-bold">Show Color Details</span> to color each value with the
      yarn of its range, with the yarn's name.
    </li>
  </ul>
  <p>
    To switch between °C / mm and °F / in, use
    <span class="font-bold">Units</span> above the weather (or press
    <kbd class="kbd">u</kbd>). It changes the units everywhere on the site.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="edit-weather-data" class="text-2xl font-bold">Edit the Weather</h2>
  <p>
    If a day looks wrong, change it. Press
    <span class="font-bold">Edit Weather Data</span> under the table (or press a value
    in the table to start on it). Every day's weather opens in a grid, like a spreadsheet,
    with each value's yarn color beside it.
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Change a value:</span> select it and type, then
      press <kbd class="kbd">Enter</kbd>. Enter, Tab and the arrow keys move.
      Daylight is hours:minutes, like 08:12. Leave a value empty for missing.
    </li>
    <li>
      <span class="font-bold">Change many:</span> select them with Shift or by
      dragging, then type a value beside
      <span class="font-bold">Set</span>, or a number to
      <span class="font-bold">Add</span> to each (negative to take away).
      <kbd class="kbd">Delete</kbd> clears them.
    </li>
    <li>
      <span class="font-bold">Paste from a spreadsheet:</span> copy cells in Excel,
      Numbers or Google Sheets and paste them on the first cell they go in. If the
      rows you copy start with dates, each goes to its day.
    </li>
    <li>
      <span class="font-bold">Missing days:</span>
      <span class="font-bold">Find Missing</span> goes to the next empty value;
      <span class="font-bold">Fill In Missing</span> fills the selected ones (or all
      of them, with one value selected) from the days on either side.
    </li>
  </ul>
  <p>
    Changed values are marked. Nothing changes in your project until you press
    <span class="font-bold">Apply</span>: until then, Undo and Redo in the
    editor work on your changes, <span class="font-bold">Revert</span> puts the selected
    values back, and closing asks before leaving them. Once applied, Undo above the
    project takes them back in one step. The moon phase can't be edited.
  </p>
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
      Press <span class="font-bold">Download</span> under the table, then
      <span class="font-bold">Download CSV</span>. This is your project's
      weather as a spreadsheet.
    </li>
    <li>
      Open it in Excel, Numbers or Google Sheets, change what you want, and save
      it as CSV.
    </li>
    <li>
      Press <span class="font-bold">Import Weather Data</span> (or
      <span class="font-bold">Import File</span> in Edit Weather Data) and choose
      the file, or drag it onto the box.
    </li>
    <li>
      The values that differ are marked in the grid. Check them, then press
      <span class="font-bold">Apply</span>.
    </li>
  </ol>
  <p>
    Rows that can't be read are left out, and listed. You can also skip the
    file: copy the cells in your spreadsheet and paste them into Edit Weather
    Data.
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
    Something still looks wrong? Press <span class="font-bold"
      >Weather Data Feedback</span
    > under the table to tell me about it.
  </p>
  <h3 id="mixed-snow-parameters" class="text-lg font-bold">
    Error: Mixed Parameters
  </h3>
  <MixedSnow />
</section>

<RelatedGuides
  slugs={[
    'weather-doesnt-match',
    'knit-along-all-year',
    'rain-snow-sunshine',
    'same-date-several-years',
  ]}
/>
