// Copyright (c) 2026, Thomas (https://github.com/jdvlpr)
//
// This file is part of Temperature-Blanket-Web-App.
//
// Temperature-Blanket-Web-App is free software: you can redistribute it and/or modify it
// under the terms of the GNU General Public License as published by the Free Software Foundation,
// either version 3 of the License, or (at your option) any later version.
//
// Temperature-Blanket-Web-App is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// See the GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License along with Temperature-Blanket-Web-App.
// If not, see <https://www.gnu.org/licenses/>.

import { describe, expect, it } from 'vitest';
import { mainSitePath, showsBetaWarning } from './beta-warning.js';

describe('mainSitePath', () => {
  it('keeps pages the main site has', () => {
    expect(mainSitePath('/')).toBe('/');
    expect(mainSitePath('/weather')).toBe('/weather');
    expect(mainSitePath('/yarn/')).toBe('/yarn');
    expect(mainSitePath('/gallery')).toBe('/gallery');
    expect(mainSitePath('/gallery/12345')).toBe('/gallery/12345');
    expect(mainSitePath('/api/yarn-colorways')).toBe('/api/yarn-colorways');
  });

  it('goes to the nearest section for pages only the beta has', () => {
    expect(mainSitePath('/gallery/palettes')).toBe('/gallery');
    expect(mainSitePath('/gallery/palette/12')).toBe('/gallery');
    expect(mainSitePath('/gallery/by/abc')).toBe('/gallery');
    expect(mainSitePath('/documentation/guides/plan-a-blanket')).toBe(
      '/documentation',
    );
    expect(mainSitePath('/whats-new/version-7')).toBe('/changelog');
  });

  it('goes home for sections the main site lacks', () => {
    expect(mainSitePath('/my-projects')).toBe('/');
    expect(mainSitePath('/account')).toBe('/');
    expect(mainSitePath('/preferences')).toBe('/');
  });
});

describe('showsBetaWarning', () => {
  it('stays off the beta pages', () => {
    expect(showsBetaWarning('/beta')).toBe(false);
    expect(showsBetaWarning('/beta/import')).toBe(false);
    expect(showsBetaWarning('/')).toBe(true);
    expect(showsBetaWarning('/beta-ish')).toBe(true);
  });
});
