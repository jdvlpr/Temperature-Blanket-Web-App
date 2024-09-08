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

import type { Writable } from 'svelte/store';

export type Unit = 'imperial' | 'metric';

export interface UnitStore extends Writable<Unit> {
  toggle: () => void;
}

/* In the project URL hash, this is '0' for 'Meteostat' or '1' for 'Open-Meteo' */
export type WeatherSource = 'Open-Meteo' | 'Meteostat';

export interface WeatherSourceOptions {
  name: WeatherSource;
  useSecondary: boolean;
}

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
}
