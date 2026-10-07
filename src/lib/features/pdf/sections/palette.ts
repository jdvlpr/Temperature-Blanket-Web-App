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

// A palette's colors as the site shows them (View › List or Grid): each a
// numbered round swatch with its yarn, its range and, if asked for, its days.
// With Fill with color, each row or card takes its color.

import {
  INK,
  SIZE,
  inkOn,
  measure,
  paragraph,
  range,
  rangeWidth,
  swatch,
  text,
  wrap,
  type Pdf,
  type RangeParts,
} from '../draw';
import { GRID_GAP, Flow, gridCells, lineHeight, ptToMm } from '../layout';
import type { PdfLayout } from '../options';

export type PaletteItem = {
  hex: string;
  /** Its number in the palette */
  number?: number;
  /** Its role instead, for a preview's border or accent color */
  role?: string;
  /** Its colorway name, or its hex code */
  name: string;
  /** "Brand · Yarn" */
  yarn?: string;
  /** Its hex code, when asked for and not already its name */
  hexLabel?: string;
  range?: RangeParts | { label: string };
  /** Days in its range, for each of the gauge's targets */
  days?: { label: string; count: string; percent: string }[];
};

const PAD = 3;
const RADIUS = 1.8;
const SWATCH_R = 4.2;
const RANGE_SIZE = 11;
const DAY_WIDTH = 20;

const colorsFor = (item: PaletteItem, filled: boolean) =>
  filled
    ? { text: inkOn(item.hex), muted: inkOn(item.hex) }
    : { text: INK.text, muted: INK.muted };

type Block = { lines: string[]; size: number; bold?: boolean; muted?: boolean };

/** The yarn's lines (role, name, "Brand · Yarn", hex code) wrapped to a width */
function yarnBlocks(pdf: Pdf, item: PaletteItem, width: number): Block[] {
  const blocks: Block[] = [];
  if (item.role)
    blocks.push({
      lines: wrap(pdf, item.role, width, { size: SIZE.small, bold: true }),
      size: SIZE.small,
      bold: true,
      muted: true,
    });
  blocks.push({
    lines: wrap(pdf, item.name, width, { size: SIZE.body, bold: true }),
    size: SIZE.body,
    bold: true,
  });
  if (item.yarn)
    blocks.push({
      lines: wrap(pdf, item.yarn, width, { size: SIZE.small }),
      size: SIZE.small,
      muted: true,
    });
  if (item.hexLabel)
    blocks.push({
      lines: [item.hexLabel],
      size: SIZE.small,
      muted: true,
    });
  return blocks;
}

const blocksHeight = (blocks: Block[]) =>
  blocks.reduce((sum, b) => sum + lineHeight(b.size) * b.lines.length, 0);

function drawBlocks(
  pdf: Pdf,
  blocks: Block[],
  x: number,
  y: number,
  ink: { text: string; muted: string },
) {
  let top = y;
  for (const block of blocks) {
    top += paragraph(pdf, block.lines, x, top, {
      size: block.size,
      bold: block.bold,
      color: block.muted ? ink.muted : ink.text,
    });
  }
}

const isNumbers = (r: PaletteItem['range']): r is RangeParts =>
  !!r && 'from' in r;

/** A range's width, or a category's label's */
function rangeSpace(pdf: Pdf, item: PaletteItem) {
  if (!item.range) return 0;
  if (isNumbers(item.range)) return rangeWidth(pdf, item.range, RANGE_SIZE);
  return measure(pdf, item.range.label, { size: SIZE.body, bold: true });
}

function drawRange(
  pdf: Pdf,
  item: PaletteItem,
  {
    x,
    y,
    maxWidth,
    color,
    align,
  }: {
    x: number;
    y: number;
    maxWidth: number;
    color: string;
    align: 'left' | 'right';
  },
): number {
  if (!item.range) return 0;
  if (isNumbers(item.range)) {
    range(pdf, item.range, {
      x,
      y: y + ptToMm(RANGE_SIZE) * 0.8,
      size: RANGE_SIZE,
      maxWidth,
      color,
      align,
    });
    return lineHeight(RANGE_SIZE);
  }
  const lines = wrap(pdf, item.range.label, maxWidth, {
    size: SIZE.body,
    bold: true,
  });
  const left = align === 'right' ? x - maxWidth : x;
  return paragraph(pdf, lines, left, y, {
    size: SIZE.body,
    bold: true,
    color,
  });
}

