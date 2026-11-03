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

import { weather } from '#lib/state/weather-state.svelte.js';
import { projectChanged } from '#lib/storage/autosave.svelte.js';
import type { TISO8601DateString } from '#lib/types/weather-types.js';
import {
  dayOf,
  lastDays,
  madeThroughOf,
  nextDay,
  previousDay,
  progressOf,
  projectDates,
  type StoredProgress,
} from '#lib/utils/project-progress.js';

/**
 * How far the open project's blanket is made: a date, kept with the project
 * when saved (and synced), never in its link, so a link or a copy starts at
 * Not started. Show Progress (kept per project too) dims the preview's days
 * not made yet.
 */
class ProgressState {
  madeThrough = $state<TISO8601DateString | null>(null);
  show = $state(false);

  /** The project's days, each once, in order */
  dates = $derived(projectDates(weather.rawData));
  first = $derived(this.dates[0] ?? null);
  last = $derived(this.dates.at(-1) ?? null);

  progress = $derived(progressOf(weather.rawData, this.madeThrough));

  /** +1 day: the next of the project's days, or null once finished */
  next = $derived(nextDay(this.dates, this.madeThrough));

  /** −1 day: the one before, or null (not started) from the first */
  previous = $derived(previousDay(this.dates, this.madeThrough));

  /** Each of the preview's days (or weeks): its last day, made once that is */
  #lastDays = $derived(
    lastDays(weather.data, weather.rawData, weather.grouping),
  );

  /** The preview's days (or weeks) not made yet, once progress is set */
  unmadeAll = $derived.by(() => {
    const madeThrough = this.madeThrough;
    if (!madeThrough) return [];
    const indexes: number[] = [];
    this.#lastDays.forEach((last, index) => {
      if (last > madeThrough) indexes.push(index);
    });
    return indexes;
  });

  /** The preview's days (or weeks) by `location|YYYY-MM-DD` of their
   * start, as the weather table's rows: each one's last day */
  #lastDayByKey = $derived(
    new Map(
      weather.data.map((entry, index) => [
        `${entry.location}|${dayOf(entry.date)}`,
        this.#lastDays[index],
      ]),
    ),
  );

  /** A weather table row (`location|YYYY-MM-DD`): its last day, and
   * whether it's made */
  rowOf(key: string): { day: TISO8601DateString; made: boolean } | null {
    const day = this.#lastDayByKey.get(key);
    if (!day) return null;
    return { day, made: !!this.madeThrough && day <= this.madeThrough };
  }

  /** Whether the preview's day (or week) at `index` is made */
  isMadeAt(index: number): boolean {
    const last = this.#lastDays[index];
    return !!this.madeThrough && !!last && last <= this.madeThrough;
  }

  /** The preview's day (or week) at `index`: its last day, as progress */
  lastDayAt(index: number): TISO8601DateString | null {
    return this.#lastDays[index] ?? null;
  }

  /** Those the preview dims: while Show Progress is on */
  unmade = $derived(this.show ? this.unmadeAll : []);

  /** Sets how far it's made (null: not started), saved with the project */
  set(madeThrough: TISO8601DateString | null) {
    if (madeThrough === this.madeThrough) return;
    this.madeThrough = madeThrough;
    projectChanged({ weather: true });
  }

  setShow(show: boolean) {
    if (show === this.show) return;
    this.show = show;
    projectChanged({ weather: true });
  }

  /** A new project, or one with none kept */
  reset() {
    this.madeThrough = null;
    this.show = false;
  }

  /** A saved project's, as it was kept */
  loaded(stored: Partial<StoredProgress> | null | undefined) {
    this.madeThrough = madeThroughOf(stored?.madeThrough);
    this.show = stored?.show === true;
  }

  /** What's kept with the project; nothing until it's been set */
  toStored(): StoredProgress | undefined {
    if (!this.madeThrough && !this.show) return undefined;
    return {
      madeThrough: this.madeThrough,
      ...(this.show && { show: true }),
    };
  }
}

export const progress = new ProgressState();
