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

import type { TISO8601DateString, WeatherSource } from './weather-types';

export interface LocationType {
  uuid?: string;
  index?: number;
  /** 'c' is for Custom, 'y' is for One Year */
  duration?: 'c' | 'y';
  from?: TISO8601DateString;
  to?: TISO8601DateString;
  label?: string;
  result?: string;
  /** Id from the GeoNames api */
  id?: number;
  lat?: string;
  lng?: string;
  elevation?: number;
  /** fclName codes from https://www.geonames.org/export/codes.html */
  fclName?: string;
  flagIcon?: string;
  population?: number;
  stations?: null | any[]; // TODO: Change 'any[]' to a more specific type if possible. Stations are set when using Meteostat for a weather source.
  source?: WeatherSource;
  wasLoadedFromURL?: boolean;
  wasLoadedFromStorage?: boolean;
}

export interface LocationStateType extends LocationType {
  isValid: boolean;
  #fromDate: Date | null;
  #toDate: Date | null;
  days: number;
  #today: TISO8601DateString | null;
  daysInFuture: number;
  errorMessage: string;
}

export interface LocationsStateType {
  all: LocationStateType[];
  totalDays: number | null;
  allValid: boolean;
  urlHash: string;
  projectFilename: string;
  projectTitle: string;
}

/** A single result from the GeoNames search/nearby APIs, e.g.
 * `src/routes/api/location/search/[text]/+server.ts`. */
export interface GeoNamesSearchResult {
  geonameId: number;
  name: string;
  adminName1?: string;
  countryName?: string;
  countryCode?: string;
  lat: string;
  lng: string;
  fclName?: string;
  population?: number;
}

/** A `GeoNamesSearchResult` formatted for display in the location autocomplete. */
export type LocationSuggestion = Pick<
  LocationType,
  | 'id'
  | 'label'
  | 'lat'
  | 'lng'
  | 'result'
  | 'fclName'
  | 'flagIcon'
  | 'population'
>;
