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

<script context="module">
  import { isProjectLoading, signal, units } from '$lib/stores';
  import { get } from 'svelte/store';
  import { activeLocationID, locations } from './+page.svelte';

  export async function fetchData() {
    isProjectLoading.set(true);

    let _locations = get(locations);

    // Update All Locations
    let newWeatherForcastData = [];
    for (let index = 0; index < _locations.length; index++) {
      let location = _locations[index];

      const needsUpdate = needsRefresh({
        date1: new Date(),
        date2: new Date(location.update_time),
      });
      if (needsUpdate || location.units !== units.value) {
        try {
          const data = await getOpenMeteoForecast({ location });
          location.source = 'Open-Meteo';
          // savedLocation.current_weather = data.current_weather;
          location.update_time = new Date().toUTCString();
          location.units = units.value;
          location.data = data;
        } catch (error) {
          throw error;
        }
      }
      newWeatherForcastData.push(location);
    }

    locations.set(newWeatherForcastData);

    isProjectLoading.set(false);

    if (!get(activeLocationID)) activeLocationID.set(get(locations)[0]?.id);
  }

  const getOpenMeteoForecast = async ({ location }) => {
    let url = 'https://api.open-meteo.com/v1/forecast';
    url += `?latitude=${location.lat}&longitude=${location.lng}`;
    // const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "auto";
    let temperatureUnit = 'celsius';
    let windspeedUnit = 'kmh';
    let precipitationUnit = 'mm';

    if (units.value === 'imperial') {
      temperatureUnit = 'fahrenheit';
      windspeedUnit = 'mph';
      precipitationUnit = 'inch';
    }

    url += `&hourly=temperature_2m,precipitation_probability,cloudcover,apparent_temperature,weathercode,is_day&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,rain_sum,snowfall_sum,precipitation_probability_max,weathercode&current_weather=true&temperature_unit=${temperatureUnit}&windspeed_unit=${windspeedUnit}&precipitation_unit=${precipitationUnit}&timezone=auto&forecast_days=7`;

    const response = await fetch(url, { signal: get(signal) });

    if (response.status === 503) {
      // Service Temporarily Unavailable
      throw new Error(
        '<p class="font-bold text-xl my-4">Service Temporarily Unavailable</p><p class="mt-4">Please try again.</p>',
      );
    }

    const data = await response.json();

    if (data?.error === true) {
      console.log({ data });
    }

    if (!response.ok) {
      // Request Failed with HTTP code ${response.status}
      throw new Error(
        `<p class="font-bold text-xl my-4">Something Went Wrong</p>
      <p>A search request for weather data from <span class="font-bold">${location.label}</span> was sent to <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" class="link">Open-Meteo.com</a>, but the response returned an error.</p>
                            <p class="my-4">Try again with a different location.</p>
                            <p class="italic text-sm">Error status code: ${response.status}</p>
                            <p class="mt-4 text-5xl font-ornament">i</p>`,
      );
    }

    if (!data?.hourly) {
      // No data returned from meteostat
      throw new Error(
        '<p class="font-bold text-xl my-4">Something Went Wrong</p><p class="mt-4">There appears to be insufficient weather data, please try a different location.</p>',
      );
    }

    if (data.hourly?.temperature_2m.every((value) => value === null)) {
      // Empty data
      throw new Error(
        '<p class="font-bold text-xl my-4">Something Went Wrong</p><p class="mt-4">There appears to be insufficient weather data, please try a different location.</p>',
      );
    }
    return data;
  };

  const needsRefresh = ({ date1, date2 }) => {
    const msDiff = date1 - date2;
    const thirtyMin = 60000 * 30;
    const hourDiff = Math.abs(date1.getUTCHours() - date2.getUTCHours());
    return msDiff > thirtyMin || hourDiff > 0;
  };
</script>
