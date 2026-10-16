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
import { randomCraftName } from './craft-names';

describe('randomCraftName', () => {
  it('is two words and a two-digit number', () => {
    for (let i = 0; i < 200; i++)
      expect(randomCraftName()).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+ [1-9]\d$/);
  });

  it('covers both ends of each list', () => {
    expect(randomCraftName(() => 0)).toBe('Amber Acorn 10');
    expect(randomCraftName(() => 0.9999)).toBe('Woolly Yarn 99');
  });
});
