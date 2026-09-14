import { describe, expect, it } from 'vitest';
import {
  buildDeepLink,
  declutterRegions,
  markerApparentPx,
  memoizeScreenOf,
  pointRadiusDegrees,
  buildGlobeLinkFromLocationsMeta,
  findNearestRegion,
  getRegionLabel,
  hasLabels,
  parseDeepLink,
  regionKey,
  regionsInView,
  searchRegions,
  type GlobeRegion,
  type ScreenPoint,
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
      '/globe?lat=59.913&lng=10.739&z=0.2',
    );
  });

  it('falls back to separate lat/lng fields', () => {
    const meta = JSON.stringify([{ label: 'Oslo', lat: 59.913, lng: 10.739 }]);
    expect(buildGlobeLinkFromLocationsMeta(meta)).toBe(
      '/globe?lat=59.913&lng=10.739&z=0.2',
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

describe('point sizing', () => {
  // The canvas the numbers below assume; the helpers take it as an argument so
  // a phone gets the same apparent size from a different number of degrees.
  const H = 700;
  const FOV = 50;
  // Mirrors pointRadiusDegrees' own distance-to-marker math (100 * altitude,
  // not 100 * (1 + altitude) — see that function's doc comment for why).
  // Deliberately independent of the implementation's internal variable
  // names, but it does still share the same *formula*, which is why the
  // anchored test below exists: a self-inverting round-trip can't catch both
  // sides drifting together back onto the old, wrong distance.
  const apparentAt = (altitude: number, count = 1) =>
    (pointRadiusDegrees(markerApparentPx(altitude, count), altitude, FOV, H) *
      ((2 * Math.PI * 100) / 360) *
      H) /
    (2 * 100 * Math.max(altitude, 0.1) * Math.tan((FOV / 2) * (Math.PI / 180)));

  it('round-trips: the degrees it returns render at the pixels it was asked for', () => {
    for (const altitude of [5, 2.5, 0.6, 0.1]) {
      expect(apparentAt(altitude)).toBeCloseTo(
        markerApparentPx(altitude, 1),
        6,
      );
    }
  });

  it('sizes a point by its distance to the marker, not to the globe center', () => {
    // Anchored to independently hand-computed values, not to the function's
    // own inverse — a round-trip test can't catch a bug where both sides
    // share the same wrong assumption (which is exactly how this shipped
    // undetected: the distance to the globe's center, 100 * (1 + altitude),
    // was used where the distance to the marker itself, 100 * altitude,
    // was needed). Regression coverage for the 2026-09-14 fix: reverting to
    // the center distance makes every dot render 5x (at altitude 0.25) to
    // 11x (at the zoom floor, 0.1) too big — exactly the ratio asserted
    // below — which is what made dots overlap however small
    // markerApparentPx's own constants were tuned.
    expect(pointRadiusDegrees(10, 0.25, 50, 642)).toBeCloseTo(0.2080799, 6);
    expect(pointRadiusDegrees(3, 0.1, 50, 642)).toBeCloseTo(0.0249696, 6);
  });

  it('grows as the camera comes in, which the old law got backwards', () => {
    // The law this replaces produced 0.75px at altitude 2.5 but only 0.60px at
    // the zoom floor, so points shrank exactly where they were being aimed at.
    expect(markerApparentPx(0.1, 1)).toBeGreaterThan(markerApparentPx(0.6, 1));
    expect(markerApparentPx(0.6, 1)).toBeGreaterThan(markerApparentPx(2.5, 1));
  });

  it('is comfortably bigger than the old law at the zoom floor', () => {
    // Old: 0.60px radius at altitude 0.1. Anything near that is unclickable.
    expect(markerApparentPx(0.1, 1)).toBeGreaterThan(2);
  });

  it('stays narrow enough not to overlap at the zoom floor', () => {
    // Neighbouring regions sit ~16px apart in the densest areas at altitude
    // 0.1, so even the busiest point has to stay well inside that.
    expect(markerApparentPx(0.1, 1000)).toBeLessThan(4);
  });

  it('keeps the wide view close to how it looked before', () => {
    // Old law gave 0.75px at altitude 2.5. Much fatter would turn dense
    // regions into one blob, which is the look that was rejected.
    expect(markerApparentPx(2.5, 1)).toBeLessThan(1.6);
  });

  it('widens with project count, but only slightly and with a hard cap', () => {
    const quiet = markerApparentPx(0.1, 1);
    const busy = markerApparentPx(0.1, 69);
    expect(busy).toBeGreaterThan(quiet);
    // The cap is what stops a busy place swallowing its neighbours.
    expect(busy / quiet).toBeLessThan(1.45);
    expect(markerApparentPx(0.1, 100000)).toBe(markerApparentPx(0.1, 81));
  });

  it('survives unusable inputs rather than sizing a point to NaN', () => {
    expect(Number.isFinite(markerApparentPx(NaN, NaN))).toBe(true);
    expect(pointRadiusDegrees(3, 0.5, FOV, 0)).toBe(0);
    expect(pointRadiusDegrees(3, NaN, FOV, H)).toBeGreaterThan(0);
  });
});

describe('memoizeScreenOf', () => {
  it('projects a given region only once, however many times it is asked', () => {
    let calls = 0;
    const a = region([{ id: 1, title: 'A' }], 1, 2);
    const b = region([{ id: 2, title: 'B' }], 3, 4);
    const screenOf = memoizeScreenOf((r) => {
      calls++;
      return { x: r.lat, y: r.lng };
    });

    expect(screenOf(a)).toEqual({ x: 1, y: 2 });
    expect(screenOf(b)).toEqual({ x: 3, y: 4 });
    expect(screenOf(a)).toEqual({ x: 1, y: 2 });
    expect(calls).toBe(2);
  });
});

describe('declutterRegions', () => {
  // The function under test only ever looks at whatever screenOf returns, so
  // tests reuse a region's (lat, lng) directly as its (x, y) — there is no
  // real projection to fake.
  const screenOf = (r: GlobeRegion): ScreenPoint => ({ x: r.lat, y: r.lng });

  it('keeps every region when they are all far apart', () => {
    const regions = [
      region([{ id: 1, title: 'A' }], 0, 0),
      region([{ id: 2, title: 'B' }], 100, 0),
      region([{ id: 3, title: 'C' }], 0, 100),
    ];
    expect(
      declutterRegions(regions, screenOf, { spacingPx: 10, budget: 10 }),
    ).toHaveLength(3);
  });

  it('drops the lower-priority region when two are too close', () => {
    const busy = region(
      [
        { id: 1, title: 'A' },
        { id: 2, title: 'A2' },
      ],
      0,
      0,
    );
    const quiet = region([{ id: 3, title: 'B' }], 3, 0);
    // Passed in the opposite of priority order, to prove the result reflects
    // project count and not array order.
    expect(
      declutterRegions([quiet, busy], screenOf, { spacingPx: 10, budget: 10 }),
    ).toEqual([busy]);
  });

  it('keeps both once they clear the spacing', () => {
    const a = region([{ id: 1, title: 'A' }], 0, 0);
    const b = region([{ id: 2, title: 'B' }], 20, 0);
    expect(
      declutterRegions([a, b], screenOf, { spacingPx: 10, budget: 10 }),
    ).toHaveLength(2);
  });

  it('enforces the budget after spacing, favouring the busiest regions', () => {
    const quiet = region([{ id: 1, title: 'A' }], 0, 0);
    const medium = region(
      [
        { id: 2, title: 'B' },
        { id: 3, title: 'B2' },
      ],
      100,
      0,
    );
    const busiest = region(
      [
        { id: 4, title: 'C' },
        { id: 5, title: 'C2' },
        { id: 6, title: 'C3' },
      ],
      200,
      0,
    );
    const kept = declutterRegions([quiet, medium, busiest], screenOf, {
      spacingPx: 10,
      budget: 2,
    });
    expect(kept).toEqual([busiest, medium]);
  });

  it('breaks equal-count ties by regionKey, regardless of input order', () => {
    const a = region([{ id: 1, title: 'A' }], 0, 0); // regionKey "0,0"
    const b = region([{ id: 2, title: 'B' }], 0, 1); // regionKey "0,1"
    const opts = { spacingPx: 10, budget: 10 };
    expect(declutterRegions([a, b], screenOf, opts)).toEqual([a]);
    expect(declutterRegions([b, a], screenOf, opts)).toEqual([a]);
  });

  it('lets a previously-kept region survive on less clearance than a fresh candidate needs', () => {
    const winner = region(
      Array.from({ length: 5 }, (_, i) => ({ id: i, title: `W${i}` })),
      0,
      0,
    );
    // Distance 12 from the winner: inside the fresh-entry buffer (10 * 1.4 =
    // 14, so a first-time candidate is blocked) but outside the bare floor
    // (10, so an incumbent is not).
    const contender = region([{ id: 99, title: 'Q' }], 12, 0);
    const opts = { spacingPx: 10, budget: 10 };

    expect(declutterRegions([contender, winner], screenOf, opts)).toEqual([
      winner,
    ]);

    expect(
      declutterRegions([contender, winner], screenOf, {
        ...opts,
        previouslyKept: new Set([regionKey(contender)]),
      }),
    ).toEqual([winner, contender]);
  });

  it('never draws two marks closer than spacingPx, even for two incumbents', () => {
    // Every other tuning decision (dot radius, DOM tap-target size) assumes
    // this floor is unconditional — hysteresis is only allowed to make a
    // fresh candidate's bar *higher*, never let an incumbent's bar drop
    // below the floor everyone else relies on.
    const a = region([{ id: 1, title: 'A' }], 0, 0);
    const b = region([{ id: 2, title: 'B' }], 6, 0); // 6px apart, under the floor
    const kept = declutterRegions([a, b], screenOf, {
      spacingPx: 10,
      budget: 10,
      previouslyKept: new Set([regionKey(a), regionKey(b)]),
    });
    expect(kept.length).toBeLessThanOrEqual(1);
  });

  it('survives unusable options rather than throwing', () => {
    const regions = [region([{ id: 1, title: 'A' }], 0, 0)];
    expect(
      declutterRegions(regions, screenOf, { spacingPx: 10, budget: 0 }),
    ).toEqual([]);
    expect(
      declutterRegions(regions, screenOf, { spacingPx: 0, budget: 10 }),
    ).toEqual([]);
    expect(
      declutterRegions([], screenOf, { spacingPx: 10, budget: 10 }),
    ).toEqual([]);
  });
});
