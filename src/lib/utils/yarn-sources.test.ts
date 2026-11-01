import { describe, expect, it } from 'vitest';
import type { Brand, Yarn } from '#lib/types/yarn-types.js';
import {
  isYarnUnavailable,
  yarnSourceGroups,
  yarnSourcesSearch,
} from './yarn-sources.js';

const yarn = (
  id: string,
  name: string,
  sources: { name: string; unavailable?: string }[],
): Yarn =>
  ({
    id,
    name,
    weightId: 'a',
    colorways: sources.map((source) => ({
      source: {
        name: source.name,
        href: `https://${source.name}`,
        accessed: '2025-01-01',
        unavailable: source.unavailable,
      },
      colors: [],
    })),
  }) as unknown as Yarn;

const brands: Brand[] = [
  {
    id: 'drops',
    name: 'Drops',
    yarns: [
      yarn('paris', 'Paris', [{ name: 'garnstudio.com' }]),
      yarn('nepal', 'Nepal', [{ name: 'garnstudio.com' }]),
    ],
  },
  {
    id: 'lion_brand',
    name: 'Lion Brand',
    yarns: [
      yarn('pound_of_love', 'Pound of Love', [{ name: 'lionbrand.com' }]),
    ],
  },
];

describe('yarnSourceGroups', () => {
  it('keeps every brand and yarn with no search', () => {
    expect(yarnSourceGroups(brands, '')).toEqual(brands);
  });

  it('keeps a whole brand when its name is searched for', () => {
    const groups = yarnSourceGroups(brands, 'drops');
    expect(groups.map((b) => b.id)).toEqual(['drops']);
    expect(groups[0].yarns.map((y) => y.id)).toEqual(['paris', 'nepal']);
  });

  it('narrows to one yarn by brand and yarn name, dropping empty brands', () => {
    const groups = yarnSourceGroups(
      brands,
      yarnSourcesSearch('Drops', 'Paris'),
    );
    expect(groups.map((b) => b.id)).toEqual(['drops']);
    expect(groups[0].yarns.map((y) => y.id)).toEqual(['paris']);
  });

  it('matches the site the colors came from', () => {
    const groups = yarnSourceGroups(brands, 'lionbrand');
    expect(groups.map((b) => b.id)).toEqual(['lion_brand']);
  });

  it('matches nothing for words no yarn has', () => {
    expect(yarnSourceGroups(brands, 'drops love')).toEqual([]);
  });
});

describe('yarnSourcesSearch', () => {
  it('joins the brand and yarn names, leaving out what is missing', () => {
    expect(yarnSourcesSearch('Drops', 'Paris')).toBe('Drops Paris');
    expect(yarnSourcesSearch('Drops')).toBe('Drops');
    expect(yarnSourcesSearch(undefined, null)).toBe('');
  });
});

describe('isYarnUnavailable', () => {
  it('is unavailable only when every colorway link is', () => {
    expect(
      isYarnUnavailable(
        yarn('a', 'A', [{ name: 'x', unavailable: '2025-02-01' }]),
      ),
    ).toBe(true);
    expect(
      isYarnUnavailable(
        yarn('a', 'A', [
          { name: 'x', unavailable: '2025-02-01' },
          { name: 'y' },
        ]),
      ),
    ).toBe(false);
  });
});
