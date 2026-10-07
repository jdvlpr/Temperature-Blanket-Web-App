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

// Drawing on a PDF page as the site draws its palettes: round numbered
// swatches, text in black or white on a color (getTextColor), and ranges
// like "105°F → 92°F".

import { fitFontSize } from '$lib/features/palette-image/layout';
import { getTextColor } from '$lib/utils/color-utils';
import { formatRangeNumber } from '$lib/utils/range-format';
import type { jsPDF } from 'jspdf';
import { APP_FONT } from './fonts';
import { lineHeight, ptToMm } from './layout';

export const INK = {
  text: '#1c1917',
  muted: '#57534e',
  line: '#d6d3d1',
  card: '#fafaf9',
  link: '#1d4ed8',
} as const;

export const SIZE = {
  title: 20,
  heading: 14,
  body: 10,
  small: 8.5,
  /** Nothing is smaller than this */
  min: 8,
} as const;

export type Pdf = {
  doc: jsPDF;
  font: string;
};

export type TextStyle = {
  size: number;
  bold?: boolean;
  color?: string;
};

/** Text as the font can draw it: Helvetica has no minus sign */
export const safe = (pdf: Pdf, text: string) =>
  pdf.font === APP_FONT ? text : text.replace(/−/g, '-');

export function style(pdf: Pdf, { size, bold, color }: TextStyle) {
  pdf.doc.setFont(pdf.font, bold ? 'bold' : 'normal');
  pdf.doc.setFontSize(size);
  pdf.doc.setTextColor(color ?? INK.text);
}

export function measure(pdf: Pdf, text: string, textStyle: TextStyle) {
  style(pdf, textStyle);
  return pdf.doc.getTextWidth(safe(pdf, text));
}

/** One line of text, its baseline at y */
export function text(
  pdf: Pdf,
  value: string,
  x: number,
  y: number,
  textStyle: TextStyle,
  align: 'left' | 'center' | 'right' = 'left',
) {
  style(pdf, textStyle);
  pdf.doc.text(safe(pdf, value), x, y, { align });
}

/** Lines of text wrapped to a width, never cut short */
export function wrap(
  pdf: Pdf,
  value: string,
  width: number,
  textStyle: TextStyle,
): string[] {
  style(pdf, textStyle);
  return pdf.doc.splitTextToSize(safe(pdf, value), width) as string[];
}

/** Draw wrapped lines from y (the top of the first line); returns their height */
export function paragraph(
  pdf: Pdf,
  lines: string[],
  x: number,
  y: number,
  textStyle: TextStyle,
): number {
  style(pdf, textStyle);
  const step = lineHeight(textStyle.size);
  lines.forEach((line, i) =>
    pdf.doc.text(line, x, y + ptToMm(textStyle.size) * 0.8 + step * i),
  );
  return step * lines.length;
}

/** Black or white, whichever reads best on a color */
export const inkOn = (hex: string) =>
  getTextColor(hex) === 'white' ? '#ffffff' : '#000000';

/**
 * A color's round swatch, its number on it. Without a fill around it, a
 * faint ring keeps white and pale yarns from vanishing into the paper;
 * `filled` draws just the number, on a card that's already the color.
 */
export function swatch(
  pdf: Pdf,
  {
    cx,
    cy,
    r,
    hex,
    number,
    filled = false,
  }: {
    cx: number;
    cy: number;
    r: number;
    hex: string;
    number?: number;
    filled?: boolean;
  },
) {
  const { doc } = pdf;
  if (!filled) {
    doc.setFillColor(hex);
    doc.setDrawColor(INK.line);
    doc.setLineWidth(0.25);
    doc.circle(cx, cy, r, 'FD');
  }
  if (number === undefined) return;
  const label = String(number);
  const size = fitFontSize({
    text: label,
    preferred: Math.max(SIZE.min, Math.min(11, r * 2.4)),
    maxWidth: r * 1.6,
    measure: (t, s) => measure(pdf, t, { size: s, bold: true }),
  });
  text(
    pdf,
    label,
    cx,
    cy + ptToMm(size) * 0.36,
    { size, bold: true, color: inkOn(hex) },
    'center',
  );
}

export type RangeParts = {
  from: number;
  to: number;
  unit: string;
  /** A temperature's unit sits up by the top of its number, as in 72°F */
  raised: boolean;
};

const UNIT_SIZE = 0.65;
const UNIT_RAISE = 0.3;

/** The arrow's length, as a part of the number's size in millimeters */
const ARROW = 0.9;
const ARROW_GAP = 0.35;

type Run = { text: string; size: number; bold: boolean; raise: number };

function runs(range: RangeParts, size: number): Run[][] {
  const end = (n: number): Run[] => {
    const unitRuns: Run[] = range.unit
      ? [
          {
            text: (range.unit.startsWith('°') ? '' : ' ') + range.unit,
            size: size * UNIT_SIZE,
            bold: false,
            raise: range.raised ? ptToMm(size) * UNIT_RAISE : 0,
          },
        ]
      : [];
    return [
      { text: formatRangeNumber(n), size, bold: true, raise: 0 },
      ...unitRuns,
    ];
  };
  return [end(range.from), end(range.to)];
}

function runsWidth(pdf: Pdf, list: Run[]) {
  return list.reduce((sum, run) => sum + measure(pdf, run.text, run), 0);
}

/** A range's width at a size: both ends and the arrow between them */
export function rangeWidth(pdf: Pdf, range: RangeParts, size: number) {
  const [from, to] = runs(range, size);
  const mm = ptToMm(size);
  return (
    runsWidth(pdf, from) + runsWidth(pdf, to) + mm * (ARROW + ARROW_GAP * 2)
  );
}

/**
 * "105°F → 92°F" with its baseline at y. The arrow is drawn, so it looks
 * the same in any font. Shrinks to fit `maxWidth`; returns its width.
 */
export function range(
  pdf: Pdf,
  value: RangeParts,
  {
    x,
    y,
    size,
    maxWidth,
    color = INK.text,
    align = 'left',
  }: {
    x: number;
    y: number;
    size: number;
    maxWidth: number;
    color?: string;
    align?: 'left' | 'right';
  },
): number {
  const fitted = fitFontSize({
    text: '',
    preferred: size,
    maxWidth,
    measure: (_t, s) => rangeWidth(pdf, value, s),
  });
  const width = rangeWidth(pdf, value, fitted);
  const mm = ptToMm(fitted);
  let cursor = align === 'right' ? x - width : x;

  const drawRuns = (list: Run[]) => {
    for (const run of list) {
      text(pdf, run.text, cursor, y - run.raise, {
        size: run.size,
        bold: run.bold,
        color,
      });
      cursor += measure(pdf, run.text, run);
    }
  };

  const [from, to] = runs(value, fitted);
  drawRuns(from);

  // The arrow, about at the middle of the numbers' height, a little faded
  cursor += mm * ARROW_GAP;
  const ay = y - mm * 0.36;
  const length = mm * ARROW;
  const head = mm * 0.28;
  const { doc } = pdf;
  doc.setDrawColor(color === INK.text ? INK.muted : color);
  doc.setLineWidth(Math.max(0.2, mm * 0.07));
  doc.setLineCap('round');
  doc.setLineJoin('round');
  doc.line(cursor, ay, cursor + length, ay);
  doc.lines(
    [
      [-head, -head],
      [head, head],
      [-head, head],
    ],
    cursor + length,
    ay,
    [1, 1],
    'S',
    false,
  );
  doc.setLineCap('butt');
  cursor += length + mm * ARROW_GAP;

  drawRuns(to);
  return width;
}
