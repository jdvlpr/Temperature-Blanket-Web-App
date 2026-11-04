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

// A day's daylight at a place, from SunCalc. Pure, so it's tested unmocked.

import * as SunCalc from 'suncalc';

const HOUR_MS = 60 * 60 * 1000;

/**
 * Local solar noon of a weather day at a longitude. Weather days are dates
 * at midnight UTC; SunCalc (2.0.2 on) takes the sun of the solar noon
 * nearest the time it's given, which for midnight UTC is the day before
 * from Greenwich westward. Giving it the place's own solar noon picks that
 * day everywhere, whatever SunCalc's version.
 */
export const solarNoonOf = (date: Date, lng: number): Date =>
  new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12) -
      (lng / 15) * HOUR_MS,
  );

/** Hours from sunrise to sunset on a weather day, or null when the sun
 * doesn't rise or set (polar day or night) */
export const daylightHours = (
  date: Date,
  lat: number,
  lng: number,
): number | null => {
  const { sunrise, sunset } = SunCalc.getTimes(
    solarNoonOf(date, lng),
    lat,
    lng,
  );
  if (
    !(sunrise instanceof Date) ||
    !(sunset instanceof Date) ||
    isNaN(sunrise.getTime()) ||
    isNaN(sunset.getTime())
  )
    return null;
  return parseFloat(
    ((sunset.getTime() - sunrise.getTime()) / HOUR_MS).toFixed(6),
  );
};
