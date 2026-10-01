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

import { MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES } from '$lib/constants/color-constants';
import { ensureYarnData } from '$lib/data/yarns/colorways.svelte';
import { defaultYarn } from '$lib/state/page-state.svelte';
import type { Color } from '$lib/types/yarn-types';
import {
  getColorways,
  stringToBrandAndYarnDetails,
} from '$lib/utils/yarn-utils';
import chroma from 'chroma-js';
import { hexToOklab, hexToRgb, oklabToHex, type Oklab } from './color-space';
import { createImagePaletteEngine, type ImagePaletteEngine } from './engine';
import {
  closestColorways,
  colorwayKey,
  colorwayOklabs,
  deltaE2000,
  findClosestColorway,
  indexColorways,
  type ColorwayIndex,
  type Lab,
  type MatchedColor,
} from './match';
import { bestInsertionIndex, orderAsGradient } from './order';
import { pointsAlongLine, sampleHex, type Point } from './pixels';
import type { PaletteStyle } from './select';

/** A palette color: a spot on the image and the yarn matched to it */
export type PalettePoint = {
  id: number;
  /** Position as fractions of the image size */
  x: number;
  y: number;
  /** The image's color at the point */
  sourceHex: string;
  /** The matched yarn colorway, when matching to yarn */
  yarn: MatchedColor | null;
  /** Locked colors keep their color through Auto Palette and new images */
  locked: boolean;
};

export type PaletteMode = 'yarn' | 'exact';
export type PickTool = 'points' | 'line';

// Large photos are drawn at most this many pixels wide or tall
const MAX_IMAGE_DIMENSION = 1200;

type Session = {
  pixels: ImageData;
  points: PalettePoint[];
  mode: PaletteMode;
  style: PaletteStyle;
  line: { from: Point; to: Point } | null;
};

// The last photo and palette, so closing and reopening the modal during a
// visit picks up where you left off
let session: Session | null = null;

export class ImagePaletteState {
  points = $state<PalettePoint[]>([]);
  mode = $state<PaletteMode>('yarn');
  style = $state<PaletteStyle>('balanced');
  tool = $state<PickTool>('points');
  line = $state<{ from: Point; to: Point } | null>(null);
  showYarnPreview = $state(false);
  selectedId = $state<number | null>(null);
  hoveredId = $state<number | null>(null);
  loading = $state(true);
  working = $state(false);
  yarnReady = $state(false);
  errorMessage = $state<string | null>(null);
  infoMessage = $state<string | null>(null);
  warningMessage = $state<string | null>(null);
  selectedBrandId = $state<string | undefined>();
  selectedYarnId = $state<string | undefined>();
  selectedYarnWeightId = $state<string | undefined>();
  /** The photo, downscaled. Replaced (not mutated) so the canvas redraws. */
  pixels = $state.raw<ImageData | null>(null);
  /** The photo redrawn in the palette's colors */
  previewPixels = $state.raw<ImageData | null>(null);

  hasImage = $derived(!!this.pixels);
  selected = $derived(
    this.points.find((point) => point.id === this.selectedId) ?? null,
  );
  isFull = $derived(this.points.length >= MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES);

  readonly warmFirst: boolean;
  /** How many colors the palette should have */
  targetCount = $state(2);
  #index: ColorwayIndex = [];
  #engine: ImagePaletteEngine | null = null;
  #nextId = 1;
  #loadId = 0;
  #previewTimer: ReturnType<typeof setTimeout> | undefined;
  #resolveReady!: () => void;
  #ready = new Promise<void>((resolve) => (this.#resolveReady = resolve));

  constructor({
    numberOfColors,
    warmFirst,
  }: {
    numberOfColors: number;
    warmFirst: boolean;
  }) {
    this.targetCount = Math.min(
      Math.max(numberOfColors, 2),
      MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES,
    );
    this.warmFirst = warmFirst;
  }

