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
 * Where the globe's surface imagery comes from.
 *
 * The globe used to paint a single 8001x4000 equirectangular JPEG onto the
 * sphere, swapping a heavier re-encode of the same image in below altitude 2.
 * Both files were the same pixel dimensions, so that swap bought compression
 * quality and never resolution: at the 0.1 altitude floor the visible cap is
 * about 1090 texels stretched over ~2800 device pixels, and that ~2.6x upscale
 * was the blur.
 *
 * three-globe ships a slippy-map tile engine (`three-slippy-map-globe`, pulled
 * in as a transitive dependency) that fixes it properly: it fetches only the
 * tiles on screen, at a level chosen from the camera altitude, and caches them.
 * globe.gl proxies the engine's methods at runtime but omits them from its type
 * definitions, which is what the cast below is for.
 *
 * Nothing here needs wiring to the camera. globe.gl calls `setPointOfView` on
 * every controls change, and three-globe forwards that to any layer exposing
 * `updatePov`, which reaches the tile engine.
 */

import type { GlobeInstance } from 'globe.gl';

export interface TileSource {
  /** Host, used to recognise the source's own requests in Resource Timing. */
  host: string;
  /** Highest level the source serves. Past it the engine would request tiles
   * that 404, leaving holes in the sphere. */
  maxLevel: number;
  /** Displayed under the globe. Required by the source's terms. */
  attribution: string;
  /** three-globe calls this as (x, y, level). Note that ArcGIS orders its REST
   * path level/row/column — that is /{z}/{y}/{x}, the reverse of the more
   * familiar {z}/{x}/{y}. */
  url: (x: number, y: number, level: number) => string;
}

/**
 * NASA GIBS — Blue Marble below the switch level, Landsat WELD above it.
 *
 * Both are NASA Earth Observing System products: US Government work, public
 * domain, no API key, no licence to accept. That is the whole reason this is
 * NASA rather than a commercial basemap.
 *
 * Two layers because neither one is good at both ends of the zoom range:
 *
 * - Blue Marble carries oceans and bathymetry, so the globe reads as a planet
 *   when it is small on screen — but it stops at level 8, and by then it is
 *   already visibly upscaled.
 * - Landsat WELD reaches level 12 with real 30m surface detail, which is what
 *   fixes the blur this change exists for. It is a land-only sensor, so its
 *   water is pure black.
 *
 * Splitting them by level gives oceans in the default wide view and genuine
 * detail once zoomed in. To use a single layer instead, make `url` return only
 * one branch and set `maxLevel` to match (8 for Blue Marble, 12 for Landsat).
 *
 * Landsat WELD is an annual composite from 2000, so it predates recent
 * development and will not match a modern satellite view.
 */

/** Below this level Blue Marble is used, at and above it Landsat WELD.
 *
 * The page's zoom buttons span roughly level 2 (altitude 2.5) to level 7
 * (altitude 0.1), so this has to sit inside that range or the detailed layer
 * would never be reached by anything but a mouse wheel. */
const LANDSAT_FROM_LEVEL = 6;

const GIBS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';

const BLUE_MARBLE = `${GIBS}/BlueMarble_ShadedRelief_Bathymetry/default/default/GoogleMapsCompatible_Level8`;

// The date is the layer's own default; this composite is not updated.
const LANDSAT = `${GIBS}/Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual/default/2000-12-01/GoogleMapsCompatible_Level12`;

export const NASA_GIBS: TileSource = {
  host: 'gibs.earthdata.nasa.gov',
  // Landsat WELD's ceiling. Past it the engine would request tiles that 404.
  maxLevel: 12,
  attribution:
    'NASA EOSDIS GIBS — Blue Marble and Landsat WELD (public domain)',
  url: (x, y, l) =>
    l >= LANDSAT_FROM_LEVEL
      ? `${LANDSAT}/${l}/${y}/${x}.jpeg`
      : `${BLUE_MARBLE}/${l}/${y}/${x}.jpeg`,
};

/** The source the globe actually uses. */
export const IMAGERY = NASA_GIBS;

/** The tile-engine methods globe.gl proxies at runtime but leaves out of its
 * type definitions, so they can be reached without widening to `any`. */
interface TileEngineMethods {
  globeTileEngineUrl(urlFn: TileSource['url'] | null): unknown;
  globeTileEngineMaxLevel(level: number): unknown;
  globeTileEngineClearCache(): unknown;
}

/** Structural view of the scene nodes anisotropy touches. Avoids importing
 * three directly, which is only a transitive dependency here. */
type TextureLike = { anisotropy: number; needsUpdate: boolean };
interface MaterialLike {
  map?: TextureLike | null;
  bumpMap?: TextureLike | null;
}
interface SceneNodeLike {
  material?: MaterialLike | MaterialLike[] | null;
}

/** Point the globe's surface at a tile source. */
export function applyImagery(
  globe: GlobeInstance,
  source: TileSource = IMAGERY,
): void {
  const tiled = globe as unknown as GlobeInstance & TileEngineMethods;
  tiled.globeTileEngineMaxLevel(source.maxLevel);
  tiled.globeTileEngineUrl(source.url);
}

/**
 * Turn on anisotropic filtering across every texture in the scene.
 *
 * three-globe sets only `colorSpace` on the textures it loads, leaving
 * anisotropy at 1, which loses detail wherever the surface curves away from the
 * camera — most of a sphere. Each tile carries its own texture, so this walks
 * the scene rather than touching a single globe material.
 *
 * Cheap to call repeatedly: it only writes, and so only forces a GPU re-upload,
 * when a texture's value actually differs. That is what lets the caller reapply
 * it as new tiles stream in without tracking each load.
 */
export function applyAnisotropy(globe: GlobeInstance): void {
  const max = globe.renderer().capabilities.getMaxAnisotropy();

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
}

/**
 * Run `onLoaded` once the first tile has arrived, or after `timeoutMs`.
 *
 * Needed because three-globe reports the globe as ready the moment a tile url
 * is set, without waiting for imagery. The engine hides the base sphere and
 * puts a black one just below the surface, so treating "ready" as "show it"
 * would flash a black globe on every first load. Resource Timing gives a
 * dependency-free signal for the real thing.
 *
 * @returns a cleanup function.
 */
export function whenFirstTileLoads(
  onLoaded: () => void,
  source: TileSource = IMAGERY,
  timeoutMs = 8000,
): () => void {
  let settled = false;
  let observer: PerformanceObserver | undefined;

  const finish = () => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    observer?.disconnect();
    onLoaded();
  };

  // The globe should still appear if the source is slow or unreachable —
  // a partly-drawn globe beats an indefinite spinner.
  const timer = setTimeout(finish, timeoutMs);

  try {
    observer = new PerformanceObserver((list) => {
      if (list.getEntries().some((e) => e.name.includes(source.host))) finish();
    });
    // `buffered` so tiles that landed before this ran still count.
    observer.observe({ type: 'resource', buffered: true });
  } catch {
    // No PerformanceObserver: fall back to the timeout alone.
  }

  return () => {
    clearTimeout(timer);
    observer?.disconnect();
  };
}
