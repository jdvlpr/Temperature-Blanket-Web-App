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

import type { TISO8601DateString } from '#lib/types/weather-types.js';

// Asking Open-Meteo's archive for weather, given up on when it doesn't answer.
// When it's overloaded it may hold a request open without answering, and a
// browser can wait minutes before giving up, so the search looked stuck.

/** What the archive answers (daily values, or an error and why) */
export type OpenMeteoAnswer = {
  error?: boolean;
  reason?: string;
  daily?: {
    time: TISO8601DateString[];
    temperature_2m_max: (number | null)[];
    temperature_2m_min: (number | null)[];
    rain_sum: (number | null)[];
    snowfall_sum: (number | null)[];
  };
};

/** How long to wait for Open-Meteo, its answer included */
export const OPEN_METEO_TIMEOUT_MS = 60_000;

/** Shown when Open-Meteo is too busy to answer (the search's error dialog) */
export const OPEN_METEO_BUSY_MESSAGE =
  '<p class="font-bold text-xl my-4">Open-Meteo Is Busy</p><p>It isn\'t answering right now, usually because it\'s getting more requests than it can handle. Try again in a few minutes.</p>';

/** Answers that mean it's busy, not that the request was wrong */
const BUSY_STATUSES = new Set([429, 502, 503, 504]);

/**
 * Fetches `url` and reads its JSON, stopped when `signal` aborts (Cancel) or
 * after `ms`. Busy (no answer in time, or a busy status) throws an Error with
 * OPEN_METEO_BUSY_MESSAGE; Cancel rejects as fetch does. `data` is null when
 * the answer isn't JSON.
 */
export async function fetchOpenMeteo(
  url: string,
  {
    signal = null,
    ms = OPEN_METEO_TIMEOUT_MS,
    fetchFn = fetch,
  }: {
    signal?: AbortSignal | null;
    ms?: number;
    fetchFn?: typeof fetch;
  } = {},
): Promise<{ response: Response; data: unknown }> {
  const stop = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    stop.abort();
  }, ms);
  const cancel = () => stop.abort(signal?.reason);
  if (signal?.aborted) cancel();
  else signal?.addEventListener('abort', cancel, { once: true });

  try {
    const response = await fetchFn(url, { signal: stop.signal });
    if (BUSY_STATUSES.has(response.status))
      throw new Error(OPEN_METEO_BUSY_MESSAGE);
    let data: unknown = null;
    try {
      data = await response.json();
    } catch (e) {
      if (stop.signal.aborted) throw e;
      // Not JSON: left to the caller's check of response.ok
    }
    return { response, data };
  } catch (e) {
    if (timedOut) throw new Error(OPEN_METEO_BUSY_MESSAGE, { cause: e });
    throw e;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', cancel);
  }
}
