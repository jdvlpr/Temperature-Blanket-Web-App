import { describe, expect, it } from 'vitest';
import { hexToOklab } from './color-space';
import { applyPaletteStyle, selectColors } from './select';

const labs = (hexes: string[]) => Float32Array.from(hexes.flatMap(hexToOklab));

const candidateHexes = [
  '#ff0000', // 0 red
  '#ee1111', // 1 brick
  '#0000ff', // 2 blue
  '#00aa00', // 3 green
  '#ffffff', // 4 white
  '#000000', // 5 black
  '#fe0101', // 6 looks the same as red
];
const candidates = labs(candidateHexes);

describe('selectColors', () => {
  it('chooses the candidates that cover the image best, biggest areas first', () => {
    const picked = selectColors({
      targets: labs(['#fe0000', '#0101fe', '#01ab01']),
      weights: Float32Array.from([0.6, 0.3, 0.1]),
      candidates,
      count: 3,
    });
    expect(picked.slice(0, 1)).toEqual([0].includes(picked[0]) ? [0] : [6]);
    expect(new Set(picked.map((i) => (i === 6 ? 0 : i)))).toEqual(
      new Set([0, 2, 3]),
    );
  });

  it('never chooses two colors that look the same', () => {
    const picked = selectColors({
      targets: labs(['#ff0000']),
      weights: Float32Array.from([1]),
      candidates,
      count: 3,
    });
    expect(picked).toHaveLength(3);
    expect(picked.includes(0) && picked.includes(6)).toBe(false);
  });

  it('leaves areas covered by fixed (locked) colors to them', () => {
    const picked = selectColors({
      targets: labs(['#ff0000', '#0000ff']),
      weights: Float32Array.from([0.5, 0.5]),
      candidates,
      count: 1,
      fixed: labs(['#ff0000']),
    });
    expect(picked).toEqual([2]);
  });

  it('returns fewer colors when there are not enough distinct candidates', () => {
    expect(
      selectColors({
        targets: labs(['#ff0000']),
        weights: Float32Array.from([1]),
        candidates: labs(['#ff0000', '#ff0001']),
        count: 5,
      }),
    ).toHaveLength(1);
  });

  it('handles empty input', () => {
    expect(
      selectColors({
        targets: new Float32Array(0),
        weights: new Float32Array(0),
        candidates,
        count: 3,
      }),
    ).toEqual([]);
  });
});

describe('applyPaletteStyle', () => {
  const centroids = labs(['#ff0000', '#808080', '#202020', '#f0f0f0']);
  const weights = Float32Array.from([0.25, 0.25, 0.25, 0.25]);
  const styled = (style: Parameters<typeof applyPaletteStyle>[0]['style']) =>
    applyPaletteStyle({ centroids, weights, style }).weights;

  it('favors colorful areas for vivid and grey areas for muted', () => {
    expect(styled('vivid')[0]).toBeGreaterThan(styled('vivid')[1]);
    expect(styled('muted')[1]).toBeGreaterThan(styled('muted')[0]);
  });

  it('favors light areas for light and dark areas for dark', () => {
    expect(styled('light')[3]).toBeGreaterThan(styled('light')[2]);
    expect(styled('dark')[2]).toBeGreaterThan(styled('dark')[3]);
  });

  it('leaves targets alone for balanced', () => {
    expect(
      applyPaletteStyle({ centroids, weights, style: 'balanced' }).targets,
    ).toEqual(centroids);
  });
});
