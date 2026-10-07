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

// Where things go on a PDF's pages, without drawing anything, so it can be
// tested. Sizes are in millimeters; font sizes in points.

import type { PdfPageSize } from './options';

export const PAGE_SIZES: Record<
  PdfPageSize,
  { width: number; height: number }
> = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
};

export const MARGIN = { top: 16, side: 14, bottom: 20 };

/** The footer's baseline, up from the page's bottom edge */
export const FOOTER_OFFSET = 9;

/** A font size in points, as millimeters */
export const ptToMm = (pt: number) => pt * 0.3528;

/** A line of text's height, in millimeters */
export const lineHeight = (pt: number, leading = 1.25) => ptToMm(pt) * leading;

export type Box = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  pageWidth: number;
  pageHeight: number;
};

/** The part of a page that content goes in */
export function pageBox(size: PdfPageSize): Box {
  const { width, height } = PAGE_SIZES[size];
  return {
    left: MARGIN.side,
    right: width - MARGIN.side,
    top: MARGIN.top,
    bottom: height - MARGIN.bottom,
    width: width - MARGIN.side * 2,
    pageWidth: width,
    pageHeight: height,
  };
}

/** Just what Flow needs of a jsPDF document */
export type Pages = { addPage: () => unknown };

/**
 * Content flowing down the pages: `y` is where the next thing goes. Before
 * drawing something, ask for room; a new page starts when it won't fit,
 * and `onNewPage` can draw what each page repeats (a table's header).
 */
export class Flow {
  y: number;
  pages = 1;
  onNewPage: (() => void) | null = null;

  constructor(
    private doc: Pages,
    readonly box: Box,
  ) {
    this.y = box.top;
  }

  /** Room left on this page */
  get room() {
    return this.box.bottom - this.y;
  }

  newPage() {
    this.doc.addPage();
    this.pages += 1;
    this.y = this.box.top;
    this.onNewPage?.();
  }

  /** Make room for `height`, starting a page if needed (but not on an empty
   * page: something too tall for one goes on it anyway). True if it did. */
  ensure(height: number): boolean {
    if (height <= this.room || this.y <= this.box.top) return false;
    this.newPage();
    return true;
  }
}

/** How many cards go across a grid of this width */
export const gridColumns = (width: number) => (width >= 150 ? 3 : 2);

export const GRID_GAP = 3;

/** Each card's x and width in a grid row */
export function gridCells(
  left: number,
  width: number,
): { x: number; width: number }[] {
  const columns = gridColumns(width);
  const cellWidth = (width - GRID_GAP * (columns - 1)) / columns;
  return Array.from({ length: columns }, (_, i) => ({
    x: left + i * (cellWidth + GRID_GAP),
    width: cellWidth,
  }));
}

/** The most the day and place column grows to, so places wrap less */
const DAY_COLUMN_MAX = 46;

/**
 * Weather table columns, from the width each would like (its widest value):
 * with room to spare, the day and place column grows first, then the rest
 * share what's left; short of room, every column gives up the same share.
 */
export function tableColumns(
  left: number,
  width: number,
  wants: { day: number; data: number[] },
): { day: { x: number; width: number }; data: { x: number; width: number }[] } {
  const wanted = wants.day + wants.data.reduce((sum, w) => sum + w, 0);
  let day = wants.day;
  let data = [...wants.data];
  if (wanted > width) {
    const scale = width / wanted;
    day *= scale;
    data = data.map((w) => w * scale);
  } else {
    let spare = width - wanted;
    const grow = Math.min(spare, Math.max(0, DAY_COLUMN_MAX - day));
    day += grow;
    spare -= grow;
    if (data.length) data = data.map((w) => w + spare / data.length);
    else day += spare;
  }
  let x = left + day;
  return {
    day: { x: left, width: day },
    data: data.map((w) => {
      const column = { x, width: w };
      x += w;
      return column;
    }),
  };
}

/** Fit a w×h image inside a box, keeping its shape */
export function fitImage(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  const scale = Math.min(maxWidth / width, maxHeight / height);
  return { width: width * scale, height: height * scale };
}
