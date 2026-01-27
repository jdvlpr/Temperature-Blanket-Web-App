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

import { METEOSTAT_DELAY_DAYS, OPEN_METEO_DELAY_DAYS } from '$lib/constants';
import { weather } from '$lib/state';
import type {
  TISO8601DateString,
  TISO8601DateStringPeriodSeparated,
  TISO8601DateStringSlashSeparated,
  WeatherDay,
} from '$lib/types';

/**
 * Checks if a given date is recent based on the weather source.
 * @param {string} date - The ISO 8601 `YYYY-MM-DD` date to check.
 * @returns {boolean} - True if the date is recent, false otherwise.
 */
export const getIsRecentDate = (date) => {
  if (!date || weather.isUserEdited) return false;
  const weatherSource = weather.source.name;
  if (weatherSource === 'Open-Meteo') {
    return (
      new Date(date) >
        new Date(
          new Date().getTime() - OPEN_METEO_DELAY_DAYS * 24 * 60 * 60 * 1000,
        ) &&
      new Date(date) < new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000)
    );
  } else if (weatherSource === 'Meteostat') {
    return (
      new Date(date) >
        new Date(
          new Date().getTime() - METEOSTAT_DELAY_DAYS * 24 * 60 * 60 * 1000,
        ) &&
      new Date(date) < new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000)
    );
  }
  return false;
};

export const getIsFutureDate = (date) => {
  if (!date || weather.isUserEdited) return false;

  return (
    new Date(date) > new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000)
  );
};

/**
 * One year from the given date
 *
 * @param   {string}  date  ISO 8601 `YYYY-MM-DD` date string
 *
 * @return  {Date} one year from the given date
 */
export const yearFrom = (date: string): Date => {
  // Ensure the input is a Date object
  let _date = typeof date === 'string' ? stringToDate(date) : date;

  // Add one year
  _date.setUTCFullYear(_date.getUTCFullYear() + 1);

  // Subtract one day
  _date.setUTCDate(_date.getUTCDate() - 1);

  return _date;
};

/**
 * Converts a date to a ISO 8601 strong
 * @param {Date} date - The date to be converted.
 * @returns {string} The ISO 8601 formatted date string `YYYY-MM-DD`.
 */
export const dateToISO8601String = (date) => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};

// Archived function
export const dateToISO8601StringVersion2 = (date) => {
  // Note: don't use .toIsoString, because it sometimes returns the previous date
  // I'm not exactly sure why it doesn't work as expected
  // For example don't do this: const str = new Date(date).toISOString().split('T')[0];

  const str = `${new Date(date).getFullYear()}-${String(new Date(date).getMonth() + 1).padStart(2, '0')}-${String(
    new Date(date).getDate(),
  ).padStart(2, '0')}`;
  return str;
};

/**
 * Converts a string in the format "YYYY-MM-DD",  "YYYY.MM.DD", or  "YYYY/MM/DD" to a date.
 *
 */
export const stringToDate = (
  str:
    | TISO8601DateString
    | TISO8601DateStringPeriodSeparated
    | TISO8601DateStringSlashSeparated,
): Date => {
  const [datePart, timePart] = str.split(' ');
  let [year, month, day] = datePart.split(/[-./]/).map(Number);

  let hours = 0,
    minutes = 0,
    seconds = 0;
  if (timePart) {
    [hours, minutes, seconds] = timePart.split(':').map(Number);
  }
  // Create a date using UTC time (prevents local time shifting)
  const date = new Date(Date.UTC(year, month - 1, day));

  return date;
};

// Archived function
export const stringToDateVersion2 = (str) => {
  if (str.includes('-')) return new Date(str.replace(/-/g, '/'));
  else if (str.includes('.')) return new Date(str.replace(/./g, '/'));
  else if (str.includes('/')) return new Date(str);
  else return new Date(str);
};

/**
 * Calculates the number of days between two dates, inclusive.
 *
 * @param {Date} startDate - The start date.
 * @param {Date} endDate - The end date.
 * @returns {number} The number of days between the start and end dates.
 */
