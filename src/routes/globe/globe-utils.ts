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
