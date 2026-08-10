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
import {
  ensureYarnData,
  getAllColorways,
  getBrands,
  getColorwaysWithAffiliateLinks,
  isYarnDataLoaded,
} from './colorways.svelte';
import { getColorName } from '$lib/utils/color-utils';
import { getColorPropertiesFromYarnStringAndHex } from '$lib/utils/yarn-utils';

// Regression coverage for the B1 lazy-load split: `getBrands`/`getColorwaysWithAffiliateLinks`/
// `getAllColorways` must start empty (nothing has warmed the module-level cache yet) and only
// resolve to the real dataset once `ensureYarnData()` has been awaited -- and downstream
// consumers (`yarn-utils.ts`) must resolve the same values against that warmed cache as they
// did before the dataset was split out of the static import graph.
//
// These tests share one module instance and run in declaration order (the "before load" checks
// must run first) rather than resetting modules between tests, since resetting this module also
// tears down the `$env`/`$lib` virtual module graph it depends on and hangs under Vitest.

describe('colorways.svelte', () => {
  it('getters are empty before ensureYarnData() resolves', () => {
    expect(getBrands()).toEqual([]);
    expect(getColorwaysWithAffiliateLinks()).toEqual([]);
    expect(getAllColorways()).toEqual([]);
    expect(isYarnDataLoaded()).toBe(false);
  });

  it('is safe to call concurrently -- both calls share one in-flight load', async () => {
    const first = ensureYarnData();
    const second = ensureYarnData();
    expect(first).toBe(second); // same promise, not a duplicate load
    await first;
  });

  it('populates all three getters from the real dataset after ensureYarnData()', async () => {
    await ensureYarnData();

    const brands = getBrands();
    const withAffiliateLinks = getColorwaysWithAffiliateLinks();
    const all = getAllColorways();

    expect(brands.length).toBeGreaterThan(0);
    expect(withAffiliateLinks.length).toBeGreaterThan(0);
    expect(all.length).toBeGreaterThan(0);
    // Both derived lists flatMap the same brand -> yarn -> colorway -> color
    // tree, just with different fields attached, so they must stay the same length.
    expect(all.length).toBe(withAffiliateLinks.length);
    expect(isYarnDataLoaded()).toBe(true);
  });

  it('ensureYarnData() does not reload once warmed', async () => {
    const brandsBefore = getBrands();
    await ensureYarnData();
    expect(getBrands()).toBe(brandsBefore); // unchanged reference, no reload
  });

  it('getColorPropertiesFromYarnStringAndHex resolves a real colorway once warmed', () => {
    const [sample] = getAllColorways();
    expect(sample).toBeDefined();

    const result = getColorPropertiesFromYarnStringAndHex({
      yarnString: `${sample.brandId}-${sample.yarnId}`,
      hex: sample.hex,
    });

    expect(result).not.toBeNull();
    expect(result!.brandId).toBe(sample.brandId);
    expect(result!.yarnId).toBe(sample.yarnId);
    expect(result!.hex).toBe(sample.hex);
  });

  it('getColorName resolves the generic hex-based name when no brand/yarn is given', () => {
    const name = getColorName({
      color: '#ff0000',
      brandId: undefined,
      yarnId: undefined,
    });
    expect(typeof name).toBe('string');
    expect(name!.length).toBeGreaterThan(0);
  });

  it('getColorName resolves the real colorway name for a matching brand/yarn/hex', () => {
    const [sample] = getAllColorways();
    expect(sample).toBeDefined();

    const name = getColorName({
      color: sample.hex,
      brandId: sample.brandId,
      yarnId: sample.yarnId,
    });

    expect(name).toBe(sample.name);
  });
});
