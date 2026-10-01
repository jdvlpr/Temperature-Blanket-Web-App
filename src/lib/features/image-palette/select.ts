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

import { distance } from './color-space';

export const PALETTE_STYLES = [
  'balanced',
  'vivid',
  'muted',
  'light',
  'dark',
] as const;

export type PaletteStyle = (typeof PALETTE_STYLES)[number];

/** Colors closer than this (in OKLab) look the same, so only one is chosen */
const SAME_COLOR_DISTANCE = 0.004;
/** Larger than any distance between two colors in the sRGB gamut */
const MAX_DISTANCE = 1;

/**
 * Turn image clusters into the targets a palette should cover, for a style.
 * Weights use a square root of each cluster's share so that small accents
 * (a red barn in a snowy field) still count. Styles both emphasize matching
 * clusters and nudge the targets, so the chosen colors visibly shift.
 */
export function applyPaletteStyle({
  centroids,
  weights,
  style,
}: {
  centroids: Float32Array;
  weights: Float32Array;
  style: PaletteStyle;
}): { targets: Float32Array; weights: Float32Array } {
  const targets = new Float32Array(centroids);
  const styled = new Float32Array(weights.length);
  for (let c = 0; c < weights.length; c++) {
    const L = targets[c * 3];
    const a = targets[c * 3 + 1];
    const b = targets[c * 3 + 2];
    const chroma = Math.min(Math.sqrt(a * a + b * b) / 0.2, 1);
    let factor = 1;
    let chromaScale = 1;
    let lightnessShift = 0;
    if (style === 'vivid') {
      factor = 0.2 + 2 * chroma;
      chromaScale = 1.2;
    } else if (style === 'muted') {
      factor = 0.2 + 2 * (1 - chroma);
      chromaScale = 0.75;
    } else if (style === 'light') {
      factor = 0.1 + 2 * L * L;
      lightnessShift = 0.06;
    } else if (style === 'dark') {
      factor = 0.1 + 2 * (1 - L) * (1 - L);
      lightnessShift = -0.06;
    }
    styled[c] = Math.sqrt(weights[c]) * factor;
    targets[c * 3] = Math.min(1, Math.max(0, L + lightnessShift));
    targets[c * 3 + 1] = a * chromaScale;
    targets[c * 3 + 2] = b * chromaScale;
  }
  return { targets, weights: styled };
}

/**
 * Choose `count` candidate colors that together best cover the weighted
 * targets: each target should be close to some chosen color (a "facility
 * location" problem). Candidates are yarn colorways, or the targets
 * themselves for exact colors. `fixed` colors (locked ones) already cover
 * their part of the image. Picks are greedy, then improved by swapping.
 *
 * Returns candidate indices, most important first. Fewer than `count` are
 * returned when there aren't enough distinct candidates.
 */
