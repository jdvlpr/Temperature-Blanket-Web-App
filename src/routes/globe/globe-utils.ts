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

/** One published gallery project, as it appears in the globe payload. */
export interface GlobeProject {
  id: number;
  title: string;
  image?: string | null;
  /**
   * Human-readable location name (e.g. "Chicago, Illinois, United States").
   * Added to the WordPress payload in Sep 2026; caches written before that
   * don't carry it, and the web app deploys independently of the plugin, so
   * every consumer must tolerate this being undefined.
   */
  label?: string;
}

/**
 * A cluster of projects sharing a ~11km cell (the payload groups by lat/lng
 * rounded to 1 decimal place). One region renders as one point on the globe.
 */
export interface GlobeRegion {
  lat: number;
  lng: number;
  projects: GlobeProject[];
  popular_color?: { hex?: string; name?: string };
}

/**
 * The single display name for a region.
 *
 * A region is a rounded cell, so its projects can carry different labels
 * ("Brooklyn" and "New York" land in the same cell). The payload keeps every
 * project's own label rather than picking a winner server-side, so the choice
 * happens here: use the most common one, breaking ties toward the first
 * occurrence so the result is stable across renders.
 *
 * Returns null when no project carries a label — i.e. against a cache written
 * before the plugin change. Callers use that to hide label UI rather than
 * render something empty.
 */
export function getRegionLabel(region: GlobeRegion): string | null {
  const labels = (region.projects ?? [])
    .map((p) => p.label?.trim())
    .filter((l): l is string => !!l);

  if (!labels.length) return null;

  const counts = new Map<string, number>();
  for (const label of labels) {
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  let best = labels[0];
  let bestCount = 0;
  // Iterate `labels`, not `counts`, so ties resolve to the earliest occurrence.
  for (const label of labels) {
    const count = counts.get(label) ?? 0;
    if (count > bestCount) {
      best = label;
      bestCount = count;
    }
  }

  return best;
}

/** True when any project in the region carries a location label. */
export function hasLabels(regions: GlobeRegion[]): boolean {
  return regions.some((r) => (r.projects ?? []).some((p) => !!p.label?.trim()));
}

/**
 * Case-insensitive match of a region against a search query, over both its
 * location label and its project titles. Runs against the already-loaded
 * dataset, so there is no network involved.
 */
export function regionMatchesQuery(
  region: GlobeRegion,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;

  return (region.projects ?? []).some(
    (p) =>
      p.title?.toLowerCase().includes(q) || p.label?.toLowerCase().includes(q),
  );
}

/** A single row in the search results dropdown. */
export interface GlobeSearchResult {
  region: GlobeRegion;
  /** What to show for this row: the region's label, falling back to a title. */
  primary: string;
  /** Project count in the region, for the secondary line. */
  count: number;
}

/**
 * Search the loaded regions, best-effort ranked: regions whose label starts
 * with the query first, then other label matches, then title-only matches.
 */
export function searchRegions(
  regions: GlobeRegion[],
  query: string,
  limit = 8,
): GlobeSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const scored: { result: GlobeSearchResult; score: number }[] = [];

  for (const region of regions) {
    if (!regionMatchesQuery(region, q)) continue;

    const label = getRegionLabel(region);
    const labelLower = label?.toLowerCase() ?? '';

    let score = 2;
    if (labelLower.includes(q)) score = 1;
    if (labelLower.startsWith(q)) score = 0;

    scored.push({
      score,
      result: {
        region,
        primary: label ?? region.projects[0]?.title ?? 'Unknown location',
        count: region.projects?.length ?? 0,
      },
    });
  }

  return scored
    .sort((a, b) => a.score - b.score || b.result.count - a.result.count)
    .slice(0, limit)
    .map((s) => s.result);
}

/** A camera position the globe can be pointed at. */
export interface GlobePointOfView {
  lat: number;
  lng: number;
  altitude: number;
}

/** Altitude bounds, matching what the zoom buttons already allow. */
const MIN_ALTITUDE = 0.1;
const MAX_ALTITUDE = 5;

/**
 * Parse `?lat=&lng=&z=` into a camera position, or null when the params are
 * absent or unusable.
 *
 * Coordinates come from a URL, so they are untrusted: anything non-numeric or
 * out of range is rejected rather than passed to the camera, where a NaN would
 * put the globe into an unrecoverable state.
 */
