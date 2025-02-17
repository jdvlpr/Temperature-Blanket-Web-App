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

<script lang="ts">
  import {
    controller,
    gauges,
    locations,
    modal,
    signal,
    weather,
  } from '$lib/state';
  // Note: the signal store is a weird necessity, investigate this
  import { delay, getOpenMeteo, goToProjectSection } from '$lib/utils';
  import { ProgressRing } from '@skeletonlabs/skeleton-svelte';
  import Spinner from '../Spinner.svelte';

  let title = $state('Searching...');

  // Index of the location which is currently getting weather data
  let currentIndex = $state(0);

  let error = $state(false);

  getWeatherData();

  async function getWeatherData() {
    controller.value = new AbortController();
    weather.rawData = [];
    weather.currentIndex = 0;
    await fetchData()
      .then(() => {
        controller.value = null;
        weather.isUserEdited = false;
        weather.isFromLocalStorage = false;
        // Add the default temperature gauge
        gauges.addById('temp');
        goToProjectSection(2);
        modal.close();
      })
      .catch((e) => {
        controller.value = null;
        weather.rawData = [];
        weather.isUserEdited = false;
        weather.isFromLocalStorage = false;
        error = e?.message;
      });
  }

  async function fetchData() {
    let tempAllData = [];

    for (
      let thisLocation = 0;
      thisLocation < locations.all.length;
      thisLocation += 1
    ) {
      let location = locations.all[thisLocation];

      title = location.label;
      currentIndex = thisLocation;
      // Setup Weather Data Object

      if (!location.elevation) {
        // If not a loaded project, the location won't have elevation data

        // Get Location's Altitude
        try {
          const response = await fetch(
            `/api/location/elevation?lat=${location.lat}&lng=${location.lng}`,
          );
          const data = await response.json();

          if (!response.ok) throw new Error(data.message);

          if (data !== null) location.elevation = data;
        } catch (e) {
          // I don't have a nice way to handle these errors at the moment; but I don't think it's super important either.
          // Opening a modal would interfere with the Getting Weather modal
          console.log(e);
        }
      }

      // Get Weather Data
      const errors = [];
      let continueWhile = true;
      const numberOfWeatherSources = 2;
      while (
        errors.length < numberOfWeatherSources &&
        tempAllData.length === thisLocation &&
        continueWhile
      ) {
        if (weather.defaultSource === 'Meteostat' || errors.length > 0) {
          try {
            // Since location is a proxy state, and for some reason $state.snapshot doesn't include all the properties,
            // we have to manually get each property and make a new non-proxy object
            const { lat, lng, from, to, id, index } = location;

            const _location = { lat, lng, from, to, id, index };

            const response = await fetch('/api/weather/v1/meteostat/daily', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                location: _location,
              }),
              signal: signal.value,
            });

            let data = await response.json();

            if (data?.message) throw Error(data.message);

            data = data.map((day) => {
              return {
                ...day,
                date: new Date(day.date),
              };
            });

            tempAllData.push(data);

            location.source = 'Meteostat';
          } catch (error) {
            errors.push(error);
          }
        }

        if (
          (errors.length > 0 && !weather.useSecondarySources) ||
          (errors.length && weather.defaultSource === 'Open-Meteo')
        )
          continueWhile = false;

        if (
          (weather.defaultSource === 'Open-Meteo' || errors.length > 0) &&
          continueWhile
        ) {
          try {
            const data = await getOpenMeteo({ location });
            tempAllData.push(data);
            location.source = 'Open-Meteo';
          } catch (error) {
            errors.push(error);
          }
        }

        if (errors.length > 0 && !weather.useSecondarySources)
          continueWhile = false;
      }

      if (tempAllData.length === thisLocation && errors.length > 0)
        throw errors[0];

      await delay(502); // pauses before the next location request in order to avoid being blacklisted from the meteostat API
    }
    tempAllData = tempAllData.flat();
    tempAllData.sort((a, b) => a.date - b.date); // Sort by date, regardless of location
    weather.rawData = tempAllData;
    tempAllData = null;
  }
</script>

<div class="flex flex-col items-center text-center w-full p-4">
  {#if signal.value && !error}
    <Spinner size="36" />

    <p class="font-bold text-xl my-4">Searching for Weather Data</p>

    <p class="mb-4 flex flex-col items-center">
      <span> {title}</span>

      {#if locations.all.length > 1}
        <span class="flex flex-col items-center mt-2 w-full gap-1">
          <progress value={currentIndex + 1} max={locations.all.length}
          ></progress>
          <span class="text-xs">
            {Math.round(((currentIndex + 1) / locations.all.length) * 100)}%
          </span>
        </span>
      {/if}
    </p>
  {/if}

  {#if error}
    <div class="mt-4">{@html error}</div>
  {/if}
</div>
