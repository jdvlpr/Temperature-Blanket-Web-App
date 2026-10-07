import { describe, expect, it, vi } from 'vitest';
import {
  colorsToCode,
  colorsToPaletteCode,
  colorsToYarnDetails,
  getColorInfo,
  getColorsFromInput,
  readPastedColors,
  getPaletteFallbackName,
  getTextColor,
  getSortedPalette,
  getYarnPageURL,
  reverseColors,
  reversedSort,
  sortColorsByName,
  sortColorsByNameZtoA,
  sortColorsDarktoLight,
  sortColorsLightToDark,
  sortColorsWarmToCool,
  yarnDetailsToColors,
  sameColorList,
} from './color-utils';

// Mocking $lib modules
vi.mock('$lib/state/gauges-state.svelte', () => ({
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
  getTargetParentGaugeId: vi.fn((param) => {
    if (param === 'tmax') return 'tmax_gauge';
    return param;
  }),
}));

vi.mock('$lib/state/project-state.svelte', () => ({
  project: {
    url: { href: 'http://localhost/?project=123' },
  },
}));

vi.mock('$lib/utils/number-utils', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    isValueInRange: vi.fn(
      ({ value, range }) => value >= range.from && value <= range.to,
    ),
  };
});

vi.mock('$lib/utils/yarn-utils', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
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
      const colors = [
        { hex: '#ff0000' as Lowercase<string>, brandId: 'b1', yarnId: 'y1' },
      ];
      const result = colorsToYarnDetails({ colors });
      expect(typeof result).toBe('string');
    });
  });

  describe('yarnDetailsToColors', () => {
    it('should apply yarn details to colors', () => {
      const colors = [{ hex: '#ff0000' as Lowercase<string> }];
      const string = 'brand1-yarn1(0)'; // apply brand1-yarn1 to index 0
      const result = yarnDetailsToColors({ string, colors });
      expect(result[0].brandId).toBe('brand1');
    });

    it('should handle simple yarn string without parenthesis', () => {
      const colors = [{ hex: '#ff0000' as Lowercase<string> }];
      const string = 'brand1-yarn1';
      const result = yarnDetailsToColors({ string, colors });
      expect(result[0].brandId).toBe('brand1');
    });

    it('should handle empty or invalid strings', () => {
      const colors = [{ hex: '#ff0000' as Lowercase<string> }];
      expect(yarnDetailsToColors({ string: '', colors })).toBe(colors);
      expect(yarnDetailsToColors({ string: ' ', colors })).toBe(colors);
    });
  });

  describe('colorsToCode', () => {
    it('should generate palette code', () => {
      const colors = [
        { hex: '#ff0000' as Lowercase<string> },
        { hex: '#00ff00' as Lowercase<string> },
      ];
      expect(colorsToCode(colors)).toBe('palette:ff000000ff00');
    });

    it('should respect includePrefixes option', () => {
      const colors = [{ hex: '#ff0000' as Lowercase<string> }];
      expect(colorsToCode(colors, { includePrefixes: false })).toBe('ff0000');
    });
  });

  describe('readPastedColors', () => {
    const hexes = (text: string) =>
      readPastedColors(text).colors.map((color) => color.hex);

    it('reads nothing from empty text', () => {
      expect(readPastedColors('  ')).toEqual({ colors: [], unreadable: [] });
    });

    it('reads one color per line, whatever the names', () => {
      expect(hexes('red\nlightblue')).toEqual(['#ff0000', '#add8e6']);
      expect(hexes('red,\nblue')).toEqual(['#ff0000', '#0000ff']);
      expect(hexes('#FF0000\r\n#00FF00\n')).toEqual(['#ff0000', '#00ff00']);
    });

    it('reads tabs and semicolons, as from a spreadsheet', () => {
      expect(hexes('#ff0000\t#00ff00')).toEqual(['#ff0000', '#00ff00']);
      expect(hexes('red;blue')).toEqual(['#ff0000', '#0000ff']);
    });

    it('reads rgb() and hsl() colors, commas and all', () => {
      expect(hexes('rgb(255, 0, 0), hsl(240, 100%, 50%)')).toEqual([
        '#ff0000',
        '#0000ff',
      ]);
    });

    it('reads names written as more than one word', () => {
      expect(hexes('dark blue, light goldenrod yellow')).toEqual([
        '#00008b',
        '#fafad2',
      ]);
      expect(hexes('red light blue')).toEqual(['#ff0000', '#add8e6']);
    });

    it('reads a copied array', () => {
      expect(hexes('["#ff0000", "#00ff00"]')).toEqual(['#ff0000', '#00ff00']);
    });

    it('keeps the colors it can read, and names the rest', () => {
      expect(readPastedColors('red, orange, blu')).toEqual({
        colors: [{ hex: '#ff0000' }, { hex: '#ffa500' }],
        unreadable: ['blu'],
      });
    });

    it('still reads codes and links', () => {
      expect(hexes('palette:ff0000ffa500')).toEqual(['#ff0000', '#ffa500']);
      expect(hexes('https://coolors.co/ff0000-00ff00')).toEqual([
        '#ff0000',
        '#00ff00',
      ]);
      expect(hexes('FF0000-FFA500-ADD8E6')).toEqual([
        '#ff0000',
        '#ffa500',
        '#add8e6',
      ]);
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

  describe('colorsToPaletteCode', () => {
    it('adds yarn details only when colors have them', () => {
      expect(
        colorsToPaletteCode([{ hex: '#ff0000' }, { hex: '#00ff00' }]),
      ).toBe('palette:ff000000ff00');
      expect(
        colorsToPaletteCode([
          { hex: '#ff0000', brandId: 'brand1', yarnId: 'yarn1' },
          { hex: '#00ff00', brandId: 'brand1', yarnId: 'yarn1' },
        ]),
      ).toBe('palette:ff000000ff00yarn:brand1-yarn1');
    });

    it('round-trips through getColorsFromInput', () => {
      const colors = getColorsFromInput({
        string: colorsToPaletteCode([
          { hex: '#ff0000', brandId: 'brand1', yarnId: 'yarn1' },
        ]),
      });
      expect(colors).toEqual([
        expect.objectContaining({
          hex: '#ff0000',
          brandId: 'brand1',
          yarnId: 'yarn1',
        }),
      ]);
    });
  });

  describe('getYarnPageURL', () => {
    it('builds a /yarn link with optional yarn details and version', () => {
      expect(
        getYarnPageURL({
          colors: [{ hex: '#ff0000' }],
          origin: 'https://x.test',
        }),
      ).toBe('https://x.test/yarn?s=ff0000');
      expect(
        getYarnPageURL({
          colors: [{ hex: '#ff0000', brandId: 'brand1', yarnId: 'yarn1' }],
          origin: 'https://x.test',
          version: '6.3.2',
        }),
      ).toBe('https://x.test/yarn?s=ff0000&f=brand1-yarn1&v=6.3.2');
    });

    it('opens as the same colors in getColorsFromInput', () => {
      const url = getYarnPageURL({
        colors: [{ hex: '#ff0000', brandId: 'brand1', yarnId: 'yarn1' }],
        origin: 'https://x.test',
      });
      expect(getColorsFromInput({ string: url })).toEqual([
        expect.objectContaining({ hex: '#ff0000', brandId: 'brand1' }),
      ]);
    });
  });

  describe('getPaletteFallbackName', () => {
    const yarn = (brandName: string, yarnName: string) => ({
      hex: '#ff0000',
      brandName,
      yarnName,
    });

    it('uses the color count when there is no yarn', () => {
      expect(getPaletteFallbackName([{ hex: '#ff0000' }])).toBe('1 color');
      expect(
        getPaletteFallbackName([{ hex: '#ff0000' }, { hex: '#00ff00' }]),
      ).toBe('2 colors');
    });

    it('names a single yarn', () => {
      expect(
        getPaletteFallbackName([
          yarn('Bernat', 'Super Value'),
          yarn('Bernat', 'Super Value'),
          { hex: '#000000' },
        ]),
      ).toBe('Bernat Super Value, 3 colors');
    });

    it('counts the other yarns', () => {
      expect(
        getPaletteFallbackName([
          yarn('Bernat', 'Super Value'),
          yarn('Lion Brand', 'Pound of Love'),
          yarn('Red Heart', 'Super Saver'),
        ]),
      ).toBe('Bernat Super Value + 2 more yarns, 3 colors');
    });
  });
});

describe('reverseColors', () => {
  const hexes = (colors: { hex?: string }[]) => colors.map((n) => n.hex);

  it('keeps locked colors where they are', () => {
    const colors = [
      { hex: '#111111' },
      { hex: '#222222', locked: true },
      { hex: '#333333' },
      { hex: '#444444' },
    ];
    expect(hexes(reverseColors(colors))).toEqual([
      '#444444',
      '#222222',
      '#333333',
      '#111111',
    ]);
  });

  it('turns a sort into that sort the other way round', () => {
    const colors = [
      { hex: '#808080' },
      { hex: '#000000', locked: true },
      { hex: '#ffffff' },
      { hex: '#404040' },
    ];
    const lightFirst = getSortedPalette({
      palette: colors,
      sortColors: 'light-to-dark',
    });
    expect(hexes(reverseColors(lightFirst))).toEqual(
      hexes(getSortedPalette({ palette: colors, sortColors: 'dark-to-light' })),
    );
  });
});

describe('reversedSort', () => {
  it('pairs each sort with its other direction', () => {
    expect(reversedSort('warm-to-cool')).toBe('cool-to-warm');
    expect(reversedSort('dark-to-light')).toBe('light-to-dark');
    expect(reversedSort('name')).toBe('name-z-to-a');
    expect(reversedSort('rainbow')).toBe('custom');
  });
});

describe('sortColorsWarmToCool', () => {
  const hexes = (colors: { hex?: string }[]) => colors.map((n) => n.hex);
  // A ramp from yellow through red to blue, shuffled
  const shuffled = ['#ff0000', '#0000ff', '#ffff00', '#aa0055', '#ff8000'].map(
    (hex) => ({ hex }),
  );

  it('blends from the warm end to the cool end', () => {
    expect(hexes(sortColorsWarmToCool({ colors: shuffled }))).toEqual([
      '#ffff00',
      '#ff8000',
      '#ff0000',
      '#aa0055',
      '#0000ff',
    ]);
  });

  it('starts from the cool end when asked', () => {
    expect(
      hexes(sortColorsWarmToCool({ colors: shuffled, warmFirst: false })),
    ).toEqual(['#0000ff', '#aa0055', '#ff0000', '#ff8000', '#ffff00']);
  });

  it('keeps locked colors in place', () => {
    const colors = [{ hex: '#0000ff', locked: true }, ...shuffled.slice(2)];
    const sorted = sortColorsWarmToCool({ colors });
    expect(sorted[0]).toEqual({ hex: '#0000ff', locked: true });
    expect(sorted).toHaveLength(colors.length);
  });
});

describe('sameColorList', () => {
  const colors = [
    { hex: '#ff0000', name: 'Red', brandId: 'b', yarnId: 'y' },
    { hex: '#00ff00' },
  ];

  it('ignores ids a sortable list adds', () => {
    expect(
      sameColorList(
        colors,
        colors.map((color, id) => ({ ...color, id })),
      ),
    ).toBe(true);
  });

  it('sees a new order, color or length', () => {
    expect(sameColorList(colors, [...colors].reverse())).toBe(false);
    expect(sameColorList(colors, [colors[0], { hex: '#0000ff' }])).toBe(false);
    expect(sameColorList(colors, colors.slice(1))).toBe(false);
  });
});
