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

// Where everything goes in a palette image, without drawing anything, so it
// can be tested. Sizes are in the image's own pixels.

export const PALETTE_IMAGE_LAYOUTS = ['rows', 'stripes', 'swatches'] as const;
export type PaletteImageLayout = (typeof PALETTE_IMAGE_LAYOUTS)[number];

export const PALETTE_IMAGE_SHAPES = ['fit', 'square', 'portrait'] as const;
export type PaletteImageShape = (typeof PALETTE_IMAGE_SHAPES)[number];

export type PaletteImageBackground = 'light' | 'dark';

export type PaletteImageLabels = {
  /** Brand and yarn name, on one line */
  yarn: boolean;
  colorway: boolean;
  hex: boolean;
  /** A project gauge's range, like 50–59 °F */
  range: boolean;
};

export type PaletteImageSettings = {
  layout: PaletteImageLayout;
  shape: PaletteImageShape;
  background: PaletteImageBackground;
  gaps: boolean;
  labels: PaletteImageLabels;
};

export const DEFAULT_PALETTE_IMAGE_SETTINGS: PaletteImageSettings = {
  layout: 'rows',
  shape: 'fit',
  background: 'light',
  gaps: false,
  labels: { yarn: true, colorway: true, hex: false, range: true },
};

/** Every image is this wide, whatever the screen it's made on */
export const IMAGE_WIDTH = 1080;
export const SHAPE_HEIGHTS = { square: 1080, portrait: 1350 } as const;

export const PADDING = 48;
export const GAP = 16;
export const TITLE_HEIGHT = 96;
export const FOOTER_HEIGHT = 56;
/** A row's height in a Fit image of rows */
export const FIT_ROW_HEIGHT = 140;
/** The stripes' height in a Fit image of stripes */
export const FIT_STRIPES_HEIGHT = 900;

export type Rect = { x: number; y: number; width: number; height: number };

export type PaletteImageGeometry = {
  width: number;
  height: number;
  title: Rect | null;
  /** The area the colors fill */
  bounds: Rect;
  cells: Rect[];
  footer: Rect;
};

/** Columns for a grid of swatches: the most even grid for a Fit image, or
 * the one with the biggest swatches in a fixed space */
export function getSwatchColumns({
  count,
  width,
  height,
  gap,
}: {
  count: number;
  width: number;
  height?: number;
  gap: number;
}): number {
  if (count <= 1) return 1;
  if (height === undefined) return Math.ceil(Math.sqrt(count));
  let best = 1;
  let bestSize = 0;
  for (let columns = 1; columns <= count; columns++) {
    const rows = Math.ceil(count / columns);
    const cellWidth = (width - gap * (columns - 1)) / columns;
    const cellHeight = (height - gap * (rows - 1)) / rows;
    const size = Math.min(cellWidth, cellHeight);
    if (size > bestSize) {
      best = columns;
      bestSize = size;
    }
  }
  return best;
}

export function getPaletteImageGeometry({
  count,
  layout,
  shape,
  gaps,
  hasTitle,
}: {
  count: number;
  layout: PaletteImageLayout;
  shape: PaletteImageShape;
  gaps: boolean;
  hasTitle: boolean;
}): PaletteImageGeometry {
  const n = Math.max(count, 1);
  const gap = gaps ? GAP : 0;
  const width = IMAGE_WIDTH;
  const contentWidth = width - PADDING * 2;
  const top = PADDING + (hasTitle ? TITLE_HEIGHT : 0);

  // The colors' height: set by the shape, or by the colors in a Fit image
  let contentHeight: number;
  let columns = 1;
  if (shape !== 'fit') {
    contentHeight = SHAPE_HEIGHTS[shape] - top - PADDING - FOOTER_HEIGHT;
    if (layout === 'swatches')
      columns = getSwatchColumns({
        count: n,
        width: contentWidth,
        height: contentHeight,
        gap,
      });
  } else if (layout === 'rows') {
    contentHeight = n * FIT_ROW_HEIGHT + gap * (n - 1);
  } else if (layout === 'stripes') {
    contentHeight = FIT_STRIPES_HEIGHT;
  } else {
    columns = getSwatchColumns({ count: n, width: contentWidth, gap });
    const rows = Math.ceil(n / columns);
    const size = (contentWidth - gap * (columns - 1)) / columns;
    contentHeight = rows * size + gap * (rows - 1);
  }

  const height = top + contentHeight + PADDING + FOOTER_HEIGHT;
  const bounds = {
    x: PADDING,
    y: top,
    width: contentWidth,
    height: contentHeight,
  };

  const cells: Rect[] = [];
  if (layout === 'rows') {
    const rowHeight = (contentHeight - gap * (n - 1)) / n;
    for (let i = 0; i < count; i++)
      cells.push({
        x: bounds.x,
        y: bounds.y + i * (rowHeight + gap),
        width: contentWidth,
        height: rowHeight,
      });
  } else if (layout === 'stripes') {
    const stripeWidth = (contentWidth - gap * (n - 1)) / n;
    for (let i = 0; i < count; i++)
      cells.push({
        x: bounds.x + i * (stripeWidth + gap),
        y: bounds.y,
        width: stripeWidth,
        height: contentHeight,
      });
  } else {
    const rows = Math.ceil(n / columns);
    const cellWidth = (contentWidth - gap * (columns - 1)) / columns;
    const cellHeight = (contentHeight - gap * (rows - 1)) / rows;
    for (let i = 0; i < count; i++)
      cells.push({
        x: bounds.x + (i % columns) * (cellWidth + gap),
        y: bounds.y + Math.floor(i / columns) * (cellHeight + gap),
        width: cellWidth,
        height: cellHeight,
      });
  }

  return {
    width,
    height,
    title: hasTitle
      ? { x: PADDING, y: PADDING, width: contentWidth, height: TITLE_HEIGHT }
      : null,
    bounds,
    cells,
    footer: {
      x: PADDING,
      y: top + contentHeight + PADDING / 2,
      width: contentWidth,
      height: FOOTER_HEIGHT,
    },
  };
}

/** A line's width at a font size, from the canvas */
export type Measure = (text: string, fontSize: number) => number;

/** The biggest size up to `preferred` at which the text fits `maxWidth`.
 * Text is never cut short; it only gets smaller. */
export function fitFontSize({
  text,
  preferred,
  maxWidth,
  measure,
}: {
  text: string;
  preferred: number;
  maxWidth: number;
  measure: Measure;
}): number {
  if (maxWidth <= 0) return 0;
  const width = measure(text, preferred);
  if (width <= maxWidth) return preferred;
  // Width grows about in step with size; check, and step down if it's not quite
  let size = (preferred * maxWidth) / width;
  for (let i = 0; i < 100 && size > 0.5 && measure(text, size) > maxWidth; i++)
    size *= 0.97;
  return size;
}

export type TextLine = {
  text: string;
  /** The size it would like to be */
  size: number;
  measure: Measure;
};

export const LINE_HEIGHT = 1.2;

/** Sizes for a block of lines in a box: all shrink together to fit its
 * height, and each shrinks further on its own to fit its width */
export function fitLines({
  lines,
  width,
  height,
}: {
  lines: TextLine[];
  width: number;
  height: number;
}): number[] {
  const total = lines.reduce((sum, line) => sum + line.size * LINE_HEIGHT, 0);
  const scale = total > height ? Math.max(height, 0) / total : 1;
  return lines.map((line) =>
    fitFontSize({
      text: line.text,
      preferred: line.size * scale,
      maxWidth: width,
      measure: line.measure,
    }),
  );
}