export function parseDeepLink(
  params: URLSearchParams,
): GlobePointOfView | null {
  const lat = Number(params.get('lat'));
  const lng = Number(params.get('lng'));

  if (!params.has('lat') || !params.has('lng')) return null;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;

  const rawZ = params.get('z');
  const z = Number(rawZ);
  const altitude =
    rawZ !== null && Number.isFinite(z)
      ? Math.min(MAX_ALTITUDE, Math.max(MIN_ALTITUDE, z))
      : 0.6;

  return { lat, lng, altitude };
}

/** Build the shareable URL for a camera position. */
export function buildDeepLink({
  lat,
  lng,
  altitude,
}: GlobePointOfView): string {
  const round = (n: number) => Math.round(n * 1000) / 1000;
  return `/globe?lat=${round(lat)}&lng=${round(lng)}&z=${round(altitude)}`;
}

/**
 * Build a "see this place on the globe" link from a gallery project's
 * `locations` meta (a JSON string).
 *
 * Deliberately mirrors the extraction in the WordPress plugin's
 * `tempblanket_globe_compute_contribution` — first location, `latlong` string
 * preferred over separate `lat`/`lng`, exact 0,0 treated as missing placeholder
 * data — so the link lands where the plugin actually placed the project's
 * point. Returns null when the project has no usable coordinates, which is the
 * signal to not render the link at all.
 */
export function buildGlobeLinkFromLocationsMeta(
  locations: string | null | undefined,
): string | null {
  if (!locations) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(locations);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed) || !parsed.length) return null;

  const loc = parsed[0] as {
    latlong?: string;
    lat?: number | string;
    lng?: number | string;
  };

  let lat: number;
  let lng: number;

  if (typeof loc?.latlong === 'string' && loc.latlong.includes(',')) {
    const [a, b] = loc.latlong.split(',');
    lat = Number(a);
    lng = Number(b);
  } else {
    lat = Number(loc?.lat);
    lng = Number(loc?.lng);
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  // Placeholder/missing data, same filter the plugin applies.
  if (Math.abs(lat) < 0.0001 && Math.abs(lng) < 0.0001) return null;

  return buildDeepLink({ lat, lng, altitude: 0.2 });
}

/** Stable identity for a region, for keyed `{#each}` blocks and selection. */
export function regionKey(region: GlobeRegion): string {
  return `${region.lat},${region.lng}`;
}

/** A region currently facing the camera, with how centered it is. */
export interface GlobeRegionInView {
  region: GlobeRegion;
  /**
   * Cosine of the angular distance from the camera's center point: 1 is dead
   * center, decreasing toward the horizon. Used to break ties between regions
   * holding the same number of projects.
   */
  centrality: number;
}

const DEG = Math.PI / 180;

/**
 * Trig for a region's position, memoized.
 *
 * Region objects come from the payload and are never mutated, so caching on
 * identity is safe. This runs for every region on every camera update, which
 * happens a few times a second while the globe spins.
 */
const trigCache = new WeakMap<
  GlobeRegion,
  { sinLat: number; cosLat: number; lngRad: number }
>();

function regionTrig(region: GlobeRegion) {
  let t = trigCache.get(region);
  if (!t) {
    const latRad = region.lat * DEG;
    t = {
      sinLat: Math.sin(latRad),
      cosLat: Math.cos(latRad),
      lngRad: region.lng * DEG,
    };
    trigCache.set(region, t);
  }
  return t;
}

/**
 * The regions currently visible from a camera position, ranked and capped.
 *
 * Two filters, in order. First the horizon: a point is on the near hemisphere
 * when its angular distance from the camera's center is inside
 * `acos(1 / (1 + altitude))`, so the test compares cosines and never needs an
 * `acos`. Then, optionally, `isOnScreen` — because the horizon cone is wider
 * than the viewport once zoomed in, and listing places that are geometrically
 * front-facing but scrolled off the canvas edge is exactly the confusing part.
 * The horizon test has to run first regardless: a screen projection alone would
 * happily place points on the far side of the globe inside the viewport.
 *
 * Ranked by how close to the center of view a place is, so the list answers
 * "what am I looking at" and reorders smoothly as the camera moves. Project
 * count only breaks ties. `total` is the full count of visible regions, so the
 * caller can say how many the capped list is leaving out.
 *
 * This replaces drawing names on the sphere itself: `three-globe`'s label layer
 * builds an extruded text geometry per label and rebuilds them as the set
 * changes, which collapses the frame rate. Ranking regions here and rendering
 * their names as DOM keeps the sphere to points only.
 */
