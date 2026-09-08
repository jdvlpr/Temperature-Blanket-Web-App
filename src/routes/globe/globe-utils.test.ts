import { describe, expect, it } from 'vitest';
import {
  buildDeepLink,
  buildGlobeLinkFromLocationsMeta,
  findNearestRegion,
  getRegionLabel,
  hasLabels,
  parseDeepLink,
  regionKey,
  regionsInView,
  searchRegions,
  type GlobeRegion,
} from './globe-utils';

const region = (
  projects: { id: number; title: string; label?: string }[],
  lat = 0,
  lng = 0,
): GlobeRegion => ({ lat, lng, projects });

describe('getRegionLabel', () => {
  it('returns null when no project carries a label', () => {
    // The shape served by caches written before the plugin change.
    expect(getRegionLabel(region([{ id: 1, title: 'A' }]))).toBeNull();
  });

  it('picks the most common label in the region', () => {
    const r = region([
      { id: 1, title: 'A', label: 'Brooklyn' },
      { id: 2, title: 'B', label: 'New York' },
      { id: 3, title: 'C', label: 'New York' },
    ]);
    expect(getRegionLabel(r)).toBe('New York');
  });

  it('breaks ties toward the first occurrence, so results are stable', () => {
    const r = region([
      { id: 1, title: 'A', label: 'Brooklyn' },
      { id: 2, title: 'B', label: 'New York' },
    ]);
    expect(getRegionLabel(r)).toBe('Brooklyn');
  });

  it('ignores blank labels', () => {
    const r = region([
      { id: 1, title: 'A', label: '   ' },
      { id: 2, title: 'B', label: 'Oslo' },
    ]);
    expect(getRegionLabel(r)).toBe('Oslo');
  });
});

describe('hasLabels', () => {
  it('is false for a payload with no labels at all', () => {
    expect(hasLabels([region([{ id: 1, title: 'A' }])])).toBe(false);
  });

  it('is true as soon as one project has a label', () => {
    expect(
      hasLabels([
        region([{ id: 1, title: 'A' }]),
        region([{ id: 2, title: 'B', label: 'Oslo' }]),
      ]),
    ).toBe(true);
  });
});

describe('searchRegions', () => {
  const regions = [
    region([{ id: 1, title: 'Blue winter', label: 'Oslo, Norway' }], 60, 10),
    region([{ id: 2, title: 'Oslo memories', label: 'Bergen, Norway' }], 60, 5),
    region([{ id: 3, title: 'Sunset', label: 'Osaka, Japan' }], 34, 135),
  ];

  it('returns nothing for an empty query', () => {
    expect(searchRegions(regions, '   ')).toEqual([]);
  });

  it('ranks a label prefix match above a title-only match', () => {
    const results = searchRegions(regions, 'oslo');
    expect(results[0].primary).toBe('Oslo, Norway');
    // The Bergen region matches only via its project title, so it ranks lower.
    expect(results.map((r) => r.primary)).toContain('Bergen, Norway');
  });

  it('matches project titles as well as labels', () => {
    expect(searchRegions(regions, 'sunset')[0].primary).toBe('Osaka, Japan');
  });

  it('is case-insensitive', () => {
    expect(searchRegions(regions, 'OSAKA')).toHaveLength(1);
  });

  it('respects the limit', () => {
    expect(searchRegions(regions, 'norway', 1)).toHaveLength(1);
  });
});

describe('parseDeepLink', () => {
  const parse = (q: string) => parseDeepLink(new URLSearchParams(q));

  it('returns null when coordinates are absent', () => {
    expect(parse('')).toBeNull();
    expect(parse('z=1')).toBeNull();
    expect(parse('lat=10')).toBeNull();
  });

  it('parses valid coordinates and defaults the altitude', () => {
    expect(parse('lat=59.9&lng=10.7')).toEqual({
      lat: 59.9,
      lng: 10.7,
      altitude: 0.6,
    });
  });

  it('rejects non-numeric and out-of-range values rather than passing NaN to the camera', () => {
    expect(parse('lat=abc&lng=10')).toBeNull();
    expect(parse('lat=91&lng=10')).toBeNull();
    expect(parse('lat=10&lng=181')).toBeNull();
  });

  it('clamps the altitude into the range the zoom buttons allow', () => {
    expect(parse('lat=0&lng=0&z=99')?.altitude).toBe(5);
    expect(parse('lat=0&lng=0&z=0.0001')?.altitude).toBe(0.1);
  });

  it('round-trips through buildDeepLink', () => {
    const pov = { lat: 59.913, lng: 10.739, altitude: 0.6 };
    const url = buildDeepLink(pov);
    expect(parseDeepLink(new URLSearchParams(url.split('?')[1]))).toEqual(pov);
  });
});

