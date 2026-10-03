import { describe, expect, it } from 'vitest';
import type { Brand } from '$lib/types/yarn-types';
import {
  buildYarnOptions,
  filterYarnOptions,
  highlightParts,
  optionLabel,
  searchTerms,
} from './yarn-search';

const colorway = (count: number, unavailable = false) => ({
  colors: Array.from({ length: count }, () => ({ hex: '#000' })),
  source: { name: 'shop', unavailable },
});

const brands = [
  {
    id: 'bernat',
    name: 'Bernat',
    yarns: [
      {
        id: 'blanket',
        name: 'Blanket',
        weightId: 'sb',
        colorways: [colorway(3)],
      },
      {
        id: 'super_value',
        name: 'Super Value',
        weightId: 'w',
        colorways: [colorway(2, true)],
      },
    ],
  },
  {
    id: 'lion',
    name: 'Lion Brand',
    yarns: [
      {
        id: 'basic',
        name: 'Basic Stitch',
        weightId: 'w',
        colorways: [colorway(4)],
      },
    ],
  },
] as unknown as Brand[];

const values = (options: { value: string }[]) => options.map((o) => o.value);

describe('buildYarnOptions', () => {
  it('lists each brand, then its yarns, with counts', () => {
    const options = buildYarnOptions(brands);
    expect(values(options)).toEqual([
      'brand:bernat',
      'yarn:bernat-blanket',
      'yarn:bernat-super_value',
      'brand:lion',
      'yarn:lion-basic',
    ]);
    expect(options[0]).toMatchObject({ brandYarns: 2, brandColorways: 5 });
    expect(options[1]).toMatchObject({
      weightName: 'Super Bulky',
      colorways: 3,
    });
    expect(options[2].unavailable).toBe(true);
  });

  it('keeps to a yarn weight, counting within it', () => {
    const options = buildYarnOptions(brands, 'w');
    expect(values(options)).toEqual([
      'brand:bernat',
      'yarn:bernat-super_value',
      'brand:lion',
      'yarn:lion-basic',
    ]);
    expect(options[0]).toMatchObject({ brandYarns: 1, brandColorways: 2 });
  });

  it('leaves out brands with no yarns of the weight', () => {
    expect(values(buildYarnOptions(brands, 'sb'))).toEqual([
      'brand:bernat',
      'yarn:bernat-blanket',
    ]);
  });
});

describe('optionLabel', () => {
  it('reads as in the field', () => {
    const [bernat, blanket] = buildYarnOptions(brands);
    expect(optionLabel(bernat)).toBe('Bernat (2 yarns)');
    expect(optionLabel(blanket)).toBe('Bernat - Blanket (Super Bulky)');
  });
});

describe('searchTerms', () => {
  it('leaves out parentheses and splits a picked label', () => {
    expect(searchTerms('Bernat - Blanket (Super Bulky)')).toEqual([
      'bernat',
      'blanket',
    ]);
    expect(searchTerms('Lion, Basic')).toEqual(['lion', 'basic']);
    expect(searchTerms('  ')).toEqual([]);
  });
});

describe('filterYarnOptions', () => {
  const options = buildYarnOptions(brands);

  it('shows everything with nothing typed', () => {
    expect(filterYarnOptions(options, '')).toEqual(options);
  });

  it('finds yarns by name, under their brand', () => {
    expect(values(filterYarnOptions(options, 'basic'))).toEqual([
      'brand:lion',
      'yarn:lion-basic',
    ]);
  });

  it('finds all of a brand’s yarns by its name', () => {
    expect(values(filterYarnOptions(options, 'bern'))).toEqual([
      'brand:bernat',
      'yarn:bernat-blanket',
      'yarn:bernat-super_value',
    ]);
  });

  it('finds either part of a picked label', () => {
    expect(values(filterYarnOptions(options, 'Lion Brand - Blanket'))).toEqual([
      'brand:bernat',
      'yarn:bernat-blanket',
      'brand:lion',
      'yarn:lion-basic',
    ]);
  });

  it('finds nothing for no match', () => {
    expect(filterYarnOptions(options, 'zzz')).toEqual([]);
  });
});

describe('highlightParts', () => {
  it('marks the matching parts, ignoring case', () => {
    expect(highlightParts('Basic Stitch', ['st'])).toEqual([
      { text: 'Basic ', match: false },
      { text: 'St', match: true },
      { text: 'itch', match: false },
    ]);
  });

  it('copes with characters that mean something in a pattern', () => {
    expect(highlightParts('a+b', ['+'])).toEqual([
      { text: 'a', match: false },
      { text: '+', match: true },
      { text: 'b', match: false },
    ]);
  });
});
