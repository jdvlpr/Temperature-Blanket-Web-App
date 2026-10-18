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

/** A gallery page of the same project as a link, offered for its weather */
export type GalleryWeatherPage = {
  postId: number;
  /** The name it was given, or '' (may have HTML entities) */
  projectName: string;
  /** Its locations meta, a JSON string */
  locations: string | null;
  /** When it was published, site-local, as the gallery cards show it */
  date: string | null;
  image: string | null;
};

type LocationDates = { from?: string; to?: string };

/** Whether a page's locations meta has these locations' dates, each in order */
export function fitsLocations(
  locationsMeta: string | null,
  locations: LocationDates[],
): boolean {
  let stored: unknown;
  try {
    stored = JSON.parse(locationsMeta ?? '');
  } catch {
    return false;
  }
  return (
    Array.isArray(stored) &&
    stored.length === locations.length &&
    stored.every(
      (place, index) =>
        place?.from === locations[index].from &&
        place?.to === locations[index].to,
    )
  );
}

/**
 * The gallery pages with weather published from a project with this ID
 * (`?project=` in their link; gallery plugin 1.12.0), newest first; which
 * dates fit is up to the caller (fitsLocations). Only what shows them: their
 * weather is got for the one chosen. None when the gallery can't say (an
 * older plugin, offline).
 */
export async function findGalleryWeatherPages(
  projectId: string,
): Promise<GalleryWeatherPage[]> {
  try {
    const { response, result } = await queryGallery(
      `query FIND_PROJECT_PAGES($id: String!) {
        projects(first: 20, where: { projectLinkId: $id }) {
          nodes {
            databaseId projectName locations date
            featuredImage { node { mediaItemUrl mediaDetails { sizes(include: MEDIUM) { sourceUrl } } } }
          }
        }
      }`,
      { id: projectId },
    );
    // An older plugin doesn't know the argument: no lookup, never every page
    if (!response.ok || result?.errors?.length) return [];
    const nodes: {
      databaseId?: unknown;
      projectName?: string | null;
      locations: string | null;
      date?: string | null;
      featuredImage?: {
        node?: {
          mediaItemUrl?: string;
          mediaDetails?: { sizes?: { sourceUrl?: string }[] };
        };
      } | null;
    }[] = result?.data?.projects?.nodes ?? [];
    return nodes
      .filter((node) => Number.isInteger(node?.databaseId))
      .map((node) => ({
        postId: node.databaseId as number,
        projectName: node.projectName ?? '',
        locations: node.locations,
        date: node.date ?? null,
        image:
          node.featuredImage?.node?.mediaDetails?.sizes?.[0]?.sourceUrl ||
          node.featuredImage?.node?.mediaItemUrl ||
          null,
      }));
  } catch {
    return [];
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
 * null to leave the weather to a search: when the page has none, or it
 * doesn't fit the locations' dates. A blanket published while in progress
 * loads too: the days since are offered as new ones (see weatherDays).
 */
export function galleryWeatherToLoad(
  { rawWeatherData }: GalleryWeather,
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

  return days;
}