describe('buildGlobeLinkFromLocationsMeta', () => {
  it('returns null for missing, empty or malformed meta', () => {
    expect(buildGlobeLinkFromLocationsMeta(null)).toBeNull();
    expect(buildGlobeLinkFromLocationsMeta('')).toBeNull();
    expect(buildGlobeLinkFromLocationsMeta('not json')).toBeNull();
    expect(buildGlobeLinkFromLocationsMeta('[]')).toBeNull();
  });

  it('reads a "lat,lng" latlong string', () => {
    const meta = JSON.stringify([{ label: 'Oslo', latlong: '59.913,10.739' }]);
    expect(buildGlobeLinkFromLocationsMeta(meta)).toBe(
      '/globe?lat=59.913&lng=10.739&z=0.6',
    );
  });

  it('falls back to separate lat/lng fields', () => {
    const meta = JSON.stringify([{ label: 'Oslo', lat: 59.913, lng: 10.739 }]);
    expect(buildGlobeLinkFromLocationsMeta(meta)).toBe(
      '/globe?lat=59.913&lng=10.739&z=0.6',
    );
  });

  it('treats exact 0,0 as missing, matching the plugin', () => {
    const meta = JSON.stringify([{ label: 'Nowhere', latlong: '0,0' }]);
    expect(buildGlobeLinkFromLocationsMeta(meta)).toBeNull();
  });

  it('rejects out-of-range coordinates', () => {
    const meta = JSON.stringify([{ label: 'Bad', latlong: '999,10' }]);
    expect(buildGlobeLinkFromLocationsMeta(meta)).toBeNull();
  });
});

describe('regionKey', () => {
  it('is stable and distinguishes coordinates', () => {
    expect(regionKey(region([], 1.5, -2.25))).toBe('1.5,-2.25');
    expect(regionKey(region([], 1.5, -2.25))).not.toBe(
      regionKey(region([], 1.5, 2.25)),
    );
  });
});

describe('regionsInView', () => {
  const p = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ id: i, title: `P${i}` }));

  // Default camera position used by handleReset.
  const wide = { lat: 0, lng: 0, altitude: 2.5 };

  it('includes a region at the camera center', () => {
    const center = region(p(1), 0, 0);
    expect(regionsInView([center], wide).regions).toHaveLength(1);
  });

  it('excludes the antipode, which is on the far side of the sphere', () => {
    const antipode = region(p(1), 0, 180);
    expect(regionsInView([antipode], wide).regions).toEqual([]);
  });

  it('widens the visible cap as the camera pulls back', () => {
    // 60 degrees away: outside the horizon up close, inside it from far off.
    const far = [region(p(1), 0, 60)];
    expect(
      regionsInView(far, { lat: 0, lng: 0, altitude: 0.1 }).regions,
    ).toEqual([]);
    expect(regionsInView(far, wide).regions).toHaveLength(1);
  });

  it('ranks by closeness to the center of view, not by project count', () => {
    // The panel answers "what am I looking at", so a small place under the
    // crosshair outranks a bigger one out near the horizon.
    const middle = region(p(1), 0, 0);
    const busyEdge = region(p(3), 0, 60);
    const { regions } = regionsInView([middle, busyEdge], wide);
    expect(regions.map((r) => r.region)).toEqual([middle, busyEdge]);
  });

  it('breaks ties toward the region with more projects', () => {
    const quiet = region(p(1), 0, 10);
    const busy = region(p(5), 0, -10);
    const { regions } = regionsInView([quiet, busy], wide);
    // Equally far from center, so the project count decides.
    expect(regions.map((r) => r.region)).toEqual([busy, quiet]);
  });

  it('drops regions the caller reports as off-screen', () => {
    // The horizon cone is wider than the viewport once zoomed in, so a region
    // can be front-facing and still not be on the canvas.
    const onCanvas = region(p(1), 0, 0);
    const offCanvas = region(p(9), 0, 40);
    const { regions, total } = regionsInView(
      [onCanvas, offCanvas],
      wide,
      30,
      (r) => r === onCanvas,
    );
    expect(regions.map((r) => r.region)).toEqual([onCanvas]);
    expect(total).toBe(1);
  });

  it('caps the list but reports the true visible total', () => {
    const many = [region(p(1), 0, 0), region(p(1), 5, 5), region(p(1), 10, 10)];
    const { regions, total } = regionsInView(many, wide, 2);
    expect(regions).toHaveLength(2);
    // The footer needs the uncapped count to say what it is leaving out.
    expect(total).toBe(3);
  });

  it('returns nothing rather than NaN for an unusable camera position', () => {
    const r = [region(p(1), 0, 0)];
    expect(
      regionsInView(r, { lat: NaN, lng: 0, altitude: 2.5 }).regions,
    ).toEqual([]);
  });
});

describe('findNearestRegion', () => {
  const oslo = region([{ id: 1, title: 'A' }], 59.913, 10.739);
  const bergen = region([{ id: 2, title: 'B' }], 60.39, 5.32);
  const regions = [oslo, bergen];

  it('finds the region a deep link points at despite the averaging offset', () => {
    // A deep link carries a project's own coordinates; the region sits at the
    // average of its cell, so the two are near but never equal.
    expect(findNearestRegion(regions, 59.92, 10.75)).toBe(oslo);
  });

  it('picks the closer of two candidates', () => {
    expect(findNearestRegion(regions, 60.3, 5.4)).toBe(bergen);
  });

  it('returns null when nothing is within tolerance', () => {
    expect(findNearestRegion(regions, 0, 0)).toBeNull();
  });

  it('does not reach into the next town', () => {
    // ~2 degrees away is well outside the default 0.5 degree tolerance.
    expect(findNearestRegion(regions, 62, 10.739)).toBeNull();
  });

  it('returns null for unusable coordinates', () => {
    expect(findNearestRegion(regions, NaN, 10)).toBeNull();
  });
});
