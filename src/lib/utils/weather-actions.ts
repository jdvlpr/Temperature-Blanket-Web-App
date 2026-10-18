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

/** What getting a saved project's weather again is called, wherever it's offered */
export const WEATHER_ACTIONS = {
  'new-days': {
    label: 'Only New Days',
    description: 'Get data since this project was last saved.',
    upToDate: 'Up to date',
  },
  again: {
    label: 'Search Again',
    description: "Update every day's weather data",
  },
} as const;