export function regionsInView(
  regions: GlobeRegion[],
  pov: GlobePointOfView,
  limit = 30,
  isOnScreen?: (region: GlobeRegion) => boolean,
): { regions: GlobeRegionInView[]; total: number } {
  const altitude = Number.isFinite(pov.altitude)
    ? Math.max(pov.altitude, MIN_ALTITUDE)
    : MIN_ALTITUDE;

  if (!Number.isFinite(pov.lat) || !Number.isFinite(pov.lng)) {
    return { regions: [], total: 0 };
  }

  const camLat = pov.lat * DEG;
  const camLng = pov.lng * DEG;
  const sinCam = Math.sin(camLat);
  const cosCam = Math.cos(camLat);
  const horizon = 1 / (1 + altitude);

  const visible: GlobeRegionInView[] = [];

  for (const region of regions) {
    const { sinLat, cosLat, lngRad } = regionTrig(region);
    const centrality =
      sinLat * sinCam + cosLat * cosCam * Math.cos(lngRad - camLng);
    if (centrality <= horizon) continue;
    if (isOnScreen && !isOnScreen(region)) continue;
    visible.push({ region, centrality });
  }

  visible.sort(
    (a, b) =>
      b.centrality - a.centrality ||
      (b.region.projects?.length ?? 0) - (a.region.projects?.length ?? 0),
  );

  return { regions: visible.slice(0, limit), total: visible.length };
}

/**
 * The region closest to a coordinate, within `maxDegrees`, or null.
 *
 * Used to open a deep link on the place it points at. A deep link carries a
 * project's own coordinates, while a region sits at the average of every
 * project in its ~11km cell, so the two never match exactly and an equality
 * check would always miss. The tolerance is wide enough to absorb that offset
 * and narrow enough not to reach into the next town.
 */
export function findNearestRegion(
  regions: GlobeRegion[],
  lat: number,
  lng: number,
  maxDegrees = 0.5,
): GlobeRegion | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const targetLat = lat * DEG;
  const targetLng = lng * DEG;
  const sinTarget = Math.sin(targetLat);
  const cosTarget = Math.cos(targetLat);
  // Compare cosines rather than angles: larger cosine means closer.
  const minCentrality = Math.cos(maxDegrees * DEG);

  let best: GlobeRegion | null = null;
  let bestCentrality = -Infinity;

  for (const region of regions) {
    const { sinLat, cosLat, lngRad } = regionTrig(region);
    const centrality =
      sinLat * sinTarget + cosLat * cosTarget * Math.cos(lngRad - targetLng);
    if (centrality < minCentrality) continue;
    if (centrality > bestCentrality) {
      bestCentrality = centrality;
      best = region;
    }
  }

  return best;
}

/**
 * Point sizing.
 *
 * Two defects in the sizing this replaces, both measured:
 *
 * 1. The old radius law, `clamp(altitude * 0.5, 0.02, 0.2)`, made points
 *    *smallest* at the zoom floor — 0.60px at altitude 0.1 against 1.64px at
 *    0.6 — because the clamp stops tracking altitude below 0.4 while the
 *    perspective divisor keeps shrinking. Points were at their least clickable
 *    exactly when the camera was closest and the user was aiming at them.
 *
 * 2. Height was `projectCount * 0.002` globe radii, uncapped, which at the
 *    zoom floor made the busiest region a 94px spike beside a 0.6px-wide
 *    target. Spikes hid their neighbours, and clicking one selected the region
 *    at its base rather than under the pointer. Points are flat now, and the
 *    project count moves into a tightly capped width instead.
 */

/** Target radius on screen, in canvas pixels, for a point at the camera's
 * centre. Tapered so a wide view keeps the fine, stippled look of thousands of
 * separate places rather than turning dense regions into one blob. */
const BASE_RADIUS_PX = 2.75;
const ZOOM_OUT_TAPER = 0.6;
/** How much a busy place is allowed to outgrow a quiet one. Deliberately
 * small: the whole complaint about the previous attempt was overlap. */
const WEIGHT_SPREAD = 0.4;
/** Project count at which the width bonus is already maxed out. */
const WEIGHT_REFERENCE = 9;

