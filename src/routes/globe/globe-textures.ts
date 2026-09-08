/** Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)

This file is part of Temperature-Blanket-Web-App.

Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
under the terms of the GNU General Public License as published by the Free Software Foundation,
either version 3 of the License, or (at your option) any later version.

Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
If not, see <https://www.gnu.org/licenses/>. */

/**
 * Surface options for the /globe zoom-detail spike.
 *
 * Why this exists: zooming all the way in is blurry, and the two shipped
 * textures cannot fix it. `earth-lowres.jpg` and `earth-highres.jpg` are both
 * 8001x4000 — only the JPEG quality differs — so at the 0.1 altitude floor the
 * visible cap (~49 degrees of longitude, ~1090 texels) is stretched over
 * roughly 2800 device pixels. That ~2.6x upscale is the blur.
 *
 * three-globe already ships a slippy-map tile engine that fixes it properly, by
 * fetching only the tiles on screen at a level matched to the zoom. This module
 * is the switchboard for comparing that against the status quo.
 *
 * Everything here is spike scaffolding behind a dev-only flag. Whichever option
 * loses gets deleted along with this file.
 */

import type { GlobeInstance } from 'globe.gl';

/** The tile-engine methods globe.gl proxies at runtime but leaves out of its
 * type definitions, so they can be reached without widening to `any`. */
interface TileEngineMethods {
  globeTileEngineUrl(urlFn: TileSource['url'] | null): unknown;
  globeTileEngineMaxLevel(level: number): unknown;
  globeTileEngineClearCache(): unknown;
}

const withTileEngine = (globe: GlobeInstance) =>
  globe as unknown as GlobeInstance & TileEngineMethods;

/** Structural view of the scene nodes this module touches. Avoids importing
 * three directly, which is only a transitive dependency here. */
type TextureLike = { anisotropy: number; needsUpdate: boolean };
interface MaterialLike {
  map?: TextureLike | null;
  bumpMap?: TextureLike | null;
}
interface SceneNodeLike {
  material?: MaterialLike | MaterialLike[] | null;
}

export const LOWRES_TEXTURE = '/images/earth-lowres.jpg';
export const HIGHRES_TEXTURE = '/images/earth-highres.jpg';

/** Pre-converted [lat, lng] line arrays, ready for globe.gl's pathsData. */
export const WORLD_LINES_URL = '/data/world-lines-110m.json';

export interface TileSource {
  id: string;
  label: string;
  /** Whether place names and borders are baked into the imagery. This is what
   * decides the "nothing to orient by" half of the complaint. */
  labelled: boolean;
  /** Highest level the source serves. Past it the engine requests tiles that
   * 404, leaving holes, so this must be fed to globeTileEngineMaxLevel. */
  maxLevel: number;
  attribution: string;
  /** What would need settling before this could ship. Displayed in the panel
   * so the spike never quietly turns into a decision. */
  caveat: string;
  /** three-globe calls this as (x, y, level). Note that GIBS and ArcGIS both
   * order their REST paths level/row/column — that is /{z}/{y}/{x}, which is
   * the reverse of the more familiar {z}/{x}/{y}. */
  url: (x: number, y: number, level: number) => string;
}

const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';
const ARCGIS = 'https://server.arcgisonline.com/ArcGIS/rest/services';

export const TILE_SOURCES: TileSource[] = [
  {
    id: 'gibs-bluemarble',
    label: 'NASA Blue Marble',
    labelled: false,
    maxLevel: 8,
    attribution: 'NASA EOSDIS GIBS',
    caveat:
      'Public domain and needs no key, so this is the cleanest option to ship. But it stops at level 8, which is only a little past what the current texture manages.',
    url: (x, y, l) =>
      `${GIBS}/BlueMarble_ShadedRelief_Bathymetry/default/default/GoogleMapsCompatible_Level8/${l}/${y}/${x}.jpeg`,
  },
  {
    id: 'esri-imagery',
    label: 'Esri World Imagery',
    labelled: false,
    maxLevel: 16,
    attribution: 'Esri, Maxar, Earthstar Geographics',
    caveat:
      'Real satellite detail far past the zoom floor. Terms and attribution would need review, and it sends every visitor IP to Esri.',
    url: (x, y, l) => `${ARCGIS}/World_Imagery/MapServer/tile/${l}/${y}/${x}`,
  },
  {
    id: 'esri-street',
    label: 'Esri World Street Map',
    labelled: true,
    maxLevel: 16,
    attribution: 'Esri',
    caveat:
      'Not satellite imagery at all — included to test whether baked-in place names fix the orientation problem without a separate vector layer.',
    url: (x, y, l) =>
      `${ARCGIS}/World_Street_Map/MapServer/tile/${l}/${y}/${x}`,
  },
];

/** A surface is either one of the two shipped textures or a tile source id. */
export type SurfaceMode = 'lowres' | 'highres' | (string & {});

export const BASE_MODES = [
  { id: 'lowres', label: 'Texture (low)' },
  { id: 'highres', label: 'Texture (high)' },
] as const;

export function findTileSource(mode: SurfaceMode): TileSource | undefined {
  return TILE_SOURCES.find((s) => s.id === mode);
}

