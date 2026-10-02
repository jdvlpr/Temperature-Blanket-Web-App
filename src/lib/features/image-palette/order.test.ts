import { describe, expect, it } from 'vitest';
import { hexToOklab } from './color-space';
import { bestInsertionIndex, orderAsGradient, orderByHue } from './order';

const ramp = [
  '#ffff00',
  '#ffaa00',
  '#ff5500',
  '#ff0000',
  '#aa0055',
  '#5500aa',
  '#0000ff',
];

describe('orderAsGradient', () => {
  const shuffled = [3, 0, 6, 1, 5, 2, 4];
  const labs = shuffled.map((i) => hexToOklab(ramp[i]));
  const names = (order: number[]) => order.map((i) => ramp[shuffled[i]]);

  it('puts shuffled colors back into a smooth gradient, warm end first', () => {
    expect(names(orderAsGradient(labs, { warmFirst: true }))).toEqual([
      ...ramp.slice(0, 4),
      '#aa0055',
      '#5500aa',
      '#0000ff',
    ]);
  });

  it('puts the cool end first when asked', () => {
    expect(names(orderAsGradient(labs, { warmFirst: false }))).toEqual(
      [...ramp].reverse(),
    );
  });

  it('handles tiny palettes', () => {
    expect(orderAsGradient([], { warmFirst: true })).toEqual([]);
    expect(
      orderAsGradient([hexToOklab('#0000ff'), hexToOklab('#ff0000')], {
        warmFirst: true,
      }),
    ).toEqual([1, 0]);
  });
});

describe('bestInsertionIndex', () => {
  const labs = ['#000000', '#808080', '#ffffff'].map(hexToOklab);

  it('inserts between the colors it sits between', () => {
    expect(bestInsertionIndex(labs, hexToOklab('#404040'))).toBe(1);
  });

  it('adds to the ends when that fits best', () => {
    expect(bestInsertionIndex(labs.slice(1), hexToOklab('#000000'))).toBe(0);
    expect(bestInsertionIndex(labs.slice(0, 2), hexToOklab('#ffffff'))).toBe(2);
  });
});

describe('orderByHue', () => {
  const hexes = [
    '#808080',
    '#0000ff',
    '#00ff00',
    '#ff0000',
    '#ffff00',
    '#ffffff',
  ];
  const labs = hexes.map(hexToOklab);
  const names = (order: number[]) => order.map((i) => hexes[i]);

  it('goes around the wheel from warm to cool, neutrals last', () => {
    expect(names(orderByHue(labs, { warmFirst: true }))).toEqual([
      '#ff0000',
      '#ffff00',
      '#00ff00',
      '#0000ff',
      '#ffffff',
      '#808080',
    ]);
  });

  it('is used for long lists, and handles them quickly', () => {
    const many = Array.from({ length: 5000 }, (_, i) =>
      hexToOklab(
        `#${((i * 2654435761) >>> 8).toString(16).padStart(6, '0').slice(-6)}`,
      ),
    );
    const start = performance.now();
    const order = orderAsGradient(many, { warmFirst: true });
    expect(performance.now() - start).toBeLessThan(500);
    expect(new Set(order).size).toBe(many.length);
  });
});
