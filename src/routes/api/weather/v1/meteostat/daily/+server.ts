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

import { dev, version } from '$app/environment';
import {
  SECRET_METEOSTAT_API_KEY,
  SECRET_METEOSTAT_DEV_API_KEY,
} from '$env/static/private';
import { API_SERVICES, NO_DATA_SRTM3 } from '$lib/constants';
import { supabase } from '$lib/supabaseClient.js';
import {
  celsiusToFahrenheit,
  dateToISO8601String,
  dateToISO8601StringVersion2,
  displayNumber,
  getAvgOfThree,
  getMaxOfThree,
  getMinOfThree,
  hoursToMinutes,
  millimetersToInches,
  stringToDate,
  stringToDateVersion2,
} from '$lib/utils.js';
import { error, json } from '@sveltejs/kit';
import SunCalc from 'suncalc';

export async function POST({ request }) {
  const body = await request.json();

  const location = body?.location;

  if (!location || typeof location !== 'object')
    throw error(400, 'Missing location object');

  let allData = [];

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
        : SECRET_METEOSTAT_API_KEY, // Use a free dev rapidAPI account for testing to save request credits
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
        }</span> (${stringToDate(location.from).toLocaleDateString()} - ${stringToDate(location.to).toLocaleDateString()}) was sent to <a href="https://meteostat.net/" target="_blank" rel="noopener noreferrer" class="link">Meteostat.net</a>, but the response returned an error.</p>
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

  const today = new Date();

  // temporary diagnostics
  await supabase.from('Weather Data Feedback').insert({
    dev,
    version,
    details: {
      postMeteostat: {
        a_dataDate: {
          0: data.data[0].date,
          1: data.data[1].date,
        },
        b_stringToDate: {
          0: stringToDate(data.data[0].date),
          1: stringToDate(data.data[1].date),
        },
        c_stringToDateVersion2: {
          0: stringToDateVersion2(data.data[0].date),
          1: stringToDateVersion2(data.data[1].date),
        },
        d_dateToISO8601String: {
          stringToDate: {
            0: dateToISO8601String(stringToDate(data.data[0].date)),
            1: dateToISO8601String(stringToDate(data.data[1].date)),
          },
          stringToDateVersion2: {
            0: dateToISO8601String(stringToDateVersion2(data.data[0].date)),
            1: dateToISO8601String(stringToDateVersion2(data.data[1].date)),
          },
        },
        e_dateToISO8601StringVersion2: {
          stringToDate: {
            0: dateToISO8601StringVersion2(stringToDate(data.data[0].date)),
            1: dateToISO8601StringVersion2(stringToDate(data.data[1].date)),
          },
          stringToDateVersion2: {
            0: dateToISO8601StringVersion2(
              stringToDateVersion2(data.data[0].date),
            ),
            1: dateToISO8601StringVersion2(
              stringToDateVersion2(data.data[1].date),
            ),
          },
        },
      },
    },
  });

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
    const isDateInPast = dayDate < today.setHours(0, 0, 0, 0);

    if (!isDateInPast) {
      tmin = null;
      tavg = null;
      tmax = null;
      prcp = null;
      snow = null;
    }

    const dayData = {};
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
    allData = [...allData, dayData];
  }

  return json(allData);
}
