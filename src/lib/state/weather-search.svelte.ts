// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

import { gauges } from '#lib/state/gauges-state.svelte.js';
import { controller, locations } from '#lib/state/location-state.svelte.js';
import { goToProjectSection } from '#lib/state/page-state.svelte.js';
import { weather } from '#lib/state/weather-state.svelte.js';
import type { LocationType } from '#lib/types/location-types.js';
import type { WeatherDay } from '#lib/types/weather-types.js';
import { setSeasonsByLocation } from '#lib/utils/seasons-utils.svelte.js';
import { useStartingPalette } from '#lib/state/starting-palette.js';
import { weatherDays } from '#lib/state/weather-days.svelte.js';
import { toast } from '#lib/state/page-state.svelte.js';
import { projectChanged } from '#lib/storage/autosave.svelte.js';
import { pluralize } from '#lib/utils/string-utils.js';
import {
  addDays,
  dayKey,
  hasValues,
  isoOf,
  mergeNewDays,
  type DeclinedValues,
} from '#lib/utils/weather-days.js';
import type { TISO8601DateString } from '#lib/types/weather-types.js';

/** The weather already there, to put back if the search is cancelled */
type Restore = {
  rawData: WeatherDay[];
  isUserEdited: boolean;
  wasLoadedFromStorage: boolean;
  sources: LocationType['source'][];
};

class AbortedError extends Error {}

/**
 * What a search does: `search` gets every day and replaces the weather (a
 * new project, or new locations, dates or source); `new-days` gets only the
 * days since the last ones got; `again` gets every day again, adds the new
 * ones and asks before changing saved ones.
 */
export type SearchMode = 'search' | 'new-days' | 'again';

/** Each location's days to get, or null to skip it */
type Ranges = ({ from: TISO8601DateString; to: TISO8601DateString } | null)[];

/**
 * Searching for every location's weather data, shown full screen
 * (WeatherSearchOverlay). It can be cancelled at any point, which stops the
 * requests and leaves the project's weather as it was.
 */
class WeatherSearch {
  active = $state(false);
  mode = $state<SearchMode>('search');
  /** The location being searched */
  label = $state('');
  /** Its position in the list */
  index = $state(0);
  /** Why it failed (may contain HTML from the weather API routes) */
  error = $state<string | null>(null);

  #restore: Restore | null = null;
  #onCancel: (() => void) | null = null;

