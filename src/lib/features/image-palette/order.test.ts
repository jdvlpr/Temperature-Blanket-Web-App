import { describe, expect, it } from 'vitest';
import { hexToOklab } from './color-space';
import { bestInsertionIndex, orderAsGradient } from './order';

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
