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
  import { ICONS, NO_DATA_SRTM3 } from '$lib/constants';
  import { project } from '$lib/state';
  import { displayGeoNamesErrorMessage } from '$lib/utils';
  import autocomplete from 'autocompleter';
  import { onMount } from 'svelte';
  import '../../css/flag-icons.css';
  import { weatherState } from './+page.svelte';
  import { fetchData } from './GetWeather.svelte';
  import { MapPinIcon, SearchIcon, XIcon } from '@lucide/svelte';

  let searching = $state(false); // Autocomplete searching status
  let showReset = $state(false);
  let locationGroup = $state();

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

          const suggestions = data.geonames.map((item) => {
            let labelText = item.name;

            if (
              item.adminName1 !== '' &&
              item?.countryName &&
              item.adminName1 === item.countryName
            ) {
              labelText += `, ${item.adminName1}`;
            } else if (item.adminName1 !== '' && item?.countryName) {
              labelText += `, ${item.adminName1}, ${item.countryName}`;
            }

            let icon = '';

            if (item.countryCode)
              icon = `<span class="fflag fflag-${item.countryCode.toUpperCase()}"></span>`;

            function formatFeatureName(fclName) {
              let _featureName = fclName;
              // remove '...'
              if (_featureName.includes('...')) {
                _featureName = _featureName.replace(/\.../g, '');
              }

              // remove spaces
              _featureName = _featureName.trim();

              // remove last ','
              if (_featureName.slice(-1) === ',') {
                _featureName = _featureName.slice(0, -1);
              }

              // split and join
              _featureName = _featureName
                .split(',')
                .map((n) => n.trim())
                .join(', ');

              if (_featureName.includes('city')) {
                // 'city, village'
                _featureName =
                  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2 size-4 inline -top-[2px] relative mr-1"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg> ` +
                  _featureName;
              } else if (_featureName.includes('parks')) {
                // 'parks, area'
                _featureName =
                  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-tree-pine size-4 inline -top-[2px] relative mr-1"><path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/></svg> ` +
                  _featureName;
              } else if (_featureName.includes('mountain')) {
                // 'mountain, hill, rock'
                _featureName =
                  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-mountain size-4 inline -top-[2px] relative mr-1"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg> ` +
                  _featureName;
              } else if (_featureName.includes('spot')) {
                // 'spot, building, farm'
                _featureName =
                  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pin-check-inside size-4 inline -top-[2px] relative mr-1"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><path d="m9 10 2 2 4-4"/></svg> ` +
                  _featureName;
              } else if (_featureName.includes('stream')) {
                // 'stream, lake'
                _featureName =
                  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-waves size-4 inline -top-[2px] relative mr-1"><path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/></svg> ` +
                  _featureName;
              }

              return _featureName;
            }

            const featureName = formatFeatureName(item.fclName);

            return {
              // adminName: item.adminName1,
              // country: item.countryName,
              id: item.geonameId,
              label: labelText,
              lng: item.lng,
              lat: item.lat,
              result: `${icon} ${labelText}`,
              fclName: featureName,
              population: item.population,
              // name: item.name,
              // value: result
            };
          });

          update(suggestions);
        } catch (error) {
          displayGeoNamesErrorMessage(error);
        }

        searching = false;
      },
      render: function (item) {
        const div = document.createElement('div');
        div.innerHTML = `<p>${item.result}</p>`;
        if (item.fclName)
          div.innerHTML += `<p class="text-xs opacity-50 mt-1">${item.fclName}</p>`;
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
  <div class="flex w-full flex-col gap-1 text-left">
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

  {#if browser && navigator.geolocation}
    <button
      class="btn hover:preset-tonal flex items-center gap-1"
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