  /**
   * @param onCancel Runs if the search is cancelled or fails, e.g. to put back
   * the weather source settings that started it
   */
  start({
    onCancel,
    mode = 'search',
  }: { onCancel?: () => void; mode?: SearchMode } = {}) {
    if (this.active) return;
    this.mode = mode;
    this.#restore = {
      rawData: $state.snapshot(weather.rawData) as WeatherDay[],
      isUserEdited: weather.isUserEdited,
      wasLoadedFromStorage: weather.wasLoadedFromStorage,
      sources: locations.all.map((location) => location.source),
    };
    this.#onCancel = onCancel ?? null;
    this.error = null;
    this.index = 0;
    this.label = '';
    this.active = true;
    this.#run(new AbortController());
  }

  /** Stops the search (or leaves its error) and puts everything back */
  cancel() {
    if (!this.active) return;
    controller.value?.abort();
    controller.value = null;
    if (!this.error) this.#putBack();
    this.active = false;
    this.error = null;
  }

  #putBack() {
    const restore = this.#restore;
    if (restore) {
      weather.setRawData(restore.rawData);
      weather.isUserEdited = restore.isUserEdited;
      weather.wasLoadedFromStorage = restore.wasLoadedFromStorage;
      locations.all.forEach((location, i) => {
        location.source = restore.sources[i];
      });
    }
    this.#restore = null;
    this.#onCancel?.();
    this.#onCancel = null;
  }

  async #run(abort: AbortController) {
    controller.value = abort;
    const mode = this.mode;
    try {
      const ranges = mode === 'new-days' ? weatherDays.newDays : null;
      const data = await this.#fetchAll(
        abort.signal,
        ranges && withDaysBefore(ranges),
      );
      if (abort.signal.aborted) return;
      controller.value = null;
      this.#restore = null;
      this.#onCancel = null;
      if (mode === 'new-days') {
        this.active = false;
        this.#addNewDays(data, ranges ?? []);
        return;
      }
      if (mode === 'again') {
        this.active = false;
        await this.#searchedAgain(data);
        return;
      }
      weather.setRawData(data);
      weatherDays.got(data, { all: true });
      weatherDays.declined = {};
      // Add the default temperature gauge, with the palette the project was
      // started from, if any
      gauges.addById('temp');
      const startingColors = useStartingPalette();
      const temperature = gauges.allCreated.find((g) => g.id === 'temp');
      if (startingColors && temperature) {
        temperature.updateColors({ colors: startingColors });
        temperature.schemeId = 'Custom';
      }
      weather.isUserEdited = false;
      weather.wasLoadedFromStorage = false;
      this.active = false;
      await goToProjectSection(2, true);
      // Auto-set seasons based on the first location's hemisphere
      setSeasonsByLocation(locations.all[0]);
    } catch (e) {
      // Cancelled: cancel() has already put everything back
      if (abort.signal.aborted) return;
      controller.value = null;
      this.#putBack();
      this.error =
        (e as Error)?.message || 'Something went wrong. Please try again.';
    }
  }

  /**
   * Only gets the days since the last ones got and adds them, without the
   * overlay, as publishing a gallery page does. Aborting it rejects.
   */
  async addNewDaysOnly(abort: AbortController) {
    const ranges = weatherDays.newDays;
    controller.value = abort;
    try {
      const data = await this.#fetchAll(abort.signal, withDaysBefore(ranges));
      if (abort.signal.aborted) return;
      this.#addNewDays(data, ranges, { quiet: true });
    } finally {
      if (controller.value === abort) controller.value = null;
    }
  }

  /** Puts the days just got in place of the blank ones saved for them */
  #addNewDays(
    data: WeatherDay[],
    ranges: Ranges,
    { quiet = false }: { quiet?: boolean } = {},
  ) {
    const added = data.filter((day) => {
      const range = ranges[day.location];
      const date = isoOf(day.date);
      return (
        !!range && date >= range.from && date <= range.to && hasValues(day)
      );
    });
    const locationsGot = ranges.flatMap((range, index) =>
      range ? [index] : [],
    );
    if (added.length) {
      weather.updateRawData(
        mergeNewDays($state.snapshot(weather.rawData) as WeatherDay[], added),
      );
      projectChanged({ weather: true });
    }
    keptWith(() => weatherDays.got(added, { all: false, locationsGot }));
    if (quiet) return;
    toast.trigger({
      category: added.length ? 'success' : 'info',
      message: added.length
        ? `Added ${added.length} new ${pluralize('day', added.length)}.`
        : "No new days yet. The weather source doesn't have them yet; try again later.",
    });
  }

  /**
   * Every day got again: new days go in, and the saved days it got
   * differently are shown to choose from (SearchAgain.svelte).
   */
  async #searchedAgain(data: WeatherDay[]) {
    const before = $state.snapshot(weather.rawData) as WeatherDay[];
    const fetchedThrough = $state.snapshot(
      weatherDays.fetchedThrough,
    ) as (TISO8601DateString | null)[];
    const declined = $state.snapshot(weatherDays.declined) as DeclinedValues;
    const fetchedAt = $state.snapshot(
      weatherDays.fetchedAt,
    ) as (TISO8601DateString | null)[];
    // Days after the last ones got are new: added without asking
    const isNew = (day: WeatherDay) => {
      const through = fetchedThrough[day.location];
      return hasValues(day) && (!through || isoOf(day.date) > through);
    };
    const newDays = data.filter(isNew);
    const saved = newDays.length ? mergeNewDays(before, newDays) : before;
    if (newDays.length) {
      weather.updateRawData(saved);
      projectChanged({ weather: true });
    }
    // Every day was got: early ones are only those still early now. The
    // saved days are as of today only once nothing's left to choose
    keptWith(() => weatherDays.got(data, { all: true, stamp: false }));
    const added = new Set(newDays.map(dayKey)).size;
    const { changesFor, openSearchAgain } =
      await import('#lib/components/modals/search-again.js');
    const result = {
      saved,
      got: data,
      fetchedThrough,
      fetchedAt,
      declined,
      added,
    };
    // Any day that differs, though none changes a color: the dialog says so
    if (changesFor(result, { colorsOnly: false }).length)
      return openSearchAgain(result);
    keptWith(() => weatherDays.stamp());
    toast.trigger({
      category: 'success',
      message: added
        ? `Added ${added} new ${pluralize('day', added)}. Weather data is up to date.`
        : 'Weather data is up to date.',
    });
  }

  /**
   * Only gets the project's weather, without the overlay or anything else a
   * search changes, for drawing a saved project's gallery image. `label` and
   * `index` follow along. Aborting it rejects.
   */
  async fetchOnly(abort: AbortController): Promise<WeatherDay[]> {
    controller.value = abort;
    try {
      return await this.#fetchAll(abort.signal);
    } finally {
      if (controller.value === abort) controller.value = null;
    }
  }

  /** Gets every location's days, or only `ranges` (skipping null ones) */
  async #fetchAll(
    signal: AbortSignal,
    ranges: Ranges | null = null,
  ): Promise<WeatherDay[]> {
    const stopIfCancelled = () => {
      if (signal.aborted) throw new AbortedError();
    };
    let tempAllData: WeatherDay[][] = [];

    for (
      let thisLocation = 0;
      thisLocation < locations.all.length;
      thisLocation += 1
    ) {
      const location = locations.all[thisLocation];
      const range = ranges ? ranges[thisLocation] : undefined;
      if (range === null) {
        // Nothing new here; keeps each location's place in the list
        tempAllData.push([]);
        continue;
      }

      this.label = location.label ?? '';
      this.index = thisLocation;

      if (!location.elevation) {
        // If not a loaded project, the location won't have elevation data

        // Get Location's Altitude
        try {
          const response = await fetch(
            `/api/location/elevation?lat=${location.lat}&lng=${location.lng}`,
            { signal },
          );
          const data = await response.json();

          if (!response.ok) throw new Error(data.message);

          if (data !== null) location.elevation = data;
        } catch (e) {
          stopIfCancelled();
          // Not important enough to stop the search for
          console.log(e);
        }
      }
      stopIfCancelled();

      // Get Weather Data
      const errors = [];
      let continueWhile = true;
      const numberOfWeatherSources = 2;
      while (
        errors.length < numberOfWeatherSources &&
        tempAllData.length === thisLocation &&
        continueWhile
      ) {
        if (weather.source.name === 'Meteostat' || errors.length > 0) {
          try {
            // Since location is a proxy state, and for some reason $state.snapshot doesn't include all the properties,
            // we have to manually copy each property to a new non-proxy object
            const { lat, lng, id, index, elevation } = location;
            const from = range?.from ?? location.from;
            const to = range?.to ?? location.to;

            const _location = { lat, lng, from, to, id, index, elevation };

            const response = await fetch('/api/weather/v1/meteostat/daily', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                location: _location,
              }),
              signal,
            });

            let data = await response.json();

            if (data?.message) throw Error(data.message);

            data = data.map((day: Record<string, any>) => {
              return {
                ...day,
                date: new Date(day.date),
              };
            });

            tempAllData.push(data);

            location.source = 'Meteostat';
          } catch (error) {
            stopIfCancelled();
            errors.push(error);
          }
        }

        if (
          (errors.length > 0 && !weather.source.useSecondary) ||
          (errors.length && weather.source.name === 'Open-Meteo')
        )
          continueWhile = false;

        if (
          (weather.source.name === 'Open-Meteo' || errors.length > 0) &&
          continueWhile
        ) {
          try {
            // Uses the controller's signal
            const data = await weather.getOpenMeteo({
              location: range ? requestFor(location, range) : location,
            });
            tempAllData.push(data);
            location.source = 'Open-Meteo';
          } catch (error) {
            stopIfCancelled();
            errors.push(error);
          }
        }

        if (errors.length > 0 && !weather.source.useSecondary)
          continueWhile = false;
      }

      if (tempAllData.length === thisLocation && errors.length > 0)
        throw errors[0];

      // pauses before the next location request in order to avoid being blacklisted from the meteostat API
      await new Promise((resolve) => setTimeout(resolve, 502));
      stopIfCancelled();
    }
    const allData = tempAllData.flat();
    allData.sort((a, b) => +a.date - +b.date); // Sort by date, regardless of location
    tempAllData = [];
    return allData;
  }
}