  /** Load yarn data and start the engine. Call once the modal is mounted. */
  async init() {
    await ensureYarnData();
    if (defaultYarn.value) {
      const details = stringToBrandAndYarnDetails(defaultYarn.value);
      this.selectedBrandId = details.brandId ?? undefined;
      this.selectedYarnId = details.yarnId ?? undefined;
    }
    this.#engine = createImagePaletteEngine();
    await this.#updateColorways();
    this.yarnReady = true;
    this.#resolveReady();

    // An image may already have been chosen while loading
    if (this.#loadId > 0) return;
    if (session) await this.#restore(session);
    else await this.randomImage();
  }

  /** Keep the photo and palette for next time, and stop the worker */
  destroy() {
    clearTimeout(this.#previewTimer);
    if (this.pixels)
      session = {
        pixels: this.pixels,
        points: $state.snapshot(this.points),
        mode: this.mode,
        style: this.style,
        line: $state.snapshot(this.line),
      };
    this.#engine?.destroy();
  }

  // Colors

  colorOf(point: PalettePoint): string {
    return (this.mode === 'yarn' && point.yarn?.hex) || point.sourceHex;
  }

  /** The palette as gauge colors */
  toColors(): Color[] {
    return this.points.map((point) => {
      if (this.mode === 'exact' || !point.yarn) return { hex: point.sourceHex };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, locked, delta, sourceHex, ...color } =
        point.yarn as MatchedColor;
      return color;
    });
  }

  /** The closest yarn (or exact color) at a spot, for the hover label */
  colorAt(
    x: number,
    y: number,
  ): { hex: string; yarn: MatchedColor | null } | null {
    const hex = this.#sample(x, y);
    if (!hex) return null;
    if (this.mode === 'exact') return { hex, yarn: null };
    return { hex, yarn: findClosestColorway({ hex, index: this.#index }) };
  }

  alternatives(point: PalettePoint, count = 6): MatchedColor[] {
    return closestColorways({
      hex: point.sourceHex,
      index: this.#index,
      count,
    });
  }

  // Images

  randomImage() {
    return this.loadImage(
      `https://picsum.photos/720/480?random=${Date.now()}`,
      "Couldn't load a random image. Check your connection and try again.",
    );
  }

  async loadFile(file: File | undefined) {
    if (!file) return;
    const isHeic =
      /image\/hei[cf]/.test(file.type) || /\.hei[cf]$/i.test(file.name);
    if (!file.type.startsWith('image/') && !isHeic) {
      this.errorMessage =
        "That file isn't an image. Try a JPG, PNG, or WebP file.";
      return;
    }
    const url = URL.createObjectURL(file);
    await this.loadImage(
      url,
      isHeic
        ? "This browser can't open HEIC photos. Try a JPG or PNG, or a screenshot of the photo."
        : "Couldn't open that image. Try a JPG, PNG, or WebP file.",
    );
    URL.revokeObjectURL(url);
  }

  async loadImage(src: string, failMessage: string) {
    const id = ++this.#loadId;
    this.loading = true;
    this.errorMessage = null;
    this.infoMessage = null;
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = src;
    try {
      await image.decode();
      await this.#ready;
    } catch {
      if (id !== this.#loadId) return;
      // Keep showing the previous image, if there was one
      this.errorMessage = failMessage;
      this.loading = false;
      return;
    }
    // A newer image was requested while this one loaded
    if (id !== this.#loadId) return;

    const scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight),
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(image, 0, 0, width, height);
    const pixels = ctx.getImageData(0, 0, width, height);

    await this.#engine!.setImage({ data: pixels.data, width, height });
    if (id !== this.#loadId) return;
    this.pixels = pixels;
    this.line = null;

    // Locked colors stay, moved to where they best appear in the new image
    const locked = this.points.filter((point) => point.locked);
    if (locked.length) {
      const positions = await this.#engine!.locate({
        labs: locked.map((point) => hexToOklab(this.colorOf(point))),
      });
      locked.forEach((point, i) => Object.assign(point, positions[i]));
    }
    this.points = locked;
    this.loading = false;
    await this.autoPalette();
  }

  async #restore(saved: Session) {
    this.mode = saved.mode;
    this.style = saved.style;
    this.line = saved.line;
    await this.#engine!.setImage({
      data: saved.pixels.data,
      width: saved.pixels.width,
      height: saved.pixels.height,
    });
    this.pixels = saved.pixels;
    this.points = saved.points;
    this.#nextId = Math.max(0, ...saved.points.map((point) => point.id)) + 1;
    this.#loadId++;
    this.loading = false;
    // This gauge may want a different number of colors than last time
    if (this.points.length !== this.targetCount)
      await this.setCount(this.targetCount);
    this.#schedulePreview();
  }

  // Palette

  /** Replace the unlocked colors with the ones that best capture the image */
  async autoPalette() {
    if (!this.#engine || !this.pixels) return;
    if (this.mode === 'yarn' && !this.#index.length) {
      this.warningMessage = 'No colorways match the selected yarn.';
      return;
    }
    this.infoMessage = null;
    this.line = null;
    const locked = this.points.filter((point) => point.locked);
    const count = Math.max(this.targetCount, locked.length);
    this.working = true;
    const picked = await this.#engine.autoPalette({
      count: count - locked.length,
      style: this.style,
      fixed: this.#labsOf(locked),
      exact: this.mode === 'exact',
    });
    this.working = false;

    const fresh = picked.map(({ candidate, lab, x, y }) => {
      const sourceHex = this.#sample(x, y) ?? oklabToHex(lab);
      return this.#makePoint({
        x,
        y,
        sourceHex: this.mode === 'exact' ? oklabToHex(lab) : sourceHex,
        yarn:
          candidate >= 0
            ? this.#withDelta(this.#index[candidate].colorway, sourceHex)
            : null,
      });
    });
    this.#setPoints(this.#sorted([...locked, ...fresh]));
    if (this.points.length < count) this.#tellFewerColors();
  }

  /** Change how many colors there are: add from the image, or remove from the end */
  async setCount(count: number) {
    count = Math.min(Math.max(count, 0), MAXIMUM_COLORWAYS_MATCHES_FOR_IMAGES);
    this.warningMessage = null;
    this.infoMessage = null;
    if (count < this.points.length) {
      const points = [...this.points];
      for (let i = points.length - 1; i >= 0 && points.length > count; i--)
        if (!points[i].locked) points.splice(i, 1);
      if (points.length > count)
        this.warningMessage = 'Unlock colors to remove them.';
      this.targetCount = points.length;
      this.#setPoints(points);
      return;
    }
    this.targetCount = count;
    if (count === this.points.length || !this.#engine || !this.pixels) return;
    const picked = await this.#engine.autoPalette({
      count: count - this.points.length,
      style: this.style,
      fixed: this.#labsOf(this.points),
      exact: this.mode === 'exact',
    });
    const points = [...this.points];
    for (const { candidate, lab, x, y } of picked) {
      const sourceHex = this.#sample(x, y) ?? oklabToHex(lab);
      const point = this.#makePoint({
        x,
        y,
        sourceHex: this.mode === 'exact' ? oklabToHex(lab) : sourceHex,
        yarn:
          candidate >= 0
            ? this.#withDelta(this.#index[candidate].colorway, sourceHex)
            : null,
      });
      // Slot each new color where it fits the gradient best
      const at = bestInsertionIndex(
        points.map((n) => hexToOklab(this.colorOf(n))),
        hexToOklab(this.colorOf(point)),
      );
      points.splice(at, 0, point);
    }
    this.#setPoints(points);
    if (this.points.length < count) this.#tellFewerColors();
  }

  async setStyle(style: PaletteStyle) {
    this.style = style;
    await this.autoPalette();
  }

  setMode(mode: PaletteMode) {
    this.mode = mode;
    if (mode === 'yarn') this.#rematch({ onlyMissing: true });
    this.#schedulePreview();
  }

  setYarnPreview(show: boolean) {
    this.showYarnPreview = show;
    if (!show) this.previewPixels = null;
    this.#schedulePreview();
  }

  /** Add a color picked from the image. Returns its id. */
  addPoint(x: number, y: number): number | null {
    if (this.isFull) {
      this.warningMessage = 'Maximum number of colors selected.';
      return null;
    }
    const sourceHex = this.#sample(x, y);
    if (!sourceHex) return null;
    const point = this.#makePoint({
      x,
      y,
      sourceHex,
      yarn: this.#match(sourceHex, this.points),
    });
    this.#setPoints([...this.points, point]);
    this.targetCount = this.points.length;
    this.selectedId = point.id;
    return point.id;
  }

  /** Move a color's point, picking up the image's color there */
  movePoint(id: number, x: number, y: number) {
    const point = this.points.find((n) => n.id === id);
    if (!point || point.locked) return;
    x = Math.min(Math.max(x, 0), 1);
    y = Math.min(Math.max(y, 0), 1);
    const sourceHex = this.#sample(x, y);
    if (!sourceHex) return;
    point.x = x;
    point.y = y;
    if (sourceHex === point.sourceHex) return;
    point.sourceHex = sourceHex;
    point.yarn = this.#match(
      sourceHex,
      this.points.filter((n) => n.id !== id),
    );
    this.#schedulePreview();
  }

  removePoint(id: number) {
    const point = this.points.find((n) => n.id === id);
    if (!point) return;
    this.#setPoints(this.points.filter((n) => n.id !== id));
    this.targetCount = this.points.length;
    if (this.selectedId === id) this.selectedId = null;
  }

  /** Remove every unlocked color */
  clear() {
    this.#setPoints(this.points.filter((point) => point.locked));
    this.targetCount = this.points.length;
    this.selectedId = null;
    this.line = null;
  }

  toggleLock(id: number) {
    const point = this.points.find((n) => n.id === id);
    if (point) point.locked = !point.locked;
  }

  /** Use a different yarn for a color (one of its alternatives) */
  setYarn(id: number, colorway: MatchedColor) {
    const point = this.points.find((n) => n.id === id);
    if (!point) return;
    point.yarn = this.#withDelta(colorway, point.sourceHex);
    this.#schedulePreview();
  }

  /** Move a color left (-1) or right (+1) in the palette */
  shift(id: number, by: -1 | 1) {
    const from = this.points.findIndex((n) => n.id === id);
    const to = from + by;
    if (from === -1 || to < 0 || to >= this.points.length) return;
    const points = [...this.points];
    [points[from], points[to]] = [points[to], points[from]];
    this.points = points;
  }

  sortAsGradient() {
    this.points = this.#sorted(this.points);
  }

  reverse() {
    this.points = [...this.points].reverse();
  }

  /**
   * Replace the unlocked colors with colors evenly spaced along a line, in
   * order from its start to its end. Locked colors slot in where they fit.
   */
  applyLine(from: Point, to: Point) {
    const locked = this.points.filter((point) => point.locked);
    const count = Math.max(this.targetCount, locked.length + 2);
    const points: PalettePoint[] = [];
    for (const { x, y } of pointsAlongLine(from, to, count - locked.length)) {
      const sourceHex = this.#sample(x, y);
      if (!sourceHex) continue;
      points.push(
        this.#makePoint({
          x,
          y,
          sourceHex,
          yarn: this.#match(sourceHex, points),
        }),
      );
    }
    for (const point of locked) {
      const at = bestInsertionIndex(
        points.map((n) => hexToOklab(this.colorOf(n))),
        hexToOklab(this.colorOf(point)),
      );
      points.splice(at, 0, point);
    }
    this.line = { from, to };
    this.targetCount = points.length;
    this.#setPoints(points);
  }

  // Yarn filter

  async setYarnFilter({
    brandId,
    yarnId,
    yarnWeightId,
  }: {
    brandId?: string;
    yarnId?: string;
    yarnWeightId?: string;
  }) {
    this.selectedBrandId = brandId;
    this.selectedYarnId = yarnId;
    this.selectedYarnWeightId = yarnWeightId;
    await this.#updateColorways();
    if (!this.pixels) return;
    if (!this.points.length) {
      await this.autoPalette();
      return;
    }
    if (!this.#index.length) {
      this.warningMessage = 'No colorways match the selected yarn.';
      return;
    }
    this.warningMessage = null;
    // Re-match the picked image colors to the new yarn, rather than replacing them
    this.#rematch({ onlyMissing: false });
  }

  async #updateColorways() {
    this.#index = indexColorways(
      getColorways({
        selectedBrandId: this.selectedBrandId,
        selectedYarnId: this.selectedYarnId,
        selectedYarnWeightId: this.selectedYarnWeightId,
      }),
    );
    await this.#engine?.setCandidates({ labs: colorwayOklabs(this.#index) });
  }

  // Helpers

  #makePoint(point: Omit<PalettePoint, 'id' | 'locked'>): PalettePoint {
    return { ...point, id: this.#nextId++, locked: false };
  }

  #setPoints(points: PalettePoint[]) {
    this.points = points;
    if (
      this.selectedId !== null &&
      !points.some((n) => n.id === this.selectedId)
    )
      this.selectedId = null;
    this.#schedulePreview();
  }

  #sample(x: number, y: number): string | null {
    if (!this.pixels) return null;
    return sampleHex({
      data: this.pixels.data,
      width: this.pixels.width,
      height: this.pixels.height,
      x,
      y,
    });
  }

  /** The closest yarn not already used by other points */
  #match(hex: string, others: PalettePoint[]): MatchedColor | null {
    if (this.mode === 'exact' && !this.#index.length) return null;
    return findClosestColorway({
      hex,
      index: this.#index,
      exclude: new Set(
        others.filter((n) => n.yarn).map((n) => colorwayKey(n.yarn!)),
      ),
    });
  }

  #rematch({ onlyMissing }: { onlyMissing: boolean }) {
    const used = this.points.filter((n) => n.locked || (onlyMissing && n.yarn));
    for (const point of this.points) {
      if (point.locked || (onlyMissing && point.yarn)) continue;
      point.yarn = this.#match(point.sourceHex, used);
      used.push(point);
    }
    this.#schedulePreview();
  }

  #withDelta(colorway: Color, sourceHex: string): MatchedColor {
    return {
      ...colorway,
      delta: deltaE2000(
        chroma(sourceHex).lab() as Lab,
        chroma(colorway.hex ?? '#ffffff').lab() as Lab,
      ),
      sourceHex,
    };
  }

  #labsOf(points: PalettePoint[]): Float32Array {
    return Float32Array.from(
      points.flatMap((n) => hexToOklab(this.colorOf(n))),
    );
  }

  #sorted(points: PalettePoint[]): PalettePoint[] {
    const labs: Oklab[] = points.map((n) => hexToOklab(this.colorOf(n)));
    return orderAsGradient(labs, { warmFirst: this.warmFirst }).map(
      (i) => points[i],
    );
  }

  #tellFewerColors() {
    const n = this.points.length;
    this.infoMessage = `This image only has ${n} distinct ${n === 1 ? 'color' : 'colors'}${this.mode === 'yarn' ? ' for this yarn' : ''}.`;
  }

  #schedulePreview() {
    clearTimeout(this.#previewTimer);
    if (!this.showYarnPreview) return;
    this.#previewTimer = setTimeout(async () => {
      if (!this.#engine || !this.pixels) return;
      const { width, height } = this.pixels;
      const data = await this.#engine.posterize({
        palette: this.points.map((n) => hexToRgb(this.colorOf(n))),
      });
      if (data && this.showYarnPreview)
        this.previewPixels = new ImageData(
          new Uint8ClampedArray(data),
          width,
          height,
        );
    }, 120);
  }
}
