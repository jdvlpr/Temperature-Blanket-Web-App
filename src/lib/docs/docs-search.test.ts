import { describe, expect, it } from 'vitest';
import { DOCS_PAGES, OLD_ANCHORS, docsHref, docsPageAt } from './docs-index';
import { keywordSearch } from './docs-search';

const firstSlug = (query: string) => keywordSearch(query)[0]?.slug;

describe('keywordSearch', () => {
  it('finds guides by the words people use for their problem', () => {
    expect(firstSlug('thermometer')).toBe('weather-doesnt-match');
    expect(firstSlug('wrong temperature')).toBe('weather-doesnt-match');
    expect(firstSlug('backup')).toBe('move-or-back-up');
    expect(firstSlug('birthday')).toBe('same-date-several-years');
    expect(firstSlug('print')).toBe('print-and-track');
  });

  it('matches plurals, partial words, case and apostrophes', () => {
    expect(firstSlug('Thermometers')).toBe('weather-doesnt-match');
    expect(firstSlug('doesnt match')).toBe('weather-doesnt-match');
    expect(keywordSearch('rang').map((page) => page.slug)).toContain(
      'choose-ranges',
    );
  });

  it('finds nothing for nothing', () => {
    expect(keywordSearch('')).toEqual([]);
    expect(keywordSearch('   ')).toEqual([]);
    expect(keywordSearch('zzzzqx')).toEqual([]);
  });
});

describe('docs index', () => {
  it('gives every page a unique address', () => {
    const hrefs = DOCS_PAGES.map(docsHref);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('finds a page by its path, with or without a trailing slash', () => {
    expect(docsPageAt('/documentation/weather')?.slug).toBe('weather');
    expect(docsPageAt('/documentation/guides/choose-ranges/')?.slug).toBe(
      'choose-ranges',
    );
    expect(docsPageAt('/documentation')).toBeUndefined();
  });

  it('sends every old anchor to a page that exists', () => {
    const paths = new Set(['/documentation', ...DOCS_PAGES.map(docsHref)]);
    for (const target of Object.values(OLD_ANCHORS))
      expect(paths).toContain(target.split('#')[0]);
  });
});
