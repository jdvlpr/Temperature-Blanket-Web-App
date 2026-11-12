// Copyright (c) 2026, Thomas (https://github.com/jdvlpr)
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

// The Weather step's notes about its weather (modals/WeatherNotes.svelte):
// values missing, and recent days that may still change. Pure words only.

/** How many days (or weeks) have no value, per value */
export type MissingCounts = {
  tmin: number;
  tavg: number;
  tmax: number;
  prcp: number;
  snow: number;
};

const plural = (word: string, count: number) =>
  `${count} ${word}${count === 1 ? '' : 's'}`;

/** "a", "a and b", "a, b and c" */
const list = (words: string[], and = 'and') =>
  words.length < 2
    ? (words[0] ?? '')
    : `${words.slice(0, -1).join(', ')} ${and} ${words[words.length - 1]}`;

const TEMPS = [
  ['tmin', 'low'],
  ['tavg', 'average'],
  ['tmax', 'high'],
] as const;

/** The values in one line: "temperatures" for all three, else "low and high
 * temperatures" / "high temperature", then rain and snow */
function valuesWords(keys: (keyof MissingCounts)[], and: string): string {
  const temps = TEMPS.filter(([key]) => keys.includes(key)).map(([, w]) => w);
  const words: string[] = [];
  if (temps.length === 3) words.push('temperatures');
  else if (temps.length)
    words.push(`${list(temps, and)} temperature${temps.length > 1 ? 's' : ''}`);
  if (keys.includes('prcp')) words.push('rain');
  if (keys.includes('snow')) words.push('snow');
  return list(words, and);
}

/**
 * One line per number of days missing, the values missing on as many days
 * sharing it: "3 days are missing temperatures, rain and snow.", "No days
 * have snow data." when none has it.
 */
export function missingLines(
  counts: MissingCounts,
  total: number,
  unit: 'day' | 'week' = 'day',
): string[] {
  const order: (keyof MissingCounts)[] = [
    'tmin',
    'tavg',
    'tmax',
    'prcp',
    'snow',
  ];
  // Never more than there are days
  const countOf = (key: keyof MissingCounts) => Math.min(counts[key], total);
  const groups = new Map<number, (keyof MissingCounts)[]>();
  for (const key of order) {
    const count = countOf(key);
    if (count > 0) groups.set(count, [...(groups.get(count) ?? []), key]);
  }
  return [...groups].map(([count, keys]) =>
    count >= total
      ? `No ${unit}s have ${valuesWords(keys, 'or')} data.`
      : `${plural(unit, count)} ${count === 1 ? 'is' : 'are'} missing ${valuesWords(keys, 'and')}.`,
  );
}

/**
 * The notice line's words: "3 days missing values · 5 recent days may still
 * change", either half alone when only one applies
 */
export function noticeLabel({
  missing,
  recent,
  unit = 'day',
}: {
  /** Days (or weeks) missing a temperature */
  missing: number;
  /** Recent days whose values may still change */
  recent: number;
  unit?: 'day' | 'week';
}): string {
  const parts: string[] = [];
  if (missing) parts.push(`${plural(unit, missing)} missing values`);
  if (recent) parts.push(`${plural('recent day', recent)} may still change`);
  const text = parts.join(' · ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}
