import { describe, expect, it, vi } from 'vitest';
import {
  extraColorDetailsFromUrlHash,
  extraColorsFromProjectHref,
  extraColorsHaveYarnDetails,
  extraColorsToUrlHash,
  parseExtraColorsUrlHash,
  resolveExtraColors,
  withExtraColorDetails,
} from './extra-colors-utils';

vi.mock('$lib/utils/yarn-utils', () => ({
  getColorPropertiesFromYarnStringAndHex: ({
    yarnString,
    hex,
  }: {
    yarnString: string;
    hex: string;
  }) =>
    yarnString === 'brand_1-yarn_1' && hex === '#f0f3f3'
      ? {
          hex,
          name: 'Cloud',
          brandId: 'brand_1',
          brandName: 'Brand 1',
          yarnId: 'yarn_1',
          yarnName: 'Yarn 1',
        }
      : null,
}));

const cloud = {
  hex: '#f0f3f3',
  name: 'Cloud',
  brandId: 'brand_1',
  brandName: 'Brand 1',
  yarnId: 'yarn_1',
  yarnName: 'Yarn 1',
};

describe('withExtraColorDetails', () => {
  it('keeps yarn details when the hex still matches', () => {
    expect(withExtraColorDetails('#F0F3F3', cloud)).toEqual({
      ...cloud,
      hex: '#F0F3F3',
    });
  });

  it('drops yarn details when the hex changed', () => {
    expect(withExtraColorDetails('#000000', cloud)).toEqual({
      hex: '#000000',
    });
  });

  it('returns just the hex with no details', () => {
    expect(withExtraColorDetails('#000000', undefined)).toEqual({
      hex: '#000000',
    });
  });
});

describe('resolveExtraColors', () => {
  it('only includes colors that are in use', () => {
    const extras = resolveExtraColors(
      [
        { role: 'accent', label: 'Accent', hex: '#f0f3f3', inUse: true },
        { role: 'border', label: 'Border', hex: '#e8e3e2', inUse: false },
      ],
      { accent: cloud },
    );
    expect(extras).toEqual([{ role: 'accent', label: 'Accent', color: cloud }]);
  });
});

describe('extraColorsToUrlHash', () => {
  it('returns an empty string with no extra colors', () => {
    expect(extraColorsToUrlHash([])).toBe('');
  });

  it('encodes role, hex, and yarn details', () => {
    expect(
      extraColorsToUrlHash([
        { role: 'accent', label: 'Accent', color: cloud },
        { role: 'border', label: 'Border', color: { hex: '#E8E3E2' } },
      ]),
    ).toBe('&x=af0f3f3brand_1-yarn_1!be8e3e2');
  });
});

describe('parseExtraColorsUrlHash', () => {
  it('parses entries', () => {
    expect(parseExtraColorsUrlHash('af0f3f3brand_1-yarn_1!be8e3e2')).toEqual([
      { role: 'accent', hex: '#f0f3f3', yarn: 'brand_1-yarn_1' },
      { role: 'border', hex: '#e8e3e2', yarn: '' },
    ]);
  });

  it('ignores unknown roles, invalid hexes, and duplicate roles', () => {
    expect(parseExtraColorsUrlHash('zf0f3f3!bzzzzzz!af0f3f3!a000000')).toEqual([
      { role: 'accent', hex: '#f0f3f3', yarn: '' },
    ]);
  });

  it('handles an empty value', () => {
    expect(parseExtraColorsUrlHash('')).toEqual([]);
  });
});

describe('extraColorDetailsFromUrlHash', () => {
  it('looks up yarn details by hex, like gauges', () => {
    expect(
      extraColorDetailsFromUrlHash('af0f3f3brand_1-yarn_1!be8e3e2'),
    ).toEqual({ accent: cloud, border: { hex: '#e8e3e2' } });
  });

  it('round-trips through the URL hash', () => {
    const hash = extraColorsToUrlHash([
      { role: 'accent', label: 'Accent', color: cloud },
    ]);
    const value = hash.substring('&x='.length);
    expect(extraColorDetailsFromUrlHash(value).accent).toEqual(cloud);
  });
});

describe('extraColorsHaveYarnDetails', () => {
  it('is true only when an entry references yarn', () => {
    expect(
      extraColorsHaveYarnDetails({ x: { value: 'af0f3f3brand_1-yarn_1' } }),
    ).toBe(true);
    expect(extraColorsHaveYarnDetails({ x: { value: 'af0f3f3' } })).toBe(false);
    expect(extraColorsHaveYarnDetails({})).toBe(false);
  });
});

describe('extraColorsFromProjectHref', () => {
  it('reads the x param from a project URL', () => {
    const extras = extraColorsFromProjectHref(
      'https://example.com/?project=1#l=abc&temp=ff0000&sqrs=tmax(3)&x=af0f3f3brand_1-yarn_1',
    );
    expect(extras).toEqual([
      { role: 'accent', label: 'Accent Color', color: cloud },
    ]);
  });

  it('returns nothing for projects saved before the x param', () => {
    expect(
      extraColorsFromProjectHref('https://example.com/?project=1#l=abc'),
    ).toEqual([]);
    expect(extraColorsFromProjectHref('not a url')).toEqual([]);
  });
});