/**
 * Point the globe at a surface.
 *
 * Setting a tile url hides the base sphere immediately while tiles arrive
 * asynchronously, so the changeover shows the engine's black inner sphere for
 * a moment. That window is one of the things the spike exists to judge, which
 * is why nothing here tries to paper over it.
 */
export function applySurface(globe: GlobeInstance, mode: SurfaceMode): void {
  const g = withTileEngine(globe);
  const source = findTileSource(mode);
  const changed = lastSurface !== mode;
  lastSurface = mode;

  // Cached tile meshes are keyed by level and grid position, not by the source
  // they came from, so switching sources at a fixed altitude would otherwise
  // leave the previous source's imagery on screen — which would quietly
  // invalidate the whole imagery-versus-labelled comparison.
  if (changed) g.globeTileEngineClearCache();

  if (source) {
    g.globeTileEngineMaxLevel(source.maxLevel);
    g.globeTileEngineUrl(source.url);
    return;
  }

  g.globeTileEngineUrl(null);
  globe.globeImageUrl(mode === 'highres' ? HIGHRES_TEXTURE : LOWRES_TEXTURE);
}

let lastSurface: SurfaceMode | null = null;

/** Drop every cached tile, so the next render re-fetches cold. Lets the
 * changeover be watched more than once, and on a throttled connection. */
export function clearTileCache(globe: GlobeInstance): void {
  withTileEngine(globe).globeTileEngineClearCache();
}

const LEVEL_THRESHOLDS = Array.from({ length: 30 }, (_, i) => 8 / 2 ** i);

/**
 * The tile level the engine will pick for a given altitude.
 *
 * Recomputed here rather than read off the engine, whose level lives in a
 * private field with no accessor. three-slippy-map-globe compares the camera's
 * altitude in globe-radius units against thresholds of `8 / 2^i` and takes the
 * first that fits, which is what this mirrors.
 */
export function tileLevelForAltitude(
  altitude: number,
  maxLevel: number,
): number {
  if (!Number.isFinite(altitude)) return 0;
  const idx = LEVEL_THRESHOLDS.findIndex((t) => t <= altitude);
  return Math.min(maxLevel, idx < 0 ? LEVEL_THRESHOLDS.length : idx);
}

/**
 * Turn anisotropic filtering on or off across every texture in the scene.
 *
 * three-globe sets only `colorSpace` on the textures it loads, leaving
 * anisotropy at 1, which is a free sharpness loss wherever the surface curves
 * away from the camera. Tiles each carry their own texture, so this walks the
 * scene rather than touching the globe material alone.
 *
 * Cheap to call repeatedly: it only writes (and so only forces a GPU re-upload)
 * when a texture's value actually differs, which is what lets the caller
 * reapply it after asynchronous texture loads without tracking them.
 *
 * @returns the anisotropy level applied, for display.
 */
export function applyAnisotropy(
  globe: GlobeInstance,
  enabled: boolean,
): number {
  const max = enabled ? globe.renderer().capabilities.getMaxAnisotropy() : 1;

  globe.scene().traverse((object: unknown) => {
    const node = object as SceneNodeLike;
    const materials = Array.isArray(node.material)
      ? node.material
      : node.material
        ? [node.material]
        : [];

    for (const material of materials) {
      for (const key of ['map', 'bumpMap'] as const) {
        const texture = material[key];
        if (texture && texture.anisotropy !== max) {
          texture.anisotropy = max;
          texture.needsUpdate = true;
        }
      }
    }
  });

  return max;
}

export interface WorldLines {
  coastline: [number, number][][];
  borders: [number, number][][];
}

/** Fetch the vector overlay. Returns null rather than throwing, so a missing
 * asset disables the overlay instead of breaking the page. */
export async function loadWorldLines(
  fetchImpl: typeof fetch = fetch,
): Promise<WorldLines | null> {
  try {
    const res = await fetchImpl(WORLD_LINES_URL);
    if (!res.ok) return null;
    return (await res.json()) as WorldLines;
  } catch {
    return null;
  }
}

/** Count tile requests the browser has actually made, per source host.
 *
 * Resource Timing reports 0 for `transferSize` on these hosts because neither
 * sends `Timing-Allow-Origin`, so this deliberately reports a count only —
 * exact bytes have to come from the DevTools network panel. */
export function countTileRequests(): number {
  if (typeof performance?.getEntriesByType !== 'function') return 0;
  return performance
    .getEntriesByType('resource')
    .filter(
      (e) =>
        e.name.includes('gibs.earthdata.nasa.gov') ||
        e.name.includes('server.arcgisonline.com'),
    ).length;
}

/**
 * Whether the spike is driving the surface by hand.
 *
 * Module scope rather than component state on purpose. The throttled camera
 * listener is registered once against a globe instance that is deliberately
 * reused across mounts, so its closure outlives the component; a component
 * field read from in there would go stale the moment the page remounted. A
 * module read is always current. Same hazard that put `pov` on globeState.
 */
let manualSurface = false;

export function setManualSurface(value: boolean): void {
  manualSurface = value;
}

export function isManualSurface(): boolean {
  return manualSurface;
}
