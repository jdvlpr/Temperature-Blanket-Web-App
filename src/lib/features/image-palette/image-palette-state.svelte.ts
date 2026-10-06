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
  getSortedPalette,
  shuffleColors,
  type PaletteSort,
} from '$lib/utils/color-utils';
import {
  getColorways,
  stringToBrandAndYarnDetails,
} from '$lib/utils/yarn-utils';
import chroma from 'chroma-js';
import { hexToOklab, oklabToHex, type Oklab } from './color-space';
import {
  checkImageFile,
  decodeImage,
  imageToPixels,
  makeThumbnail,
  MAX_IMAGE_DIMENSION,
} from './decode';
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
import {
  pickRandomPhoto,
  randomPhotoSrc,
  type RandomPhoto,
} from './random-photos';
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
export type PhotoSource = 'random' | 'file';

/** A palette color as the palette component shows it */
export type PaletteColor = Color & { pointId: number; locked: boolean };
export type PickTool = 'points' | 'line';

/** The palette's order: one of the site's sorts, or custom */
export type SortOrder = PaletteSort;

/** A line drawn across the photo, and the colors spaced along it, in order */
export type PaletteLine = { from: Point; to: Point; pointIds: number[] };

type Session = {
  pixels: ImageData;
  thumbnail: string;
  source: PhotoSource;
  credit: RandomPhoto | null;
  points: PalettePoint[];
  mode: PaletteMode;
  style: PaletteStyle;
  autoStyle: PaletteStyle | null;
  sortOrder: SortOrder;
  line: PaletteLine | null;
  brandId?: string;
  yarnId?: string;
  yarnWeightId?: string;
};

// The last photo and palette, so closing and reopening the modal during a
// visit picks up where you left off
let session: Session | null = null;

