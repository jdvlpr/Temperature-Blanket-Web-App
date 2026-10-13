import { describe, expect, it } from 'vitest';
import { sharedPaletteFrom } from './shared-palette-utils.js';

const yarnUrls = JSON.stringify([
  'https://temperature-blanket.com/yarn?s=ff000000ff000000ff',
]);

describe('sharedPaletteFrom', () => {
  it('links on this site, with no name unless given', () => {
    const palette = sharedPaletteFrom(yarnUrls);
    expect(palette?.colors).toHaveLength(3);
    expect(palette?.href).toBe('/yarn?s=ff000000ff000000ff');
  });

  it('adds the title as name, encoded', () => {
    expect(sharedPaletteFrom(yarnUrls, 'Autumn & “Rust” #1')?.href).toBe(
      '/yarn?s=ff000000ff000000ff&name=Autumn%20%26%20%E2%80%9CRust%E2%80%9D%20%231',
    );
  });

  it("is null when the link can't be read", () => {
    expect(sharedPaletteFrom('not json', 'Name')).toBeNull();
  });
});
