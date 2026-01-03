import { describe, expect, it, vi } from 'vitest';
import {
  stringToBrandAndYarnDetails,
  getColorPropertiesFromYarnStringAndHex,
  paletteContiansSomeNamedColorways,
  paletteContiansAllNamedColorways,
  getFilteredYarns,
  getColorways,
} from './yarn-utils';

// Mock constants and yarns data
vi.mock('$lib/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('$lib/constants')>();
  return {
    ...actual,
    ALL_COLORWAYS_WITH_AFFILIATE_LINKS: [
      {
        brandId: 'brand1',
        yarnId: 'yarn1',
        yarnWeightId: 'weight1',
        hex: '#ff0000',
        name: 'Red',
        brandName: 'Brand 1',
        yarnName: 'Yarn 1',
      },
      {
        brandId: 'brand1',
        yarnId: 'yarn2',
        yarnWeightId: 'weight2',
        hex: '#00ff00',
        name: 'Green',
        brandName: 'Brand 1',
        yarnName: 'Yarn 2',
      },
      {
        brandId: 'brand2',
        yarnId: 'yarn3',
        yarnWeightId: 'weight1',
        hex: '#0000ff',
        name: 'Blue',
        brandName: 'Brand 2',
        yarnName: 'Yarn 3',
      },
    ],
  };
});

vi.mock('$lib/yarns/brands', () => ({
  brands: [
    {
      id: 'brand1',
      name: 'Brand 1',
      yarns: [
        {
          id: 'yarn1',
          name: 'Yarn 1',
          colorways: [
            {
              colors: [{ hex: '#ff0000', name: 'Red' }],
            },
          ],
        },
        {
          id: 'yarn2',
          name: 'Yarn 2',
          colorways: [],
        },
      ],
    },
    {
      id: 'brand2',
      name: 'Brand 2',
      yarns: [
        {
          id: 'yarn3',
          name: 'Yarn 3',
          colorways: [],
        },
      ],
    },
  ],
}));

describe('yarn-utils', () => {
  describe('stringToBrandAndYarnDetails', () => {
    it('should parse a valid brand-yarn string', () => {
      const result = stringToBrandAndYarnDetails('brand1-yarn1');
      expect(result.brandId).toBe('brand1');
      expect(result.yarnId).toBe('yarn1');
      expect(result.brandName).toBe('Brand 1');
      expect(result.yarnName).toBe('Yarn 1');
    });

    it('should return nulls for unknown brand or yarn', () => {
      const result = stringToBrandAndYarnDetails('unknown-unknown');
      expect(result.brandId).toBe('unknown');
      expect(result.brandName).toBeNull();
    });

    it('should handle missing separator', () => {
      const result = stringToBrandAndYarnDetails('invalid');
      expect(result.brandId).toBe('invalid');
      expect(result.yarnId).toBeNull();
    });
  });

  describe('getColorPropertiesFromYarnStringAndHex', () => {
    it('should return combined properties', () => {
      const result = getColorPropertiesFromYarnStringAndHex({
        yarnString: 'brand1-yarn1',
        hex: '#ff0000',
      });
      expect(result).not.toBeNull();
      expect(result!.hex).toBe('#ff0000');
      expect(result!.brandName).toBe('Brand 1');
      expect(result!.yarnName).toBe('Yarn 1');
    });
  });

  describe('paletteContiansSomeNamedColorways', () => {
    it('should return true if some colorways have names', () => {
      const palette = ['#ff0000', '#00ff00'];
      expect(
        paletteContiansSomeNamedColorways({
          palette: palette as any,
          brandId: 'brand1',
          yarnId: 'yarn1',
        }),
      ).toBe(true);
    });
  });

  describe('paletteContiansAllNamedColorways', () => {
    it('should return false if some colorways are missing names', () => {
      const palette = ['#ff0000', '#00ff00'];
      expect(
        paletteContiansAllNamedColorways({
          palette: palette as any,
          brandId: 'brand1',
          yarnId: 'yarn1',
        }),
      ).toBe(false); // Green is not in yarn1
    });

    it('should return true if all colorways have names', () => {
      const palette = ['#ff0000'];
      expect(
        paletteContiansAllNamedColorways({
          palette: palette as any,
          brandId: 'brand1',
          yarnId: 'yarn1',
        }),
      ).toBe(true);
    });
  });

  describe('getFilteredYarns', () => {
    it('should return all yarns if no brand selected', () => {
      const result = getFilteredYarns({ selectedBrandId: null });
      expect(result).toHaveLength(3); // 2 from brand1, 1 from brand2
    });

    it('should return only yarns for specific brand', () => {
      const result = getFilteredYarns({ selectedBrandId: 'brand1' });
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('yarn1');
      expect(result[1].id).toBe('yarn2');
    });
  });

  describe('getColorways', () => {
    it('should return all colorways if no filters provided', () => {
      const result = getColorways({} as any);
      expect(result).toHaveLength(3);
    });

    it('should filter by brand', () => {
      const result = getColorways({
        selectedBrandId: 'brand1',
        selectedYarnId: null,
        selectedYarnWeightId: null,
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by yarn', () => {
      const result = getColorways({
        selectedBrandId: null,
        selectedYarnId: 'yarn1',
        selectedYarnWeightId: null,
      });
      expect(result).toHaveLength(1);
      expect(result[0].yarnId).toBe('yarn1');
    });

    it('should filter by weight', () => {
      const result = getColorways({
        selectedBrandId: null,
        selectedYarnId: null,
        selectedYarnWeightId: 'weight1',
      });
      expect(result).toHaveLength(2); // Red (brand1,yarn1) and Blue (brand2,yarn3)
    });

    it('should combine filters', () => {
      const result = getColorways({
        selectedBrandId: 'brand1',
        selectedYarnId: 'yarn1',
        selectedYarnWeightId: 'weight1',
      });
      expect(result).toHaveLength(1);
    });
  });
});
