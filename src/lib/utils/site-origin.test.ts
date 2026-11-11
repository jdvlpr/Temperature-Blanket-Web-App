import { describe, expect, it } from 'vitest';
import {
  BETA_ORIGIN,
  isRetiredBeta,
  lastingOriginFor,
  originOf,
  withOrigin,
} from './site-origin';

const MAIN = 'https://temperature-blanket.com';
const BETA = 'https://next.temperature-blanket.com';

describe('originOf', () => {
  it('is a URL’s origin, or null', () => {
    expect(originOf('https://temperature-blanket.com/')).toBe(MAIN);
    expect(originOf('')).toBeNull();
    expect(originOf(undefined)).toBeNull();
    expect(originOf('not a url')).toBeNull();
  });
});

describe('lastingOriginFor', () => {
  it('is the main site in the beta', () => {
    expect(lastingOriginFor(BETA, { beta: true, main: MAIN })).toBe(MAIN);
  });

  it('is the main site at the beta’s address after launch', () => {
    expect(lastingOriginFor(BETA, { beta: false, main: MAIN })).toBe(MAIN);
  });

  it('is this site otherwise, or when the main one isn’t known', () => {
    expect(lastingOriginFor(MAIN, { beta: false, main: MAIN })).toBe(MAIN);
    expect(
      lastingOriginFor('http://localhost:5173', { beta: false, main: MAIN }),
    ).toBe('http://localhost:5173');
    expect(lastingOriginFor(BETA, { beta: true, main: null })).toBe(BETA);
  });
});

describe('isRetiredBeta', () => {
  it('is the main site’s build at the beta’s address', () => {
    expect(BETA_ORIGIN).toBe(BETA);
    expect(isRetiredBeta(BETA, false)).toBe(true);
  });

  it('isn’t the beta itself, or anywhere else', () => {
    expect(isRetiredBeta(BETA, true)).toBe(false);
    expect(isRetiredBeta(MAIN, false)).toBe(false);
  });
});

describe('withOrigin', () => {
  it('moves a link to another site, keeping the rest', () => {
    expect(withOrigin(`${BETA}/?project=1&l=2#a`, MAIN)).toBe(
      `${MAIN}/?project=1&l=2#a`,
    );
  });

  it('leaves what isn’t a link as it is', () => {
    expect(withOrigin('/relative', MAIN)).toBe('/relative');
  });
});
