import { describe, expect, it } from 'vitest';
import {
  FIT_ROW_HEIGHT,
  IMAGE_WIDTH,
  LINE_HEIGHT,
  PADDING,
  PALETTE_IMAGE_LAYOUTS,
  PALETTE_IMAGE_SHAPES,
  SHAPE_SIZES,
  TITLE_HEIGHT,
  fitFontSize,
  formatRangeLabel,
  getSwatchPlacement,
  rangeToText,
  fitLines,
  getPaletteImageGeometry,
  getSwatchColumns,
  type Measure,
} from './layout';

// About like a real font: in step with size, plus a little extra (kerning,
// side bearings) that a single proportional guess doesn't account for
const measure: Measure = (text, size) => text.length * size * 0.55 + 3;

describe('fitFontSize', () => {
  it('keeps the preferred size when the text fits', () => {
    expect(
      fitFontSize({ text: 'Red', preferred: 40, maxWidth: 500, measure }),
    ).toBe(40);
  });

  it('shrinks text that would overflow, and never cuts it short', () => {
    for (const length of [20, 60, 200, 1000]) {
      const text = 'W'.repeat(length);
      const size = fitFontSize({ text, preferred: 40, maxWidth: 300, measure });
      expect(size).toBeGreaterThan(0);
      expect(size).toBeLessThan(40);
      expect(measure(text, size)).toBeLessThanOrEqual(300);
    }
  });

  it('gives no size for a box with no width', () => {
    expect(
      fitFontSize({ text: 'Red', preferred: 40, maxWidth: 0, measure }),
    ).toBe(0);
  });
});

describe('fitLines', () => {
  it('shrinks every line together to fit the height', () => {
    const lines = [
      { text: 'a', size: 40, measure },
      { text: 'b', size: 20, measure },
    ];
    const sizes = fitLines({ lines, width: 1000, height: 36 });
    expect(sizes[0] / sizes[1]).toBeCloseTo(2);
    expect((sizes[0] + sizes[1]) * LINE_HEIGHT).toBeLessThanOrEqual(36.001);
  });

  it('makes room for taller lines', () => {
    const sizes = fitLines({
      lines: [{ text: 'a', size: 40, measure, lineHeight: 2 }],
      width: 1000,
      height: 40,
    });
    expect(sizes[0]).toBeCloseTo(20);
  });

  it('shrinks only the line that is too wide', () => {
    const lines = [
      { text: 'Short', size: 30, measure },
      {
        text: 'A very long brand name - and a very long yarn name',
        size: 30,
        measure,
      },
    ];
    const sizes = fitLines({ lines, width: 300, height: 1000 });
    expect(sizes[0]).toBe(30);
    expect(sizes[1]).toBeLessThan(30);
    lines.forEach((line, i) =>
      expect(measure(line.text, sizes[i])).toBeLessThanOrEqual(300),
    );
  });
});

describe('getSwatchColumns', () => {
  it('makes an even grid for a Fit image', () => {
    expect(getSwatchColumns({ count: 1, width: 984, gap: 0 })).toBe(1);
    expect(getSwatchColumns({ count: 4, width: 984, gap: 0 })).toBe(2);
    expect(getSwatchColumns({ count: 8, width: 984, gap: 0 })).toBe(3);
  });

  it('picks the biggest swatches for a fixed space', () => {
    // A wide, short space suits one row
    expect(
      getSwatchColumns({ count: 4, width: 1000, height: 250, gap: 0 }),
    ).toBe(4);
    // A tall, narrow one suits one column
    expect(
      getSwatchColumns({ count: 4, width: 250, height: 1000, gap: 0 }),
    ).toBe(1);
  });
});

