import { describe, expect, it } from 'vitest';
import { nameAllowed } from './words';

describe('gallery name filter', () => {
  it('allows ordinary names, and words that only contain a listed one', () => {
    for (const name of [
      'Autumn in Vermont',
      'Scunthorpe 2024',
      'Peacock Blues',
      'Essex Coast',
      'Grape & Rapeseed',
      'Cocktail Hour',
      '',
    ])
      expect(nameAllowed(name)).toBe(true);
    expect(nameAllowed(null)).toBe(true);
  });

  it('refuses listed words, whole, in any case, with endings and look-alikes', () => {
    for (const name of [
      'Shit Weather',
      'FUCKING cold',
      'sh1t year',
      'f.u.c.k winter',
      'What the fück',
      'bitches',
    ])
      expect(nameAllowed(name)).toBe(false);
  });
});
