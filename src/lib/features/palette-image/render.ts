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

// Draws a palette image on a canvas, in the site's fonts, in the same design
// as the gauge customizer's colors: filled with the color, or a round swatch
// beside the text; a muted second line; ranges as "40 → 49" with a small unit

import { getTextColor } from '$lib/utils/color-utils';
import {
  LINE_HEIGHT,
  fitFontSize,
  fitLines,
  formatRangeNumber,
  getPaletteImageGeometry,
  getSwatchPlacement,
  type Measure,
  type PaletteImageLabels,
  type PaletteImageRange,
  type PaletteImageSettings,
  type Rect,
  type TextLine,
} from './layout';

export type PaletteImageColor = {
  hex: string;
  name?: string;
  brandName?: string;
  yarnName?: string;
};

const BODY_FONT = '"Be Vietnam Pro", sans-serif';
const HEADING_FONT = '"Fraunces Variable", serif';

const THEMES = {
  light: {
    background: '#ffffff',
    title: '#1c1917',
    // Secondary text and an unfilled color's card, as on the site's surface
    muted: '#57534e',
    card: '#f5f5f4',
    line: 'rgba(0, 0, 0, 0.12)',
  },
  dark: {
    background: '#18181b',
    title: '#f4f4f5',
    muted: '#d6d3d1',
    card: '#27272a',
    line: 'rgba(255, 255, 255, 0.16)',
  },
};

const RADIUS = 16;
/** Space kept between the title and the colors */
const PADDING_BELOW_TITLE = 24;
/** The unit's size, as a part of its number's */
const UNIT_SIZE = 0.6;
/** A temperature's unit sits up by the top of its number */
const UNIT_RAISE = 0.28;
/** Space around a range's arrow, as parts of the number's size */
const ARROW_SPACE = 0.4;
/** The most of a row a range may take before it shrinks */
const MAX_RANGE_SHARE = 0.45;

/** Load the fonts the image uses, so text is measured in the font it's drawn in */
export async function loadPaletteImageFonts() {
  await Promise.all(
    [
      `400 40px ${BODY_FONT}`,
      `600 40px ${BODY_FONT}`,
      `700 40px ${BODY_FONT}`,
      `600 56px ${HEADING_FONT}`,
    ].map((font) => document.fonts.load(font).catch(() => [])),
  );
}

function font(weight: number, size: number, family = BODY_FONT) {
  return `${weight} ${size}px ${family}`;
}

function measurer(
  ctx: CanvasRenderingContext2D,
  weight: number,
  family = BODY_FONT,
): Measure {
  return (text, size) => {
    ctx.font = font(weight, size, family);
    return ctx.measureText(text).width;
  };
}

/** A piece of a range's line, at a size relative to the line's */
type Run = {
  text: string;
  scale: number;
  weight: number;
  /** Space before it, as a part of the line's size */
  before?: number;
  raised?: boolean;
  /** Dimmed (where the color is the page's surface, not a yarn's color) */
  dim?: number;
};

function getRangeRuns(range: PaletteImageRange, filled: boolean): Run[] {
  if ('label' in range) return [{ text: range.label, scale: 1, weight: 600 }];
  const unit = (): Run[] =>
    range.unit
      ? [
          {
            text: range.unit,
            scale: UNIT_SIZE,
            weight: 400,
            before: 0.1,
            raised: range.raised,
            // Dimmed only on the surface: on a color it could lose its contrast
            dim: filled ? undefined : 0.7,
          },
        ]
      : [];
  return [
    { text: formatRangeNumber(range.from), scale: 1, weight: 600 },
    ...unit(),
    {
      text: '→',
      scale: 0.9,
      weight: 400,
      before: ARROW_SPACE,
      dim: 0.6,
    },
    {
      text: formatRangeNumber(range.to),
      scale: 1,
      weight: 600,
      before: ARROW_SPACE,
    },
    ...unit(),
  ];
}

function rangeMeasurer(ctx: CanvasRenderingContext2D, runs: Run[]): Measure {
  return (_text, size) =>
    runs.reduce((sum, run) => {
      ctx.font = font(run.weight, size * run.scale);
      return sum + ctx.measureText(run.text).width + (run.before ?? 0) * size;
    }, 0);
}

type Line = TextLine & {
  weight: number;
  /** Secondary text: muted where the color is the page's surface */
  muted?: boolean;
  runs?: Run[];
};

