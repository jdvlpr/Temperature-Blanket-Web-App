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
  import Tooltip from '$lib/components/Tooltip.svelte';
  import { ICONS, MAXIMUM_DAYS_PER_LOCATION, MONTHS } from '$lib/constants';
  import {
    defaultWeatherSource,
    isCustomWeather,
    isProjectLoading,
    locations,
    useSecondaryWeatherSources,
    weatherUngrouped,
  } from '$lib/stores';
  import {
    dateToISO8601String,
    displayGeoNamesErrorMessage,
    getToday,
    numberOfDays,
    pluralize,
    yearFrom,
  } from '$lib/utils';
  import autocomplete from 'autocompleter';
  import { onMount } from 'svelte';
  import { derived, writable } from 'svelte/store';
  import '../../css/flag-icons.css';

  export let index: number = 0; // Default index in $locations

  const years = createYears();

  let inputLocation: HTMLInputElement, inputStart, inputEnd; // Bindings to elements
  let locationGroup;
  let year = getLastYear();
  let month = 1;
  let day = 1;

  let searching = false; // Are the autocomplete results fetching?
  let showReset = false; // Should the clear input button appear?
  let hasLoaded = false; // If the location was loaded from a saved project, then this gets set to true. It gets checked so that the initial setup function doesn't run again.

  let datesDetails = derived(locations, ($locations) => {
    if (!$locations[index]) return { isValid: false };
    if (!$locations[index].from || !$locations[index].to)
      return { isValid: false };
    const from = new Date($locations[index].from.replace(/-/g, '/'));
    const to = new Date($locations[index].to.replace(/-/g, '/'));
    const today = getToday();

    if (!from || !to) return { isValid: false };
    if (from >= today)
      return {
        isValid: false,
        message: 'The starting date must be at least one day in the past.',
      };

    let daysInFuture = null;
    if (to >= today) daysInFuture = numberOfDays(today, to);

    let length = numberOfDays(from, to);

    if (length > MAXIMUM_DAYS_PER_LOCATION)
      return {
        isValid: false,
        length,
        daysInFuture,
        message: `Please select a maximum of ${MAXIMUM_DAYS_PER_LOCATION} days. You've selected ${length} days.`,
      };
    if (length < 1)
      return {
        isValid: false,
        length,
        daysInFuture,
        message: `It looks like the selected end date comes before the selected start date. Please select an end date which comes after the start date.`,
      };
    return {
      isValid: true,
      length,
      daysInFuture,
    };
  });

  let validId = writable(false);
  let validDates = derived(
    datesDetails,
    ($datesDetails) => $datesDetails.isValid,
  );

  // Is Valid Location ID and Dates
  let valid = derived([validId, validDates], ([$validId, $validDates], set) => {
    set($validId && $validDates);
  });

  $: $locations[index].valid = $valid;

  $: if (inputLocation) {
    showReset =
      (!searching && inputLocation.value?.length > 1) ||
      (!searching && $locations[index]?.label);
    if (!$locations[index]?.from && !$locations[index]?.to) setDates({});
  }

  $: hasError =
    !$validId &&
    !$locations[index]?.id &&
    $locations[index]?.label &&
    !$isProjectLoading;

  $: days = getDays(month, year);

  $: datesMustBeHistorical =
    $defaultWeatherSource === 'Open-Meteo' &&
    $datesDetails?.daysInFuture >= 1 &&
    !$useSecondaryWeatherSources;

  $: if (day > days) day = 1;

  // If the location was loaded from a saved project, then this gets run to setup initial variables.
  // 'hasLoaded' gets checked so that the initial setup function doesn't run again. This is important because otherwise it would get called on every keystroke.
  // NOTE: This is a bit of a hack, but it works.
  // TODO: Find a better way to do this. putting it in onMount is too early, I believe
  $: if ($locations[index]?.wasLoadedFromSavedProject && !hasLoaded) {
    $validId = true;
    $locations[index].valid = true;
    $locations[index].duration = $locations[index]?.duration || 'c';

    if ($locations[index]?.from) {
      const from = new Date($locations[index].from.replace(/-/g, '/'));
      year = from.getFullYear();
      month = from.getMonth() + 1;
      day = from.getDate();
    }

    hasLoaded = true;
  }

  onMount(() => {
    // Setup the autocomplete location
    autocomplete({
      input: inputLocation,
      minLength: 2,
      debounceWaitMs: 550,
      showOnFocus: false,
      emptyMsg: 'Trouble getting location. Please search again.',
      customize: function (input, inputRect, container, maxHeight) {
        const group = locationGroup.getBoundingClientRect();
        container.style.width = `${group.width}px`;
        container.style.left = `${group.left}px`;
        // container.style.marginTop = "0.5rem";
      },
      fetch: async function (text, update) {
        // If a user input changes the text after the fetch is triggered but before the `debouceWaitMs` time is up,
        // the text could become an empty string or less than two characters,
        // in which case we don't want to make a request.
        if (!text || text.length < 2) return;

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
              id: item.geonameId,
              label: labelText,
              lng: item.lng,
              lat: item.lat,
              result: `<span class="fflag fflag-${item.countryCode.toUpperCase()}"></span> ${labelText}`,
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
        div.innerHTML = `${item.result}`;
        return div;
      },
      onSelect: function (item) {
        $locations[index].label = item?.label;
        $locations[index].result = item?.result;
        $locations[index].id = item?.id;
        $locations[index].lat = item?.lat;
        $locations[index].lng = item?.lng;
        $locations[index].elevation = null;
        $validId = true;
      },
    });
  }); // End of onMount

  // Removes location
  function remove() {
    let _locations = [...$locations];
    _locations.splice(index, 1);
    _locations = _locations.map((location, i) => {
      location.index = i;
      return { ...location };
    });

    $locations = _locations;
  }

  function validate() {
    if ($isCustomWeather) return;

    $weatherUngrouped = null;

    const value = inputLocation.value;

    // Check to see if the user has selected the location input text,
    // which happens when a user "selects all" in the input field in order to search for a new location)
    let hasUserSelectedInputValue = false;
    if (typeof window.getSelection != 'undefined')
      hasUserSelectedInputValue = window.getSelection().toString() === value;

    // If the input has at least two characters and it is not selected, show the searching icon
    if (value.length > 1 && !hasUserSelectedInputValue) {
      searching = true;
    } else {
      searching = false;
    }

    if (!$locations[index]?.id) {
      $validId = false;
      return;
    }

    if (inputLocation.value?.length < 2) {
      invalidate();
      return;
    }
  }

  // Listen for backspace keypress, in which case invalidate the location
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
    locations.clearAutocompleteData(index);
  }

  function createYears() {
    const min = 1920 - 1;
    const _years = [];
    for (let i = new Date().getFullYear(); i > min; i--) _years.push(i);
    return _years;
  }

  function setDates({ from = null, to = null, unsetWeather = true }) {
    if (unsetWeather) $weatherUngrouped = null;
    let setDate = new Date(year, month - 1, day, 1);
    const _padFromMonth = String(setDate.getMonth() + 1).padStart(2, '0');
    const _padFromDate = String(setDate.getDate()).padStart(2, '0');
    from = from || `${year}-${_padFromMonth}-${_padFromDate}`;

    if ($locations[index].duration === 'y') {
      let yearFromSetDate = yearFrom(setDate);
      const _padToMonth = String(yearFromSetDate.getMonth() + 1).padStart(
        2,
        '0',
      );
      const _padToDate = String(yearFromSetDate.getDate()).padStart(2, '0');
      to =
        to || `${yearFromSetDate.getFullYear()}-${_padToMonth}-${_padToDate}`;
    }

    $locations[index].from = from;
    $locations[index].to = to;

    if ($locations[index]?.id) $validId = true;
  }

  // Get's the date of yesterday to set the max date
  function getYesterday() {
    const yesterday = new Date().setDate(new Date().getDate() - 1);
    return dateToISO8601String(yesterday);
  }

  function getLastYear() {
    const currentYear = new Date().getFullYear(); // 2020
    const previousYear = currentYear - 1;
    return previousYear;
  }

  /**
   * Returns the number of days in a given month and year, taking into account leap years.
   *
   * @param {number} _month - The month as a number (1-12).
   * @param {number} _year - The year.
   * @returns {number} - The number of days in the given month and year.
   */
  function getDays(_month, _year) {
    switch (_month) {
      case 1:
      case 3:
      case 5:
      case 7:
      case 8:
      case 10:
      case 12:
        return 31;
      case 4:
      case 6:
      case 9:
      case 11:
        return 30;
      case 2:
        const isLeap = (_year % 4 == 0 && _year % 100 != 0) || _year % 400 == 0;
        if (isLeap) return 29;
        return 28;
      default:
        return 30;
    }
  }
