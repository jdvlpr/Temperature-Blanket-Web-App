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

<!-- Data Sources & Credits: DataSourcesCredits (shared with the rest of the
site, with every yarn's source) plus what it doesn't cover: the Globe's
imagery (globe-imagery.ts) and random photos (GetPaletteFromImage). -->

<script lang="ts">
  import DataSourcesCredits from '#lib/components/DataSourcesCredits.svelte';
  import RelatedGuides from '#lib/components/docs/RelatedGuides.svelte';
</script>

<p>
  Temperature Blanket is built on open data and open-source work. Thank you to
  everyone behind it.
</p>

<section class="flex flex-col gap-3">
  <h2 id="data-sources" class="text-2xl font-bold">
    Weather, Places and Colors
  </h2>
  <DataSourcesCredits />
</section>

<section class="flex flex-col gap-3">
  <h2 id="more-credits" class="text-2xl font-bold">Also</h2>
  <ul class="ml-6 list-disc space-y-1">
    <li>
      The <a href="/globe" class="link">Globe</a>'s imagery is NASA's Blue
      Marble and Landsat WELD, from
      <a
        href="https://earthdata.nasa.gov/gibs"
        target="_blank"
        rel="noopener noreferrer"
        class="link">NASA EOSDIS GIBS</a
      > (public domain).
    </li>
    <li>
      Random photos in <span class="font-bold">From an Image</span> come from
      <a
        href="https://unsplash.com"
        target="_blank"
        rel="noopener noreferrer"
        class="link">Unsplash</a
      >, through
      <a
        href="https://picsum.photos"
        target="_blank"
        rel="noopener noreferrer"
        class="link">Lorem Picsum</a
      >, with each photographer credited under the photo.
    </li>
    <li>
      Yarn colors are worked out from each colorway's own photos:
      <a
        href="/documentation/colors-and-yarn#getting-yarn-colorway-data"
        class="link">how yarn colors are made</a
      >.
    </li>
    <li>
      The site's code is free software, under the GNU General Public License,
      <a
        href="https://github.com/jdvlpr/Temperature-Blanket-Web-App"
        target="_blank"
        rel="noopener noreferrer"
        class="link">on GitHub</a
      >.
    </li>
  </ul>
</section>

<RelatedGuides slugs={['weather-doesnt-match']} />
