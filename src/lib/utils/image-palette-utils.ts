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

import type { Color } from '$lib/types/yarn-types';
import chroma from 'chroma-js';

export type Lab = [number, number, number];

export type MatchedColor = Color & {
  delta?: number;
  /** The color picked from the image, before matching it to a yarn colorway */
  sourceHex?: string;
};

export type ColorwayIndex = { colorway: Color; lab: Lab; key: string }[];

const { sqrt, pow, min, max, atan2, abs, cos, sin, exp, PI } = Math;
const rad2deg = (rad: number) => (360 * rad) / (2 * PI);
const deg2rad = (deg: number) => (2 * PI * deg) / 360;

/**
 * Delta E (CIE 2000) between two Lab colors. A port of chroma.deltaE that
 * skips the per-call color parsing and Lab conversion, so it can be run
 * against thousands of precomputed colorways on every pointer move.
 */
export function deltaE2000([L1, a1, b1]: Lab, [L2, a2, b2]: Lab): number {
  const avgL = (L1 + L2) / 2;
  const C1 = sqrt(pow(a1, 2) + pow(b1, 2));
  const C2 = sqrt(pow(a2, 2) + pow(b2, 2));
  const avgC = (C1 + C2) / 2;
  const G = 0.5 * (1 - sqrt(pow(avgC, 7) / (pow(avgC, 7) + pow(25, 7))));
  const a1p = a1 * (1 + G);
  const a2p = a2 * (1 + G);
  const C1p = sqrt(pow(a1p, 2) + pow(b1, 2));
  const C2p = sqrt(pow(a2p, 2) + pow(b2, 2));
  const avgCp = (C1p + C2p) / 2;
  const arctan1 = rad2deg(atan2(b1, a1p));
  const arctan2 = rad2deg(atan2(b2, a2p));
  const h1p = arctan1 >= 0 ? arctan1 : arctan1 + 360;
  const h2p = arctan2 >= 0 ? arctan2 : arctan2 + 360;
  const avgHp = abs(h1p - h2p) > 180 ? (h1p + h2p + 360) / 2 : (h1p + h2p) / 2;
  const T =
    1 -
    0.17 * cos(deg2rad(avgHp - 30)) +
    0.24 * cos(deg2rad(2 * avgHp)) +
    0.32 * cos(deg2rad(3 * avgHp + 6)) -
    0.2 * cos(deg2rad(4 * avgHp - 63));
  let deltaHp = h2p - h1p;
  deltaHp =
    abs(deltaHp) <= 180 ? deltaHp : h2p <= h1p ? deltaHp + 360 : deltaHp - 360;
  deltaHp = 2 * sqrt(C1p * C2p) * sin(deg2rad(deltaHp) / 2);
  const deltaL = L2 - L1;
  const deltaCp = C2p - C1p;
  const sl = 1 + (0.015 * pow(avgL - 50, 2)) / sqrt(20 + pow(avgL - 50, 2));
  const sc = 1 + 0.045 * avgCp;
  const sh = 1 + 0.015 * avgCp * T;
  const deltaTheta = 30 * exp(-pow((avgHp - 275) / 25, 2));
  const Rc = 2 * sqrt(pow(avgCp, 7) / (pow(avgCp, 7) + pow(25, 7)));
  const Rt = -Rc * sin(2 * deg2rad(deltaTheta));
  const result = sqrt(
    pow(deltaL / sl, 2) +
      pow(deltaCp / sc, 2) +
      pow(deltaHp / sh, 2) +
      Rt * (deltaCp / sc) * (deltaHp / sh),
  );
  return max(0, min(100, result));
}

export const colorwayKey = (color: Color) =>
  `${color.brandId}${color.yarnId}${color.name}${color.hex}`;

/** Precompute Lab values for a list of colorways (do this once per yarn filter) */
export function indexColorways(colorways: Color[]): ColorwayIndex {
  return colorways.map((colorway) => ({
    colorway,
    lab: chroma(colorway.hex ?? '#ffffff').lab() as Lab,
    key: colorwayKey(colorway),
  }));
}

/**
 * The closest colorway to a hex color, in a single pass. Colorways whose key
 * is in `exclude` are skipped unless every colorway is excluded, in which case
 * the closest overall is returned. Returns null only if the index is empty.
 */
export function findClosestColorway({
  hex,
  index,
  exclude,
}: {
  hex: string;
  index: ColorwayIndex;
  exclude?: Set<string>;
}): MatchedColor | null {
  if (!index.length) return null;
  const lab = chroma(hex).lab() as Lab;
  let best: ColorwayIndex[number] | null = null;
  let bestDelta = Infinity;
  let bestAny: ColorwayIndex[number] | null = null;
  let bestAnyDelta = Infinity;
  for (const item of index) {
    const delta = deltaE2000(lab, item.lab);
    if (delta < bestAnyDelta) {
      bestAnyDelta = delta;
      bestAny = item;
    }
    if (exclude?.has(item.key)) continue;
    if (delta < bestDelta) {
      bestDelta = delta;
      best = item;
    }
  }
  const match = best ?? bestAny;
  if (!match) return null;
  return {
    ...match.colorway,
    delta: best ? bestDelta : bestAnyDelta,
    sourceHex: hex,
  };
}

/**
 * Match image colors to colorways without repeating a colorway. Image colors
 * whose closest colorway is already used are tried last (with their next
 * closest unused colorway), so new colorways favor colors not yet represented.
 */
export function matchUniqueColorways({
  hexes,
  count,
  index,
  exclude = new Set(),
}: {
  hexes: string[];
  count: number;
  index: ColorwayIndex;
  exclude?: Set<string>;
}): MatchedColor[] {
  const used = new Set(exclude);
  const matches: MatchedColor[] = [];
  const deferred: string[] = [];

  for (const hex of hexes) {
    if (matches.length >= count) break;
    const closest = findClosestColorway({ hex, index });
    if (!closest) return matches;
    const key = colorwayKey(closest);
    if (used.has(key)) {
      deferred.push(hex);
      continue;
    }
    used.add(key);
    matches.push(closest);
  }

  for (const hex of deferred) {
    if (matches.length >= count) break;
    const match = findClosestColorway({ hex, index, exclude: used });
    if (!match) break;
    used.add(colorwayKey(match));
    matches.push(match);
  }

  return matches;
}

/**
 * Average the pixels in a square around (x, y) of RGBA image data, which gives
 * a truer color than a single pixel for textured or noisy photos.
 */
export function sampleAverageHex({
  data,
  width,
  height,
  x,
  y,
  radius = 2,
}: {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  x: number;
  y: number;
  radius?: number;
}): string | null {
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  if (cx < 0 || cy < 0 || cx >= width || cy >= height) return null;
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
  return chroma(r / n, g / n, b / n).hex();
}