describe('getPaletteImageGeometry', () => {
  it('makes Fit images 1080 wide, and fixed shapes their size', () => {
    for (const layout of PALETTE_IMAGE_LAYOUTS) {
      for (const shape of PALETTE_IMAGE_SHAPES) {
        const geometry = getPaletteImageGeometry({
          count: 7,
          layout,
          shape,
          gaps: true,
          hasTitle: true,
        });
        if (shape === 'fit') {
          expect(geometry.width).toBe(IMAGE_WIDTH);
        } else {
          expect(geometry.width).toBe(SHAPE_SIZES[shape].width);
          expect(geometry.height).toBe(SHAPE_SIZES[shape].height);
        }
        expect(geometry.cells).toHaveLength(7);
      }
    }
  });

  it('keeps every color inside the colors area, without overlapping', () => {
    for (const layout of PALETTE_IMAGE_LAYOUTS) {
      for (const gaps of [true, false]) {
        const { bounds, cells } = getPaletteImageGeometry({
          count: 11,
          layout,
          shape: 'portrait',
          gaps,
          hasTitle: false,
        });
        for (const cell of cells) {
          expect(cell.x).toBeGreaterThanOrEqual(bounds.x - 0.001);
          expect(cell.y).toBeGreaterThanOrEqual(bounds.y - 0.001);
          expect(cell.x + cell.width).toBeLessThanOrEqual(
            bounds.x + bounds.width + 0.001,
          );
          expect(cell.y + cell.height).toBeLessThanOrEqual(
            bounds.y + bounds.height + 0.001,
          );
        }
        for (let i = 0; i < cells.length; i++)
          for (let j = i + 1; j < cells.length; j++) {
            const a = cells[i];
            const b = cells[j];
            const overlaps =
              a.x + a.width > b.x + 0.001 &&
              b.x + b.width > a.x + 0.001 &&
              a.y + a.height > b.y + 0.001 &&
              b.y + b.height > a.y + 0.001;
            expect(overlaps).toBe(false);
          }
      }
    }
  });

  it('grows a Fit image of rows with its colors, and makes room for a title', () => {
    const geometry = getPaletteImageGeometry({
      count: 5,
      layout: 'list',
      shape: 'fit',
      gaps: false,
      hasTitle: true,
    });
    expect(geometry.height).toBe(
      PADDING + TITLE_HEIGHT + 5 * FIT_ROW_HEIGHT + PADDING,
    );
    expect(geometry.title).not.toBeNull();
    expect(geometry.bounds.y).toBe(PADDING + TITLE_HEIGHT);
    expect(geometry.cells[0].height).toBe(FIT_ROW_HEIGHT);
  });

  it('makes square swatches in a Fit image', () => {
    const { cells } = getPaletteImageGeometry({
      count: 6,
      layout: 'grid',
      shape: 'fit',
      gaps: true,
      hasTitle: false,
    });
    expect(cells[0].width).toBeCloseTo(cells[0].height);
  });
});

describe('formatRangeLabel', () => {
  it('joins a range with a dash', () => {
    expect(formatRangeLabel(50, 59, '°F')).toBe('50\u201359 °F');
  });

  it('gives negative numbers a minus sign', () => {
    expect(formatRangeLabel(-10, 19, '°F')).toBe('\u221210\u201319 °F');
  });

  it('keeps a negative end from running into the dash', () => {
    expect(formatRangeLabel(-15, -5, '°C')).toBe('\u221215 to \u22125 °C');
  });

  it('leaves out a missing unit', () => {
    expect(formatRangeLabel(0, 10)).toBe('0\u201310');
  });
});

describe('rangeToText', () => {
  it('writes numbers with their unit, or a label as it is', () => {
    expect(rangeToText({ from: 50, to: 59, unit: '°F' })).toBe('50\u201359 °F');
    expect(rangeToText({ label: 'Rain' })).toBe('Rain');
  });
});

describe('getSwatchPlacement', () => {
  const rect = { x: 48, y: 100, width: 984, height: 140 };

  it("puts a row's swatch beside its text, inside the cell", () => {
    const { cx, cy, r, text } = getSwatchPlacement(rect, 'list');
    expect(cx - r).toBeGreaterThanOrEqual(rect.x);
    expect(cy - r).toBeGreaterThanOrEqual(rect.y);
    expect(cy + r).toBeLessThanOrEqual(rect.y + rect.height);
    expect(text.x).toBeGreaterThan(cx + r);
    expect(text.x + text.width).toBeLessThanOrEqual(rect.x + rect.width);
  });

  it("puts a card's swatch above its text", () => {
    const card = { x: 0, y: 0, width: 300, height: 300 };
    const { cy, r, text } = getSwatchPlacement(card, 'grid');
    expect(text.y).toBeGreaterThan(cy + r);
    expect(text.y + text.height).toBeLessThanOrEqual(card.height);
    expect(text.width).toBeGreaterThan(0);
  });

  it('leaves no negative room in a tiny cell', () => {
    for (const layout of ['list', 'grid'] as const) {
      const { text } = getSwatchPlacement(
        { x: 0, y: 0, width: 20, height: 20 },
        layout,
      );
      expect(text.width).toBeGreaterThanOrEqual(0);
      expect(text.height).toBeGreaterThanOrEqual(0);
    }
  });
});
