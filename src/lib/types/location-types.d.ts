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

import type { WeatherSource } from './weather-types';

export interface LocationType {
  uuid?: string;
  index?: number;
  /** 'c' is for Custom, 'y' is for One Year */
  duration?: 'c' | 'y';
  /** ISO 8601 date string `YYYY-MM-DD` */
  from?: string;
  /** ISO 8601 date string `YYYY-MM-DD` */
  to?: string;
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
  wasLoadedFromSavedProject?: boolean;
}

export interface LocationStateType {
  isValid: boolean;
  #fromDate: Date | null;
  #toDate: Date | null;
  days: number;
  #today: Date;
  daysInFuture: number;
  errorMessage: string;
}

export interface LocationsStateType {
  all: LocationStateType[];
  totalDays: number;
  allValid: boolean;
  urlHash: string;
  projectFileName: string;
  projectTitle: string | undefined | null;
}
