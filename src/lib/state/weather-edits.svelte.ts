// Copyright (c) 2026, Thomas (https://github.com/jdvlpr)
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

// Edit Weather Data's Apply, undoable. Weather isn't in the project's link,
// so history entries (URL hash strings) can't hold it: each Apply is a
// revision kept here, only its changed values before and after, and the
// history entry carries just its number (`&wr=<id>`, never in the address).
// Undo and Redo step one revision back or forward. Revisions belong to the
// weather they were made to: once it's replaced (weather.dataEpoch), they're
// left alone.

import { weather } from '#lib/state/weather-state.svelte.js';
import { projectChanged } from '#lib/storage/autosave.svelte.js';
import {
  applyChanges,
  changedDays,
  type WeatherChange,
} from '#lib/utils/weather-edits.js';
import { pluralize } from '#lib/utils/string-utils.js';

type Revision = {
  id: number;
  /** The revision this one was applied on (0: none) */
  parent: number;
  epoch: number;
  changes: WeatherChange[];
  /** Whether the weather was already Custom before this Apply */
  wasUserEdited: boolean;
};

/** A history entry's weather revision key */
export const WEATHER_REVISION_KEY = 'wr';

class WeatherEditsClass {
  /** The revision the weather is at now (0: no edits applied this session) */
  current = 0;

  #revisions = new Map<number, Revision>();

  #nextId = 1;

  /** For the history entry: `&wr=<id>`, or nothing before any edit to this weather */
  get historyToken() {
    const revision = this.#revisions.get(this.current);
    if (!revision || revision.epoch !== weather.dataEpoch) return '';
    return `&${WEATHER_REVISION_KEY}=${this.current}`;
  }

  /** Puts the changes in the weather as one undoable step; the weather becomes Custom */
  apply(changes: WeatherChange[]) {
    if (!changes.length) return;
    const revision: Revision = {
      id: this.#nextId++,
      // As the history entry before it says (none, once the weather's been replaced)
      parent: this.historyToken ? this.current : 0,
      epoch: weather.dataEpoch,
      changes,
      wasUserEdited: weather.isUserEdited,
    };
    this.#revisions.set(revision.id, revision);
    this.current = revision.id;
    applyChanges(weather.rawData, changes, 'after');
    weather.isUserEdited = true;
    this.#changed();
  }

  /**
   * Moves the weather from one history entry's revision to the next one's
   * (one step: back to a revision's parent, or forward to a child of it).
   * Returns what changed, for the Undo/Redo message, or '' when nothing did.
   */
  step(from: number, to: number): string {
    if (from === to) return '';
    const back = this.#revisions.get(from);
    const forward = this.#revisions.get(to);
    let revision: Revision | undefined;
    let side: 'before' | 'after';
    if (back && back.parent === to) {
      revision = back;
      side = 'before';
    } else if (forward && forward.parent === from) {
      revision = forward;
      side = 'after';
    } else {
      this.current = to;
      return '';
    }
    this.current = to;
    // Made to weather that's since been replaced
    if (revision.epoch !== weather.dataEpoch) return '';
    applyChanges(weather.rawData, revision.changes, side);
    weather.isUserEdited = side === 'after' ? true : revision.wasUserEdited;
    this.#changed();
    const days = changedDays(revision.changes);
    return `weather data on ${days} ${pluralize('day', days)}`;
  }

  #changed() {
    weather.editCount++;
    projectChanged({ weather: true });
  }
}

export const weatherEdits = new WeatherEditsClass();
