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

import { rgbToHex } from './color-space';

export type Point = { x: number; y: number };

/**
 * `count` points spaced evenly along a line, including both ends. Points are
 * fractions of the image size.
 */
export function pointsAlongLine(
  from: Point,
  to: Point,
  count: number,
): Point[] {
  if (count <= 0) return [];
  if (count === 1) return [{ x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }];
  return Array.from({ length: count }, (_, i) => {
    const t = i / (count - 1);
    return {
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
    };
  });
}

/**
 * The average color of the pixels in a square around a point (given as
 * fractions of the image size), which gives a truer color than a single
 * pixel for textured or noisy photos.
 */
export function sampleHex({
  data,
  width,
  height,
  x,
  y,
  radius = 2,
}: {
  data: ArrayLike<number>;
  width: number;
  height: number;
  x: number;
  y: number;
  radius?: number;
}): string | null {
  if (x < 0 || y < 0 || x > 1 || y > 1 || !width || !height) return null;
  const cx = Math.min(width - 1, Math.floor(x * width));
  const cy = Math.min(height - 1, Math.floor(y * height));
  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (
    let py = Math.max(0, cy - radius);
    py <= Math.min(height - 1, cy + radius);
    py++
  ) {
    for (
      let px = Math.max(0, cx - radius);
      px <= Math.min(width - 1, cx + radius);
      px++
    ) {
      const i = (py * width + px) * 4;
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      n++;
    }
  }
  return rgbToHex(Math.round(r / n), Math.round(g / n), Math.round(b / n));
}

/**
 * Where to put a magnifier of `size` for a finger at (x, y) on screen: above
 * the finger, `gap` away so the finger doesn't cover it. Without room above,
 * beside the finger on the side with more room, never below where the hand
 * would hide it. Kept `margin` inside the screen's edges.
 */
export function placeMagnifier({
  x,
  y,
  size,
  gap,
  margin,
  screenWidth,
}: {
  x: number;
  y: number;
  size: number;
  gap: number;
  margin: number;
  screenWidth: number;
}): { left: number; top: number } {
  let left = x - size / 2;
  let top = y - gap - size;
  if (top < margin) {
    left = x > screenWidth / 2 ? x - gap - size : x + gap;
    top = Math.max(margin, y - size / 2);
  }
  return {
    left: Math.min(
      Math.max(left, margin),
      Math.max(margin, screenWidth - size - margin),
    ),
    top,
  };
}
