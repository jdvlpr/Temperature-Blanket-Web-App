// Copyright (c) 2024 - 2026, Thomas (https://github.com/jdvlpr)
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
import { safeRedirect } from './redirect';

describe('safeRedirect', () => {
  it('keeps paths on this site', () => {
    expect(safeRedirect('/gallery')).toBe('/gallery');
    expect(safeRedirect('/?project=1#l=abc')).toBe('/?project=1#l=abc');
  });

  it('falls back to the account page', () => {
    expect(safeRedirect(null)).toBe('/account');
    expect(safeRedirect('')).toBe('/account');
    expect(safeRedirect('/auth/sign-in')).toBe('/account');
  });

  it('never leaves the site', () => {
    for (const value of [
      'https://evil.example',
      '//evil.example',
      '/\\evil.example',
      'javascript:alert(1)',
      'evil.example',
    ])
      expect(safeRedirect(value)).toBe('/account');
  });
});
