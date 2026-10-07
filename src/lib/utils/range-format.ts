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

// How a range reads everywhere it's shown (palette editor, gallery, palette
// image, PDF, Google Sheets): "105°F → 92°F", From first, in the gauge's
// direction. Whether a range includes its From and To is said once per gauge,
// in words (`rangeRuleSentence`), not on each range.

/** A number in a range, with a real minus sign: "−5" */
export const formatRangeNumber = (n: number) =>
  n < 0 ? `−${Math.abs(n)}` : `${n}`;

/** One end of a range with its unit: "72°F" (a degree sign hugs its number), "10 mm" */
export function formatRangeEnd(n: number, unit = ''): string {
  if (!unit) return formatRangeNumber(n);
  const gap = unit.startsWith('°') ? '' : ' ';
  return `${formatRangeNumber(n)}${gap}${unit}`;
}

/** A range as text: "105°F → 92°F", "−15 → −5 mm" */
export function formatRangeLabel(from: number, to: number, unit = ''): string {
  return `${formatRangeEnd(from, unit)} → ${formatRangeEnd(to, unit)}`;
}

/** Which ends of each range count as in it, said once for a gauge, e.g.
 * "Each range includes its From number, not its To." */
export function rangeRuleSentence({
  includeFromValue,
  includeToValue,
}: {
  includeFromValue: boolean | undefined;
  includeToValue: boolean | undefined;
}): string {
  if (includeFromValue && includeToValue)
    return 'Each range includes both its From and To numbers.';
  if (includeFromValue)
    return 'Each range includes its From number, not its To number.';
  if (includeToValue) return 'Each range includes its To number, not its From number.';
  return 'Each range includes neither its From nor its To number.';
}
