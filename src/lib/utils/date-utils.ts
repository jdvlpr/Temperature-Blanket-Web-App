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
import type { WeatherDay } from '$lib/types';

/**
 * Checks if a given date is recent based on the weather source.
 * @param {string | Date} date - The ISO 8601 `YYYY-MM-DD` or Date date to check
 * @returns {boolean} - True if the date is recent, false otherwise.
 */
export const getIsRecentDate = (date) => {
  if (typeof date === 'string') date = stringToDate(date);
  if (!date || weather.isUserEdited) return false;
  const weatherSource = weather.defaultSource;

  console.log({
    date,
    newD: new Date(
      new Date().getTime() - OPEN_METEO_DELAY_DAYS * 24 * 60 * 60 * 1000,
    ),
  });

  const now = new Date();
  const msPerDay = 24 * 60 * 60 * 1000;
  const oneDayAgo = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);

  if (weatherSource === 'Open-Meteo') {
    const daysAgo = new Date(now.getTime() - OPEN_METEO_DELAY_DAYS * msPerDay);

    const utcMidnightDaysAgo = new Date(
      Date.UTC(
        daysAgo.getUTCFullYear(),
        daysAgo.getUTCMonth(),
        daysAgo.getUTCDate(),
      ),
    );
    return date > utcMidnightDaysAgo && date < oneDayAgo;
  } else if (weatherSource === 'Meteostat') {
    const daysAgo = new Date(now.getTime() - METEOSTAT_DELAY_DAYS * msPerDay);

    const utcMidnightDaysAgo = new Date(
      Date.UTC(
        daysAgo.getUTCFullYear(),
        daysAgo.getUTCMonth(),
        daysAgo.getUTCDate(),
      ),
    );

    return date > utcMidnightDaysAgo && date < oneDayAgo;
  }
  return false;
};

export const getIsFutureDate = (date) => {
  if (!date || weather.isUserEdited) return false;

  return (
    stringToDate(date) >
    new Date(Date.UTC(new Date().getTime() - 1 * 24 * 60 * 60 * 1000))
  );
};

/**
 * One year from the given date
 *
 * @param   {string | Date}  date  ISO 8601 `YYYY-MM-DD` date string or Date
 *
 * @return  {Date} one year from the given date
 */
export const yearFrom = (date) => {
  let _date = date;
  if (typeof date === 'string') _date = stringToDate(date);
  const yearFromDate = new Date(_date.setFullYear(_date.getFullYear() + 1));
  return new Date(yearFromDate.setDate(new Date(yearFromDate).getDate() - 1));
};

/**
 * Converts a date to a ISO 8601 strong
 * @param {Date} date - The date to be converted.
 * @returns {string} The ISO 8601 formatted date string `YYYY-MM-DD`.
 */
export const dateToISO8601String = (date) => {
  console.log({ date });

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');

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
 * @param   {string}  str  The string to be converted.
 *
 * @return  {Date} The UTC date
 */
export const stringToDate = (str) => {
  console.log({ str });

  let _datePart = str;
  if (str.includes(' ')) _datePart = str.split(' ')[0];

  let splitDatePart;
  if (_datePart.includes('-')) splitDatePart = _datePart.split('-').map(Number);
  else if (_datePart.includes('.'))
    splitDatePart = _datePart.split('.').map(Number);
  else if (_datePart.includes('/'))
    splitDatePart = _datePart.split('/').map(Number);

  const [year, month, day] = splitDatePart;

  // disregard the time part
  // if (timePart && timePart.includes(':')) {
  //   const [hour, minute, second] = timePart.split(':').map(Number);
  //   return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  // }

  return new Date(Date.UTC(year, month - 1, day));
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
  return Math.round((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1; // changed from ceil to round in v1.741 seems to have fixed a rounding bug
};

/**
 * Returns the week number for this date.  dowOffset is the day of week the week
 * "starts" on for your locale - it can be from 0 to 6. If dowOffset is 1 (Monday),
 * the week returned is the ISO 8601 week number.
 * @param int dowOffset
 * @return int
 */
export const getWeek = ({ date, dowOffset }) => {
  /* getWeek() was developed by Nick Baicoianu at MeanFreePath: http://www.meanfreepath.com */
  dowOffset = typeof dowOffset === 'number' ? dowOffset : 0; // default dowOffset to zero, Sunday
  const newYear = new Date(date.getFullYear(), 0, 1);
  let day = newYear.getDay() - dowOffset; // the day of week the year begins on
  day = day >= 0 ? day : day + 7;
  const daynum =
    Math.floor(
      (date.getTime() -
        newYear.getTime() -
        (date.getTimezoneOffset() - newYear.getTimezoneOffset()) * 60000) /
        86400000,
    ) + 1;
  // if the year starts before the middle of a week
  const weeknum = Math.floor((daynum + day - 1) / 7) + 1;
  return weeknum;
};

export const createWeeksProperty = ({
  weatherData,
  dowOffset = weather.monthGroupingStartDay,
}: {
  weatherData: WeatherDay[];
  dowOffset: number;
}) => {
  if (!weatherData.length) return weatherData;
  const data = weatherData.map((day, i) => {
    const week = getWeek({ date: day.date, dowOffset });
    const year = day.date.getFullYear();
    return { ...day, weekId: `${year}-${week}` };
  });
  return data;
};

export const isDateWithinLastSevenDays = (date) => {
  // Get the current date
  const currentDate = new Date();

  // Set the current date to midnight for accurate comparison
  currentDate.setHours(0, 0, 0, 0);

  // Calculate the date seven days ago
  const sevenDaysAgo = new Date(currentDate);
  sevenDaysAgo.setDate(currentDate.getDate() - 7);

  // Convert the input date to a Date object for comparison
  // const inputDate = new Date(date);
  const inputDate = typeof date === 'string' ? stringToDate(date) : date;

  // Check if the input date is within the last seven days
  return inputDate >= sevenDaysAgo && inputDate <= currentDate;
};

export const getToday = (): Date => {
  let dateToday = new Date(new Date().setHours(24, 0, 0, 0));
  let today = dateToday.setDate(dateToday.getDate() - 1); // why this way??
  return today;
};
