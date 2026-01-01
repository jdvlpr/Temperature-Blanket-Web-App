// Copyright (c) 2024, Thomas (https://github.com/jdvlpr)
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

import {
  DEFAULT_SEASONS,
  MONTH_NAMES,
  SEASON_PRESETS,
} from '$lib/constants/seasons-constants';
import { localState, previews, project } from '$lib/state';
import type { LocationType } from '$lib/types';

/**
 * Parse a MM-DD string into month and day numbers
 */
function parseDateString(dateStr: string): { month: number; day: number } {
  const [month, day] = dateStr.split('-').map(Number);
  return { month, day };
}

/**
 * Convert a Date object to a comparable day-of-year number (ignoring year)
 */
function toDayOfYear(month: number, day: number): number {
  // Use a leap year (2000) to ensure Feb 29 is valid
  const date = new Date(2000, month - 1, day);
  const start = new Date(2000, 0, 1);
  return (
    Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
}

/**
 * Check if a date falls within a date range (handles year-wrap for seasons like winter)
 */
export function isDateInRange(
  date: Date,
  startDate: string,
  endDate: string,
): boolean {
  const month = date.getMonth() + 1; // getMonth() returns 0-11
  const day = date.getDate();

  const start = parseDateString(startDate);
  const end = parseDateString(endDate);

  const dateDoy = toDayOfYear(month, day);
  const startDoy = toDayOfYear(start.month, start.day);
  const endDoy = toDayOfYear(end.month, end.day);

  // Handle year-wrap (e.g., winter: Dec 1 - Feb 28)
  if (startDoy > endDoy) {
    // Range wraps around the year
    return dateDoy >= startDoy || dateDoy <= endDoy;
  } else {
    // Normal range within same year
    return dateDoy >= startDoy && dateDoy <= endDoy;
  }
}

type Season = {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
};

/**
 * Get the season for a given date
 */
export function getSeasonForDate(
  date: Date,
  seasons: Season[] = DEFAULT_SEASONS,
): Season | null {
  return (
    seasons.find((season) => {
      return isDateInRange(date, season.startDate, season.endDate);
    }) || null
  );
}

/**
 * Format a date range for display (e.g., "Mar 1 - May 31")
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);

  const startMonthName = MONTH_NAMES[start.month - 1].substring(0, 3);
  const endMonthName = MONTH_NAMES[end.month - 1].substring(0, 3);

  return `${startMonthName} ${start.day} - ${endMonthName} ${end.day}`;
}

/**
 * Array of presets in order for URL encoding
 * Index 0 = Northern Meteorological, 1 = Northern Astronomical,
 * 2 = Southern Meteorological, 3 = Southern Astronomical
 */
const PRESETS_ARRAY = [
  SEASON_PRESETS.northernMeteorological,
  SEASON_PRESETS.northernAstronomical,
  SEASON_PRESETS.southernMeteorological,
  SEASON_PRESETS.southernAstronomical,
];

/**
 * Check if two seasons arrays have the same dates
 */
function seasonsMatchDates(seasons1: Season[], seasons2: Season[]): boolean {
  if (seasons1.length !== seasons2.length) return false;
  return seasons1.every(
    (season, index) =>
      season.startDate === seasons2[index].startDate &&
      season.endDate === seasons2[index].endDate,
  );
}

/**
 * Encode seasons to a compact URL hash string
 * Returns preset index (0-3) if matching a standard preset,
 * otherwise returns 32-char date string (MMDDMMDD for each season)
 */
export function seasonsToUrlHash(seasons: Season[]): string {
  // Check if seasons match any preset
  for (let i = 0; i < PRESETS_ARRAY.length; i++) {
    if (seasonsMatchDates(seasons, PRESETS_ARRAY[i].seasons)) {
      return String(i);
    }
  }

  // Custom seasons: encode as MMDDMMDD for each season (32 chars total)
  return seasons
    .map((season) => {
      const start = season.startDate.replace('-', '');
      const end = season.endDate.replace('-', '');
      return start + end;
    })
    .join('');
}

/**
 * Decode URL hash string to seasons array
 * Handles both preset indices (0-3) and custom 32-char date strings
 */
export function seasonsFromUrlHash(hash: string): Season[] | null {
  // Check if it's a preset index
  if (hash.length === 1 && /^[0-3]$/.test(hash)) {
    const presetIndex = parseInt(hash, 10);
    // Return a copy with labels from default seasons
    return DEFAULT_SEASONS.map((defaultSeason, index) => ({
      ...defaultSeason,
      startDate: PRESETS_ARRAY[presetIndex].seasons[index].startDate,
      endDate: PRESETS_ARRAY[presetIndex].seasons[index].endDate,
    }));
  }

  // Custom dates: parse 32-char string (8 chars per season)
  if (hash.length === 32) {
    const seasons: Season[] = [];
    for (let i = 0; i < 4; i++) {
      const chunk = hash.substring(i * 8, (i + 1) * 8);
      const startMonth = chunk.substring(0, 2);
      const startDay = chunk.substring(2, 4);
      const endMonth = chunk.substring(4, 6);
      const endDay = chunk.substring(6, 8);

      seasons.push({
        ...DEFAULT_SEASONS[i],
        startDate: `${startMonth}-${startDay}`,
        endDate: `${endMonth}-${endDay}`,
      });
    }
    return seasons;
  }

  return null;
}

export function setSeasonsByLocation(location: LocationType) {
  // Don't override if seasons are already being used (set via URL or by user)
  if (previews.active && previews.active.settings.useSeasonTargets) return;

  try {
    // Check that the current seasons are still the default before auto-assigning
    const currentSeasons = localState.value.seasons;

    const isDefaultSeasons = PRESETS_ARRAY.some((preset) =>
      seasonsMatchDates(currentSeasons, preset.seasons),
    );

    let firstLat = Number($state.snapshot(location.lat));

    // Auto-assign seasons preset based on the location's hemisphere
    if (isDefaultSeasons && typeof firstLat === 'number') {
      // Latitude >= 0 => Northern Hemisphere, else Southern
      if (firstLat >= 0)
        localState.value.seasons =
          SEASON_PRESETS.northernMeteorological.seasons;
      else
        localState.value.seasons =
          SEASON_PRESETS.southernMeteorological.seasons;
    }
  } catch (e) {
    // Defensive: don't block UX if something unexpected happens
    console.warn('Auto-assign seasons failed', e);
  }
}
