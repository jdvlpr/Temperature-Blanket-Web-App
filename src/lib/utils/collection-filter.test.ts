import { describe, expect, it } from 'vitest';
import {
  matchesSearch,
  matchesStatus,
  matchesYarn,
  patternIdOf,
  sortGalleryPages,
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
  it('never matches a chosen yarn with no colors, even with only', () => {
    expect(matchesYarn([], { brandId: 'a', yarnId: '1', only: true })).toBe(
      false,
    );
    expect(matchesYarn([], { brandId: 'a', yarnId: '', only: false })).toBe(
      false,
    );
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

describe('sortGalleryPages', () => {
  const pages = [
    { databaseId: 1, date: '2024-01-01T00:00:00' },
    { databaseId: 2, date: '2026-01-01T00:00:00' },
    { databaseId: 3, date: '2025-01-01T00:00:00' },
  ];
  const ids = (list: typeof pages) => list.map((p) => p.databaseId);
  it('sorts by date either way', () => {
    expect(ids(sortGalleryPages(pages, 'DESC', null))).toEqual([2, 3, 1]);
    expect(ids(sortGalleryPages(pages, 'ASC', [1]))).toEqual([1, 3, 2]);
  });
  it('sorts popular ones first, the rest newest first', () => {
    expect(ids(sortGalleryPages(pages, 'POPULAR', [1]))).toEqual([1, 2, 3]);
    expect(ids(sortGalleryPages(pages, 'POPULAR', [3, 1, 2]))).toEqual([
      3, 1, 2,
    ]);
    // Not known yet: newest first
    expect(ids(sortGalleryPages(pages, 'POPULAR', null))).toEqual([2, 3, 1]);
  });
});
