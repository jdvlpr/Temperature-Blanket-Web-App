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

export type Unit = 'imperial' | 'metric';

/* In the project URL hash, this is '0' for 'Meteostat' or '1' for 'Open-Meteo' */
export type WeatherSource = 'Open-Meteo' | 'Meteostat';

export interface WeatherSourceOptions {
  name: WeatherSource;
  useSecondary: boolean;
  settings: {
    /* In the project URL hash, 'l' is for 'era5_land', 'e' is for 'era5' ('auto' is the default so no need to explicitly set it)	*/
    openMeteo: { model: 'auto' | 'era5_land' | 'era5' };
    meteoStat: {
      /* Substitute missing records with statistically optimized model data (see https://dev.meteostat.net/api/point/daily.html#parameters)
      In the project URL hash, '0' is for 'false' ('true' is the default so no need to explicitly set it) */
      model: boolean;
    };
  };
}

export type MoonPhasesId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type MoonPhasesName =
  | 'New Moon'
  | 'Waxing Crescent'
  | 'First Quarter'
  | 'Waxing Gibbous'
  | 'Full Moon'
  | 'Waning Gibbous'
  | 'Third Quarter'
  | 'Waning Crescent';

export type TYearString = `${number}${number}${number}${number}`;
export type TMonthString = `${number}${number}`;
export type TDayString = `${number}${number}`;
/** YYYY-MM-DD representation of a date */
export type TISO8601DateString = `${TYearString}-${TMonthString}-${TDayString}`;
/** YYYY.MM.DD representation of a date */
export type TISO8601DateStringPeriodSeparated =
  `${TYearString}.${TMonthString}.${TDayString}`;
/** YYYY/MM/DD representation of a date */
export type TISO8601DateStringSlashSeparated =
  `${TYearString}/${TMonthString}/${TDayString}`;

export interface WeatherDay {
  /** 0-based index of which location the weather day is for */
  location: number;
  date: Date;
  tavg: {
    metric: number | null;
    imperial: number | null;
  };
  tmin: {
    metric: number | null;
    imperial: number | null;
  };
  tmax: {
    metric: number | null;
    imperial: number | null;
  };
  prcp: {
    metric: number | null;
    imperial: number | null;
  };
  snow: {
    metric: number | null;
    imperial: number | null;
  };
  dayt: {
    metric: number | null;
    imperial: number | null;
  };
  moon: MoonPhasesId | null;
}
