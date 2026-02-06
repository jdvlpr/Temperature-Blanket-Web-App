import { describe, expect, it, vi } from 'vitest';
import {
  colorsToCode,
  colorsToYarnDetails,
  getColorInfo,
  getColorsFromInput,
  getTextColor,
  sortColorsByName,
  sortColorsByNameZtoA,
  sortColorsDarktoLight,
  sortColorsLightToDark,
  yarnDetailsToColors,
} from './color-utils';

// Mocking $lib modules
vi.mock('$lib/state', () => ({
  allGaugesAttributes: [
    {
      id: 'tmax_gauge',
      targets: [
        {
          id: 'tmax',
          ranges: [
            { min: -Infinity, max: 0, color: { hex: '#0000ff' } },
            { min: 0, max: 20, color: { hex: '#00ff00' } },
            { min: 20, max: Infinity, color: { hex: '#ff0000' } },
          ],
        },
      ],
    },
  ],
  gauges: {
    getSnapshot: vi.fn((id) => {
      if (id === 'tmax_gauge') {
        return {
          unit: { type: 'number' },
          ranges: [
            { from: -Infinity, to: 0 },
            { from: 0.1, to: 20 },
            { from: 20.1, to: Infinity },
          ],
          colors: [{ hex: '#0000ff' }, { hex: '#00ff00' }, { hex: '#ff0000' }],
          rangeOptions: {
            direction: 'forward',
            includeFromValue: true,
            includeToValue: true,
          },
        };
      }
      return null;
    }),
  },
  project: {
    url: { href: 'http://localhost/?project=123' },
  },
}));

vi.mock('$lib/utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/utils')>();
  return {
    ...actual,
    isValueInRange: vi.fn(
      ({ value, range }) => value >= range.from && value <= range.to,
    ),
    getTargetParentGaugeId: vi.fn((param) => {
      if (param === 'tmax') return 'tmax_gauge';
      return param;
    }),
    getColorPropertiesFromYarnStringAndHex: vi.fn(({ yarnString, hex }) => {
      // Simple mock for testing yarnDetailsToColors
      if (yarnString === 'brand1-yarn1') {
        return {
          brandId: 'brand1',
          yarnId: 'yarn1',
          brandName: 'Brand 1',
          yarnName: 'Yarn 1',
          name: 'Red',
        };
      }
      return {};
    }),
  };
});

describe('color-utils', () => {
  describe('getTextColor', () => {
    it('should return black for light colors', () => {
      expect(getTextColor('#ffffff')).toBe('black');
      expect(getTextColor('white')).toBe('black');
      expect(getTextColor('#ffff00')).toBe('black');
    });

    it('should return white for dark colors', () => {
      expect(getTextColor('#000000')).toBe('white');
      expect(getTextColor('black')).toBe('white');
      expect(getTextColor('#0000ff')).toBe('white');
    });
  });

  describe('getColorInfo', () => {
    it('should return the correct color info for a given value', () => {
      const result = getColorInfo({ param: 'tmax', value: 10 });
      expect(result.hex).toBe('#00ff00');
    });

    it('should return null or default if no range matches', () => {
      const result = getColorInfo({ param: 'unknown' as any, value: 10 });
      expect(result.hex).toBe('#ffffff'); // default in implementation
    });

    it('should return neutral color for null value', () => {
      const result = getColorInfo({ param: 'tmax', value: null });
      expect(result.hex).toBe('#ffffff');
    });
  });

  describe('colorsToYarnDetails', () => {
    it('should encode colors to yarn details string', () => {
      const colors = [{ hex: '#ff0000', brandId: 'b1', yarnId: 'y1' }];
      const result = colorsToYarnDetails({ colors });
      expect(typeof result).toBe('string');
    });
  });

  describe('yarnDetailsToColors', () => {
    it('should apply yarn details to colors', () => {
      const colors = [{ hex: '#ff0000' }];
      const string = 'brand1-yarn1(0)'; // apply brand1-yarn1 to index 0
      const result = yarnDetailsToColors({ string, colors });
      expect(result[0].brandId).toBe('brand1');
    });

    it('should handle simple yarn string without parenthesis', () => {
      const colors = [{ hex: '#ff0000' }];
      const string = 'brand1-yarn1';
      const result = yarnDetailsToColors({ string, colors });
      expect(result[0].brandId).toBe('brand1');
    });

    it('should handle empty or invalid strings', () => {
      const colors = [{ hex: '#ff0000' }];
      expect(yarnDetailsToColors({ string: '', colors })).toBe(colors);
      expect(yarnDetailsToColors({ string: ' ', colors })).toBe(colors);
    });
  });

  describe('colorsToCode', () => {
    it('should generate palette code', () => {
      const colors = [{ hex: '#ff0000' }, { hex: '#00ff00' }];
      expect(colorsToCode(colors)).toBe('palette:ff000000ff00');
    });

    it('should respect includePrefixes option', () => {
      const colors = [{ hex: '#ff0000' }];
      expect(colorsToCode(colors, { includePrefixes: false })).toBe('ff0000');
    });
  });

  describe('getColorsFromInput', () => {
    it('should parse single hex color', () => {
      const result = getColorsFromInput({ string: '#ff0000' });
      expect(result).toHaveLength(1);
      // @ts-expect-error
      expect(result[0].hex).toBe('#ff0000');
    });

    it('should parse multiple hex colors', () => {
      const result = getColorsFromInput({ string: '#ff0000,#00ff00' });
      expect(result).toHaveLength(2);
    });

    it('should handle hex without hash', () => {
      const result = getColorsFromInput({ string: 'ff0000' });
      expect(result).toHaveLength(1);
    });

    it('should parse coolors.co url', () => {
      const result = getColorsFromInput({
        string: 'https://coolors.co/ff0000-00ff00',
      });
      expect(result).toHaveLength(2);
      // @ts-expect-error
      expect(result[0].hex).toBe('#ff0000');
    });

    it('should parse palette: prefix', () => {
      const result = getColorsFromInput({ string: 'palette:ff0000 00ff00' });
      expect(result).toHaveLength(2);
    });

    it('should return false for invalid input', () => {
      expect(getColorsFromInput({ string: '' })).toBe(false);
      expect(
        getColorsFromInput({ string: 'invalid-color-string-that-is-too-long' }),
      ).toBe(false);
    });
  });

  describe('Sorting Colors', () => {
    const colors = [
      { hex: '#000000', name: 'Black' },
      { hex: '#ffffff', name: 'White' },
      { hex: '#888888', name: 'Grey' },
    ];

    it('sortColorsLightToDark', () => {
      const sorted = sortColorsLightToDark({ colors: [...colors] as any });
      expect(sorted[0].hex).toBe('#ffffff');
      expect(sorted[2].hex).toBe('#000000');
    });

    it('sortColorsDarktoLight', () => {
      const sorted = sortColorsDarktoLight({ colors: [...colors] as any });
      expect(sorted[0].hex).toBe('#000000');
      expect(sorted[2].hex).toBe('#ffffff');
    });

    it('sortColorsByName', () => {
      const sorted = sortColorsByName({ colors: [...colors] as any });
      expect(sorted[0].name).toBe('Black');
      expect(sorted[2].name).toBe('White');
    });

    it('sortColorsByNameZtoA', () => {
      const sorted = sortColorsByNameZtoA({ colors: [...colors] as any });
      expect(sorted[0].name).toBe('White');
      expect(sorted[2].name).toBe('Black');
    });
  });
});
