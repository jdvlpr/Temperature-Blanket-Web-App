import { describe, expect, it } from 'vitest';
import { iconColorOn, linkSite } from './colorway-utils';

describe('iconColorOn', () => {
  it('picks black on mid-tone pinks, where white falls under 3:1', () => {
    expect(iconColorOn('#ea7196')).toBe('black');
    expect(iconColorOn('#c88990')).toBe('black');
  });

  it('picks white on dark colors and black on light ones', () => {
    expect(iconColorOn('#1c3c29')).toBe('white');
    expect(iconColorOn('#e9e0cd')).toBe('black');
  });

  it('falls back to black without a valid color', () => {
    expect(iconColorOn(undefined)).toBe('black');
    expect(iconColorOn('not a color')).toBe('black');
  });
});

describe('linkSite', () => {
  it("names a link's site without www", () => {
    expect(linkSite('https://www.garnstudio.com/yarn.php?id=1')).toBe(
      'garnstudio.com',
    );
    expect(linkSite('https://hobbii.com/some-yarn')).toBe('hobbii.com');
  });

  it("is undefined for something that isn't a web address", () => {
    expect(linkSite('not a link')).toBeUndefined();
  });
});