function drawSwatch(
  pdf: Pdf,
  item: PaletteItem,
  cx: number,
  cy: number,
  filled: boolean,
) {
  swatch(pdf, {
    cx,
    cy,
    r: SWATCH_R,
    hex: item.hex,
    number: item.number,
    filled,
  });
}

/** One day cell: "High", "20 days", "5.5%" */
function dayLines(day: NonNullable<PaletteItem['days']>[number]) {
  return [
    { text: day.label, size: SIZE.small, bold: false, muted: true },
    { text: day.count, size: SIZE.small, bold: true, muted: false },
    { text: day.percent, size: SIZE.small, bold: false, muted: true },
  ];
}

function drawList(pdf: Pdf, flow: Flow, items: PaletteItem[], filled: boolean) {
  const { doc } = pdf;
  const { left, width } = flow.box;
  const dayCount = items[0]?.days?.length ?? 0;
  const daysWidth = dayCount * DAY_WIDTH;
  const rangeColumn = Math.min(
    Math.max(0, ...items.map((item) => rangeSpace(pdf, item))),
    width * 0.34,
  );
  const textX = left + PAD + SWATCH_R * 2 + 3;
  const textWidth =
    left +
    width -
    PAD -
    daysWidth -
    (rangeColumn ? rangeColumn + 4 : 0) -
    textX;
  const dayHeight = lineHeight(SIZE.small) * 3;

  let chunkTop = flow.y;
  const closeChunk = () => {
    if (flow.y <= chunkTop) return;
    doc.setDrawColor(INK.line);
    doc.setLineWidth(0.3);
    doc.roundedRect(
      left,
      chunkTop,
      width,
      flow.y - chunkTop,
      RADIUS,
      RADIUS,
      'S',
    );
  };

  items.forEach((item, index) => {
    const blocks = yarnBlocks(pdf, item, textWidth);
    let rangeLines = lineHeight(RANGE_SIZE);
    if (item.range && !isNumbers(item.range))
      rangeLines =
        wrap(pdf, item.range.label, rangeColumn, {
          size: SIZE.body,
          bold: true,
        }).length * lineHeight(SIZE.body);
    const height =
      Math.max(
        SWATCH_R * 2,
        blocksHeight(blocks),
        dayCount ? dayHeight : 0,
        item.range ? rangeLines : 0,
      ) +
      PAD * 2;

    if (height > flow.room && flow.y > flow.box.top) {
      closeChunk();
      flow.newPage();
      chunkTop = flow.y;
    }
    const top = flow.y;
    const ink = colorsFor(item, filled);

    if (filled) {
      doc.setFillColor(item.hex);
      doc.rect(left, top, width, height, 'F');
    }
    // A line between rows, as the site's list has
    if (index > 0 && top > chunkTop) {
      doc.setDrawColor(INK.line);
      doc.setLineWidth(0.3);
      doc.line(left, top, left + width, top);
    }

    drawSwatch(pdf, item, left + PAD + SWATCH_R, top + height / 2, filled);
    drawBlocks(
      pdf,
      blocks,
      textX,
      top + (height - blocksHeight(blocks)) / 2,
      ink,
    );

    const rangeRight = left + width - PAD - daysWidth;
    if (item.range)
      drawRange(pdf, item, {
        x: rangeRight,
        y: top + (height - rangeLines) / 2,
        maxWidth: rangeColumn,
        color: ink.text,
        align: 'right',
      });

    item.days?.forEach((day, d) => {
      const x = rangeRight + 4 + d * DAY_WIDTH;
      let y = top + (height - dayHeight) / 2;
      for (const line of dayLines(day)) {
        y += paragraph(pdf, [line.text], x, y, {
          size: line.size,
          bold: line.bold,
          color: line.muted ? ink.muted : ink.text,
        });
      }
    });

    flow.y = top + height;
  });
  closeChunk();
}

