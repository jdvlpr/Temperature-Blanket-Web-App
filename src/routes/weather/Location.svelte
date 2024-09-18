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
  // Validates location id
  export let validId = writable(false);
  export let inputLocation = writable(null);
</script>

<script lang="ts">
  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { ICONS, NO_DATA_SRTM3 } from '$lib/constants';
  import { isProjectLoading } from '$lib/stores';
  import { displayGeoNamesErrorMessage } from '$lib/utils';
  import autocomplete from 'autocompleter';
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import '../../css/flag-icons.css';
  import { activeLocationID, locations } from './+page.svelte';
  import { fetchData } from './GetWeather.svelte';

  let searching = false; // Autocomplete searching status
  let showReset = false;
  let locationGroup;

  $: if ($inputLocation) {
    showReset = !searching && $inputLocation?.value?.length > 1;
  }

  $: hasError = !$validId && $inputLocation?.value && !$isProjectLoading;

  onMount(async () => {
    // Setup the autocomplete location
    autocomplete({
      input: $inputLocation,
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
            let labelText;
            if (item.adminName1 === item.countryName) {
              labelText = `${item.name}, ${item.adminName1}`;
            } else {
              labelText = `${item.name}, ${item.adminName1}, ${item.countryName}`;
            }
            return {
              // adminName: item.adminName1,
              // country: item.countryName,
              id: +item.geonameId,
              label: labelText,
              lng: item.lng,
              lat: item.lat,
              result: `<span class="fflag fflag-${item.countryCode.toUpperCase()}"></span> ${labelText}`,
              // name: item.name,
              // value: result
            };
          });

          update(suggestions);
        } catch (e) {
          displayGeoNamesErrorMessage(e);
        }

        searching = false;
      },
      render: function (item) {
        const div = document.createElement('div');
        div.innerHTML = `${item.result}`;
        return div;
      },
      onSelect: async function (item) {
        if (!$locations.some((location) => location.id === +item.id)) {
          $locations.unshift(item);
        }
        await fetchData();
        $activeLocationID = item.id;
        $inputLocation.value = '';
        $validId = true;
      },
    });
    const id = $page.url.searchParams.get('id');
    if (id) {
      await setLocationFromId({ id });
    } else {
      $validId = true;
      $isProjectLoading = false;
    }
  }); // End of onMount

  function validate() {
    if (!$locations?.find((item) => item.id === $activeLocationID)?.id) {
      $validId = false;
      return;
    }

    if ($inputLocation?.value?.length < 2) {
      invalidate();
      return;
    }
  }

  function validateKeyup(e) {
    if (!e) {
      $validId = true;
      return;
    }

    if (e.key === 'Backspace') {
      invalidate();
    }
  }

  function invalidate() {
    $validId = false;
  }

  const setLocationFromId = async ({ id }) => {
    $inputLocation.value = 'Loading...';

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
      $inputLocation.value = '';

      if (!$locations.map((item) => item.id).includes(+id))
        $locations.unshift(_location);

      $activeLocationID = +id;
      await fetchData();
      $validId = true;
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

      if (!$locations.map((item) => item.id).includes(+geonames.geonameId))
        $locations.unshift(_location);

      $activeLocationID = +geonames.geonameId;

      await fetchData();

      $validId = true;
    } catch (error) {
      displayGeoNamesErrorMessage(error);
    }
  };
</script>

<div class="py-2 flex flex-wrap items-end gap-y-2 gap-x-4 justify-center">
  <div class="flex flex-col w-full text-left gap-1">
    <p>
      {#if hasError}
        <span class="text-error-800-100-token">Choose a result</span>
      {:else if $inputLocation?.value}
        Location
      {:else}
        Search for a city, region, or landmark
      {/if}
    </p>
    <div
      class="input-group input-group-divider grid-cols-[auto_1fr_auto]"
      bind:this={locationGroup}
    >
      <div class="input-group-shim">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="w-6 h-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>
      <input
        type="text"
        id="location-0"
        class="truncate"
        autocomplete="off"
        placeholder={$isProjectLoading ? 'Loading...' : 'Enter a place'}
        title="Enter a city, region, or landmark"
        bind:this={$inputLocation}
        on:input={validate}
        on:keyup={validateKeyup}
        disabled={$isProjectLoading}
      />
      {#if searching}
        <div class="flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="w-8 h-8 animate-spin"
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
          class=""
          title="Reset Location Search"
          on:click={async () => {
            $inputLocation.value = '';
            // $location.label = "";
            // $location.id = null;
            $validId = false;
            if (document.querySelector('.autocomplete'))
              document.querySelector('.autocomplete').remove();
            // $weatherData = null;
            await goto('?');
            $inputLocation.focus();
          }}
        >
          {@html ICONS.xMark}
        </button>
      {/if}
    </div>
  </div>

  {#if browser && navigator.geolocation}
    <button
      class="btn bg-secondary-hover-token gap-1 flex items-center"
      title="Use My Location"
      on:click={async () => {
        $inputLocation.value = 'Loading...';
        navigator.geolocation.getCurrentPosition(
          async (response) => {
            await setLocationFromCoords({
              coords: response.coords,
            });
            $inputLocation.value = '';
          },
          (error) => {
            $inputLocation.value = '';
          },
        );
      }}
      ><svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
        />
      </svg>
      Use My Location
    </button>
  {/if}
</div>
