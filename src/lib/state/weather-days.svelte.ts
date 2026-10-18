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

import { locations } from '#lib/state/location-state.svelte.js';
import { weather } from '#lib/state/weather-state.svelte.js';
import type {
  TISO8601DateString,
  WeatherDay,
} from '#lib/types/weather-types.js';
import {
  earlyDaysIn,
  localToday,
  utcToday,
  fetchedThroughNow,
  lastDayWithValues,
  newDaysRange,
  settledEarlyDays,
  type DayKey,
  type DeclinedValues,
  type EarlyDays,
  type StoredWeatherDays,
} from '#lib/utils/weather-days.js';

/** Where a location's days came from */
export { localToday };

const sourceOf = (index: number) =>
  locations.all[index]?.source ?? weather.source.name;

/** What the weather was got for: the locations' places and dates, and the source */
const inputsKey = () =>
  JSON.stringify({
    locations: locations.all.map(({ id, from, to }) => [id, from, to]),
    source: [
      weather.source.name,
      weather.source.useSecondary,
      weather.source.settings,
    ],
  });

/**
 * What the open project knows about its weather days, kept with it when
 * saved: how far each location's days were got, which were early, and the
 * newer values someone chose not to use. Opening a saved project never gets
 * its weather again; this says what a later search may add or change.
 */
class WeatherDays {
  /** Each location's last day got (null: none) */
  fetchedThrough = $state<(TISO8601DateString | null)[]>([]);
  early = $state<EarlyDays>({});
  declined = $state<DeclinedValues>({});
  /** What the days were got for; null until there are days */
  #basis = $state<string | null>(null);

  /** Whether the days still fit the locations' dates and the source */
  current = $derived(this.#basis !== null && this.#basis === inputsKey());

  /** The days each location can get now that it hasn't */
  newDays = $derived.by(() => {
    if (!this.current || weather.isUserEdited) return [];
    const today = localToday();
    return locations.all.map((location, index) =>
      location.from && location.to
        ? newDaysRange({
            from: location.from,
            to: location.to,
            fetchedThrough: this.fetchedThrough[index] ?? null,
            today,
          })
        : null,
    );
  });

  newDaysCount = $derived(
    this.newDays.reduce((sum, range) => sum + (range?.days ?? 0), 0),
  );

  /** Whether any location's days go on past yesterday */
  ongoing = $derived(
    locations.all.some(
      (location) => !!location.to && location.to >= localToday(),
    ),
  );

  /** Days got for these locations and source: a search compares them, rather than replacing them */
  canSearchAgain = $derived(
    !weather.isUserEdited && weather.rawData.length > 0 && this.current,
  );

  /** Still going, or not caught up: new days to get as well */
  offersNewDays = $derived(
    this.canSearchAgain && (this.ongoing || this.newDaysCount > 0),
  );

  /** Early days whose values have settled since, which a search may change */
  settledEarly = $derived.by((): DayKey[] => {
    if (!this.current || weather.isUserEdited) return [];
    return settledEarlyDays(this.early, localToday(), sourceOf);
  });

  /** Starts over: a new project, or one with no days yet */
  reset() {
    this.fetchedThrough = [];
    this.early = {};
    this.declined = {};
    this.#basis = null;
  }

  /**
   * The days now loaded (saved, or from a gallery page) are the project's:
   * what was kept about them, or what their values show for projects saved
   * before that was kept.
   */
  loaded(days: WeatherDay[], stored?: Partial<StoredWeatherDays> | null) {
    this.fetchedThrough = locations.all.map(
      (_, index) =>
        stored?.fetchedThrough?.[index] ?? lastDayWithValues(days, index),
    );
    this.early = { ...stored?.early };
    this.declined = { ...stored?.declined };
    this.markCurrent();
  }

  /**
   * Days were just got: every day of every location (`all`, a search), or
   * only the new days of `locationsGot`. A location's days count as got
   * through its last day with values, so days its source doesn't have yet
   * are offered again later.
   */
  got(
    data: WeatherDay[],
    { all, locationsGot }: { all: boolean; locationsGot?: number[] },
  ) {
    const today = localToday();
    const todayUTC = utcToday();
    const through = all ? [] : [...this.fetchedThrough];
    locations.all.forEach((location, index) => {
      const fetched = all || !!locationsGot?.includes(index);
      const last = fetched ? lastDayWithValues(data, index) : null;
      if (!last || !location.to) {
        through[index] = all ? null : (through[index] ?? null);
        return;
      }
      const cap = fetchedThroughNow({
        to: location.to,
        source: sourceOf(index),
        today,
        todayUTC,
      });
      through[index] = last < cap ? last : cap;
    });
    this.fetchedThrough = through;
    const early = earlyDaysIn(data, today, sourceOf);
    this.early = all ? early : { ...this.early, ...early };
    this.markCurrent();
  }

  /** The days were just got for the locations and source as they are now */
  markCurrent() {
    this.#basis = inputsKey();
  }

  /** What's kept with the saved project */
  toStored(): StoredWeatherDays {
    return $state.snapshot({
      fetchedThrough: this.fetchedThrough,
      early: this.early,
      declined: this.declined,
    }) as StoredWeatherDays;
  }
}

export const weatherDays = new WeatherDays();
