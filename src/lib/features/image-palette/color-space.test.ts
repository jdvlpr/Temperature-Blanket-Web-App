import chroma from 'chroma-js';
import { describe, expect, it } from 'vitest';
import {
  hexToOklab,
  hexToRgb,
  oklabToHex,
  rgbToHex,
  warmth,
} from './color-space';

const hexes = [
  '#000000',
  '#ffffff',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#c0ffee',
  '#7f3fbf',
  '#123456',
];

describe('OKLab conversion', () => {
  it('matches chroma-js', () => {
    for (const hex of hexes) {
      const ours = hexToOklab(hex);
      const theirs = chroma(hex).oklab();
      for (let i = 0; i < 3; i++) expect(ours[i]).toBeCloseTo(theirs[i], 4);
    }
  });

  it('round-trips through hex', () => {
    for (const hex of hexes) expect(oklabToHex(hexToOklab(hex))).toBe(hex);
  });

  it('parses and formats hex', () => {
    expect(hexToRgb('#0a0')).toEqual([0, 170, 0]);
    expect(rgbToHex(1, 2, 255)).toBe('#0102ff');
  });
});

describe('warmth', () => {
  it('scores red and orange above blue', () => {
    expect(warmth(hexToOklab('#ff4000'))).toBeGreaterThan(
      warmth(hexToOklab('#0040ff')),
    );
    expect(warmth(hexToOklab('#ff0000'))).toBeGreaterThan(
      warmth(hexToOklab('#00ffff')),
    );
  });
});
