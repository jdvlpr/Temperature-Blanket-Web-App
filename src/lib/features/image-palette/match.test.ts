import chroma from 'chroma-js';
import { describe, expect, it } from 'vitest';
import type { Color } from '$lib/types/yarn-types';
import {
  deltaE2000,
  findClosestColorway,
  indexColorways,
  closestColorways,
  colorwayOklabs,
  type Lab,
} from './match';
import { hexToOklab } from './color-space';

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

describe('closestColorways', () => {
  it('lists the closest colorways first, without repeats', () => {
    const matches = closestColorways({ hex: '#ff0000', index, count: 3 });
    expect(matches.map((n) => n.name)).toEqual(['Red', 'Brick', 'White']);
  });

  it('skips colorways with the same hex as one already listed', () => {
    const withDuplicate = indexColorways([
      colorway('#ff0000', 'Red'),
      { ...colorway('#ff0000', 'Red Too'), brandId: 'other' },
      colorway('#0000ff', 'Blue'),
    ]);
    expect(
      closestColorways({ hex: '#ff0000', index: withDuplicate, count: 2 }).map(
        (n) => n.name,
      ),
    ).toEqual(['Red', 'Blue']);
  });
});

describe('colorwayOklabs', () => {
  it('lists OKLab triples in index order', () => {
    const labs = colorwayOklabs(index);
    expect(labs).toHaveLength(index.length * 3);
    const blue = hexToOklab('#0000ff');
    expect(labs[6]).toBeCloseTo(blue[0], 5);
    expect(labs[7]).toBeCloseTo(blue[1], 5);
    expect(labs[8]).toBeCloseTo(blue[2], 5);
  });
});
