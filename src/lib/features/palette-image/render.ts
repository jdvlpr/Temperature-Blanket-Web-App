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

// Draws a palette image on a canvas, in the site's fonts

import { getTextColor } from '$lib/utils/color-utils';
import {
  LINE_HEIGHT,
  fitFontSize,
  fitLines,
  getPaletteImageGeometry,
  type Measure,
  type PaletteImageLabels,
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
  light: { background: '#ffffff', title: '#1c1917', footer: '#6b6b6b' },
  dark: { background: '#18181b', title: '#f4f4f5', footer: '#a1a1aa' },
};

const RADIUS = 16;
/** Space kept between the title and the colors */
const PADDING_BELOW_TITLE = 24;
const FOOTER_PREFIX = 'Create your own yarn palette at ';
const FOOTER_URL = 'temperature-blanket.com/yarn';

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

type Line = TextLine & { weight: number };

function getLines({
  ctx,
  color,
  range,
  labels,
  primary,
}: {
  ctx: CanvasRenderingContext2D;
  color: PaletteImageColor;
  range?: string;
  labels: PaletteImageLabels;
  primary: number;
}): Line[] {
  const secondary = primary * 0.72;
  const lines: Line[] = [];
  const add = (text: string, size: number, weight: number) =>
    lines.push({ text, size, weight, measure: measurer(ctx, weight) });
  if (labels.range && range) add(range, primary, 600);
  if (labels.colorway && color.name) add(color.name, primary, 600);
  const yarn = [color.brandName, color.yarnName].filter(Boolean).join(' – ');
  if (labels.yarn && yarn) add(yarn, secondary, 400);
  if (labels.hex) add(color.hex.toUpperCase(), secondary, 400);
  return lines;
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
}: {
  ctx: CanvasRenderingContext2D;
  lines: Line[];
  x: number;
  y: number;
  width: number;
  height: number;
  /** Where the block sits in the box's height */
  align: 'center' | 'end';
}) {
  if (!lines.length || width <= 0 || height <= 0) return;
  const sizes = fitLines({ lines, width, height });
  const blockHeight = sizes.reduce((sum, size) => sum + size * LINE_HEIGHT, 0);
  let top =
    align === 'center'
      ? y + (height - blockHeight) / 2
      : y + height - blockHeight;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  lines.forEach((line, i) => {
    const slot = sizes[i] * LINE_HEIGHT;
    ctx.font = font(line.weight, sizes[i]);
    ctx.fillText(line.text, x, top + slot / 2);
    top += slot;
  });
}

function drawCellLabels({
  ctx,
  cell,
  lines,
  layout,
}: {
  ctx: CanvasRenderingContext2D;
  cell: Rect;
  lines: Line[];
  layout: PaletteImageSettings['layout'];
}) {
  if (layout === 'rows') {
    const insetX = 28;
    const insetY = Math.max(6, cell.height * 0.12);
    drawLines({
      ctx,
      lines,
      x: cell.x + insetX,
      y: cell.y + insetY,
      width: cell.width - insetX * 2,
      height: cell.height - insetY * 2,
      align: 'center',
    });
  } else if (layout === 'swatches') {
    const inset = Math.max(8, Math.min(cell.width, cell.height) * 0.08);
    drawLines({
      ctx,
      lines,
      x: cell.x + inset,
      y: cell.y + inset,
      width: cell.width - inset * 2,
      height: cell.height - inset * 2,
      align: 'end',
    });
  } else {
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
    });
    ctx.restore();
  }
}

/** The labels' preferred size, from the size of a color */
function getPrimarySize(cell: Rect, layout: PaletteImageSettings['layout']) {
  if (layout === 'rows') return Math.min(40, cell.height * 0.3);
  if (layout === 'swatches')
    return Math.min(34, Math.min(cell.width, cell.height) * 0.13);
  return Math.min(34, cell.width * 0.28);
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
  /** A label for each color's range, in a project */
  ranges?: string[];
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
    ctx.fillStyle = color.hex;
    ctx.beginPath();
    ctx.roundRect(
      cell.x,
      cell.y,
      cell.width,
      cell.height,
      settings.gaps ? RADIUS : 0,
    );
    ctx.fill();

    ctx.fillStyle = getTextColor(color.hex);
    drawCellLabels({
      ctx,
      cell,
      layout: settings.layout,
      lines: getLines({
        ctx,
        color,
        range: ranges?.[i],
        labels: settings.labels,
        primary: getPrimarySize(cell, settings.layout),
      }),
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

  // The footer: one centered line, part of it bold
  const { x, y, width, height } = geometry.footer;
  const regular = measurer(ctx, 400);
  const bold = measurer(ctx, 700);
  const size = fitFontSize({
    text: FOOTER_PREFIX + FOOTER_URL,
    preferred: 24,
    maxWidth: width,
    measure: (_, s) => regular(FOOTER_PREFIX, s) + bold(FOOTER_URL, s),
  });
  const prefixWidth = regular(FOOTER_PREFIX, size);
  const start = x + (width - prefixWidth - bold(FOOTER_URL, size)) / 2;
  ctx.fillStyle = theme.footer;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = font(400, size);
  ctx.fillText(FOOTER_PREFIX, start, y + height / 2);
  ctx.font = font(700, size);
  ctx.fillText(FOOTER_URL, start + prefixWidth, y + height / 2);
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No image'))),
      'image/png',
    ),
  );
}
