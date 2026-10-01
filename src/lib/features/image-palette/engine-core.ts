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

import {
  analyzePixels,
  findColorPosition,
  type ImageAnalysis,
} from './analyze';
import type { Oklab } from './color-space';
import { posterize } from './pixels';
import { applyPaletteStyle, selectColors, type PaletteStyle } from './select';

export type AutoPaletteColor = {
  /** Index of the chosen yarn candidate, or -1 for an exact image color */
  candidate: number;
  lab: Oklab;
  /** Where the color is in the image, as fractions of its size */
  x: number;
  y: number;
};

/**
 * The image palette's heavy lifting, kept free of the DOM and app state so
 * it can run in a worker (see engine.worker.ts) or, as a fallback, on the
 * main thread. It holds the current image's analysis and yarn candidates.
 */
export function createEngineCore() {
  let analysis: ImageAnalysis | null = null;
  let pixels: Uint8ClampedArray | null = null;
  let candidates: Float32Array = new Float32Array(0);

  return {
    setImage({
      data,
      width,
      height,
    }: {
      data: Uint8ClampedArray;
      width: number;
      height: number;
    }) {
      pixels = data;
      analysis = analyzePixels({ data, width, height });
      return { distinctColors: analysis.weights.length };
    },

    /** Yarn colorways as OKLab triples */
    setCandidates({ labs }: { labs: Float32Array }) {
      candidates = labs;
      return null;
    },

    autoPalette({
      count,
      style,
      fixed,
      exact,
    }: {
      count: number;
      style: PaletteStyle;
      /** Colors to keep (locked ones), as OKLab triples */
      fixed: Float32Array;
      exact: boolean;
    }): AutoPaletteColor[] {
      if (!analysis) return [];
      const { targets, weights } = applyPaletteStyle({
        centroids: analysis.centroids,
        weights: analysis.weights,
        style,
      });
      const pool = exact ? targets : candidates;
      const picked = selectColors({
        targets,
        weights,
        candidates: pool,
        count,
        fixed,
      });
      const used = new Set<number>();
      return picked.map((i) => {
        const lab: Oklab = [pool[i * 3], pool[i * 3 + 1], pool[i * 3 + 2]];
        const position = findColorPosition({
          analysis: analysis!,
          lab,
          avoid: used,
        });
        if (position) used.add(position.pixel);
        return {
          candidate: exact ? -1 : i,
          lab,
          x: position?.x ?? 0.5,
          y: position?.y ?? 0.5,
        };
      });
    },

    /** Where colors appear in the image, for moving markers to a new image */
    locate({ labs }: { labs: Oklab[] }) {
      const used = new Set<number>();
      return labs.map((lab) => {
        const position = analysis
          ? findColorPosition({ analysis, lab, avoid: used })
          : null;
        if (position) used.add(position.pixel);
        return { x: position?.x ?? 0.5, y: position?.y ?? 0.5 };
      });
    },

    /** The image redrawn using only these colors (RGB triples) */
    posterize({ palette }: { palette: [number, number, number][] }) {
      return pixels ? posterize({ data: pixels, palette }) : null;
    },
  };
}

export type EngineCore = ReturnType<typeof createEngineCore>;
export type EngineMethod = keyof EngineCore;
