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

<!-- Rain, Snow and Sunshine Blankets: the other gauges (state/gauges/*), every
preview's "Color Each Row Using the Day's" (any added gauge's weather), rain
and snow ranges that stop at 0 (a range ending at 0 includes it), snow
measured by source (MixedSnow), daylight in minutes (metric) or hours
(imperial), Daytime Rows. -->

<script lang="ts">
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import RelatedReference from '#lib/components/docs/RelatedReference.svelte';
</script>

<p>
  A temperature blanket doesn't have to be about temperature. Track the rainy
  days, a snowy winter, or the days getting longer and shorter, on their own or
  alongside temperature.
</p>

<section class="flex flex-col gap-3">
  <h2 id="add-a-gauge" class="text-2xl font-bold">1. Add a Gauge</h2>
  <p>Each kind of weather has its own gauge: its own colors and ranges.</p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>Get the weather for your place and dates, as usual.</li>
    <li>
      Above the gauge's colors, press <span class="font-bold">Rain Gauge</span>,
      <span class="font-bold">Snow Gauge</span>,
      <span class="font-bold">Daytime Gauge</span> or
      <span class="font-bold">Moon Phase Gauge</span>. A
      <span class="font-bold">+</span> means it isn't in your project yet.
    </li>
    <li>Confirm that you want to add it.</li>
    <li>Choose its colors and ranges, just like the temperature gauge.</li>
  </ol>
  <DocsShot
    src="rain-snow-sunshine/rain-gauge"
    alt="The Rain Gauge with four blues, from palest for 27 → 20 mm to darkest for 7 → 0 mm, and the sentence A range with a To of 0 includes 0. The last range holds 341 days, 93% of the year."
    caption="A Rain Gauge."
  />
</section>

<section class="flex flex-col gap-3">
  <h2 id="use-it-in-the-preview" class="text-2xl font-bold">
    2. Use It in the Preview
  </h2>
  <p>
    A gauge only colors your blanket once the preview uses it. Below the
    preview:
  </p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Find <span class="font-bold">Color Each Row Using the Day's</span> (the wording
      differs a little by pattern).
    </li>
    <li>
      Choose <span class="font-bold">Rain</span>, Snow, Daytime or Moon Phase
      instead of a temperature.
    </li>
  </ol>
  <p>
    Choose more than one to split each row or square between them, like the high
    temperature on one half and rain on the other. Square and hexagon patterns
    let you choose what each round shows.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="rain-and-snow" class="text-2xl font-bold">Rain and Snow</h2>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      Most days have no rain or snow at all, so one color does most of the work.
      Choose it carefully: it's the background of your blanket.
    </li>
    <li>
      Ranges never go below 0, and the last one includes 0, so dry days have a
      color.
    </li>
    <li>
      Ranges that suit rain are often small and uneven, like 0 → 1, 1 → 5, 5 →
      15. Press a range's number to change it.
    </li>
    <li>
      Snow depends on the weather source: Open-Meteo gives how much snow fell,
      Meteostat how deep it was on the ground. Use the same source for every
      location.
    </li>
  </ul>
</section>

<section class="flex flex-col gap-3">
  <h2 id="daylight" class="text-2xl font-bold">Daylight</h2>
  <p>
    The <span class="font-bold">Daytime Gauge</span> uses how long each day is, from
    sunrise to sunset (in minutes in metric, hours in imperial), not how sunny it
    was. It makes a smooth wave over a year, darkest in winter.
  </p>
  <p>
    Or try the <span class="font-bold">Daytime Rows</span> pattern: it splits each
    row into day and night stitches by the length of the day, and colors each part
    with weather you choose, like the high temperature for the day and the low for
    the night.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="moon" class="text-2xl font-bold">The Moon</h2>
  <p>
    The <span class="font-bold">Moon Phase Gauge</span> has eight colors, one for
    each phase. Its ranges are fixed; you only choose the colors.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="if-something-goes-wrong" class="text-2xl font-bold">
    If Something Goes Wrong
  </h2>
  <h3 class="text-lg font-bold">The gauge I want isn't there</h3>
  <p>
    A gauge shows only when the weather has what it needs. Try the other weather
    source in <span class="font-bold">Weather Source</span>.
  </p>
  <h3 class="text-lg font-bold">"Error: Mixed Parameters"</h3>
  <p>
    Some locations have snow from Meteostat and others from Open-Meteo, which
    measure it differently. Choose Open-Meteo, and turn off trying the other
    source.
    <a href="/documentation/weather#mixed-snow-parameters" class="link"
      >More about this error</a
    >.
  </p>
  <h3 class="text-lg font-bold">My blanket is nearly all one color</h3>
  <p>
    That's a dry place, or a dry year. Make the 0 range a color you love, or add
    more small ranges at the low end.
  </p>
</section>

<RelatedReference slugs={['gauges-and-ranges', 'preview', 'weather']} />