function getLines({
  ctx,
  color,
  range,
  labels,
  primary,
  filled,
}: {
  ctx: CanvasRenderingContext2D;
  color: PaletteImageColor;
  /** The range to put first; in a row it's drawn at the end instead */
  range?: PaletteImageRange;
  labels: PaletteImageLabels;
  primary: number;
  filled: boolean;
}): Line[] {
  const secondary = primary * 0.72;
  const lines: Line[] = [];
  const add = (text: string, size: number, weight: number, muted = false) =>
    lines.push({ text, size, weight, muted, measure: measurer(ctx, weight) });
  if (labels.range && range) {
    const runs = getRangeRuns(range, filled);
    lines.push({
      text: '',
      size: primary,
      weight: 600,
      runs,
      measure: rangeMeasurer(ctx, runs),
    });
  }
  if (labels.colorway && color.name) add(color.name, primary, 600);
  // Without a range or name, the first of the rest takes their place
  const lead = () => (lines.length ? secondary : primary);
  const yarn = [color.brandName, color.yarnName].filter(Boolean).join(' · ');
  if (labels.yarn && yarn) add(yarn, lead(), 400, lines.length > 0);
  if (labels.hex) add(color.hex.toUpperCase(), lead(), 400, lines.length > 0);
  return lines;
}

type TextColors = { text: string; muted: string };

/** Draws a range's runs from (x, middle), numbers on one baseline, the unit
 * smaller (and raised, for a temperature) */
function drawRange({
  ctx,
  runs,
  x,
  middle,
  size,
  colors,
}: {
  ctx: CanvasRenderingContext2D;
  runs: Run[];
  x: number;
  middle: number;
  size: number;
  colors: TextColors;
}) {
  // Centered on the numbers' own glyphs: they have no descenders, so the
  // font's middle would sit them low
  ctx.font = font(600, size);
  const glyphs = ctx.measureText('0');
  const baseline =
    middle +
    (glyphs.actualBoundingBoxAscent - glyphs.actualBoundingBoxDescent) / 2;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  let at = x;
  for (const run of runs) {
    at += (run.before ?? 0) * size;
    ctx.font = font(run.weight, size * run.scale);
    ctx.globalAlpha = run.dim ?? 1;
    ctx.fillStyle = colors.text;
    ctx.fillText(run.text, at, baseline - (run.raised ? size * UNIT_RAISE : 0));
    at += ctx.measureText(run.text).width;
  }
  ctx.globalAlpha = 1;
}

/** Draws lines from (x, y) down, left-aligned, shrunk to fit the box */
function drawLines({
  ctx,
  lines,
  x,
  y,
  width,
  height,
  align,
  colors,
}: {
  ctx: CanvasRenderingContext2D;
  lines: Line[];
  x: number;
  y: number;
  width: number;
  height: number;
  /** Where the block sits in the box's height */
  align: 'center' | 'end';
  colors: TextColors;
}) {
  if (!lines.length || width <= 0 || height <= 0) return;
  const sizes = fitLines({ lines, width, height });
  const slots = lines.map(
    (line, i) => sizes[i] * (line.lineHeight ?? LINE_HEIGHT),
  );
  const blockHeight = slots.reduce((sum, slot) => sum + slot, 0);
  let top =
    align === 'center'
      ? y + (height - blockHeight) / 2
      : y + height - blockHeight;
  ctx.textAlign = 'left';
  lines.forEach((line, i) => {
    const size = sizes[i];
    const middle = top + slots[i] / 2;
    if (line.runs) {
      drawRange({ ctx, runs: line.runs, x, middle, size, colors });
    } else {
      ctx.font = font(line.weight, size);
      ctx.fillStyle = line.muted ? colors.muted : colors.text;
      ctx.textBaseline = 'middle';
      ctx.fillText(line.text, x, middle);
    }
    top += slots[i];
  });
}

/** The labels' preferred size, from the size of a color */
function getPrimarySize(cell: Rect, layout: PaletteImageSettings['layout']) {
  if (layout === 'rows') return Math.min(40, cell.height * 0.3);
  if (layout === 'swatches')
    return Math.min(34, Math.min(cell.width, cell.height) * 0.13);
  return Math.min(34, cell.width * 0.28);
}

