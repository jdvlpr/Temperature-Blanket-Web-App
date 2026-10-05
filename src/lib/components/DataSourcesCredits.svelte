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

<!-- Where the app's data comes from, with the licenses' attributions: in the
Documentation's Data Sources & Credits section (the Project menu links there). -->

<script lang="ts">
  import YarnSources from '$lib/components/YarnSources.svelte';
</script>

<div class="flex w-full flex-col items-start gap-2">
  <p class="text-surface-700-300">
    Location data is from <a
      href="https://www.geonames.org/"
      target="_blank"
      rel="noopener noreferrer"
      class="link">Geonames</a
    >
    licensed under
    <a
      href="https://creativecommons.org/licenses/by/2.0/"
      target="_blank"
      rel="noopener noreferrer"
      class="link">CC BY 2.0</a
    >. Weather data from
    <a
      href="https://meteostat.net/"
      target="_blank"
      rel="noopener noreferrer"
      class="link">Meteostat</a
    >
    is licensed under
    <a
      href="https://creativecommons.org/licenses/by-nc/4.0/"
      target="_blank"
      rel="noopener noreferrer"
      class="link">CC BY-NC 4.0</a
    >, with raw data provided by
    <a
      href="https://www.noaa.gov/"
      target="_blank"
      rel="noopener noreferrer"
      class="link">NOAA</a
    >,
    <a
      href="https://www.dwd.de/"
      target="_blank"
      rel="noopener noreferrer"
      class="link">DWD</a
    >
    and
    <a
      href="https://dev.meteostat.net/docs/sources.html"
      target="_blank"
      rel="noopener noreferrer"
      class="link">others</a
    >. Weather data from
    <a
      href="https://www.open-meteo.com"
      rel="noopener noreferrer"
      class="link"
      target="_blank">Open-Meteo</a
    >
    is licenced under
    <a
      href="https://creativecommons.org/licenses/by/4.0/"
      target="_blank"
      class="link"
      rel="noreferrer noopener">Attribution 4.0 International (CC BY 4.0)</a
    >, and includes data from the
    <a
      href="https://cds.climate.copernicus.eu/cdsapp#!/dataset/reanalysis-era5-land?tab=overview"
      rel="noopener noreferrer"
      target="_blank"
      class="link">Copernicus Program</a
    >. Daytime length calculations are by
    <a
      href="https://github.com/mourner/suncalc"
      target="_blank"
      class="link"
      rel="noopener noreferrer">SunCalc</a
    >
    licensed under
    <a
      href="https://choosealicense.com/licenses/bsd-2-clause/"
      target="_blank"
      rel="noopener noreferrer"
      class="link">BSD 2</a
    >. Default color schemes are based on
    <a
      href="https://ColorBrewer2.org"
      target="_blank"
      rel="noopener noreferrer"
      class="link">ColorBrewer2.org</a
    >
    by Cynthia A. Brewer, Geography, Pennsylvania State University, licenced under
    <a
      href="https://www.apache.org/licenses/LICENSE-2.0"
      target="_blank"
      rel="noopener noreferrer"
      class="link">Apache 2</a
    >. Country flag icons are made by
    <a
      href="https://www.freakflagsprite.com/"
      target="_blank"
      class="link"
      rel="noopener noreferrer">Michael P. Cohen.</a
    >
    <a
      href="https://www.apache.org/licenses/LICENSE-2.0"
      target="_blank"
      rel="noopener noreferrer"
      class="link">Apache 2</a
    >.
  </p>
  <YarnSources />
</div>