function drawGrid(pdf: Pdf, flow: Flow, items: PaletteItem[], filled: boolean) {
  const { doc } = pdf;
  // A filled card without a number has nothing to show at the top
  const swatchSpace = (item: PaletteItem) =>
    filled && item.number === undefined ? 0 : SWATCH_R * 2 + 2.5;
  const cells = gridCells(flow.box.left, flow.box.width);
  const pad = PAD + 0.5;

  for (let start = 0; start < items.length; start += cells.length) {
    const row = items.slice(start, start + cells.length);
    const laid = row.map((item, i) => {
      const inner = cells[i].width - pad * 2;
      const blocks = yarnBlocks(pdf, item, inner);
      const rangeHeight = !item.range
        ? 0
        : isNumbers(item.range)
          ? lineHeight(RANGE_SIZE)
          : wrap(pdf, item.range.label, inner, { size: SIZE.body, bold: true })
              .length * lineHeight(SIZE.body);
      const daysHeight = (item.days?.length ?? 0) * lineHeight(SIZE.small);
      const height =
        pad +
        swatchSpace(item) +
        blocksHeight(blocks) +
        (rangeHeight ? 2 + rangeHeight : 0) +
        (daysHeight ? 2 + daysHeight : 0) +
        pad;
      return { item, cell: cells[i], inner, blocks, rangeHeight, height };
    });
    const rowHeight = Math.max(...laid.map((l) => l.height));
    flow.ensure(rowHeight);
    const top = flow.y;

    for (const { item, cell, inner, blocks, rangeHeight } of laid) {
      const ink = colorsFor(item, filled);
      doc.setLineWidth(0.3);
      // A pale color's card keeps an edge, so it doesn't vanish into the paper
      doc.setDrawColor(
        filled && inkOn(item.hex) === '#ffffff' ? item.hex : INK.line,
      );
      doc.setFillColor(filled ? item.hex : INK.card);
      doc.roundedRect(cell.x, top, cell.width, rowHeight, RADIUS, RADIUS, 'FD');

      const x = cell.x + pad;
      if (swatchSpace(item))
        drawSwatch(pdf, item, x + SWATCH_R, top + pad + SWATCH_R, filled);
      let y = top + pad + swatchSpace(item);
      drawBlocks(pdf, blocks, x, y, ink);
      y += blocksHeight(blocks);

      // The range and days sit at the card's bottom, lined up across the row
      const daysHeight = (item.days?.length ?? 0) * lineHeight(SIZE.small);
      let bottom = top + rowHeight - pad - daysHeight;
      if (item.range) {
        bottom -= rangeHeight + (daysHeight ? 2 : 0);
        drawRange(pdf, item, {
          x,
          y: Math.max(y + 2, bottom),
          maxWidth: inner,
          color: ink.text,
          align: 'left',
        });
      }
      let dayY = top + rowHeight - pad - daysHeight;
      for (const day of item.days ?? []) {
        const baseline = dayY + ptToMm(SIZE.small) * 0.8;
        text(pdf, day.label, x, baseline, {
          size: SIZE.small,
          color: ink.muted,
        });
        text(
          pdf,
          `${day.count} · ${day.percent}`,
          x + inner,
          baseline,
          { size: SIZE.small, bold: true, color: ink.text },
          'right',
        );
        dayY += lineHeight(SIZE.small);
      }
    }
    flow.y = top + rowHeight + GRID_GAP;
  }
}

export function drawPalette(
  pdf: Pdf,
  flow: Flow,
  items: PaletteItem[],
  { layout, filled }: { layout: PdfLayout; filled: boolean },
) {
  if (!items.length) return;
  if (layout === 'grid') drawGrid(pdf, flow, items, filled);
  else drawList(pdf, flow, items, filled);
}