/** Degrees per world unit of arc, matching three-globe's own conversion
 * (`pxPerDeg` at three-globe.mjs:952) on its radius-100 globe. */
const PX_PER_DEG = (2 * Math.PI * 100) / 360;

/**
 * The apparent radius a point should have, in canvas pixels.
 *
 * Grows as the camera comes in — the opposite of the law it replaces — and
 * widens only slightly with the project count.
 */
export function markerApparentPx(
  altitude: number,
  projectCount: number,
): number {
  const alt = Number.isFinite(altitude) ? Math.max(0, altitude) : 0;
  const count = Number.isFinite(projectCount) ? Math.max(projectCount, 0) : 0;
  const weight =
    1 + WEIGHT_SPREAD * Math.min(1, Math.sqrt(count) / WEIGHT_REFERENCE);
  return (BASE_RADIUS_PX / (1 + ZOOM_OUT_TAPER * alt)) * weight;
}

/**
 * Convert a wanted on-screen radius into the degrees `pointRadius` expects.
 *
 * three-globe scales a point to `radius * PX_PER_DEG` world units. What that
 * subtends on screen depends on the *marker's* distance from the camera, not
 * the camera's distance to the globe's center. The camera sits `100 * (1 +
 * altitude)` from the center; a marker on the surface, near the middle of
 * the view, sits `100` units closer along that same ray — its actual depth
 * is `100 * altitude`, not `100 * (1 + altitude)`. Using the center's
 * distance here (a bug fixed 2026-09-14, present since this function was
 * first written) overstated the marker's depth by a factor of
 * `(1 + altitude) / altitude`, which grows without bound as the camera
 * comes in — 11x too large at the zoom floor (altitude 0.1) — and is why
 * every dot rendered far bigger than `markerApparentPx` asked for, no
 * matter how small its constants were tuned; a self-consistency unit test
 * across `pointRadiusDegrees`/its own inverse can't catch this, since both
 * sides shared the same wrong assumption. A perspective camera shows
 * `2 * distance * tan(fov / 2)` world units of height at a given distance;
 * inverting that, at the corrected distance, gives a point whose size on
 * screen is what was asked for, at any zoom. The fov and canvas height are
 * passed in rather than assumed so this stays right on a phone, and if the
 * camera is ever changed.
 */
export function pointRadiusDegrees(
  apparentPx: number,
  altitude: number,
  fovDegrees: number,
  canvasHeightPx: number,
): number {
  if (!(canvasHeightPx > 0) || !(fovDegrees > 0)) return 0;
  const alt = Number.isFinite(altitude) ? Math.max(0, altitude) : 0;
  const distanceToMarker = 100 * Math.max(alt, MIN_ALTITUDE);
  const visibleWorldHeight =
    2 * distanceToMarker * Math.tan((fovDegrees / 2) * DEG);
  return (apparentPx * visibleWorldHeight) / (PX_PER_DEG * canvasHeightPx);
}

/**
 * Screen-space declutter.
 *
 * No amount of shrinking the dot fixes overlap in the densest areas: at the
 * default altitude the median neighbour gap there is ~1px, well under even
 * an invisible dot's minimum useful size. The only way to stop marks
 * overlapping is to draw fewer of them — this is a greedy pick of which
 * regions get a mark at all, not a merge of several regions into one. Every
 * mark that survives is still exactly one region; nothing is aggregated, no
 * count bubble, no cluster level. (Zoom-step clustering with count bubbles
 * was tried and rejected on look/feel — see the project memory. This is a
 * different mechanism: it thins, it does not merge.)
 */

