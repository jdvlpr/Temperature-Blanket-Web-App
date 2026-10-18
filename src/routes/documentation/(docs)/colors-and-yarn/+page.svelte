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

<!-- Colors & Yarn: Gauge.svelte's Get Colors, its dialogs (PaletteSource,
ChooseColorways, GetPaletteFromImage, RandomPalette, PasteColors,
ChangeColor), SortMenu (PALETTE_SORTS) and GaugePaletteExport. Section ids
are the old single page's (OLD_ANCHORS, HELP_TOPICS). -->

<script lang="ts">
  import LinkUnavailable from '#lib/components/docs/help/LinkUnavailable.svelte';
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import RelatedGuides from '#lib/components/docs/RelatedGuides.svelte';
  import { PALETTE_SORTS } from '#lib/utils/color-utils.js';
</script>

<p>
  A gauge's colors can be any colors, or real yarn colorways. Press
  <span class="font-bold">Get Colors</span> above a gauge to fill it all at once,
  or press one color to change just that one.
</p>

<section class="flex flex-col gap-3">
  <h2 id="preset-colors" class="text-2xl font-bold">Get Colors</h2>
  <p>The <span class="font-bold">Get Colors</span> menu has:</p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">My Palettes:</span> palettes you've saved{#if __ACCOUNTS_ENABLED__},
        and ones you've starred in the gallery{/if}.
    </li>
    <li>
      <span class="font-bold">Palette Gallery:</span> palettes shared by everyone,
      with the gallery's search, filters and sorting.
    </li>
    <li>
      <span class="font-bold">Preset Gradients:</span> smooth color combinations in
      any number of colors, like One Hue: Blue or Multi-hue: Yellow to Green.
    </li>
    <li>
      <span class="font-bold">Choose Colorways:</span>
      <a href="#choose-yarn-colorways" class="link">pick real yarn</a>, by brand
      and yarn.
    </li>
    <li>
      <span class="font-bold">From an Image:</span>
      <a href="#image-palette" class="link">pick colors from a photo</a>.
    </li>
    <li>
      <span class="font-bold">Random:</span> random colors. Press
      <span class="font-bold">Randomize</span> (or <kbd class="kbd">r</kbd>)
      until you like them.
    </li>
    <li>
      <span class="font-bold">Paste Colors or Code:</span>
      <a href="#importexport" class="link">type or paste colors</a>.
    </li>
  </ul>
  <p>Choosing a palette replaces the gauge's colors. Undo puts them back.</p>
  <DocsShot
    src="colors-and-yarn/get-colors"
    alt="The Get Colors menu: My Palettes, Palette Gallery, Preset Gradients, Choose Colorways, From an Image, Random, and Paste Colors or Code, each with a short description."
    caption="The Get Colors menu in the Project Planner."
  />
</section>

