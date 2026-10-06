import { describe, expect, it } from 'vitest';
import type { Color } from '$lib/types/yarn-types';
import {
  closeMatches,
  colorwaySortOptions,
  iconColorOn,
  linkSite,
  MIN_CLOSE_MATCHES,
  sortColorways,
  withDeltas,
} from './colorway-utils';

describe('iconColorOn', () => {
  it('picks black on mid-tone pinks, where white falls under 3:1', () => {
    expect(iconColorOn('#ea7196')).toBe('black');
    expect(iconColorOn('#c88990')).toBe('black');
  });

  it('picks white on dark colors and black on light ones', () => {
    expect(iconColorOn('#1c3c29')).toBe('white');
    expect(iconColorOn('#e9e0cd')).toBe('black');
  });

  it('falls back to black without a valid color', () => {
    expect(iconColorOn(undefined)).toBe('black');
    expect(iconColorOn('not a color')).toBe('black');
  });
});

describe('linkSite', () => {
  it("names a link's site without www", () => {
    expect(linkSite('https://www.garnstudio.com/yarn.php?id=1')).toBe(
      'garnstudio.com',
    );
    expect(linkSite('https://hobbii.com/some-yarn')).toBe('hobbii.com');
  });

  it("is undefined for something that isn't a web address", () => {
    expect(linkSite('not a link')).toBeUndefined();
  });
});

const swatch = (hex: string, name = hex): Color => ({ hex, name });

describe('closeMatches', () => {
  // 40 colors stepping away from white: the first few are close matches
  const grays = Array.from({ length: 40 }, (_, i) =>
    swatch(`#${(255 - i * 6).toString(16).padStart(2, '0').repeat(3)}`),
  );

  it('keeps every close match, closest first, with its delta', () => {
    const near = Array.from({ length: 30 }, () => swatch('#fefefe'));
    const matches = closeMatches([swatch('#000000'), ...near], '#ffffff');
    expect(matches).toHaveLength(30);
    expect(matches.every((m) => m.delta < 15)).toBe(true);
  });

  it('gives a rare color at least its nearest few', () => {
    const matches = closeMatches(grays, '#ff0000');
    expect(matches).toHaveLength(MIN_CLOSE_MATCHES);
    const deltas = matches.map((m) => m.delta);
    expect(deltas).toEqual([...deltas].sort((a, b) => a - b));
  });

  it('returns nothing for an invalid color', () => {
    expect(closeMatches(grays, 'not a color')).toEqual([]);
  });
});

describe('withDeltas', () => {
  it('keeps every colorway, in order, each with its delta', () => {
    const colorways = [swatch('#000000'), swatch('#ffffff'), swatch('#fefefe')];
    const ranked = withDeltas(colorways, '#ffffff');
    expect(ranked.map((c) => c.hex)).toEqual(['#000000', '#ffffff', '#fefefe']);
    expect(ranked[1].delta).toBe(0);
    expect(ranked[0].delta).toBeGreaterThan(ranked[2].delta);
  });

  it('returns nothing for an invalid color', () => {
    expect(withDeltas([swatch('#000000')], 'not a color')).toEqual([]);
  });
});

describe('colorwaySortOptions', () => {
  it('offers Best match only with a color', () => {
    const values = (hasColor: boolean) =>
      colorwaySortOptions(hasColor).map((sort) => sort.value);
    expect(values(true)).toContain('best-match');
    expect(values(false)).not.toContain('best-match');
  });
});

describe('sortColorways', () => {
  const colors = [
    { ...swatch('#888888', 'Gray'), delta: 5 },
    { ...swatch('#ffffff', 'White'), delta: 1 },
    { ...swatch('#000000', 'Black'), delta: 9 },
  ];
  const names = (list: Color[]) => list.map((c) => c.name);

  it('keeps the catalog order by yarn, without changing the list', () => {
    const sorted = sortColorways(colors, 'by-yarn');
    expect(names(sorted)).toEqual(['Gray', 'White', 'Black']);
    expect(sorted).not.toBe(colors);
  });

  it('orders by best match, light to dark, and name', () => {
    expect(names(sortColorways(colors, 'best-match'))).toEqual([
      'White',
      'Gray',
      'Black',
    ]);
    expect(names(sortColorways(colors, 'light-to-dark'))).toEqual([
      'White',
      'Gray',
      'Black',
    ]);
    expect(names(sortColorways(colors, 'name'))).toEqual([
      'Black',
      'Gray',
      'White',
    ]);
  });

  it('reverses any sort but best match', () => {
    expect(names(sortColorways(colors, 'light-to-dark', true))).toEqual([
      'Black',
      'Gray',
      'White',
    ]);
    expect(names(sortColorways(colors, 'by-yarn', true))).toEqual([
      'Black',
      'White',
      'Gray',
    ]);
    expect(names(sortColorways(colors, 'best-match', true))).toEqual([
      'White',
      'Gray',
      'Black',
    ]);
  });

  it('keeps match deltas through the color sorts', () => {
    const sorted = sortColorways(colors, 'rainbow');
    expect(sorted.map((c) => c.delta).sort()).toEqual([1, 5, 9]);
  });
});
