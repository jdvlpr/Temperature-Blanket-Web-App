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

<!-- Preview: Previews.svelte, PreviewInfo, each pattern's Settings.svelte
(the descriptions follow their About text). Section ids are the old single
page's (OLD_ANCHORS, HELP_TOPICS). -->

<script lang="ts">
  import Seasons from '#lib/components/docs/help/Seasons.svelte';
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import RelatedGuides from '#lib/components/docs/RelatedGuides.svelte';

  const patterns = [
    {
      name: '12-Point Star',
      about:
        'Each of the 12 points is a month, January at the top and going clockwise. Each chevron row in a point is one day, from the center outward. Works best with a whole year, January 1 to December 31.',
    },
    {
      name: 'Calendar',
      about: 'Squares in a calendar grid, grouped by month.',
    },
    {
      name: 'Chevrons',
      about: 'A row of zigzags for each day, from top to bottom.',
    },
    {
      name: 'Continuous Square',
      about:
        'One square, growing round and round from the center, like a granny square or a moss (linen) stitch square.',
    },
    {
      name: 'Corner to Corner',
      about:
        'Lines worked back and forth on the diagonal, starting from the bottom right.',
    },
    {
      name: 'Daytime Rows',
      about:
        "Each row is split by that day's daylight: daylight stitches are the row's stitches × hours of daylight ÷ 24, and the rest are night.",
    },
    {
      name: 'Hexagon Rounds',
      about:
        'Each round of a hexagon is one day. Hexagons go left to right, top to bottom.',
    },
    {
      name: 'Hexagons',
      about:
        'Each hexagon is one day, left to right, top to bottom. Each of its rounds can use different weather, and you can add hexagons at the start or between months.',
    },
    {
      name: 'Month Rows',
      about:
        'Rows grouped by month, top to bottom or left to right. Shorter months get extra rows, so every month is the same size.',
    },
    {
      name: 'Month Squares',
      about:
        'Each square is a month, and each round of it a day, the 1st in the center. Shorter months get extra rounds.',
    },
    {
      name: 'Rows',
      about:
        'A row of stitches for each day, from top to bottom: the classic temperature blanket.',
    },
    {
      name: 'Split Month Squares',
      about:
        'Like Month Squares, but each round is split in half to show two kinds of weather.',
    },
    {
      name: 'Square Rounds',
      about:
        'Each round of a square is one day. Squares go left to right, top to bottom.',
    },
    {
      name: 'Squares',
      about:
        'Each square is one day, left to right, top to bottom, like a granny square blanket.',
    },
  ];
</script>

<p>
  The preview shows what your blanket could look like, with your weather and
  your colors. It's a picture to plan with, not a pattern: a real blanket won't
  look exactly like it, and how you crochet or knit each part is up to you.
</p>

<section class="flex flex-col gap-3">
  <h2 id="create-a-preview" class="text-2xl font-bold">Choose a Pattern</h2>
  <p>
    Choose a <span class="font-bold">Pattern</span> above the preview. With weekly
    weather, each "day" below is a week.
  </p>
  <dl class="flex flex-col gap-2">
    {#each patterns as { name, about } (name)}
      <div>
        <dt class="font-bold">{name}</dt>
        <dd>{about}</dd>
      </div>
    {/each}
  </dl>
  <p>
    Press <span class="font-bold">Information</span> above a preview for more about
    its pattern and what's in this one.
  </p>
  <DocsShot
    src="preview/rows"
    alt="A Rows preview of a year of London's weather: one thin stripe per day from top to bottom, purples and blues in winter, warming through yellows and oranges to deep reds in summer, and back to blues and purples in December."
    caption="The Rows pattern, a year of London."
  />
</section>

<section class="flex flex-col gap-3">
  <h2 id="preview-settings" class="text-2xl font-bold">Settings</h2>
  <p>Each pattern has its own settings, below the preview. Most have:</p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Which weather:</span> like
      <span class="font-bold">Color Each Row Using the Day's</span> High, Average
      or Low Temperature, Rain… Choose more than one to split each row or square between
      them.
    </li>
    <li>
      <span class="font-bold">Size:</span> stitches per row, or how many squares or
      hexagons across and down.
    </li>
    <li>
      <span class="font-bold">Accent Color:</span> for anything that isn't a day,
      like padding at the end of a row or squares to fill a grid.
    </li>
    <li>
      <span class="font-bold">Borders:</span> a border color and size, for patterns
      made of pieces.
    </li>
  </ul>
  <p>
    Squares and hexagons have a designer, to choose what each round shows.
    Daytime Rows chooses where the daylight stitches go.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="preview-use" class="text-2xl font-bold">Using the Preview</h2>
  <ul class="ml-6 list-disc space-y-1">
    <li>Touch or click a row or square to see its date and weather.</li>
    <li>
      Point at a color in the gauge to see where it's used in the preview.
    </li>
    <li>
      <span class="font-bold">Download PNG</span> under the preview saves it as
      a picture.
      <a href="/documentation/download" class="link">More downloads</a>.
    </li>
  </ul>
</section>

<section class="flex flex-col gap-3">
  <h2 id="assigning-seasons" class="text-2xl font-bold">Seasons</h2>
  <Seasons />
</section>

<RelatedGuides
  slugs={['plan-a-blanket', 'rain-snow-sunshine', 'print-and-track']}
/>
