import { describe, expect, it } from 'vitest';
import { normalizeName, stashMatcher } from './ravelry-stash-match';

const colorways = [
  {
    brandName: 'Lion Brand',
    yarnName: 'Wool-Ease Thick & Quick',
    name: 'Wheat',
    hex: '#d8c49a',
  },
  {
    brandName: 'Lion Brand',
    yarnName: 'Pound of Love',
    name: 'Wheat',
    hex: '#e0d0a0',
  },
  {
    brandName: 'Malabrigo',
    yarnName: 'Rios',
    name: 'Azul Profundo',
    hex: '#1a2a6c',
  },
  { brandName: 'Malabrigo', yarnName: 'Rios', name: 'Red', hex: '#c00000' },
];
const match = stashMatcher(colorways);

describe('stash matching', () => {
  it('ignores case, accents and punctuation', () => {
    expect(normalizeName('Wool-Ease Thick & Quick')).toBe(
      'wool ease thick and quick',
    );
    expect(normalizeName('Café')).toBe('cafe');
  });

  it('matches brand, yarn and colorway exactly first', () => {
    expect(
      match({
        brand: 'Lion Brand Yarn',
        yarn: 'Wool-Ease Thick & Quick',
        colorway: 'wheat',
      }),
    ).toMatchObject({ quality: 'exact', color: { hex: '#d8c49a' } });
  });

  it('finds a colorway written with its code', () => {
    expect(
      match({
        brand: 'Lion Brand',
        yarn: 'Pound of Love',
        colorway: '550-157 Wheat',
      }),
    ).toMatchObject({ quality: 'close', color: { hex: '#e0d0a0' } });
  });

  it('doesn’t match another yarn’s colorway, or short names inside longer ones', () => {
    expect(
      match({ brand: 'Malabrigo', yarn: 'Rasta', colorway: 'Azul Profundo' }),
    ).toBeNull();
    expect(
      match({ brand: 'Malabrigo', yarn: 'Rios', colorway: 'Redwood' }),
    ).toBeNull();
    expect(
      match({ brand: 'Unknown', yarn: 'Rios', colorway: 'Red' }),
    ).toBeNull();
  });
});
