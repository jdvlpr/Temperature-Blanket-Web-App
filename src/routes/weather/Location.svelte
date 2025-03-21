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

<script module>
  // Validates location id

  class WeatherLocationState {
    validId = $state(false);
    inputLocation = $state(null);
  }

  export const weatherLocationState = new WeatherLocationState();
</script>

<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { NO_DATA_SRTM3 } from '$lib/constants';
  import { project } from '$lib/state';
  import {
    displayGeoNamesErrorMessage,
    getSuggestions,
    renderResult,
  } from '$lib/utils';
  import { MapPinIcon, SearchIcon, XIcon } from '@lucide/svelte';
  import autocomplete from 'autocompleter';
  import { onMount } from 'svelte';
  import '../../css/flag-icons.css';
  import { weatherState } from './+page.svelte';
  import { fetchData } from './GetWeather.svelte';

  let searching = $state(false); // Autocomplete searching status
  let showReset = $state(false);
  let locationGroup = $state();

  let navigatorAvailable = $state(true);

  $effect(() => {
    if (weatherLocationState.inputLocation) {
      showReset =
        !searching && weatherLocationState.inputLocation?.value?.length > 1;
    }
  });

  let hasError = $derived(
    !weatherLocationState.validId &&
      weatherLocationState.inputLocation?.value &&
      !project.status.loading,
  );

  onMount(async () => {
    if (!navigator.geolocation) {
      navigatorAvailable = false;
    }
    // Setup the autocomplete location
    autocomplete({
      input: weatherLocationState.inputLocation,
      minLength: 2,
      debounceWaitMs: 550,
      showOnFocus: false,
      emptyMsg: 'Trouble getting location. Please search again.',
      customize: function (input, inputRect, container, maxHeight) {
        const group = locationGroup.getBoundingClientRect();
        container.style.width = `${group.width}px`;
        container.style.left = `${group.left}px`;
      },
      fetch: async function (text, update) {
        searching = true;

        try {
          const response = await fetch(
            `/api/location/search/${encodeURIComponent(text)}`,
          );

          const data = await response.json();

          if (!response.ok) throw new Error(data.message);

          const suggestions = getSuggestions(data.geonames);

          update(suggestions);
        } catch (error) {
          displayGeoNamesErrorMessage(error);
        }

        searching = false;
      },
      render: function (item) {
        const div = document.createElement('div');
        div.innerHTML = renderResult(item);
        return div;
      },
      onSelect: async function (item) {
        if (
          !weatherState.weatherLocations.some(
            (location) => location.id === +item.id,
          )
        ) {
          weatherState.weatherLocations.unshift(item);
        }
        await fetchData();
        weatherState.activeLocationID = item.id;
        weatherLocationState.inputLocation.value = '';
        weatherLocationState.validId = true;
      },
    });
    const id = page.url.searchParams.get('id');
    if (id) {
      await setLocationFromId({ id });
    } else {
      weatherLocationState.validId = true;
      project.status.loading = false;
    }
  }); // End of onMount

  function validate() {
    if (
      !weatherState.weatherLocations?.find(
        (item) => item.id === weatherState.activeLocationID,
      )?.id
    ) {
      weatherLocationState.validId = false;
      return;
    }

    if (weatherLocationState.inputLocation?.value?.length < 2) {
      invalidate();
      return;
    }
  }

  function validateKeyup(e) {
    if (!e) {
      weatherLocationState.validId = true;
      return;
    }

    if (e.key === 'Backspace') {
      invalidate();
    }
  }

  function invalidate() {
    weatherLocationState.validId = false;
  }

  const setLocationFromId = async ({ id }) => {
    weatherLocationState.inputLocation.value = 'Loading...';

    // Get location information from GeoNames using the location's id
    try {
      const response = await fetch(`/api/location/${id}`);

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      const label = `${data.name}, ${data.adminName1}, ${data.countryName}`;
      const _location = {};
      _location.id = +id;
      _location.lat = data.lat;
      _location.lng = data.lng;

      if (data.srtm3 !== NO_DATA_SRTM3) _location.elevation = data.srtm3; // TODO: I think this is handled in the server endpoint, check if it is ok to remove.

      _location.label = label;
      _location.result = `<span class="fflag fflag-${data.countryCode?.toUpperCase()}"></span>${label}`;
      weatherLocationState.inputLocation.value = '';

      if (!weatherState.weatherLocations.map((item) => item.id).includes(+id))
        weatherState.weatherLocations.unshift(_location);

      weatherState.activeLocationID = +id;
      await fetchData();
      weatherLocationState.validId = true;
    } catch (e) {
      throw displayGeoNamesErrorMessage(e);
    }
  };

  const setLocationFromCoords = async ({ coords }) => {
    try {
      const response = await fetch(
        `/api/location/near?lat=${encodeURIComponent(coords.latitude)}&lng=${encodeURIComponent(coords.longitude)}`,
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      const geonames = data.geonames[0];
      const _location = {};
      _location.id = +geonames.geonameId;
      _location.lat = geonames.lat;
      _location.lng = geonames.lng;
      // _location.elevation = geonames.srtm3; // Elevation not necessary for weather forecast location, only for a location for a project
      const label = `${geonames.name}, ${geonames.adminName1}, ${geonames.countryName}`;
      _location.label = label;
      _location.result = `<span class="fflag fflag-${geonames.countryCode?.toUpperCase()}"></span>${label}`;

      if (
        !weatherState.weatherLocations
          .map((item) => item.id)
          .includes(+geonames.geonameId)
      )
        weatherState.weatherLocations.unshift(_location);

      weatherState.activeLocationID = +geonames.geonameId;

      await fetchData();

      weatherLocationState.validId = true;
    } catch (error) {
      displayGeoNamesErrorMessage(error);
    }
  };
</script>

<div class="flex flex-wrap items-end justify-center gap-x-4 gap-y-2 py-2">
  <div class="flex w-full max-w-screen-sm flex-col gap-1 text-left">
    <p>
      {#if hasError}
        <span class="text-error-900-100">Choose a result</span>
      {:else if weatherLocationState.inputLocation?.value}
        Location
      {:else}
        Search for a city, region, or landmark
      {/if}
    </p>
    <div
      class="input-group grid-cols-[auto_1fr_auto]"
      bind:this={locationGroup}
    >
      <div class="ig-cell">
        <SearchIcon />
      </div>
      <input
        type="text"
        id="location-0"
        class="ig-input truncate"
        autocomplete="off"
        placeholder={project.status.loading ? 'Loading...' : 'Enter a place'}
        title="Enter a city, region, or landmark"
        bind:this={weatherLocationState.inputLocation}
        oninput={validate}
        onkeyup={validateKeyup}
        disabled={project.status.loading}
      />
      {#if searching}
        <div class="flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="mx-2 size-6 animate-spin"
            viewBox="0 0 24 24"
          >
            <g fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M12 19a7 7 0 1 0 0-14a7 7 0 0 0 0 14Zm0 3c5.523 0 10-4.477 10-10S17.523 2 12 2S2 6.477 2 12s4.477 10 10 10Z"
                clip-rule="evenodd"
                opacity=".2"
              />
              <path d="M2 12C2 6.477 6.477 2 12 2v3a7 7 0 0 0-7 7H2Z" />
            </g>
          </svg>
        </div>
      {/if}

      {#if showReset}
        <button
          class="ig-btn hover:preset-tonal"
          title="Reset Location Search"
          onclick={async () => {
            weatherLocationState.inputLocation.value = '';
            // $location.label = "";
            // $location.id = null;
            weatherLocationState.validId = false;
            if (document.querySelector('.autocomplete'))
              document.querySelector('.autocomplete').remove();
            await goto('?');
            weatherLocationState.inputLocation.focus();
          }}
        >
          <XIcon />
        </button>
      {/if}
    </div>
  </div>

  {#if navigatorAvailable}
    <button
      class="btn hover:preset-tonal relative flex items-center gap-1 lg:-top-1"
      title="Use My Location"
      onclick={async () => {
        weatherLocationState.inputLocation.value = 'Loading...';
        navigator.geolocation.getCurrentPosition(
          async (response) => {
            await setLocationFromCoords({
              coords: response.coords,
            });
            weatherLocationState.inputLocation.value = '';
          },
          (error) => {
            weatherLocationState.inputLocation.value = '';
          },
        );
      }}
    >
      <MapPinIcon />
      Use My Location
    </button>
  {/if}
</div>
