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

<!-- Match Your Own Yarn, or a Photo: ChooseColorways (Search by Color),
ChangeColor ("Find matching yarn" under a color without yarn, "% match"),
GetPaletteFromImage (Yarn › Match to Yarn Colors, "Other close yarns"), the
Colorway Finder's photo picker, and the collections' "Only <yarn>" filter
(CollectionToolbar, SelectYarn). -->

<script lang="ts">
  import DocsShot from '#lib/components/docs/DocsShot.svelte';
  import RelatedReference from '#lib/components/docs/RelatedReference.svelte';
</script>

<p>
  Start from the yarn: a stash you want to use up, a brand you love, or a photo
  whose colors you want in your blanket.
</p>

<section class="flex flex-col gap-3">
  <h2 id="yarn-you-can-buy" class="text-2xl font-bold">
    Use a Yarn You Can Buy
  </h2>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      In the gauge, press <span class="font-bold">Get Colors</span>, then
      <span class="font-bold">Choose Colorways</span>.
    </li>
    <li>
      Choose your yarn under <span class="font-bold">Yarn Name</span>: type part
      of its name to find it.
    </li>
    <li>
      Press colorways to add them, in order. They line up in the strip at the
      bottom. To find a color, type it in
      <span class="font-bold">Search by Color</span>, like "sage" or #9CAF88.
    </li>
    <li>Press <span class="font-bold">Save</span>.</li>
  </ol>
  <DocsShot
    src="match-your-yarn/choose-colorways"
    alt="Choose Colorways, with Stylecraft - Special DK chosen under Yarn Name: a grid of its colorways, four of them checked (White, Dark Brown, Matador and Lemon), and a strip of those four at the bottom with Sort and Clear, then Cancel and Save."
    caption="Choose Colorways."
  />
  <p>
    Yarn missing? <a href="/yarn-search-request" class="link"
      >Ask for it to be added</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="yarn-you-have" class="text-2xl font-bold">
    Match Yarn You Already Have
  </h2>
  <p>Don't know a skein's colorway name? Match it by eye, with a photo:</p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>Take a photo of your yarn in daylight, without a filter.</li>
    <li>In the gauge, press the swatch of the color it should replace.</li>
    <li>
      Pick the color from your photo with the image button beside the color
      field. Colorways are listed by <span class="font-bold">Best match</span>,
      each with how close it is (like 92% match).
    </li>
    <li>
      Choose the closest one, and press <span class="font-bold">Save</span>.
    </li>
  </ol>
  <p>
    The <a href="/yarn-colorway-finder" class="link">Yarn Colorway Finder</a> does
    the same across every brand, without a project.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="colors-from-a-photo" class="text-2xl font-bold">
    Take the Colors From a Photo
  </h2>
  <p>A sunset, a garden, a favorite painting:</p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>
      Press <span class="font-bold">Get Colors</span>, then
      <span class="font-bold">From an Image</span>, and choose
      <span class="font-bold">Your Photo</span>. It stays on your device.
    </li>
    <li>
      Press <span class="font-bold">Auto</span>, tap the photo to pick colors,
      or
      <span class="font-bold">Draw a Line</span> across it.
    </li>
    <li>
      For yarn instead of exact colors, press
      <span class="font-bold">Yarn</span>, turn on
      <span class="font-bold">Match to Yarn Colors</span>, and choose a yarn (or
      any yarn of a weight). Each color shows its closest colorway, with other
      close yarns to swap in.
    </li>
    <li>Press <span class="font-bold">Save</span>.</li>
  </ol>
</section>

<section class="flex flex-col gap-3">
  <h2 id="colors-first" class="text-2xl font-bold">Colors First, Yarn Later</h2>
  <p>
    Already chose colors that aren't yarn? A color without one says
    <span class="font-bold">Find matching yarn</span> under its name. Press it to
    see colorways closest to it, best match first.
  </p>
  <p>
    Or plan a palette before you have a place or dates, in the
    <a href="/documentation/palette-creator" class="link"
      >Yarn Palette Creator</a
    >. When you're ready, press <span class="font-bold">Palette</span>, then
    <span class="font-bold">Start a Project with It</span>.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="palettes-in-your-yarn" class="text-2xl font-bold">
    Find Palettes in Your Yarn
  </h2>
  <p>
    Other people's palettes are in <span class="font-bold">Get Colors</span>,
    <span class="font-bold">Palette Gallery</span>. To see only those in your
    yarn:
  </p>
  <ol class="ml-6 list-decimal space-y-1">
    <li>Press <span class="font-bold">Filters</span>, and choose your yarn.</li>
    <li>
      Check <span class="font-bold">Only</span> followed by your yarn's name (like
      Only Stylecraft Special DK), so every color is that yarn, not just some.
    </li>
  </ol>
  <p>The same filter is in My Library and the Gallery.</p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="if-something-goes-wrong" class="text-2xl font-bold">
    If Something Goes Wrong
  </h2>
  <h3 class="text-lg font-bold">The yarn looks different in person</h3>
  <p>
    Every screen shows colors a little differently, and each colorway is one
    average color of what's often a mix. Check the real yarn before you buy a
    lot. <a href="/documentation/colors-and-yarn#yarn" class="link"
      >About the yarn colors</a
    >.
  </p>
  <h3 class="text-lg font-bold">A shop link says it's unavailable</h3>
  <p>
    <a href="/documentation/colors-and-yarn#link-unavailable" class="link"
      >Link Unavailable</a
    > explains why, and where to look instead.
  </p>
  <h3 class="text-lg font-bold">The same yarn keeps coming up</h3>
  <p>
    That's your default yarn. Change it in
    <a href="/documentation/library-and-account#preferences" class="link"
      >Preferences</a
    >.
  </p>
</section>

<RelatedReference slugs={['colors-and-yarn', 'palette-creator', 'explore']} />
