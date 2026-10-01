import { describe, expect, it } from 'vitest';
import { pointsAlongLine, posterize, sampleHex } from './pixels';

describe('pointsAlongLine', () => {
  it('spaces points evenly, including both ends', () => {
    expect(pointsAlongLine({ x: 0, y: 0 }, { x: 1, y: 0.5 }, 3)).toEqual([
      { x: 0, y: 0 },
      { x: 0.5, y: 0.25 },
      { x: 1, y: 0.5 },
    ]);
  });

  it('uses the middle for one point', () => {
    expect(pointsAlongLine({ x: 0, y: 0 }, { x: 1, y: 1 }, 1)).toEqual([
      { x: 0.5, y: 0.5 },
    ]);
  });
});

describe('sampleHex', () => {
  // 2x1 image: a black pixel and a white pixel
  const data = new Uint8ClampedArray([0, 0, 0, 255, 255, 255, 255, 255]);

  it('averages the surrounding pixels', () => {
    expect(
      sampleHex({ data, width: 2, height: 1, x: 0.1, y: 0.5, radius: 1 }),
    ).toBe('#808080');
  });

  it('samples one pixel with radius 0', () => {
    expect(
      sampleHex({ data, width: 2, height: 1, x: 0.9, y: 0.5, radius: 0 }),
    ).toBe('#ffffff');
  });

  it('returns null outside the image', () => {
    expect(sampleHex({ data, width: 2, height: 1, x: 1.2, y: 0.5 })).toBeNull();
  });
});

describe('posterize', () => {
  it('replaces each pixel with the closest palette color', () => {
    const data = new Uint8ClampedArray([250, 10, 10, 255, 10, 10, 240, 128]);
    expect([
      ...posterize({
        data,
        palette: [
          [255, 0, 0],
          [0, 0, 255],
        ],
      }),
    ]).toEqual([255, 0, 0, 255, 0, 0, 255, 128]);
  });
});
