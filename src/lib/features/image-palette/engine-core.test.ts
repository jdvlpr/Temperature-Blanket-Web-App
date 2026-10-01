import { describe, expect, it } from 'vitest';
import { hexToOklab, hexToRgb } from './color-space';
import { createEngineCore } from './engine-core';

function image(colors: string[], width = 30, height = 10) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const color = colors[Math.floor((x / width) * colors.length)];
      data.set([...hexToRgb(color), 255], (y * width + x) * 4);
    }
  return { data, width, height };
}

const labs = (hexes: string[]) => Float32Array.from(hexes.flatMap(hexToOklab));

describe('createEngineCore', () => {
  it('chooses yarns for an image and says where each color is', () => {
    const core = createEngineCore();
    core.setImage(image(['#ff0000', '#0000ff']));
    core.setCandidates({ labs: labs(['#00ff00', '#ee0000', '#0000ee']) });
    const colors = core.autoPalette({
      count: 2,
      style: 'balanced',
      fixed: new Float32Array(0),
      exact: false,
    });
    expect(colors.map((n) => n.candidate).sort()).toEqual([1, 2]);
    const red = colors.find((n) => n.candidate === 1)!;
    expect(red.x).toBeLessThan(0.5);
  });

  it('uses the image colors themselves for exact colors', () => {
    const core = createEngineCore();
    core.setImage(image(['#ff0000', '#00ff00', '#0000ff']));
    const colors = core.autoPalette({
      count: 5,
      style: 'balanced',
      fixed: new Float32Array(0),
      exact: true,
    });
    // Only three distinct colors exist
    expect(colors).toHaveLength(3);
    expect(colors.every((n) => n.candidate === -1)).toBe(true);
  });

  it('redraws the image in a palette', () => {
    const core = createEngineCore();
    core.setImage(image(['#fe0101'], 2, 1));
    expect([...core.posterize({ palette: [[255, 0, 0]] })!]).toEqual([
      255, 0, 0, 255, 255, 0, 0, 255,
    ]);
  });

  it('returns nothing before an image is set', () => {
    const core = createEngineCore();
    expect(
      core.autoPalette({
        count: 2,
        style: 'balanced',
        fixed: new Float32Array(0),
        exact: true,
      }),
    ).toEqual([]);
    expect(core.posterize({ palette: [[0, 0, 0]] })).toBeNull();
  });
});