export const numberOfDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  return Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1; // changed from ceil to round in v1.741 seems to have fixed a rounding bug
};

export const getDaysBetween = (startDate: Date, endDate: Date): number => {
  if (!startDate || !endDate) return 0;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((endDate.getTime() - startDate.getTime()) / msPerDay) + 1;
};

export function getWeekNumber(d, dowOffset) {
  // --- 1. Parameter Handling & Validation ---
  // Set default offset to Sunday (ISO 8601) if not provided or invalid type
  dowOffset = typeof dowOffset === 'number' ? dowOffset : 0;

  // Validate the offset value
  if (dowOffset < 0 || dowOffset > 6) {
    throw new Error(
      'dowOffset must be an integer between 0 (Sunday) and 6 (Saturday).',
    );
  }

  // --- 2. Date Preparation ---
  // Copy date so we don't modify the original. Use UTC to avoid timezone issues.
  var date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );

  // --- 3. Adjust Date to the "Reference Day" of the Week ---
  // Calculate the day of the week relative to the specified offset.
  // getUTCDay() returns 0 for Sunday, 1 for Monday, etc.
  // We want a 1-7 representation where 1 is the start day defined by dowOffset.
  // Example: if dowOffset = 1 (Monday), then Mon=1, Tue=2, ..., Sun=7
  // Example: if dowOffset = 0 (Sunday), then Sun=1, Mon=2, ..., Sat=7
  var dayOfWeek = ((date.getUTCDay() - dowOffset + 7) % 7) + 1;

  // Adjust the date to the 4th day (e.g., Thursday if week starts Monday) of the *current* week.
  // Why the 4th day? Because the week belongs to the year containing the majority (>=4) of its days.
  // Shifting to the 4th day ensures that date.getUTCFullYear() below gives the correct year for the week number.
  date.setUTCDate(date.getUTCDate() + 4 - dayOfWeek);

  // --- 4. Calculate Week Number ---
  // Get the first day of the year for the potentially adjusted date's year.
  var yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));

  // Calculate the number of days between the start of the year and the adjusted date (the 4th day of the week).
  var days = (date - yearStart) / 86400000; // 86400000 = ms per day

  // Calculate the week number. Add 1 because days is zero-based, divide by 7, and round up.
  var weekNo = Math.ceil((days + 1) / 7);

  // --- 5. Return Result ---
  // Return array of the year the week belongs to and the calculated week number.

  return [date.getUTCFullYear(), weekNo];
}

export const createWeeksProperty = ({
  weatherData,
  dowOffset = weather.monthGroupingStartDay,
}: {
  weatherData: WeatherDay[];
  dowOffset: number;
}) => {
  if (!weatherData.length) return weatherData;
  const data = weatherData.map((day, i) => {
    const [year, week] = getWeekNumber(day.date, dowOffset);

    return { ...day, weekId: `${year}-${week}` };
  });
  return data;
};

export const isDateWithinLastSevenDays = (date) => {
  // Get the current date
  const currentDate = new Date();

  // Set the current date to midnight for accurate comparison
  currentDate.setUTCHours(0, 0, 0, 0);

  // Calculate the date seven days ago
  const sevenDaysAgo = new Date(currentDate);
  sevenDaysAgo.setUTCDate(currentDate.getUTCDate() - 7);

  // Convert the input date to a Date object for comparison
  // const inputDate = new Date(date);
  const inputDate = typeof date === 'string' ? new Date(date) : date;

  // Check if the input date is within the last seven days
  return inputDate >= sevenDaysAgo && inputDate <= currentDate;
};

/**
 * Converts a date to a Local ISO 8601 string (YYYY-MM-DD)
 * Uses the local machine's timezone, NOT UTC.
 */
export const getLocalISODateString = (
  date: Date = new Date(),
): TISO8601DateString => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');

  return `${year}-${month}-${day}`;
};