export function selectColors({
  targets,
  weights,
  candidates,
  count,
  fixed = new Float32Array(0),
  neighbors = 24,
}: {
  targets: Float32Array;
  weights: Float32Array;
  candidates: Float32Array;
  count: number;
  fixed?: Float32Array;
  neighbors?: number;
}): number[] {
  const k = weights.length;
  const m = candidates.length / 3;
  const f = fixed.length / 3;
  if (!k || !m || count <= 0) return [];

  // Only candidates near some target can be worth choosing
  let pool: number[];
  if (m <= 1500) {
    pool = Array.from({ length: m }, (_, i) => i);
  } else {
    const inPool = new Set<number>();
    const d = new Float64Array(m);
    const order = Array.from({ length: m }, (_, i) => i);
    for (let c = 0; c < k; c++) {
      for (let i = 0; i < m; i++) d[i] = distance(targets, c, candidates, i);
      order.sort((x, y) => d[x] - d[y]);
      for (let i = 0; i < Math.min(neighbors, m); i++) inPool.add(order[i]);
    }
    pool = [...inPool];
  }
  const p = pool.length;

  // Distance from every pool candidate to every target
  const D = new Float64Array(p * k);
  for (let i = 0; i < p; i++)
    for (let c = 0; c < k; c++)
      D[i * k + c] = distance(candidates, pool[i], targets, c);
  const fixedD = new Float64Array(f * k);
  for (let j = 0; j < f; j++)
    for (let c = 0; c < k; c++)
      fixedD[j * k + c] = distance(fixed, j, targets, c);

  const covered = new Float64Array(k).fill(MAX_DISTANCE);
  for (let j = 0; j < f; j++)
    for (let c = 0; c < k; c++)
      covered[c] = Math.min(covered[c], fixedD[j * k + c]);

  const chosen: number[] = []; // indices into pool
  const tooClose = (i: number, except = -1) => {
    for (const j of chosen)
      if (
        j !== except &&
        distance(candidates, pool[i], candidates, pool[j]) < SAME_COLOR_DISTANCE
      )
        return true;
    for (let j = 0; j < f; j++)
      if (distance(candidates, pool[i], fixed, j) < SAME_COLOR_DISTANCE)
        return true;
    return false;
  };

  while (chosen.length < count) {
    let best = -1;
    let bestGain = 0;
    for (let i = 0; i < p; i++) {
      if (chosen.includes(i) || tooClose(i)) continue;
      let gain = 0;
      for (let c = 0; c < k; c++) {
        const improvement = covered[c] - D[i * k + c];
        if (improvement > 0) gain += weights[c] * improvement;
      }
      if (gain > bestGain) {
        bestGain = gain;
        best = i;
      }
    }
    if (best === -1) {
      // Nothing improves coverage: add the color most unlike those chosen
      let bestSpread = 0;
      for (let i = 0; i < p; i++) {
        if (chosen.includes(i) || tooClose(i)) continue;
        let spread = MAX_DISTANCE;
        for (const j of chosen)
          spread = Math.min(
            spread,
            distance(candidates, pool[i], candidates, pool[j]),
          );
        for (let j = 0; j < f; j++)
          spread = Math.min(spread, distance(candidates, pool[i], fixed, j));
        if (spread > bestSpread) {
          bestSpread = spread;
          best = i;
        }
      }
    }
    if (best === -1) break;
    chosen.push(best);
    for (let c = 0; c < k; c++)
      covered[c] = Math.min(covered[c], D[best * k + c]);
  }

  // Swap pass: try replacing each chosen color with a nearby candidate when
  // that lowers the total weighted distance
  for (let pass = 0; pass < 2; pass++) {
    let improved = false;
    for (let s = 0; s < chosen.length; s++) {
      // Best and second best coverage of each target without chosen[s]
      const withoutS = new Float64Array(k).fill(MAX_DISTANCE);
      for (let c = 0; c < k; c++) {
        for (let j = 0; j < f; j++)
          withoutS[c] = Math.min(withoutS[c], fixedD[j * k + c]);
        for (let t = 0; t < chosen.length; t++)
          if (t !== s)
            withoutS[c] = Math.min(withoutS[c], D[chosen[t] * k + c]);
      }
      const cost = (i: number) => {
        let total = 0;
        for (let c = 0; c < k; c++)
          total += weights[c] * Math.min(withoutS[c], D[i * k + c]);
        return total;
      };
      let bestCost = cost(chosen[s]);
      let bestSwap = -1;
      for (let i = 0; i < p; i++) {
        if (chosen.includes(i)) continue;
        const total = cost(i);
        if (total < bestCost - 1e-9 && !tooClose(i, chosen[s])) {
          bestCost = total;
          bestSwap = i;
        }
      }
      if (bestSwap !== -1) {
        chosen[s] = bestSwap;
        improved = true;
      }
    }
    if (!improved) break;
  }

  return chosen.map((i) => pool[i]);
}
