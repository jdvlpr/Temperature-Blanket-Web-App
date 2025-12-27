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

/**
 * Default season definitions with month ranges (1-indexed: 1 = January, 12 = December)
 */
export const DEFAULT_SEASONS = [
  {
    id: 'spring',
    label: 'Spring',
    months: [3, 4, 5], // March, April, May
  },
  {
    id: 'summer',
    label: 'Summer',
    months: [6, 7, 8], // June, July, August
  },
  {
    id: 'fall',
    label: 'Fall',
    months: [9, 10, 11], // September, October, November
  },
  {
    id: 'winter',
    label: 'Winter',
    months: [12, 1, 2], // December, January, February
  },
];

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/**
 * Get the season for a given month
 * @param {number} month - Month number (1-12)
 * @param {any[]} seasons - Array of season definitions
 * @returns {object|null} - Season object or null if month not found
 */
export function getSeasonForMonth(month, seasons = DEFAULT_SEASONS) {
  return (
    seasons.find((season) => {
      const s = /** @type {{months: number[]}} */ (season);
      return s.months.includes(month);
    }) || null
  );
}

/**
 * Get all seasons
 * @returns {object[]} - Array of season definitions
 */
export function getAllSeasons() {
  return DEFAULT_SEASONS;
}
