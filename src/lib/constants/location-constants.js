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

// Temperature blankets are usually just one year of weather data, so set the maximum number of days per location to a bit more than that.
// NOTE: Users can get more than one year of data by adding more locations.
export const MAXIMUM_DAYS_PER_LOCATION = 370;

// A somewhat arbitrary limit on the number of locations per project.
export const MAXIMUM_LOCATIONS = 200;

// GeoNames ocean areas have been masked as "no data" and have been assigned a value of -32768
// See https://www.geonames.org/export/web-services.html under the Elevation - SRTM3 headings
export const NO_DATA_SRTM3 = -32768;
