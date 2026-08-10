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

import type { Unit, WeatherSource } from '$lib/types/weather-types';

/** Shape of the `/weather` route's standalone Open-Meteo forecast integration
 * (distinct from the main app's Meteostat-backed `$lib/state/weather-state.svelte.ts`). */

export interface OpenMeteoCurrentWeather {
  time: string;
  temperature: number;
  weathercode: number;
  is_day: number;
}

export interface OpenMeteoHourly {
  time: string[];
  temperature_2m: (number | null)[];
  precipitation_probability: (number | null)[];
  cloudcover: (number | null)[];
  apparent_temperature: (number | null)[];
  weathercode: (number | null)[];
  is_day: (number | null)[];
}

export interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: (number | null)[];
  temperature_2m_min: (number | null)[];
  apparent_temperature_max: (number | null)[];
  apparent_temperature_min: (number | null)[];
  rain_sum: (number | null)[];
  snowfall_sum: (number | null)[];
  precipitation_probability_max: (number | null)[];
  weathercode: (number | null)[];
}

export interface OpenMeteoForecastData {
  utc_offset_seconds: number;
  current_weather: OpenMeteoCurrentWeather;
  hourly: OpenMeteoHourly;
  daily: OpenMeteoDaily;
}

/** A single hour of the forecast, expanded from the columnar `OpenMeteoHourly` shape. */
export interface WeatherHourlyItem {
  isNow: boolean;
  time: string;
  apparent_temperature: number | null;
  cloudcover: number | null;
  is_day: number | null;
  precipitation_probability: number | null;
  temperature_2m: number | null;
  weathercode: number | null;
}

/** A single day of the forecast, expanded from the columnar `OpenMeteoDaily` shape. */
export interface WeatherDailyItem {
  time: string;
  temperature_2m_max: number | null;
  temperature_2m_min: number | null;
  precipitation_probability_max: number | null;
  weathercode: number | null;
}

export interface WeatherLocation {
  id: number;
  elevation?: number;
  label?: string;
  lat?: string;
  lng?: string;
  result?: string;
  units?: Unit;
  saved?: boolean;
  source?: WeatherSource;
  update_time?: string;
  data?: OpenMeteoForecastData;
}
