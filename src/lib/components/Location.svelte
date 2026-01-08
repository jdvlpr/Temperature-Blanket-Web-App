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
  import { browser } from '$app/environment';
  import { MONTHS } from '$lib/constants';
  import { dialog, locations, project, toast, weather } from '$lib/state';
  import { safeSlide } from '$lib/features/transitions/safeSlide';
  import type { LocationType } from '$lib/types/location-types';
  import {
    dateToISO8601String,
    displayGeoNamesErrorMessage,
    getSuggestions,
    pluralize,
    renderResult,
    stringToDate,
    yearFrom,
  } from '$lib/utils';
  import {
    EllipsisVerticalIcon,
    MapIcon,
    MapPinIcon,
    SearchIcon,
    Trash2Icon,
    TriangleAlertIcon,
    XIcon,
  } from '@lucide/svelte';
  import { Popover, Portal, useTooltip } from '@skeletonlabs/skeleton-svelte';
  import autocomplete from 'autocompleter';
  import { onMount } from 'svelte';
  import '../../css/flag-icons.css';
  import LocationDetails from './modals/LocationDetails.svelte';

  const id = $props.id();
  const tooltip = useTooltip({ id });

  interface Props {
    location: LocationType;
    index: number;
  }

  let { location, index }: Props = $props(); // Default index in locationsState.locations

  const years = createYears();

  let inputLocation: HTMLInputElement = $state();
  let inputStart: HTMLInputElement = $state();
  let inputEnd: HTMLInputElement = $state();
  let locationGroup: HTMLElement;

  let year = $state(getLastYear());
  let month = $state(1);
  let day = $state(1);

  let searching = $state(false); // Are the autocomplete results fetching?
  let hasLoaded = $state(false); // If the location was loaded from a saved project, then this gets set to true. It gets checked so that the initial setup function doesn't run again.

  let showResetKey = $state(false);
  // Weather or not the clear input text button should appear
  let showReset = $derived.by(() => {
    showResetKey;
    return (
      (!searching && inputLocation?.value?.length > 1) ||
      (!searching && location?.label)
    );
  });

  onMount(() => {
    if (!location?.from && !location?.to) setDates({});
  });

  let showSelectLocationLabelMessage = $derived(
    !location?.id && location?.label && !project.status.loading,
  );

  let days = $derived(getDays(month, year));

  let datesMustBeHistorical = $derived(
    weather.source.name === 'Open-Meteo' &&
      location.daysInFuture >= 1 &&
      !weather.source.useSecondary,
  );

  $effect(() => {
    if (day > days) day = 1;
  });

  // If the location was loaded from a saved project, then this gets run to setup initial variables.
  // 'hasLoaded' gets checked so that the initial setup function doesn't run again. This is important because otherwise it would get called on every keystroke.
  // NOTE: This is a bit of a hack, but it works.
  $effect(() => {
    if (location?.wasLoadedFromSavedProject && !hasLoaded) {
      location.duration = location?.duration || 'c';

      if (location?.from) {
        const from = stringToDate(location.from);
        year = from.getUTCFullYear();
        month = from.getUTCMonth() + 1;
        day = from.getUTCDate();
      }

      hasLoaded = true;
    }
  });

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

        // remove whitespace
        text = text.trim();

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
      onSelect: function (item) {
        location.label = item?.label;
        location.result = item?.result;
        location.id = item?.id;
        location.lat = item?.lat;
        location.lng = item?.lng;
        location.lng = item?.lng;
        location.elevation = null;
        location.fclName = item?.fclName;
        location.flagIcon = item?.flagIcon;
        location.population = item?.population;
      },
    });
  }); // End of onMount

  function validate() {
    if (weather.isUserEdited > 0) return;

    weather.rawData = [];

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

    if (inputLocation.value?.length < 2) {
      invalidate();
      return;
    }
  }

  // Listen for backspace keypress, in which case invalidate the location
  function validateKeyup(e) {
    if (e.key === 'Backspace') {
      invalidate();
    }
  }

  function invalidate() {
    location.id = undefined;
    location.lat = undefined;
    location.lng = undefined;
  }

  function createYears() {
    const min = 1920 - 1;
    const _years = [];
    for (let i = new Date().getUTCFullYear(); i > min; i--) _years.push(i);
    return _years;
  }

  function setDates({ from = null, to = null, unsetWeather = true }) {
    if (unsetWeather) weather.rawData = [];
    let setDate = new Date(year, month - 1, day, 1);
    const _padFromMonth = String(setDate.getUTCMonth() + 1).padStart(2, '0');
    const _padFromDate = String(setDate.getUTCDate()).padStart(2, '0');
    from = from || `${year}-${_padFromMonth}-${_padFromDate}`;

    if (location.duration === 'y') {
      let yearFromSetDate = yearFrom(setDate);
      const _padToMonth = String(yearFromSetDate.getUTCMonth() + 1).padStart(
        2,
        '0',
      );
      const _padToDate = String(yearFromSetDate.getUTCDate()).padStart(2, '0');
      to =
        to ||
        `${yearFromSetDate.getUTCFullYear()}-${_padToMonth}-${_padToDate}`;
    }

    location.from = from;
    location.to = to;
  }

  // Get's the date of yesterday to set the max date
  function getYesterday() {
    const yesterday = new Date(
      new Date().setUTCDate(new Date().getUTCDate() - 1),
    );
    return dateToISO8601String(yesterday);
  }

  function getLastYear() {
    const currentYear = new Date().getUTCFullYear(); // 2020
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

<div class="grid grid-cols-1 items-end justify-center gap-4 py-2">
  {#if locations.all?.length > 1}
    <div class="justify-self-end">
      <Popover>
        <Popover.Trigger
          class="btn-icon hover:preset-tonal"
          title="Location Options"
        >
          <EllipsisVerticalIcon />
        </Popover.Trigger>
        <Portal>
          <Popover.Positioner>
            <Popover.Content
              class="bg-surface-200-800 rounded-container z-50 flex items-center justify-center gap-2 p-2 shadow-xl"
            >
              {#snippet element(attributes)}
                {#if !attributes.hidden}
                  <div {...attributes} transition:safeSlide>
                    <Popover.Description>
                      <button
                        class="btn hover:preset-tonal"
                        onclick={() => {
                          locations.remove(location.uuid);
                          weather.rawData = [];
                        }}
                        disabled={weather.isUserEdited > 0 ||
                          project.status.loading}
                        title="Remove Location"
                      >
                        <Trash2Icon />
                        <p>
                          Remove Location {index + 1}
                        </p>
                      </button>
                    </Popover.Description>
                    <Popover.Arrow
                      style="--arrow-size: calc(var(--spacing) * 4); --arrow-background: var(--color-surface-200-800);"
                    >
                      <Popover.ArrowTip />
                    </Popover.Arrow>
                  </div>
                {/if}
              {/snippet}
            </Popover.Content>
          </Popover.Positioner>
        </Portal>
      </Popover>
    </div>
  {/if}
  <div class="grid grid-cols-1 gap-4">
    <div class="flex w-full flex-col gap-1 text-left">
      <p>
        {#if showSelectLocationLabelMessage}
          <span class="text-error-900-100">Choose a result</span>
        {:else if locations.all.length > 1 && location?.label}
          Location {locations.all.length > 1 ? index + 1 : ''}
        {:else}
          Search for a city, region, or landmark
        {/if}
      </p>
      <div
        class={['input-group grid-cols-[auto_1fr_auto]']}
        bind:this={locationGroup}
      >
        <div class="ig-cell">
          <SearchIcon />
        </div>
        <input
          type="text"
          id="location-{location.uuid}"
          class="ig-input truncate"
          autocomplete="off"
          placeholder={project.status.loading ? 'Loading...' : 'Enter a place'}
          title="Enter a city, region, or landmark"
          bind:value={location.label}
          bind:this={inputLocation}
          oninput={validate}
          onkeyup={validateKeyup}
          disabled={project.status.loading || weather.isUserEdited > 0}
        />
        {#if searching}
          <div class="ig-cell flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="size-6 animate-spin"
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
        {:else if showReset}
          <button
            class="ig-btn hover:preset-tonal"
            title="Reset Location Search"
            disabled={!!weather.isUserEdited}
            onclick={() => {
              if (weather.isUserEdited) return;
              showResetKey = !showResetKey;
              weather.rawData = [];
              inputLocation.value = '';
              inputLocation.focus();
              location.label = '';
              invalidate();
              location.result = '';
              if (document.querySelector('.autocomplete'))
                document.querySelector('.autocomplete').remove();
            }}
          >
            <XIcon />
          </button>
        {:else if project.geolocationAvailable}
          <button
            class="ig-btn hover:preset-tonal"
            title="Use My Location"
            disabled={!!weather.isUserEdited}
            onclick={async () => {
              searching = true;
              inputLocation.placeholder = 'Requesting your location...';

              async function success(position) {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                const response = await fetch(
                  `/api/location/near?lat=${encodeURIComponent(latitude)}&lng=${encodeURIComponent(longitude)}`,
                );

                const data = await response.json();

                if (!response.ok || !data.geonames || !data.geonames[0]) {
                  toast.trigger({
                    category: 'error',
                    message: data.message,
                  });
                  searching = false;
                  inputLocation.placeholder = 'Enter a place';
                  return;
                }

                const suggestions = getSuggestions(data.geonames);

                const first = suggestions[0];

                inputLocation.value = first.label;

                location.elevation = first.elevation;
                location.fclName = first.fclName;
                location.flagIcon = first.flagIcon;
                location.population = first.population;
                location.lat = first.lat;
                location.lng = first.lng;
                location.id = first.id;
                location.result = first.result;
                location.label = first.label;

                searching = false;
                inputLocation.placeholder = 'Enter a place';
              }

              async function error() {
                let message = 'Unable to retrieve your location';
                if (navigator.permissions && navigator.permissions.query) {
                  const result = await navigator.permissions.query({
                    name: 'geolocation',
                  });

                  if (result.state === 'denied')
                    message =
                      '<div class="flex flex-col">Unable to retrieve your location. <span class="text-xs">Location services may disabled for this site in your browser, or there was some other problem.</span></div>';

                  if (result.state === 'prompt')
                    message =
                      '<div class="flex flex-col">Unable to retrieve your location.<span class="text-xs">Location permission may not have been granted for this site in your browser, or there was some other problem.</span></div>';
                }

                toast.trigger({
                  category: 'error',
                  message,
                });

                searching = false;
                inputLocation.placeholder = 'Enter a place';
              }

              navigator.geolocation.getCurrentPosition(success, error);
            }}
          >
            <MapPinIcon /> <span class="hidden sm:inline">My Location</span>
          </button>
        {/if}
      </div>
      {#if location.id && location.lat && location.lng}
        <button
          class="btn hover:preset-tonal w-fit text-xs opacity-50 hover:opacity-100"
          onclick={() => {
            dialog.trigger({
              type: 'component',
              component: {
                ref: LocationDetails,
                props: { location },
              },
            });
          }}
        >
          <MapIcon class="inline size-4" />
          Details
        </button>
      {/if}
    </div>

    <div
      class="grid w-full grid-cols-12 items-start justify-between gap-4 text-left"
    >
      {#if location.duration != 'c'}
        <div
          class="col-span-12 grid grid-cols-3 items-center justify-between gap-4 sm:col-span-6"
        >
          <label class="label">
            <span> Year </span>
            <select
              class="select"
              bind:value={year}
              id={`choose-year-${location.uuid}`}
              title="Choose a Year"
              disabled={!!weather.isUserEdited || project.status.loading}
              onchange={() => {
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
              id={`choose-month-${location.uuid}`}
              title="Choose a Month"
              disabled={!!weather.isUserEdited || project.status.loading}
              onchange={() => {
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
              id={`choose-day-${location.uuid}`}
              title="Choose a Day"
              disabled={!!weather.isUserEdited || project.status.loading}
              onchange={() => setDates({})}
            >
              {#each Array(days) as _, i}
                <option value={i + 1}>{i + 1}</option>
              {/each}
            </select>
          </label>
        </div>
      {/if}
      {#if location?.duration === 'c'}
        <div
          class="col-span-12 grid grid-cols-2 items-center justify-between gap-4 sm:col-span-6"
        >
          <label for="datepicker-from-{location.uuid}" class="">
            <span>From</span>
            <input
              type="date"
              class="input"
              data-type="from"
              id="datepicker-from-{location.uuid}"
              title="Choose a Start Date"
              max={getYesterday()}
              bind:value={location.from}
              bind:this={inputStart}
              onchange={() => (weather.rawData = [])}
              disabled={project.status.loading || !!weather.isUserEdited}
            />
          </label>
          <label for="datepicker-to-{location.uuid}" class="">
            <span>To</span>
            <input
              type="date"
              class="input"
              data-type="to"
              id="datepicker-to-{location.uuid}"
              placeholder="Choose end date"
              title="Choose an End Date"
              max={getYesterday()}
              bind:value={location.to}
              bind:this={inputEnd}
              onchange={() => (weather.rawData = [])}
              disabled={project.status.loading || !!weather.isUserEdited}
            />
          </label>
        </div>
      {/if}

      <label class="label col-span-8 w-full sm:col-span-4 sm:col-start-9">
        <span>Duration</span>
        <select
          class="select w-full"
          id={`duration-${location.uuid}`}
          bind:value={location.duration}
          disabled={!!weather.isUserEdited || project.status.loading}
          onchange={() => {
            if (location?.duration === 'y') {
              year = stringToDate(location.from).getUTCFullYear();
              month = stringToDate(location.from).getUTCMonth() + 1;
              day = stringToDate(location.from).getUTCDate();
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

    <div class="flex w-full flex-col items-center justify-center gap-2">
      {#if !location.errorMessage && location.days}
        <p class="text-sm">
          {location.days}
          {pluralize('Day', location.days)}
        </p>
        {#if location.daysInFuture}
          <p
            class="text-warning-800-200 rounded-container my-2 w-full p-2 text-sm"
          >
            <TriangleAlertIcon class="relative -top-[1px] inline size-4" />

            {#if !datesMustBeHistorical}
              For best results, don't include future dates.
            {/if}
            {location.daysInFuture} of these days
            {pluralize(
              {
                singular: 'is',
                plural: 'are',
              },
              location.daysInFuture,
            )}
            not in the past and won't have weather data.
            {#if datesMustBeHistorical}
              All the dates must be in the past.
            {/if}
          </p>
        {/if}
      {:else if location.errorMessage && browser}
        <p
          class="text-warning-800-200 rounded-container my-2 w-full p-2 text-sm"
        >
          <TriangleAlertIcon class="relative -top-[1px] inline size-4" />
          {location.errorMessage}
        </p>
      {:else if project.status.loading}
        <p class="animate-pulse text-sm">...</p>
      {/if}
    </div>
  </div>
</div>
