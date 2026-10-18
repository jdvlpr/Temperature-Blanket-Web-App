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

<!-- Choose Ranges for Your Yarn (from the FAQ's "Why do the range values
repeat…, and how can I make them not overlap?"). Ranges menu labels are
RangesMenu's; Gauges & Ranges has every option. -->

<script lang="ts">
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import RelatedReference from '#lib/components/docs/RelatedReference.svelte';
</script>

<p>
  Ranges decide which color each day gets. Here's how to read them, and how to
  shape them around the yarn you have.
</p>

<section class="flex flex-col gap-3">
  <h2 id="how-ranges-work" class="text-2xl font-bold">How Ranges Work</h2>
  <p>
    Each color in the gauge has a range beside it, From → To. With 30 → 25, a
    day that's 27° gets that color. Which temperature counts, the day's high,
    average or low, is chosen in the preview's settings.
  </p>
  <p>
    The numbers repeat on purpose: 30 → 25, then 25 → 20. By default a range
    includes its first number but not its last, so 25° goes in 25 → 20, never in
    both. A sentence above the ranges says how yours work.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="every-color-used" class="text-2xl font-bold">
    Use Every Color About Equally
  </h2>
  <p>
    Good for buying the same amount of each yarn. Most days are mild, so with
    equal-sized ranges the middle colors get used far more than the ends.
  </p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>Press <span class="font-bold">Ranges</span> above the colors.</li>
    <li>
      Under <span class="font-bold">Auto ranges</span>, choose
      <span class="font-bold">Equal days</span>, by the temperature your preview
      uses (High, Average or Low).
    </li>
  </ol>
  <p>
    To check, look beside each color: it shows its number of days and its share
    of the blanket (<span class="font-bold">Days in ranges</span>, in
    <span class="font-bold">View</span>).
  </p>
  <DocsShot
    src="choose-ranges/days-in-ranges"
    alt="The Temperature Gauge with Ranges: Auto and View: List, and the sentence About the same number of high temperature days in each range. Each of ten colors shows its range, from 34° → 25° down to 7° → 1°, and its number of high, average and low days with their share of the blanket."
    caption="Days in ranges, shown beside each color."
  />
</section>

<section class="flex flex-col gap-3">
  <h2 id="round-steps" class="text-2xl font-bold">
    Round Steps, Like Every 5°
  </h2>
  <p>Easy to read off a thermometer, and the same from year to year.</p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Press <span class="font-bold">Ranges</span>, then
      <span class="font-bold">Manual steps…</span>
    </li>
    <li>
      Fill in <span class="font-bold">Every</span> (like 5) and
      <span class="font-bold">From</span> (where the first range starts, like 35).
    </li>
    <li>Press <span class="font-bold">Save</span>.</li>
  </ol>
  <p>
    Your hottest and coldest days need a range too. If either end is left out,
    add a color, or choose a bigger step.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="match-your-colors" class="text-2xl font-bold">
    Fit the Ranges to the Yarn You Have
  </h2>
  <p>
    Have 9 colors? Choose <span class="font-bold">9 Colors</span> in the menu below
    the gauge. Then change any range by hand:
  </p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>Press a range's number.</li>
    <li>
      Type the new number, and press <span class="font-bold">Save</span>.
    </li>
  </ol>
  <p>
    With <span class="font-bold">Linked ranges</span> on (in the Ranges menu),
    the next range moves with it, so no days are left out. The Ranges button now
    says <span class="font-bold">Edited</span>; choosing Auto ranges or Manual
    steps again replaces your edits (Undo brings them back).
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="no-repeats" class="text-2xl font-bold">
    Ranges That Don't Repeat (0 → 9, 10 → 19)
  </h2>
  <p>Some patterns write ranges this way. To match one:</p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Press <span class="font-bold">Ranges</span>, and set
      <span class="font-bold">Each range includes</span> to
      <span class="font-bold">Both From and To</span>.
    </li>
    <li>
      Turn off <span class="font-bold">Linked ranges</span>, and type each
      range.
    </li>
  </ol>
  <p>
    Mind the gaps: a day of 9.5° fits neither 0 → 9 nor 10 → 19. Use decimals to
    cover them, like 0 → 9.99 and 10 → 19.99. To check, add up the days beside
    the colors: they should come to the days in your project.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="if-something-goes-wrong" class="text-2xl font-bold">
    If Something Goes Wrong
  </h2>
  <h3 class="text-lg font-bold">My ranges changed by themselves</h3>
  <p>
    Auto ranges are remade when the weather or the number of colors changes. To
    keep them, edit one range (the button says
    <span class="font-bold">Edited</span>), or use Manual steps.
  </p>
  <h3 class="text-lg font-bold">A day is in two ranges</h3>
  <p>
    It takes the color of the first one, the higher one in the list. Change the
    ends so they don't overlap.
  </p>
  <h3 class="text-lg font-bold">The ranges go the wrong way</h3>
  <p>
    Choose <span class="font-bold">Direction</span> in the Ranges menu:
    <span class="font-bold">High to low</span> or
    <span class="font-bold">Low to high</span>.
  </p>
</section>

<RelatedReference slugs={['gauges-and-ranges', 'colors-and-yarn', 'preview']} />
