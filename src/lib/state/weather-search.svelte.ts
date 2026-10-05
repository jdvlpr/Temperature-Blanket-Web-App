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

import { gauges } from '$lib/state/gauges-state.svelte';
import { controller, locations } from '$lib/state/location-state.svelte';
import { goToProjectSection } from '$lib/state/page-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import type { LocationType } from '$lib/types/location-types';
import type { WeatherDay } from '$lib/types/weather-types';
import { setSeasonsByLocation } from '$lib/utils/seasons-utils.svelte';

/** The weather already there, to put back if the search is cancelled */
type Restore = {
  rawData: WeatherDay[];
  isUserEdited: boolean;
  wasLoadedFromStorage: boolean;
  sources: LocationType['source'][];
};

class AbortedError extends Error {}

/**
 * Searching for every location's weather data, shown full screen
 * (WeatherSearchOverlay). It can be cancelled at any point, which stops the
 * requests and leaves the project's weather as it was.
 */
class WeatherSearch {
  active = $state(false);
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
  start({ onCancel }: { onCancel?: () => void } = {}) {
    if (this.active) return;
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
    try {
      const data = await this.#fetchAll(abort.signal);
      if (abort.signal.aborted) return;
      controller.value = null;
      weather.setRawData(data);
      // Add the default temperature gauge
      gauges.addById('temp');
      weather.isUserEdited = false;
      weather.wasLoadedFromStorage = false;
      this.#restore = null;
      this.#onCancel = null;
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

  async #fetchAll(signal: AbortSignal): Promise<WeatherDay[]> {
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
            const { lat, lng, from, to, id, index, elevation } = location;

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
            const data = await weather.getOpenMeteo({ location });
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

export const weatherSearch = new WeatherSearch();
