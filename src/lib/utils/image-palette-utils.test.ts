import chroma from 'chroma-js';
import { describe, expect, it } from 'vitest';
import type { Color } from '$lib/types/yarn-types';
import {
  deltaE2000,
  findClosestColorway,
  indexColorways,
  matchUniqueColorways,
  sampleAverageHex,
  type Lab,
} from './image-palette-utils';

const colorway = (hex: string, name: string): Color =>
  ({ hex, name, brandId: 'b', yarnId: 'y' }) as Color;

const index = indexColorways([
  colorway('#ff0000', 'Red'),
  colorway('#ee1111', 'Brick'),
  colorway('#0000ff', 'Blue'),
  colorway('#ffffff', 'White'),
]);

describe('deltaE2000', () => {
  it('matches chroma.deltaE', () => {
    const hexes = [
      '#000000',
      '#ffffff',
      '#ff0000',
      '#00ff00',
      '#0000ff',
      '#808080',
      '#c0ffee',
      '#123456',
      '#fedcba',
      '#7f3fbf',
    ];
    for (const a of hexes) {
      for (const b of hexes) {
        expect(
          deltaE2000(chroma(a).lab() as Lab, chroma(b).lab() as Lab),
        ).toBeCloseTo(chroma.deltaE(a, b), 10);
      }
    }
  });
});

describe('findClosestColorway', () => {
  it('returns the closest colorway with its delta and source hex', () => {
    const match = findClosestColorway({ hex: '#fe0101', index });
    expect(match?.name).toBe('Red');
    expect(match?.sourceHex).toBe('#fe0101');
    expect(match?.delta).toBeGreaterThanOrEqual(0);
  });

  it('skips excluded colorways', () => {
    const exclude = new Set([index[0].key]);
    expect(findClosestColorway({ hex: '#ff0000', index, exclude })?.name).toBe(
      'Brick',
    );
  });

  it('falls back to the closest overall when everything is excluded', () => {
    const exclude = new Set(index.map((n) => n.key));
    expect(findClosestColorway({ hex: '#ff0000', index, exclude })?.name).toBe(
      'Red',
    );
  });

  it('returns null for an empty index', () => {
    expect(findClosestColorway({ hex: '#ff0000', index: [] })).toBeNull();
  });
});

describe('matchUniqueColorways', () => {
  it('never repeats a colorway', () => {
    const matches = matchUniqueColorways({
      hexes: ['#ff0000', '#fe0000', '#0000ff'],
      count: 3,
      index,
    });
    expect(matches.map((n) => n.name)).toEqual(['Red', 'Blue', 'Brick']);
  });

  it('returns fewer matches when given fewer image colors', () => {
    expect(
      matchUniqueColorways({ hexes: ['#ff0000'], count: 5, index }),
    ).toHaveLength(1);
  });

  it('avoids excluded colorways', () => {
    const matches = matchUniqueColorways({
      hexes: ['#ff0000'],
      count: 1,
      index,
      exclude: new Set([index[0].key]),
    });
    expect(matches[0].name).toBe('Brick');
  });
});

describe('sampleAverageHex', () => {
  // 2x1 image: a black pixel and a white pixel
  const data = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]);

  it('averages the surrounding pixels', () => {
    expect(
      sampleAverageHex({ data, width: 2, height: 1, x: 0, y: 0, radius: 1 }),
    ).toBe(chroma(127.5, 127.5, 127.5).hex());
  });

  it('samples a single pixel with radius 0', () => {
    expect(
      sampleAverageHex({ data, width: 2, height: 1, x: 1.7, y: 0, radius: 0 }),
    ).toBe('#ffffff');
  });

  it('returns null outside the image', () => {
    expect(
      sampleAverageHex({ data, width: 2, height: 1, x: 2, y: 0 }),
    ).toBeNull();
  });
});
