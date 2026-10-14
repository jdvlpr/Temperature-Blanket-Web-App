import { describe, expect, it } from 'vitest';
import {
  matchesSearch,
  matchesStatus,
  matchesYarn,
  patternIdOf,
  sortLibrary,
} from './collection-filter.js';

describe('matchesSearch', () => {
  it('matches every word, in any of the texts, ignoring case and accents', () => {
    expect(matchesSearch('', ['anything'])).toBe(true);
    expect(matchesSearch('kansas 2003', ['Topeka, Kansas', '2003'])).toBe(true);
    expect(matchesSearch('montreal', ['Montréal'])).toBe(true);
    expect(matchesSearch('kansas 2004', ['Topeka, Kansas', '2003'])).toBe(
      false,
    );
    expect(matchesSearch('x', [null, undefined])).toBe(false);
  });
});

describe('patternIdOf', () => {
  const ids = ['rows', 'chev', 'twsr'];
  it('finds the preview in the hash', () => {
    expect(
      patternIdOf('https://example.com/?project=1#l=abc&chev=1,2&t=x', ids),
    ).toBe('chev');
  });
  it('is null without a hash or a preview', () => {
    expect(patternIdOf('https://example.com/', ids)).toBeNull();
    expect(patternIdOf('https://example.com/#l=abc', ids)).toBeNull();
    expect(patternIdOf(undefined, ids)).toBeNull();
  });
});

describe('matchesYarn', () => {
  const colors = [
    { brandId: 'a', yarnId: '1' },
    { brandId: 'b', yarnId: '2' },
  ];
  it('matches any color, or with only, every color', () => {
    expect(matchesYarn(colors, { brandId: '', yarnId: '', only: false })).toBe(
      true,
    );
    expect(matchesYarn(colors, { brandId: 'a', yarnId: '', only: false })).toBe(
      true,
    );
    expect(
      matchesYarn(colors, { brandId: 'a', yarnId: '2', only: false }),
    ).toBe(false);
    expect(matchesYarn(colors, { brandId: 'a', yarnId: '', only: true })).toBe(
      false,
    );
    expect(
      matchesYarn(colors.slice(0, 1), {
        brandId: 'a',
        yarnId: '1',
        only: true,
      }),
    ).toBe(true);
  });
});

describe('matchesStatus', () => {
  it('sorts things into published, not published and gallery only', () => {
    const published = { published: true, galleryOnly: false };
    const unpublished = { published: false, galleryOnly: false };
    const galleryOnly = { published: true, galleryOnly: true };
    expect(matchesStatus('published', published)).toBe(true);
    expect(matchesStatus('published', galleryOnly)).toBe(false);
    expect(matchesStatus('unpublished', unpublished)).toBe(true);
    expect(matchesStatus('unpublished', published)).toBe(false);
    expect(matchesStatus('gallery-only', galleryOnly)).toBe(true);
    expect(matchesStatus('all', unpublished)).toBe(true);
  });
});

describe('sortLibrary', () => {
  const items = [
    { name: 'b10', time: 1 },
    { name: 'B2', time: 3 },
    { name: 'a', time: 2 },
  ];
  const by = {
    name: (i: (typeof items)[number]) => i.name,
    time: (i: (typeof items)[number]) => i.time,
  };
  it('sorts by recent or by name, either way round', () => {
    expect(sortLibrary(items, 'recent', false, by).map((i) => i.time)).toEqual([
      3, 2, 1,
    ]);
    expect(sortLibrary(items, 'recent', true, by).map((i) => i.time)).toEqual([
      1, 2, 3,
    ]);
    expect(sortLibrary(items, 'name', false, by).map((i) => i.name)).toEqual([
      'a',
      'B2',
      'b10',
    ]);
  });
});
