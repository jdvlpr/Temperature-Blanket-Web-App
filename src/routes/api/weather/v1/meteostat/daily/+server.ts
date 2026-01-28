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
import {
  SECRET_METEOSTAT_API_KEY,
  SECRET_METEOSTAT_DEV_API_KEY,
} from '$env/static/private';
import { API_SERVICES, NO_DATA_SRTM3 } from '$lib/constants';
import type { WeatherDay } from '$lib/types.js';
import {
  celsiusToFahrenheit,
  dateToISO8601String,
  displayNumber,
  getAvgOfThree,
  getMaxOfThree,
  getMinOfThree,
  getMoonPhase,
  hoursToMinutes,
  millimetersToInches,
  stringToDate,
} from '$lib/utils.js';
import { error, json } from '@sveltejs/kit';
import SunCalc from 'suncalc';

export async function POST({ request }) {
  const body = await request.json();

  const location = body?.location;

  if (!location || typeof location !== 'object')
    throw error(400, 'Missing location object');

  let allData: WeatherDay[] = [];

  let url = API_SERVICES.meteostat.baseURL;
  url += `?lat=${location.lat}`;
  url += `&lon=${location.lng}`;
  if (
    typeof location.elevation === 'number' &&
    location.elevation !== NO_DATA_SRTM3
  )
    url += `&alt=${location.elevation}`;
  url += `&start=${location.from}`;
  url += `&end=${location.to}`;

  const response = await fetch(url, {
    headers: {
      'X-RapidAPI-Key': dev
        ? SECRET_METEOSTAT_DEV_API_KEY || SECRET_METEOSTAT_API_KEY
        : SECRET_METEOSTAT_API_KEY,
      'X-RapidAPI-Host': 'meteostat.p.rapidapi.com',
    },
  });

  if (response.status === 503) {
    // Service Temporarily Unavailable
    throw error(400, {
      message: `
                <p class="font-bold text-xl my-4">Service Temporarily Unavailable</p>
                <p class="mt-4">Please try again.</p>
            `,
    });
  }
  if (!response.ok) {
    // Request Failed with HTTP code ${response.status}
    throw error(400, {
      message: `<p class="font-bold text-xl my-4">Something Went Wrong</p>
        <p>A search request for weather data from <span class="font-bold">${
          location.label
        }</span> (${stringToDate(location.from).toLocaleDateString(undefined, {
          timeZone: 'UTC',
        })} - ${stringToDate(location.to).toLocaleDateString(undefined, {
          timeZone: 'UTC',
        })}) was sent to <a href="https://meteostat.net/" target="_blank" rel="noopener noreferrer" class="link">Meteostat.net</a>, but the response returned an error.</p>
        <p class="my-4">Try again with a different location or dates, or change the Weather Source setting.</p>
        <p class="italic text-sm">Error status code: ${response.status}</p>`,
    });
  }

  const data = await response.json();

  const errorMessage =
    '<p class="font-bold text-xl my-4">Something Went Wrong</p><p class="mt-4">There appears to be insufficient weather data, please try a different location or dates.</p>';
  if (!data.data) {
    // No data property returned from meteostat
    throw error(400, { message: errorMessage });
  }
  if (data.data.every((day) => day.tavg === null)) {
    // Empty data array
    throw error(400, { message: errorMessage });
  }

  location.stations = data.meta.stations;

  // Process the data
  const todayDate = new Date();

  for (let index = 0; index < data.data.length; index += 1) {
    const day = data.data[index];

    // Sometimes avg will be null but not min and max, so calculate it
    if (day.tavg == null) {
      if (day.tmin !== null && day.tmax !== null)
        day.tavg = (day.tmin + day.tmax) / 2;
    }

    let tmin = getMinOfThree(day.tmin, day.tavg, day.tmax);
    let tavg = getAvgOfThree(day.tmin, day.tavg, day.tmax);
    let tmax = getMaxOfThree(day.tmin, day.tavg, day.tmax);
    let prcp = day.prcp;
    let snow = day.snow;

    const dayDate = stringToDate(day.date);

    // With the Meteostat API, if the "model" param is set to "true" (which is the default), it will include future weather predictions.
    //Our application does not want this, so make null any weather parameters which are for days in the future.
    const isDateInPast =
      dateToISO8601String(dayDate) < dateToISO8601String(todayDate);

    if (!isDateInPast) {
      tmin = null;
      tavg = null;
      tmax = null;
      prcp = null;
      snow = null;
    }

    const dayData = {} as WeatherDay;
    dayData.location = location.index;
    dayData.date = dayDate;
    dayData.tavg = {
      metric: tavg,
      imperial: celsiusToFahrenheit(tavg),
    }; // Average Temp
    dayData.tmin = {
      metric: tmin,
      imperial: celsiusToFahrenheit(tmin),
    }; // Minimum Temp
    dayData.tmax = {
      metric: tmax,
      imperial: celsiusToFahrenheit(tmax),
    }; // Maximum Temp
    dayData.prcp = {
      metric: prcp,
      imperial: millimetersToInches(prcp),
    }; // Precipitation
    dayData.snow = {
      metric: snow,
      imperial: millimetersToInches(snow),
    }; // Snow
    // dayData.wdir = day.wdir; // Wind Direction degrees (unused)
    // dayData.wspd = day.wspd; // WindSpeed km/hr (unused)
    // dayData.wpgt = day.wpgt; //T he peak wind gust in km/h (unused)
    // dayData.pres = day.pres; // The average sea-level air pressure in hPa (unused)
    // dayData.tsun = day.tsun; // The daily sunshine total in minutes (m) (unused)
    // End of meteostat data

    const times = SunCalc.getTimes(dayDate, location.lat, location.lng);
    // dayData.sunrise = times.sunrise;
    // dayData.sunset = times.sunset;
    const isValidSunset =
      times.sunset instanceof Date && !isNaN(times.sunset.getTime());
    const isValidSunRise =
      times.sunrise instanceof Date && !isNaN(times.sunrise.getTime());
    if (isValidSunset && isValidSunRise) {
      const daytime = parseFloat(
        ((times.sunset - times.sunrise) / 1000 / 60 / 60).toFixed(6),
      );
      // Convert metric to minutes because of Weather chart scale
      dayData.dayt = {
        metric: hoursToMinutes(daytime, 4),
        imperial: displayNumber(daytime, 4),
      };
    } else {
      dayData.dayt = { metric: null, imperial: null };
    }

    dayData.moon = getMoonPhase(dayDate);

    allData = [...allData, dayData];
  }

  // Sort by date
  allData.sort((a, b) => a.date - b.date);

  return json(allData);
}
