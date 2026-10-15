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

// A gallery page keeps the weather its project had when it was published
// (`rawWeatherData`, from Send to Gallery). Opening a copy loads it, as My
// Projects loads a saved project's weather, so it needn't be searched again.

import type {
  TISO8601DateString,
  WeatherDay,
} from '#lib/types/weather-types.js';
import { dateToISO8601String, stringToDate } from '#lib/utils/date-utils.js';
import { queryGallery } from '#lib/utils/gallery-utils.js';

export type GalleryWeather = {
  rawWeatherData: string | null;
  weatherSources: string | null;
  /** When the page was published, in UTC without a zone ("2026-10-13T01:44:43") */
  dateGmt: string | null;
  /** When it was last updated in place (its weather is from then), the same way */
  modifiedGmt?: string | null;
};

/** A gallery page's weather, or null if it can't be had. */
export async function fetchGalleryWeather(
  postId: number,
): Promise<GalleryWeather | null> {
  try {
    const { response, result } = await queryGallery(
      `query GET_PROJECT_WEATHER($id: ID!) {
        project(id: $id, idType: DATABASE_ID) {
          rawWeatherData
          weatherSources
          dateGmt
          modifiedGmt
        }
      }`,
      { id: postId },
    );
    if (!response.ok) return null;
    return result?.data?.project ?? null;
  } catch {
    return null;
  }
}

/** Whether the page's weather was edited by hand (Send to Gallery names it) */
export function isCustomGalleryWeather(weatherSources: string | null) {
  try {
    const sources = JSON.parse(weatherSources ?? '');
    return (
      Array.isArray(sources) &&
      sources.some((source) => source?.name === 'custom weather data')
    );
  } catch {
    return false;
  }
}

const isValue = (value: unknown) => value === null || typeof value === 'number';

const isStoredDay = (day: any) =>
  typeof day === 'object' &&
  day !== null &&
  Number.isInteger(day.location) &&
  typeof day.date === 'string' &&
  !Number.isNaN(Date.parse(day.date)) &&
  ['tavg', 'tmin', 'tmax', 'prcp', 'snow'].every(
    (key) => isValue(day[key]?.metric) && isValue(day[key]?.imperial),
  );

/**
 * The page's weather days to load into a project with these locations, or
 * null to leave the weather to a search: when the page has none, it doesn't
 * fit the locations' dates, or (unless edited by hand) the blanket was still
 * in progress when published, so later days would be missing.
 */
export function galleryWeatherToLoad(
  { rawWeatherData, weatherSources, dateGmt, modifiedGmt }: GalleryWeather,
  locations: { from?: TISO8601DateString; to?: TISO8601DateString }[],
): WeatherDay[] | null {
  let stored: unknown;
  try {
    stored = JSON.parse(rawWeatherData ?? '');
  } catch {
    return null;
  }
  if (!Array.isArray(stored) || !stored.length || !stored.every(isStoredDay))
    return null;

  const days: WeatherDay[] = stored.map((day) => ({
    ...day,
    // Stored as midnight UTC ("2025-01-01T00:00:00.000Z")
    date: stringToDate(day.date.slice(0, 10) as TISO8601DateString),
  }));

  // Each location's days run from its From date to its To date
  if (!locations.length) return null;
  for (const [index, location] of locations.entries()) {
    const own = days.filter((day) => day.location === index);
    if (
      !own.length ||
      dateToISO8601String(own[0].date) !== location.from ||
      dateToISO8601String(own[own.length - 1].date) !== location.to
    )
      return null;
  }
  if (days.some((day) => day.location >= locations.length)) return null;

  // Edited weather can't be searched again, so it loads however it ends
  if (isCustomGalleryWeather(weatherSources)) return days;

  // The days from the one it was published (or last updated) on weren't all in yet
  const publishedAt = new Date(`${modifiedGmt ?? dateGmt}Z`);
  if (Number.isNaN(publishedAt.getTime())) return null;
  const publishedOn = stringToDate(dateToISO8601String(publishedAt));
  if (days.some((day) => day.date >= publishedOn)) return null;

  return days;
}
