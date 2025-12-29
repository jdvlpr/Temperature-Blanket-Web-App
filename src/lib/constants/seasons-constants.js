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
 * Season presets for different regions and definitions
 * - Meteorological seasons: Based on calendar months (more common for weather purposes)
 * - Astronomical seasons: Based on solstices and equinoxes
 */
export const SEASON_PRESETS = {
  northernMeteorological: {
    id: 'northern-meteorological',
    label: 'Northern Hemisphere (Meteorological)',
    description: 'Mar-May, Jun-Aug, Sep-Nov, Dec-Feb',
    seasons: [
      { id: 'spring', label: 'Spring', startDate: '03-01', endDate: '05-31' },
      { id: 'summer', label: 'Summer', startDate: '06-01', endDate: '08-31' },
      { id: 'fall', label: 'Fall', startDate: '09-01', endDate: '11-30' },
      { id: 'winter', label: 'Winter', startDate: '12-01', endDate: '02-28' },
    ],
  },
  northernAstronomical: {
    id: 'northern-astronomical',
    label: 'Northern Hemisphere (Astronomical)',
    description: 'Mar 20, Jun 21, Sep 22, Dec 21',
    seasons: [
      { id: 'spring', label: 'Spring', startDate: '03-20', endDate: '06-20' },
      { id: 'summer', label: 'Summer', startDate: '06-21', endDate: '09-21' },
      { id: 'fall', label: 'Fall', startDate: '09-22', endDate: '12-20' },
      { id: 'winter', label: 'Winter', startDate: '12-21', endDate: '03-19' },
    ],
  },
  southernMeteorological: {
    id: 'southern-meteorological',
    label: 'Southern Hemisphere (Meteorological)',
    description: 'Sep-Nov, Dec-Feb, Mar-May, Jun-Aug',
    seasons: [
      { id: 'spring', label: 'Spring', startDate: '09-01', endDate: '11-30' },
      { id: 'summer', label: 'Summer', startDate: '12-01', endDate: '02-28' },
      { id: 'fall', label: 'Fall', startDate: '03-01', endDate: '05-31' },
      { id: 'winter', label: 'Winter', startDate: '06-01', endDate: '08-31' },
    ],
  },
  southernAstronomical: {
    id: 'southern-astronomical',
    label: 'Southern Hemisphere (Astronomical)',
    description: 'Sep 22, Dec 21, Mar 20, Jun 21',
    seasons: [
      { id: 'spring', label: 'Spring', startDate: '09-22', endDate: '12-20' },
      { id: 'summer', label: 'Summer', startDate: '12-21', endDate: '03-19' },
      { id: 'fall', label: 'Fall', startDate: '03-20', endDate: '06-20' },
      { id: 'winter', label: 'Winter', startDate: '06-21', endDate: '09-21' },
    ],
  },
};

/**
 * Default season definitions (Northern Hemisphere Meteorological)
 */
export const DEFAULT_SEASONS = SEASON_PRESETS.northernMeteorological.seasons;

/**
 * Month names for display purposes
 */
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
 * Parse a MM-DD string into month and day numbers
 * @param {string} dateStr - Date string in MM-DD format
 * @returns {{month: number, day: number}} - Month (1-12) and day (1-31)
 */
function parseDateString(dateStr) {
  const [month, day] = dateStr.split('-').map(Number);
  return { month, day };
}

/**
 * Convert a Date object to a comparable day-of-year number (ignoring year)
 * @param {number} month - Month (1-12)
 * @param {number} day - Day (1-31)
 * @returns {number} - Day of year (1-366)
 */
function toDayOfYear(month, day) {
  // Use a leap year (2000) to ensure Feb 29 is valid
  const date = new Date(2000, month - 1, day);
  const start = new Date(2000, 0, 1);
  return (
    Math.floor((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
}

/**
 * Check if a date falls within a date range (handles year-wrap for seasons like winter)
 * @param {Date} date - The date to check
 * @param {string} startDate - Start date in MM-DD format
 * @param {string} endDate - End date in MM-DD format
 * @returns {boolean} - True if date is within range
 */
export function isDateInRange(date, startDate, endDate) {
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

/**
 * Get the season for a given date
 * @param {Date} date - Date to find season for
 * @param {any[]} seasons - Array of season definitions
 * @returns {object|null} - Season object or null if date not found in any season
 */
export function getSeasonForDate(date, seasons = DEFAULT_SEASONS) {
  return (
    seasons.find((season) => {
      const s = /** @type {{startDate: string, endDate: string}} */ (season);
      return isDateInRange(date, s.startDate, s.endDate);
    }) || null
  );
}

/**
 * Format a date range for display (e.g., "Mar 1 - May 31")
 * @param {string} startDate - Start date in MM-DD format
 * @param {string} endDate - End date in MM-DD format
 * @returns {string} - Formatted date range string
 */
export function formatDateRange(startDate, endDate) {
  const start = parseDateString(startDate);
  const end = parseDateString(endDate);

  const startMonthName = MONTH_NAMES[start.month - 1].substring(0, 3);
  const endMonthName = MONTH_NAMES[end.month - 1].substring(0, 3);

  return `${startMonthName} ${start.day} - ${endMonthName} ${end.day}`;
}

/**
 * Get all seasons
 * @returns {object[]} - Array of season definitions
 */
export function getAllSeasons() {
  return DEFAULT_SEASONS;
}
