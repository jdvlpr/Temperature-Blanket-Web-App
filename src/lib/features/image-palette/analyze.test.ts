import { describe, expect, it } from 'vitest';
import { analyzePixels, findColorPosition } from './analyze';
import { hexToOklab, hexToRgb } from './color-space';

/** An image whose left part is one color and right part another */
function splitImage(
  left: string,
  right: string,
  width = 40,
  height = 20,
  split = 30,
) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const [r, g, b] = hexToRgb(x < split ? left : right);
      data.set([r, g, b, 255], (y * width + x) * 4);
    }
  return { data, width, height };
}

describe('analyzePixels', () => {
  it('finds each distinct color once, weighted by area', () => {
    const analysis = analyzePixels(splitImage('#ff0000', '#0000ff'));
    expect(analysis.weights).toHaveLength(2);
    const weights = [...analysis.weights].sort();
    expect(weights[0]).toBeCloseTo(0.25, 1);
    expect(weights[1]).toBeCloseTo(0.75, 1);
  });

  it('is repeatable', () => {
    const image = splitImage('#ff0000', '#00ff00');
    expect(analyzePixels(image).centroids).toEqual(
      analyzePixels(image).centroids,
    );
  });

  it('ignores transparent pixels', () => {
    const image = splitImage('#ff0000', '#0000ff');
    for (let i = 3; i < image.data.length; i += 4) image.data[i] = 0;
    expect(analyzePixels(image).weights).toHaveLength(0);
  });
});

describe('findColorPosition', () => {
  it('finds where a color is in the image', () => {
    const analysis = analyzePixels(splitImage('#ff0000', '#0000ff'));
    const position = findColorPosition({
      analysis,
      lab: hexToOklab('#0000ff'),
    });
    expect(position!.x).toBeGreaterThan(0.75);
    expect(position!.y).toBeGreaterThan(0);
    expect(position!.y).toBeLessThan(1);
  });

  it('avoids positions already used when it can', () => {
    const analysis = analyzePixels(splitImage('#ff0000', '#0000ff'));
    const lab = hexToOklab('#0000ff');
    const first = findColorPosition({ analysis, lab })!;
    const second = findColorPosition({
      analysis,
      lab,
      avoid: new Set([first.pixel]),
    })!;
    expect(second.pixel).not.toBe(first.pixel);
  });
});
