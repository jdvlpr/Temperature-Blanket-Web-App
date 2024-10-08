<!-- Copyright (c) 2024, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation, 
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App. 
If not, see <https://www.gnu.org/licenses/>. -->

<script>
  import {
    defaultWeatherSource,
    locations,
    prcp,
    snow,
    weatherParametersInView,
  } from '$lib/stores';
  import { exists, pluralize } from '$lib/utils';
  import { onMount } from 'svelte';

  let isAnyWeatherSourceDifferentFromDefault;
  let stations;

  onMount(() => {
    isAnyWeatherSourceDifferentFromDefault = !$locations?.some(
      (n) => n.source === $defaultWeatherSource,
    );

    if ($prcp.every((n) => n === null)) $weatherParametersInView.prcp = false;
    else $weatherParametersInView.prcp = true;
    if ($snow.every((n) => n === null)) $weatherParametersInView.snow = false;
    else $weatherParametersInView.snow = true;
    $weatherParametersInView = $weatherParametersInView;
  });

  $: stations = $locations
    ?.filter((location) => exists(location.stations))
    ?.map((location) =>
      location.stations.map(
        (station) =>
          `<a href="https://meteostat.net/en/station/${station}?t=${location.from}/${location.to}" target="_blank" rel="noreferrer" class="link">#${station}</a>`,
      ),
    )
    ?.flat();
</script>

<p class="my-2 text-sm">
  {#if $locations?.some((n) => n.source === 'Meteostat') && stations?.length}
    Includes aggregated data from <a
      href="https://meteostat.net/"
      target="_blank"
      rel="noopener noreferrer"
      class="link">Meteostat</a
    >
    {$locations?.length > 1 &&
    $locations?.some((n) => n.source === 'Meteostat') &&
    $locations?.some((n) => n.source === 'Open-Meteo')
      ? `for ${new Intl.ListFormat().format([
          ...new Set(
            $locations
              .filter((n) => n.source === 'Meteostat')
              .map((n) => n.label),
          ),
        ])}`
      : ''}
    using {pluralize({ singular: 'this', plural: 'these' }, stations?.length)}
    {pluralize(
      {
        singular: 'weather station',
        plural: 'weather stations',
      },
      stations?.length,
    )}: {@html stations?.join(', ')}. Stations are sometimes located in areas
    around—not directly in—your location. The accuracy of the results will vary.
  {/if}

  {#if $locations?.some((n) => n.source === 'Open-Meteo')}
    Includes weather data from <a
      href="https://open-meteo.com/"
      rel="noopener noreferrer"
      class="link"
      target="_blank">Open-Meteo</a
    >{$locations?.length > 1 &&
    $locations?.some((n) => n.source === 'Meteostat') &&
    $locations?.some((n) => n.source === 'Open-Meteo')
      ? ` for ${new Intl.ListFormat().format([
          ...new Set(
            $locations
              .filter((n) => n.source === 'Open-Meteo')
              .map((n) => n.label),
          ),
        ])}`
      : ''}.
  {/if}

  Daytime calculations from
  <a
    href="https://github.com/mourner/suncalc"
    target="_blank"
    rel="noopener noreferrer"
    class="link">SunCalc</a
  >.
</p>