export class ImagePaletteState {
  points = $state<PalettePoint[]>([]);
  mode = $state<PaletteMode>('yarn');
  style = $state<PaletteStyle>('balanced');
  /** The Auto Palette style the colors came from, until they're edited */
  autoStyle = $state<PaletteStyle | null>(null);
  sortOrder = $state<SortOrder>('custom');
  tool = $state<PickTool>('points');
  line = $state<PaletteLine | null>(null);
  selectedId = $state<number | null>(null);
  hoveredId = $state<number | null>(null);
  loading = $state(false);
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
  /** A small preview of the photo, for continuing with it later */
  thumbnail = $state<string | null>(session?.thumbnail ?? null);
  /** Where the photo came from, so a random one can be swapped for another */
  source = $state<PhotoSource | null>(null);
  /** Who took the photo, when it's a random one */
  credit = $state<RandomPhoto | null>(null);

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
  #paletteRequest = 0;
  #destroyed = false;
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
    if (this.#destroyed) return;
    if (defaultYarn.value) {
      const details = stringToBrandAndYarnDetails(defaultYarn.value);
      this.selectedBrandId = details.brandId ?? undefined;
      this.selectedYarnId = details.yarnId ?? undefined;
    }
    this.#engine = createImagePaletteEngine();
    await this.#updateColorways();
    if (this.#destroyed) return;
    this.yarnReady = true;
    this.#resolveReady();
  }

  /** Whether there's a photo to continue with, from now or an earlier visit */
  get canContinue() {
    return !!this.pixels || !!session;
  }

  /** Go back to the last photo and palette */
  async continueSaved() {
    if (this.pixels || !session) return;
    this.loading = true;
    await this.#ready;
    if (session) await this.#restore(session);
  }

  /** Keep the photo and palette for next time, and stop the worker */
  destroy() {
    this.#destroyed = true;
    if (this.pixels)
      session = {
        pixels: this.pixels,
        thumbnail: this.thumbnail ?? '',
        source: this.source ?? 'file',
        credit: this.credit,
        points: $state.snapshot(this.points),
        mode: this.mode,
        style: this.style,
        autoStyle: this.autoStyle,
        sortOrder: this.sortOrder,
        line: $state.snapshot(this.line),
        brandId: this.selectedBrandId,
        yarnId: this.selectedYarnId,
        yarnWeightId: this.selectedYarnWeightId,
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

  /** The palette for the palette component, which reports changes back
   * through `syncFromColors` */
  paletteColors(): PaletteColor[] {
    const colors = this.toColors();
    return this.points.map((point, i) => ({
      ...colors[i],
      pointId: point.id,
      locked: point.locked,
    }));
  }

  /** Apply reordering, deleting, and locking done in the palette component */
  syncFromColors(colors: Partial<PaletteColor>[]) {
    const byId = new Map(this.points.map((point) => [point.id, point]));
    const points: PalettePoint[] = [];
    for (const color of colors) {
      const point = byId.get(color.pointId ?? -1);
      if (!point) continue;
      point.locked = !!color.locked;
      points.push(point);
    }
    const remaining = this.points.filter((point) => points.includes(point));
    if (points.length < this.points.length) this.autoStyle = null;
    if (points.some((point, i) => point !== remaining[i]))
      this.sortOrder = 'custom';
    this.#setPoints(points);
    this.targetCount = points.length;
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
    this.source = 'random';
    const photo = pickRandomPhoto(this.credit?.id);
    return this.loadImage(
      randomPhotoSrc(photo, MAX_IMAGE_DIMENSION, (MAX_IMAGE_DIMENSION * 2) / 3),
      "Couldn't load a random image. Check your connection and try again.",
      photo,
    );
  }

  async loadFile(file: File | undefined) {
    if (!file) return;
    const check = checkImageFile(file);
    if (!check.ok) {
      this.errorMessage = check.error;
      return;
    }
    this.source = 'file';
    const url = URL.createObjectURL(file);
    await this.loadImage(url, check.failMessage);
    URL.revokeObjectURL(url);
  }

  async loadImage(
    src: string,
    failMessage: string,
    credit: RandomPhoto | null = null,
  ) {
    const id = ++this.#loadId;
    this.loading = true;
    this.errorMessage = null;
    this.infoMessage = null;
    let image: HTMLImageElement;
    try {
      image = await decodeImage(src);
      await this.#ready;
    } catch {
      if (id !== this.#loadId) return;
      // Keep showing the previous image, if there was one
      this.errorMessage = failMessage;
      this.loading = false;
      return;
    }
    // A newer image was requested while this one loaded
    if (id !== this.#loadId || this.#destroyed) return;

    const drawn = imageToPixels(image);
    if (!drawn) return;
    const { pixels, canvas } = drawn;
    const { width, height } = pixels;

    await this.#engine!.setImage({ data: pixels.data, width, height });
    if (id !== this.#loadId || this.#destroyed) return;
    this.pixels = pixels;
    this.credit = credit;
    this.thumbnail = makeThumbnail(canvas);
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
    this.autoStyle = saved.autoStyle;
    this.sortOrder = saved.sortOrder;
    this.line = saved.line;
    this.selectedBrandId = saved.brandId;
    this.selectedYarnId = saved.yarnId;
    this.selectedYarnWeightId = saved.yarnWeightId;
    await this.#updateColorways();
    await this.#engine!.setImage({
      data: saved.pixels.data,
      width: saved.pixels.width,
      height: saved.pixels.height,
    });
    if (this.#destroyed) return;
    this.pixels = saved.pixels;
    this.thumbnail = saved.thumbnail;
    this.source = saved.source;
    this.credit = saved.credit;
    this.points = saved.points;
    this.#nextId = Math.max(0, ...saved.points.map((point) => point.id)) + 1;
    this.#loadId++;
    this.loading = false;
    // This gauge may want a different number of colors than last time
    if (this.points.length !== this.targetCount)
      await this.setCount(this.targetCount);
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
    // After clearing every color, start again from two
    if (this.targetCount < 2) this.targetCount = 2;
    const count = Math.max(this.targetCount, locked.length);
    this.working = true;
    const result = await this.#requestColors({
      count: count - locked.length,
      fixed: locked,
    });
    this.working = false;
    if (!result) return;
    // Keep a sort the user chose; otherwise blend in the gauge's direction
    const order = this.sortOrder;
    const warmFirst =
      order === 'warm-to-cool' || order === 'cool-to-warm'
        ? order === 'warm-to-cool'
        : this.warmFirst;
    this.#setPoints(this.#sorted([...locked, ...result.points], warmFirst));
    this.autoStyle = this.style;
    if (
      order !== 'custom' &&
      order !== 'warm-to-cool' &&
      order !== 'cool-to-warm'
    )
      this.sortBy(order);
    else this.sortOrder = warmFirst ? 'warm-to-cool' : 'cool-to-warm';
    this.#rematchIfFilterChanged(result.index);
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
    const result = await this.#requestColors({
      count: count - this.points.length,
      fixed: this.points,
    });
    if (!result) return;
    const points = [...this.points];
    for (const point of result.points) {
      // Slot each new color where it fits the gradient best
      const at = bestInsertionIndex(
        points.map((n) => hexToOklab(this.colorOf(n))),
        hexToOklab(this.colorOf(point)),
      );
      points.splice(at, 0, point);
    }
    // New colors slot into a blend; any other sort no longer holds
    if (this.sortOrder !== 'warm-to-cool' && this.sortOrder !== 'cool-to-warm')
      this.sortOrder = 'custom';
    this.#setPoints(points);
    this.#rematchIfFilterChanged(result.index);
    if (this.points.length < count) this.#tellFewerColors();
  }

  /**
   * Ask the engine for colors that best cover the image alongside `fixed`.
   * Returns null if a newer request replaced this one. Yarn picks are read
   * against the colorways the engine had when the request was sent, since
   * the yarn filter can change while it works.
   */
  async #requestColors({
    count,
    fixed,
  }: {
    count: number;
    fixed: PalettePoint[];
  }): Promise<{ points: PalettePoint[]; index: ColorwayIndex } | null> {
    const request = ++this.#paletteRequest;
    const index = this.#index;
    const picked = await this.#engine!.autoPalette({
      count,
      style: this.style,
      fixed: this.#labsOf(fixed),
      exact: this.mode === 'exact',
    });
    if (request !== this.#paletteRequest || this.#destroyed) return null;
    const points = picked.map(({ candidate, lab, x, y }) => {
      // Exact colors and yarn matches both use the photo's color at the marker
      const sourceHex = this.#sample(x, y) ?? oklabToHex(lab);
      const colorway = candidate >= 0 ? index[candidate]?.colorway : undefined;
      return this.#makePoint({
        x,
        y,
        sourceHex,
        yarn: colorway ? this.#withDelta(colorway, sourceHex) : null,
      });
    });
    return { points, index };
  }

  /** Re-match colors to the yarn if the filter changed while they were chosen */
  #rematchIfFilterChanged(index: ColorwayIndex) {
    if (index !== this.#index && this.#index.length)
      this.#rematch({ onlyMissing: false });
  }

  async setStyle(style: PaletteStyle) {
    this.style = style;
    await this.autoPalette();
  }

  setMode(mode: PaletteMode) {
    this.mode = mode;
    if (mode === 'yarn') this.#rematch({ onlyMissing: true });
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
    this.line = null;
    this.#edited();
    this.sortOrder = 'custom';
    return point.id;
  }

  /**
   * Move a color's point, picking up the image's color there. Dragging the
   * first or last color on a line moves that end of the line instead; any
   * other color on it leaves the line.
   */
  movePoint(id: number, x: number, y: number) {
    const point = this.points.find((n) => n.id === id);
    if (!point || point.locked) return;
    x = Math.min(Math.max(x, 0), 1);
    y = Math.min(Math.max(y, 0), 1);
    this.#edited();
    if (this.line) {
      const ids = this.line.pointIds;
      const at = ids.indexOf(id);
      if (at === 0 || at === ids.length - 1) {
        this.#moveLineEnd(at === 0 ? 'from' : 'to', { x, y });
        return;
      }
      if (at !== -1) this.line = null;
    }
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
  }

  /** A drag finished: settle the colors along a line that was adjusted */
  finishMove(id: number) {
    if (!this.line?.pointIds.includes(id)) return;
    const others = this.points.filter(
      (n) => !this.line!.pointIds.includes(n.id),
    );
    const used = [...others];
    for (const lineId of this.line.pointIds) {
      const point = this.points.find((n) => n.id === lineId);
      if (!point || point.locked) continue;
      point.yarn = this.#match(point.sourceHex, used);
      used.push(point);
    }
  }

  setTool(tool: PickTool) {
    this.tool = tool;
    // Picking colors one by one again: the line no longer applies
    if (tool === 'points') this.line = null;
  }

  removePoint(id: number) {
    const point = this.points.find((n) => n.id === id);
    if (!point) return;
    this.#edited();
    this.#setPoints(this.points.filter((n) => n.id !== id));
    this.targetCount = this.points.length;
    if (this.selectedId === id) this.selectedId = null;
  }

  /** Remove every unlocked color */
  clear() {
    this.#edited();
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
    this.#edited();
    point.yarn = this.#withDelta(colorway, point.sourceHex);
  }

  /** Move a color left (-1) or right (+1) in the palette */
  shift(id: number, by: -1 | 1) {
    const from = this.points.findIndex((n) => n.id === id);
    const to = from + by;
    if (from === -1 || to < 0 || to >= this.points.length) return;
    const points = [...this.points];
    [points[from], points[to]] = [points[to], points[from]];
    this.points = points;
    this.sortOrder = 'custom';
  }

  /** Sort the palette, keeping locked colors where they are, as the site's
   * other palette sorts do */
  sortBy(order: SortOrder) {
    this.sortOrder = order;
    if (order === 'custom') return;
    const byId = new Map(this.points.map((point) => [point.id, point]));
    this.points = (
      getSortedPalette({
        palette: this.paletteColors(),
        sortColors: order,
      }) as PaletteColor[]
    ).map((color) => byId.get(color.pointId)!);
  }

  reverse() {
    this.points = [...this.points].reverse();
    this.sortOrder = 'custom';
  }

  /** Put the colors in a random order, keeping locked colors where they are */
  shuffle() {
    const byId = new Map(this.points.map((point) => [point.id, point]));
    this.points = shuffleColors(this.paletteColors()).map((color) =>
      byId.get(color.pointId)!,
    );
    this.sortOrder = 'custom';
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
    this.line = {
      from,
      to,
      pointIds: points.filter((n) => !n.locked).map((n) => n.id),
    };
    this.targetCount = points.length;
    this.#setPoints(points);
    this.#edited();
    this.sortOrder = 'custom';
  }

  /** Move one end of the line, respacing its colors along it. Only the
   * dragged end is re-matched to yarn while dragging; `finishMove` settles
   * the rest, since matching every color on every move would lag. */
  #moveLineEnd(end: 'from' | 'to', at: Point) {
    const line = this.line!;
    line[end] = at;
    const spots = pointsAlongLine(line.from, line.to, line.pointIds.length);
    line.pointIds.forEach((id, i) => {
      const point = this.points.find((n) => n.id === id);
      if (!point || point.locked) return;
      const sourceHex = this.#sample(spots[i].x, spots[i].y);
      if (!sourceHex) return;
      point.x = spots[i].x;
      point.y = spots[i].y;
      point.sourceHex = sourceHex;
      const isEnd = i === 0 || i === line.pointIds.length - 1;
      if (isEnd && (end === 'from') === (i === 0))
        point.yarn = this.#match(
          sourceHex,
          this.points.filter((n) => n.id !== id),
        );
    });
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

  /** The colors were changed by hand: they're no longer an Auto Palette,
   * or in any particular order */
  #edited() {
    this.autoStyle = null;
    this.sortOrder = 'custom';
  }

  #setPoints(points: PalettePoint[]) {
    this.points = points;
    if (this.line) {
      const ids = new Set(points.map((n) => n.id));
      const pointIds = this.line.pointIds.filter((id) => ids.has(id));
      // A line needs both its ends; without them it's just colors
      if (
        pointIds[0] !== this.line.pointIds[0] ||
        pointIds.at(-1) !== this.line.pointIds.at(-1)
      )
        this.line = null;
      else this.line.pointIds = pointIds;
    }
    if (
      this.selectedId !== null &&
      !points.some((n) => n.id === this.selectedId)
    )
      this.selectedId = null;
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

  #sorted(points: PalettePoint[], warmFirst = this.warmFirst): PalettePoint[] {
    const labs: Oklab[] = points.map((n) => hexToOklab(this.colorOf(n)));
    return orderAsGradient(labs, { warmFirst }).map((i) => points[i]);
  }

  #tellFewerColors() {
    const n = this.points.length;
    this.infoMessage = `This image only has ${n} distinct ${n === 1 ? 'color' : 'colors'}${this.mode === 'yarn' ? ' for this yarn' : ''}.`;
  }
}