function drawCell({
  ctx,
  cell,
  color,
  range,
  settings,
  filled,
  theme,
}: {
  ctx: CanvasRenderingContext2D;
  cell: Rect;
  color: PaletteImageColor;
  range?: PaletteImageRange;
  settings: PaletteImageSettings;
  filled: boolean;
  theme: (typeof THEMES)[keyof typeof THEMES];
}) {
  const { layout, labels } = settings;
  const primary = getPrimarySize(cell, layout);
  const colors: TextColors = filled
    ? // On a color: black or white, and secondary text at full strength
      { text: getTextColor(color.hex), muted: getTextColor(color.hex) }
    : { text: theme.title, muted: theme.muted };
  // A row shows its range at the end, as the list does; the rest, first
  const rangeAtEnd = layout === 'rows' && labels.range && !!range;
  const lines = getLines({
    ctx,
    color,
    range: rangeAtEnd ? undefined : range,
    labels,
    primary,
    filled,
  });

  // The box for the text: all of the cell on a color, or what's left by the swatch
  let box: Rect;
  if (filled) {
    if (layout === 'rows') {
      const insetX = 28;
      const insetY = Math.max(6, cell.height * 0.12);
      box = {
        x: cell.x + insetX,
        y: cell.y + insetY,
        width: cell.width - insetX * 2,
        height: cell.height - insetY * 2,
      };
    } else {
      const inset = Math.max(8, Math.min(cell.width, cell.height) * 0.08);
      box = {
        x: cell.x + inset,
        y: cell.y + inset,
        width: cell.width - inset * 2,
        height: cell.height - inset * 2,
      };
    }
  } else {
    const { cx, cy, r, text } = getSwatchPlacement(cell, layout);
    ctx.fillStyle = color.hex;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    // A ring just inside, so a color as light as the card still shows
    ctx.strokeStyle = theme.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
    ctx.stroke();
    const insetY = layout === 'rows' ? Math.max(6, cell.height * 0.12) : 0;
    box = {
      x: text.x,
      y: text.y + insetY,
      width: text.width,
      height: text.height - insetY * 2,
    };
  }

  if (rangeAtEnd && range) {
    const runs = getRangeRuns(range, filled);
    const measure = rangeMeasurer(ctx, runs);
    const size = fitFontSize({
      text: '',
      preferred: primary,
      maxWidth: box.width * MAX_RANGE_SHARE,
      measure,
    });
    const width = measure('', size);
    drawRange({
      ctx,
      runs,
      x: box.x + box.width - width,
      middle: box.y + box.height / 2,
      size,
      colors,
    });
    // The names keep to the space left of it
    box = { ...box, width: Math.max(box.width - width - 24, 0) };
  }

  if (layout === 'stripes') {
    // Stripes read from the bottom up, along the stripe
    const along = 28;
    const across = Math.max(4, cell.width * 0.12);
    ctx.save();
    ctx.translate(cell.x + across, cell.y + cell.height - along);
    ctx.rotate(-Math.PI / 2);
    drawLines({
      ctx,
      lines,
      x: 0,
      y: 0,
      width: cell.height - along * 2,
      height: cell.width - across * 2,
      align: 'center',
      colors,
    });
    ctx.restore();
  } else {
    drawLines({
      ctx,
      lines,
      ...box,
      align: layout === 'rows' ? 'center' : 'end',
      colors,
    });
  }
}

export function renderPaletteImage({
  canvas,
  colors,
  ranges,
  title,
  settings,
}: {
  canvas: HTMLCanvasElement;
  colors: PaletteImageColor[];
  /** Each color's range, in a project */
  ranges?: PaletteImageRange[];
  title?: string;
  settings: PaletteImageSettings;
}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  const heading = title?.trim() ?? '';
  const geometry = getPaletteImageGeometry({
    count: colors.length,
    layout: settings.layout,
    shape: settings.shape,
    gaps: settings.gaps,
    hasTitle: !!heading,
  });
  const theme = THEMES[settings.background];
  // A stripe is the color itself, so it's always filled
  const filled = settings.fill || settings.layout === 'stripes';

  canvas.width = geometry.width;
  canvas.height = Math.round(geometry.height);
  ctx.fillStyle = theme.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Without gaps, the colors are one block with rounded outer corners
  ctx.save();
  if (!settings.gaps) {
    const { x, y, width, height } = geometry.bounds;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, RADIUS);
    ctx.clip();
  }
  geometry.cells.forEach((cell, i) => {
    const color = colors[i];
    ctx.fillStyle = filled ? color.hex : theme.card;
    ctx.beginPath();
    ctx.roundRect(
      cell.x,
      cell.y,
      cell.width,
      cell.height,
      settings.gaps ? RADIUS : 0,
    );
    ctx.fill();
    // Colors on a card, with no space between, are told apart by a line
    if (!filled && !settings.gaps) {
      ctx.strokeStyle = theme.line;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    drawCell({
      ctx,
      cell,
      color,
      range: ranges?.[i],
      settings,
      filled,
      theme,
    });
  });
  ctx.restore();

  if (geometry.title) {
    const { x, y, width, height } = geometry.title;
    const size = fitFontSize({
      text: heading,
      preferred: 56,
      maxWidth: width,
      measure: measurer(ctx, 600, HEADING_FONT),
    });
    ctx.fillStyle = theme.title;
    ctx.font = font(600, size, HEADING_FONT);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      heading,
      x + width / 2,
      y + (height - PADDING_BELOW_TITLE) / 2,
    );
  }
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No image'))),
      'image/png',
    ),
  );
}
