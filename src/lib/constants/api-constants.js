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

import { dev } from '$app/environment';

// When in dev mode, use free geonames .org instead of paid geonames.net credits. It's mandatory for local dev environment to use the .org domain because of permissions
// Check GeoNames api usage here: https://www.geonames .org/account
export const API_SERVICES = {
  geonames: {
    baseURL: dev
      ? 'https://secure.geonames.net/searchJSON'
      : 'https://secure.geonames.net/searchJSON',
  },
  geonamesfindNearbyPlaceName: {
    baseURL: dev
      ? 'https://secure.geonames.net/findNearbyPlaceNameJSON'
      : 'https://secure.geonames.net/findNearbyPlaceNameJSON',
  },
  geonamesGetID: {
    baseURL: dev
      ? 'https://secure.geonames.net/getJSON'
      : 'https://secure.geonames.net/getJSON',
  },
  geonamesGetAltitude: {
    baseURL: dev
      ? 'https://secure.geonames.net/srtm3JSON'
      : 'https://secure.geonames.net/srtm3JSON',
  },
  meteostat: {
    baseURL: 'https://meteostat.p.rapidapi.com/point/daily',
  },
  openMeteo: {
    baseURL: 'https://archive-api.open-meteo.com/v1/archive',
  },
};