/**
 * Runs a change to what's known about the days, and saves it with the
 * project when it changed (so a settled early day isn't offered again on
 * the next open, though nothing else changed)
 */
function keptWith(change: () => void) {
  const before = JSON.stringify(weatherDays.toStored());
  change();
  if (JSON.stringify(weatherDays.toStored()) !== before)
    projectChanged({ weather: true });
}

/**
 * New days' ranges starting up to two weeks sooner (not before the
 * location's From date): days a source doesn't have yet come back blank, and
 * a request of only blank days fails as if the place had no weather.
 */
function withDaysBefore(ranges: Ranges): Ranges {
  return ranges.map((range, index) => {
    if (!range) return null;
    const from = locations.all[index]?.from;
    const sooner = addDays(range.from, -14);
    return { from: from && from > sooner ? from : sooner, to: range.to };
  });
}

/**
 * A location as getOpenMeteo() reads it, for only some of its days. A plain
 * copy, so what it sets (stations) stays off the location.
 */
function requestFor(
  location: LocationType,
  range: { from: TISO8601DateString; to: TISO8601DateString },
): LocationType {
  const { lat, lng, id, index, elevation, label } = location;
  return { lat, lng, id, index, elevation, label, ...range } as LocationType;
}

export const weatherSearch = new WeatherSearch();