</script>

<div class="py-2 grid grid-cols-1 items-end gap-4 justify-center">
  {#if $locations?.length > 1}
    <div class="justify-self-end">
      <Tooltip placement="bottom" minWidth="250px">
        <div class="btn-icon bg-secondary-hover-token">
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
              d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
            />
          </svg>
        </div>
        <div class="flex items-center gap-2 justify-center" slot="tooltip">
          <button
            class="btn bg-secondary-hover-token"
            on:click={() => {
              remove();
              $weatherUngrouped = null;
            }}
            disabled={!!$isCustomWeather || $isProjectLoading}
            title="Remove Location"
          >
            {@html ICONS.trash}
            <p>
              Remove Location {index + 1}
            </p>
          </button>
        </div>
      </Tooltip>
    </div>
  {/if}
  <div class="grid grid-cols-1 gap-4">
    <div class="flex flex-col w-full text-left gap-1">
      <p>
        {#if hasError}
          <span class="text-error-800-100-token">Choose a result</span>
        {:else if $locations.length > 1 && $locations[index]?.label}
          Location {$locations.length > 1 ? index + 1 : ''}
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
          id="location-{index}"
          class="truncate"
          autocomplete="off"
          placeholder={$isProjectLoading ? 'Loading...' : 'Enter a place'}
          title="Enter a city, region, or landmark"
          bind:value={$locations[index].label}
          bind:this={inputLocation}
          on:input={validate}
          on:keyup={validateKeyup}
          disabled={$isProjectLoading || !!$isCustomWeather}
        />
        {#if searching}
          <div class="flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-8 animate-spin"
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
            disabled={!!$isCustomWeather}
            on:click={() => {
              if ($isCustomWeather) return;
              $weatherUngrouped = null;
              inputLocation.value = '';
              inputLocation.focus();
              $locations[index].label = '';
              $locations[index].id = '';
              $locations[index].lat = '';
              $locations[index].lng = '';
              $locations[index].result = '';
              $validId = false;
              if (document.querySelector('.autocomplete'))
                document.querySelector('.autocomplete').remove();
            }}
          >
            {@html ICONS.xMark}
          </button>
        {/if}
      </div>
    </div>

    <div
      class="grid grid-cols-12 justify-between items-start gap-4 text-left w-full"
    >
      {#if $locations[index].duration != 'c'}
        <div
          class="grid grid-cols-3 justify-between items-center gap-4 col-span-12 sm:col-span-6"
        >
          <label class="label">
            <span> Year </span>
            <select
              class="select"
              bind:value={year}
              id={`choose-year-${index}`}
              title="Choose a Year"
              disabled={!!$isCustomWeather || $isProjectLoading}
              on:change={() => {
                setDates({});
              }}
            >
              {#each years as year}
                <option value={year}>{year}</option>
              {/each}
            </select>
          </label>

          <label class="label">
            <span>Month</span>
            <select
              class="select"
              bind:value={month}
              id={`choose-month-${index}`}
              title="Choose a Month"
              disabled={!!$isCustomWeather || $isProjectLoading}
              on:change={() => {
                setDates({});
              }}
            >
              {#each MONTHS as { value, shortName }}
                <option {value}>{shortName}</option>
              {/each}
            </select>
          </label>

          <label class="label">
            <span>Day</span>
            <select
              class="select"
              bind:value={day}
              id={`choose-day-${index}`}
              title="Choose a Day"
              disabled={!!$isCustomWeather || $isProjectLoading}
              on:change={() => setDates({})}
            >
              {#each Array(days) as _, i}
                <option value={i + 1}>{i + 1}</option>
              {/each}
            </select>
          </label>
        </div>
      {/if}
      {#if $locations[index]?.duration === 'c'}
        <div
          class="grid grid-cols-2 justify-between items-center gap-4 col-span-12 sm:col-span-6"
        >
          <label for="datepicker-from-{index}" class="">
            <span>From</span>
            <input
              type="date"
              class="input"
              data-type="from"
              id="datepicker-from-{index}"
              title="Choose a Start Date"
              max={getYesterday()}
              bind:value={$locations[index].from}
              bind:this={inputStart}
              on:change={() => ($weatherUngrouped = null)}
              disabled={$isProjectLoading || !!$isCustomWeather}
            />
          </label>
          <label for="datepicker-to-{index}" class="">
            <span>To</span>
            <input
              type="date"
              class="input"
              data-type="to"
              id="datepicker-to-{index}"
              placeholder="Choose end date"
              title="Choose an End Date"
              max={getYesterday()}
              bind:value={$locations[index].to}
              bind:this={inputEnd}
              on:change={() => ($weatherUngrouped = null)}
              disabled={$isProjectLoading || !!$isCustomWeather}
            />
          </label>
        </div>
      {/if}

      <label class="label w-full col-span-8 sm:col-span-4 sm:col-start-9">
        <span>Duration</span>
        <select
          class="select w-full"
          id={`duration-${index}`}
          bind:value={$locations[index].duration}
          disabled={!!$isCustomWeather || $isProjectLoading}
          on:change={() => {
            if ($locations[index]?.duration === 'y') {
              year = new Date(
                $locations[index].from.replace(/-/g, '/'),
              ).getFullYear();
              month =
                new Date($locations[index].from.replace(/-/g, '/')).getMonth() +
                1;
              day = new Date(
                $locations[index].from.replace(/-/g, '/'),
              ).getDate();
              setDates({});
            }
          }}
          title="Select a duration"
        >
          <option value="y" selected>One Year</option>
          <option value="c">Custom</option>
        </select>
      </label>
    </div>

    <div class="w-full flex flex-col gap-2 justify-center items-center">
      {#if $datesDetails.isValid && $datesDetails?.length}
        <p class="italic text-sm">
          {$datesDetails?.length}
          {pluralize('Day', $datesDetails?.length)}
        </p>
        {#if $datesDetails.daysInFuture}
          <p
            class="text-sm variant-ghost-warning text-token rounded-container-token p-2 w-full my-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-4 h-4 inline mr-1"
              viewBox="0 0 24 24"
              ><path
                fill="currentColor"
                d="M7 20h4c0 1.1-.9 2-2 2s-2-.9-2-2m-2-1h8v-2H5zm11.5-9.5c0 3.82-2.66 5.86-3.77 6.5H5.27c-1.11-.64-3.77-2.68-3.77-6.5C1.5 5.36 4.86 2 9 2s7.5 3.36 7.5 7.5m-2 0C14.5 6.47 12.03 4 9 4S3.5 6.47 3.5 9.5c0 2.47 1.49 3.89 2.35 4.5h6.3c.86-.61 2.35-2.03 2.35-4.5m6.87-2.13L20 8l1.37.63L22 10l.63-1.37L24 8l-1.37-.63L22 6zM19 6l.94-2.06L22 3l-2.06-.94L19 0l-.94 2.06L16 3l2.06.94z"
              /></svg
            >

            {#if !datesMustBeHistorical}
              For best results, don't include future dates.
            {/if}
            {$datesDetails.daysInFuture} of these days
            {pluralize(
              {
                singular: 'is',
                plural: 'are',
              },
              $datesDetails.daysInFuture,
            )}
            not in the past and won't have weather data.
            {#if datesMustBeHistorical}
              All the dates must be in the past.
            {/if}
          </p>
        {/if}
      {:else if $datesDetails.message}
        <p
          class="variant-ghost-error text-token rounded-container-token p-2 text-sm w-full my-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="w-4 h-4 inline"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          {$datesDetails.message}
        </p>
      {:else if $isProjectLoading}
        <p class="italic text-sm">...</p>
      {/if}
    </div>
  </div>
</div>