/** An on-screen position, in canvas pixels. */
export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * A brand-new mark needs this much *more* clearance than an already-kept one
 * needs to hold its spot. The gap between the two — 1x to 1.4x spacingPx —
 * is a dead zone: a region drifting slowly across it, as the camera turns,
 * settles into whichever state (drawn or not) it already had rather than
 * flapping every recompute. This never relaxes the floor itself — an
 * incumbent still needs the *full* spacingPx, never less — so every pair of
 * marks this function returns is guaranteed at least spacingPx apart,
 * unconditionally. That guarantee is load-bearing: the caller sizes the dot
 * radius against it (see Globe.svelte's `DOT_SCALE`).
 */
const FRESH_ENTRY_BUFFER = 1.4;

export interface DeclutterOptions {
  /** Minimum on-screen distance any two kept marks are guaranteed to keep
   * from each other — see `FRESH_ENTRY_BUFFER` for why this is a hard floor
   * regardless of hysteresis, not just what a first-time candidate needs. */
  spacingPx: number;
  /** Hard cap on how many marks are kept, applied after spacing so a very
   * dense view degrades to "busiest N regions" rather than an unbounded mesh
   * count. */
  budget: number;
  /** Keys (see `regionKey`) of the regions kept on the previous recompute,
   * for the hysteresis described above. Omit for a first run. */
  previouslyKept?: ReadonlySet<string>;
}

/**
 * Greedily picks which regions get a mark, in priority order, dropping any
 * region that would land within `spacingPx` of a higher-priority mark
 * already picked.
 *
 * Priority is project count, descending, then `regionKey` — deterministic on
 * purpose. It must not depend on anything that changes with camera angle, or
 * which region wins a spacing conflict would flip as the camera moved even
 * when neither region's own rank changed, which reads as random flicker
 * rather than a stable "busiest wins" rule.
 *
 * Uses a spatial hash grid sized to `spacingPx`, so a candidate only has to
 * check the (at most) nine cells that could possibly hold a conflicting
 * point, rather than every mark kept so far. That keeps this O(n) rather
 * than the O(n^2) an all-pairs check would be — the difference between
 * ~5000 and ~25,000,000 distance checks per recompute.
 */
export function declutterRegions(
  regions: GlobeRegion[],
  screenOf: (region: GlobeRegion) => ScreenPoint,
  { spacingPx, budget, previouslyKept }: DeclutterOptions,
): GlobeRegion[] {
  if (!regions.length || budget <= 0 || !(spacingPx > 0)) return [];

  const ranked = [...regions].sort((a, b) => {
    const byCount = (b.projects?.length ?? 0) - (a.projects?.length ?? 0);
    if (byCount !== 0) return byCount;
    const ka = regionKey(a);
    const kb = regionKey(b);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });

  // Cell size equals spacingPx, the largest distance that can ever matter, so
  // any point within range of a candidate is guaranteed to fall in one of its
  // own cell's eight neighbours. The *entry* threshold (spacingPx *
  // FRESH_ENTRY_BUFFER) is only ever used to decide whether a fresh candidate
  // gets blocked — it never widens the cell, since a fresh candidate that
  // clears the floor but not the buffer is still rejected by the ordinary
  // distance check against cells within spacingPx.
  const grid = new Map<string, ScreenPoint[]>();
  const kept: GlobeRegion[] = [];

  for (const region of ranked) {
    if (kept.length >= budget) break;

    const p = screenOf(region);
    const cx = Math.floor(p.x / spacingPx);
    const cy = Math.floor(p.y / spacingPx);
    // The floor (spacingPx) applies unconditionally; an incumbent only ever
    // gets *more* lenient treatment relative to a fresh candidate, never less.
    const threshold = previouslyKept?.has(regionKey(region))
      ? spacingPx
      : spacingPx * FRESH_ENTRY_BUFFER;

    let blocked = false;
    for (let dx = -1; dx <= 1 && !blocked; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = grid.get(`${cx + dx},${cy + dy}`);
        if (!bucket) continue;
        if (bucket.some((q) => Math.hypot(p.x - q.x, p.y - q.y) < threshold)) {
          blocked = true;
          break;
        }
      }
    }
    if (blocked) continue;

    const cellKey = `${cx},${cy}`;
    const bucket = grid.get(cellKey);
    if (bucket) bucket.push(p);
    else grid.set(cellKey, [p]);
    kept.push(region);
  }

  return kept;
}

/**
 * Wraps a screen-projection function with a per-region memo.
 *
 * A declutter recompute needs the same region's projected position twice —
 * once for the on-screen test, once inside `declutterRegions` — and doing
 * that projection twice per region, every ~350ms while the camera moves, is
 * the kind of doubled cost that shows up as stutter on a phone rather than
 * in a unit test. A plain `Map`, not component state: the cache is rebuilt
 * fresh every recompute and never read by anything that renders from it.
 */
export function memoizeScreenOf(
  project: (region: GlobeRegion) => ScreenPoint,
): (region: GlobeRegion) => ScreenPoint {
  const cache = new Map<GlobeRegion, ScreenPoint>();
  return (region) => {
    let p = cache.get(region);
    if (!p) {
      p = project(region);
      cache.set(region, p);
    }
    return p;
  };
}
