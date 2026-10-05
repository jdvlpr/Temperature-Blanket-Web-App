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

import { distance, rgbToOklab } from './color-space';

/** An image summarized as weighted color clusters, in OKLab */
export type ImageAnalysis = {
  width: number;
  height: number;
  /** Sampled pixel colors, three numbers per sample */
  samples: Float32Array;
  /** Pixel index (y * width + x) of each sample */
  samplePixels: Uint32Array;
  /** Cluster centers, three numbers per cluster */
  centroids: Float32Array;
  /** Share of samples in each cluster, summing to 1 */
  weights: Float32Array;
};

/** Small seeded random number generator, so results are repeatable */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sample an image on an even grid and group the samples into color clusters
 * with k-means++ (seeded, so the same image always gives the same result).
 * Mostly transparent pixels are ignored.
 */
export function analyzePixels({
  data,
  width,
  height,
  maxSamples = 20000,
  clusters = 48,
  iterations = 10,
  seed = 1,
}: {
  data: ArrayLike<number>;
  width: number;
  height: number;
  maxSamples?: number;
  clusters?: number;
  iterations?: number;
  seed?: number;
}): ImageAnalysis {
  const step = Math.max(
    1,
    Math.floor(Math.sqrt((width * height) / maxSamples)),
  );
  const labs: number[] = [];
  const pixels: number[] = [];
  for (let y = Math.floor(step / 2); y < height; y += step) {
    for (let x = Math.floor(step / 2); x < width; x += step) {
      const p = y * width + x;
      if (data[p * 4 + 3] < 125) continue;
      labs.push(...rgbToOklab(data[p * 4], data[p * 4 + 1], data[p * 4 + 2]));
      pixels.push(p);
    }
  }
  const samples = Float32Array.from(labs);
  const samplePixels = Uint32Array.from(pixels);
  const n = samplePixels.length;
  const empty = {
    width,
    height,
    samples,
    samplePixels,
    centroids: new Float32Array(0),
    weights: new Float32Array(0),
  };
  if (!n) return empty;

  // k-means++ seeding: spread the starting centers out
  const random = mulberry32(seed);
  const centers: number[] = [];
  const nearest = new Float64Array(n).fill(Infinity);
  let next = Math.floor(random() * n);
  for (let c = 0; c < clusters; c++) {
    centers.push(
      samples[next * 3],
      samples[next * 3 + 1],
      samples[next * 3 + 2],
    );
    let total = 0;
    for (let i = 0; i < n; i++) {
      const d = distance(samples, i, centers, c) ** 2;
      if (d < nearest[i]) nearest[i] = d;
      total += nearest[i];
    }
    // Every sample is already a center's color: there are no more clusters
    if (total <= 1e-12) break;
    let target = random() * total;
    next = n - 1;
    for (let i = 0; i < n; i++) {
      target -= nearest[i];
      if (target <= 0) {
        next = i;
        break;
      }
    }
  }

  const k = centers.length / 3;
  const centroids = Float32Array.from(centers);
  const assignment = new Uint16Array(n);
  const counts = new Float64Array(k);
  for (let iteration = 0; iteration < iterations; iteration++) {
    const sums = new Float64Array(k * 3);
    counts.fill(0);
    let changed = false;
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestDistance = Infinity;
      for (let c = 0; c < k; c++) {
        const d = distance(samples, i, centroids, c);
        if (d < bestDistance) {
          bestDistance = d;
          best = c;
        }
      }
      if (assignment[i] !== best) changed = true;
      assignment[i] = best;
      counts[best]++;
      sums[best * 3] += samples[i * 3];
      sums[best * 3 + 1] += samples[i * 3 + 1];
      sums[best * 3 + 2] += samples[i * 3 + 2];
    }
    for (let c = 0; c < k; c++) {
      if (!counts[c]) continue;
      centroids[c * 3] = sums[c * 3] / counts[c];
      centroids[c * 3 + 1] = sums[c * 3 + 1] / counts[c];
      centroids[c * 3 + 2] = sums[c * 3 + 2] / counts[c];
    }
    if (!changed && iteration > 0) break;
  }

  // Drop clusters that ended up empty
  const kept: number[] = [];
  const weights: number[] = [];
  for (let c = 0; c < k; c++) {
    if (!counts[c]) continue;
    kept.push(centroids[c * 3], centroids[c * 3 + 1], centroids[c * 3 + 2]);
    weights.push(counts[c] / n);
  }

  return {
    ...empty,
    centroids: Float32Array.from(kept),
    weights: Float32Array.from(weights),
  };
}

/**
 * The position (as fractions of the image size, at the pixel's center) of
 * the sampled pixel closest to a color. Positions already used are skipped
 * when possible, so two markers don't land on the same spot.
 */
export function findColorPosition({
  analysis,
  lab,
  avoid,
}: {
  analysis: ImageAnalysis;
  lab: ArrayLike<number>;
  avoid?: Set<number>;
}): { x: number; y: number; pixel: number } | null {
  const { samples, samplePixels, width, height } = analysis;
  let best = -1;
  let bestDistance = Infinity;
  for (let i = 0; i < samplePixels.length; i++) {
    if (avoid?.has(samplePixels[i])) continue;
    const d = distance(samples, i, lab, 0);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  }
  if (best === -1) {
    if (avoid?.size) return findColorPosition({ analysis, lab });
    return null;
  }
  const pixel = samplePixels[best];
  return {
    x: ((pixel % width) + 0.5) / width,
    y: (Math.floor(pixel / width) + 0.5) / height,
    pixel,
  };
}
