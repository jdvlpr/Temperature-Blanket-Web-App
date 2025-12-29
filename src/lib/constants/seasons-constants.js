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