<section class="flex flex-col gap-3">
  <h2 id="choose-yarn-colorways" class="text-2xl font-bold">Choose Yarn</h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Press <span class="font-bold">Get Colors</span>, then
      <span class="font-bold">Choose Colorways</span>.
    </li>
    <li>
      Choose a brand and yarn. To find a colorway, search by its name or by a
      color.
    </li>
    <li>
      Press colorways to add them to your palette, in order. Rearrange or remove
      them in the strip at the bottom, or press <span class="font-bold"
        >Clear</span
      > to start over.
    </li>
    <li>Press <span class="font-bold">Save</span>.</li>
  </ol>
  <p>
    To change one color, press its swatch in the gauge. Type a color (a name
    like "sage" or a hex code like #9CAF88), pick it from a photo, or choose a
    yarn colorway below; then <span class="font-bold">Save</span>.
  </p>
  <p>
    If you keep choosing the same yarn, you'll be asked whether to make it your
    default yarn, so it's chosen for you next time. Change it any time in
    <a href="/documentation/library-and-account#preferences" class="link"
      >Preferences</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="image-palette" class="text-2xl font-bold">Colors From a Photo</h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Press <span class="font-bold">Get Colors</span>, then
      <span class="font-bold">From an Image</span>.
    </li>
    <li>
      Choose <span class="font-bold">Your Photo</span> (or drop or paste one),
      or a
      <span class="font-bold">Random Photo</span>. Your photo stays on your
      device: it's never uploaded.
    </li>
    <li>
      Tap the photo to add colors (<span class="font-bold">Pick Colors</span>),
      or
      <span class="font-bold">Draw a Line</span> across it to take the colors
      along it. <span class="font-bold">Auto</span> picks the colors that best capture
      the photo.
    </li>
    <li>
      To use yarn, choose one under <span class="font-bold">Yarn</span>: each
      color is matched to its closest colorway.
    </li>
    <li>Press <span class="font-bold">Save</span>.</li>
  </ol>
  <p>
    <span class="font-bold">Continue with your last photo</span> picks up where
    you left off.
    <a href="/documentation/guides/match-your-yarn" class="link"
      >Matching your yarn or a photo</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="sort-colors" class="text-2xl font-bold">Sort Colors</h2>
  <p>
    Drag a color by its handle to move it. Or use
    <span class="font-bold">Sort</span> above the gauge to put them all in order:
  </p>
  <ul class="ml-6 list-disc space-y-1">
    {#each PALETTE_SORTS as { value, label, details } (value)}
      <li><span class="font-bold">{label}:</span> {details}.</li>
    {/each}
    <li>
      <span class="font-bold">Reverse:</span> the same order, last to first.
    </li>
    <li><span class="font-bold">Shuffle:</span> a random order.</li>
  </ul>
  <p>Name only shows when every color has a name.</p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="saved-palettes" class="text-2xl font-bold">Saved Palettes</h2>
  <p>
    Keep a gauge's colors to use in other projects. In the Project Planner,
    press
    <span class="font-bold">Project</span>, then your gauge under
    <span class="font-bold">Palettes</span>, then
    <span class="font-bold">Save to My Palettes</span>. Name it, or leave the
    name empty to use its yarn and number of colors.
  </p>
  <p>
    Saved palettes are in My Library, under
    <span class="font-bold">Yarn Palettes</span>{#if __ACCOUNTS_ENABLED__}, and
      on every device where you're signed in{/if}. Open one in the
    <a href="/documentation/palette-creator" class="link"
      >Yarn Palette Creator</a
    >
    to change, share or publish it. To use it in a project, press
    <span class="font-bold">Get Colors</span>, then
    <span class="font-bold">My Palettes</span>.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="importexport" class="text-2xl font-bold">
    Copy, Export and Paste Colors
  </h2>
  <p>
    To take colors out: press <span class="font-bold">Project</span>, then your
    gauge under <span class="font-bold">Palettes</span>, then:
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      <span class="font-bold">Image:</span> download a PNG of the palette.
    </li>
    <li>
      <span class="font-bold">Color Codes:</span> copy hex codes, for other apps.
    </li>
    <li>
      <span class="font-bold">Yarn Colorway Names:</span> copy the yarn names, for
      a shopping list.
    </li>
  </ul>
  <p>
    To bring colors in: press <span class="font-bold">Get Colors</span>, then
    <span class="font-bold">Paste Colors or Code</span>. Type or paste them,
    separated by commas or new lines:
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>color names: red, orange, light blue</li>
    <li>hex codes: #FF0000 #FFA500, or FF0000-FFA500</li>
    <li>rgb() colors: rgb(255, 0, 0)</li>
    <li>
      a palette link, project link or yarn search link from this site, or a
      palette link from Coolors.co
    </li>
    <li>a palette code from older versions of this site</li>
  </ul>
  <p>
    Anything that can't be read is listed, and the rest is kept. Press
    <span class="font-bold">Use Colors</span> when you're done.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="yarn" class="text-2xl font-bold">About the Yarn Colors</h2>
  <p>
    Yarn on a screen never looks quite like yarn in your hands. Screens differ,
    and each colorway is one average color of what is often a mix. Check the
    real yarn before you buy a lot of it.
  </p>
  <p>
    Links with a shopping cart go to where the yarn is sold. Buying through some
    of them supports this site at no extra cost to you. Yarn names and colorways
    belong to their companies.
  </p>
  <p>
    Is a yarn missing? <a href="/yarn-search-request" class="link"
      >Ask for it to be added</a
    >.
  </p>
  <h3 id="getting-yarn-colorway-data" class="text-lg font-bold">
    How yarn colors are made
  </h3>
  <ol class="ml-6 list-decimal space-y-1">
    <li>A photo of the colorway is found, usually from the yarn company.</li>
    <li>
      A clear part of the photo is chosen, showing as much of the colorway's
      variation as possible.
    </li>
    <li>That part is averaged into one color.</li>
    <li>
      The color, the colorway's name and a link to its page are saved, for the
      site to show.
    </li>
  </ol>
  <h3 id="link-unavailable" class="text-lg font-bold">Link Unavailable</h3>
  <LinkUnavailable />
</section>

<RelatedGuides slugs={['match-your-yarn', 'choose-ranges', 'plan-a-blanket']} />
