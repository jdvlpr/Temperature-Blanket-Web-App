import { describe, expect, it } from 'vitest';
import { cornerRadius, drawnBox, nearCorners } from './card-corners.js';

const inner = { left: 8, top: 8, right: 208, bottom: 308 };
const none = { tl: false, tr: false, br: false, bl: false };
const all = { tl: true, tr: true, br: true, bl: true };

describe('nearCorners', () => {
  it('rounds every corner of a picture filling the card to its padding', () => {
    expect(nearCorners(inner, inner)).toEqual(all);
  });

  it('counts a picture within the tolerance as reaching the card', () => {
    expect(
      nearCorners(inner, { left: 11, top: 11, right: 205, bottom: 305 }),
    ).toEqual(all);
  });

  it('keeps a picture in the middle of a wide card square', () => {
    expect(
      nearCorners(inner, { left: 50, top: 50, right: 150, bottom: 250 }),
    ).toEqual(none);
  });

  it('rounds only the top of a picture over the name', () => {
    expect(
      nearCorners(inner, { left: 8, top: 8, right: 208, bottom: 250 }),
    ).toEqual({ tl: true, tr: true, br: false, bl: false });
  });

  it('rounds only the left of a picture beside the name (list)', () => {
    expect(
      nearCorners(inner, { left: 8, top: 8, right: 100, bottom: 308 }),
    ).toEqual({ tl: true, tr: false, br: false, bl: true });
  });

  it('needs both sides of a corner to reach the card', () => {
    expect(
      nearCorners(inner, { left: 8, top: 40, right: 208, bottom: 308 }),
    ).toEqual({ tl: false, tr: false, br: true, bl: true });
  });
});

describe('drawnBox', () => {
  const box = { left: 0, top: 0, right: 100, bottom: 100 };

  it('is the box itself unless contained', () => {
    expect(drawnBox(box, 'fill', 200, 100)).toEqual(box);
  });

  it('is the box before the picture has loaded', () => {
    expect(drawnBox(box, 'contain', 0, 0)).toEqual(box);
  });

  it('letterboxes a wide picture top and bottom', () => {
    expect(drawnBox(box, 'contain', 200, 100)).toEqual({
      left: 0,
      top: 25,
      right: 100,
      bottom: 75,
    });
  });

  it('letterboxes a tall picture at the sides', () => {
    expect(drawnBox(box, 'contain', 50, 100)).toEqual({
      left: 25,
      top: 0,
      right: 75,
      bottom: 100,
    });
  });
});

describe('cornerRadius', () => {
  it('gives the nested radius to near corners, in CSS order', () => {
    expect(cornerRadius({ tl: true, tr: false, br: false, bl: true })).toBe(
      'var(--radius-nested) 0 0 var(--radius-nested)',
    );
  });
});
