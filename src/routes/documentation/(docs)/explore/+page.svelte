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

<!-- Explore: the sidebar's Explore links (AppNavigation) besides the
Gallery, which has its own page, and the Globe (opened from the Gallery). -->

<script lang="ts">
  import RelatedGuides from '#lib/components/docs/RelatedGuides.svelte';
</script>

<p>
  Beyond planning a blanket, the site has tools to find yarn, look at the weather
  ahead, and see blankets from around the world. They're under
  <span class="font-bold">Explore</span> in the site menu, with the
  <a href="/documentation/gallery-and-ravelry" class="link">Gallery</a>.
</p>

<section class="flex flex-col gap-3">
  <h2 id="yarn-colorway-finder" class="text-2xl font-bold">
    Yarn Colorway Finder
  </h2>
  <p>
    <a href="/yarn-colorway-finder" class="link">Yarn Colorways</a> finds yarn by
    color, without starting a project.
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>Choose a brand and yarn, or browse them all.</li>
    <li>
      Search by a color: type a hex code, or pick a color from a photo with the
      image button beside the color field. Photos stay on your device.
    </li>
    <li>
      <span class="font-bold">Filters</span> narrow it down by yarn weight and
      colorway name.
    </li>
    <li>
      Sort the results, and switch between a grid and a list. Each colorway's ⋮ has
      its shop link and copies its name or hex code.
    </li>
  </ul>
  <p>
    The colors are close, not exact: see <a
      href="/documentation/colors-and-yarn#yarn"
      class="link">About the Yarn Colors</a
    >.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="weather-forecast" class="text-2xl font-bold">Weather Forecast</h2>
  <p>
    <a href="/weather" class="link">Weather Forecast</a> shows the coming days for
    any place: an hourly and a daily forecast. Add places to
    <span class="font-bold">Locations</span> to switch between them, and change the
    units in <span class="font-bold">Settings</span>.
  </p>
  <p>
    It's for looking ahead. A temperature blanket uses past weather, which comes
    from the <a href="/documentation/weather" class="link">Project Planner</a>.
  </p>
</section>

<section class="flex flex-col gap-3">
  <h2 id="globe" class="text-2xl font-bold">Globe</h2>
  <p>
    The <a href="/globe" class="link">Globe</a> is a 3D map of projects in the gallery,
    at the places they were made for. Open it from the Gallery.
  </p>
  <ul class="ml-6 list-disc space-y-1">
    <li>Drag to turn it, and pinch or scroll to zoom in.</li>
    <li>
      Search for a place or project, or browse the list of places in view (on
      phones, swipe it up from the bottom).
    </li>
    <li>Press a marker to see the projects there.</li>
  </ul>
</section>

<RelatedGuides slugs={['match-your-yarn', 'publish-and-share']} />
