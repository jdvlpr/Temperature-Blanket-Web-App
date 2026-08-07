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

import {
  PUBLIC_AFFILIATE_BASE_URL,
  PUBLIC_AFFILIATE_YARNS,
} from '$env/static/public';
import type {
  AffiliateYarn,
  AffiliateYarnCompressed,
  Brand,
  Color,
} from '$lib/types/yarn-types';
import chroma from 'chroma-js';

// The yarn brand dataset (~1.2MB) is heavy, so it's kept out of every
// static import graph and only fetched here, on demand, via ensureYarnData().
// Everything below reads these warmed, module-level caches synchronously.
let brands = $state<Brand[]>([]);
let colorwaysWithAffiliateLinks = $state<Color[]>([]);
let allColorways = $state<Color[]>([]);
let loadPromise: Promise<void> | null = null;

/**
 * Dynamically imports the yarn brand dataset and derives the colorway
 * lookups from it. Safe to call repeatedly/concurrently -- the import and
 * derivation only run once.
 */
export function ensureYarnData(): Promise<void> {
  if (!loadPromise) loadPromise = loadYarnData();
  return loadPromise;
}

async function loadYarnData(): Promise<void> {
  const { brands: loadedBrands } = await import('$lib/data/yarns/brands');
  const affiliateYarnsMap = getAffiliateYarns();
  brands = loadedBrands;
  colorwaysWithAffiliateLinks = buildColorwaysWithAffiliateLinks(
    loadedBrands,
    affiliateYarnsMap,
  );
  allColorways = buildAllColorways(loadedBrands);
}

export function getBrands(): Brand[] {
  return brands;
}

export function getColorwaysWithAffiliateLinks(): Color[] {
  return colorwaysWithAffiliateLinks;
}

export function getAllColorways(): Color[] {
  return allColorways;
}

export function isYarnDataLoaded(): boolean {
  return brands.length > 0;
}

/**
 * Get all affiliate yarns as a map keyed by brandId:yarnId
 */
function getAffiliateYarns(): Map<string, AffiliateYarn> | null {
  if (!PUBLIC_AFFILIATE_YARNS) return null;
  const parsed = JSON.parse(PUBLIC_AFFILIATE_YARNS);
  if (!parsed) return null;
  const locationCode = getLocationCode();
  const map = new Map<string, AffiliateYarn>();

  parsed.forEach((affiliateYarn: AffiliateYarnCompressed) => {
    const usHref = affiliateYarn.a?.us || null;
    const otherHref = affiliateYarn.a?.other || null;

    const affiliateVariantBaseHref =
      locationCode === 'us' ? usHref || otherHref : otherHref || usHref;

    const affiliate_variant_base_href = `${PUBLIC_AFFILIATE_BASE_URL}-${affiliateVariantBaseHref}`;

    let yarn: AffiliateYarn = {
      brand_id: affiliateYarn.b,
      yarn_id: affiliateYarn.y,
      affiliate_variant_base_href,
    };

    if (affiliateYarn?.c && affiliateYarn?.c.length > 0) {
      yarn = {
        ...yarn,
        colors: affiliateYarn.c.map((color) => {
          const usVariantHref = color?.v?.us || null;
          const otherVariantHref = color?.v?.other || null;

          const colorVariantHref =
            locationCode === 'us'
              ? usVariantHref || otherVariantHref
              : otherVariantHref || usVariantHref;

          const affiliate_variant_href = colorVariantHref
            ? affiliate_variant_base_href + colorVariantHref
            : affiliate_variant_base_href;
          return {
            affiliate_variant_href,
            name: color.n,
          };
        }),
      };
    }
    map.set(`${yarn.brand_id}-${yarn.yarn_id}`, yarn);
  });
  return map;
}

/**
 * Get all colorways with affiliate links
 *
 * @return {Color[]} The colorways with affiliate links
 */
function buildColorwaysWithAffiliateLinks(
  brandsList: Brand[],
  affiliateYarnsMap: Map<string, AffiliateYarn> | null,
): Color[] {
  return brandsList.flatMap((brand) => {
    return brand.yarns.flatMap((yarn) => {
      // Find matching affiliate data for the current yarn in O(1)
      const affiliateYarn =
        affiliateYarnsMap?.get(`${brand.id}-${yarn.id}`) || null;

      // Create a map of affiliate colors for O(1) lookup if colors exist
      const affiliateColorsMap = new Map<string, string>();
      if (affiliateYarn?.colors) {
        affiliateYarn.colors.forEach((c) => {
          if (c.affiliate_variant_href) {
            affiliateColorsMap.set(c.name, c.affiliate_variant_href);
          }
        });
      }

      const affiliateVariantBaseHref =
        affiliateYarn?.affiliate_variant_base_href || null;

      return yarn.colorways.flatMap((colorway) => {
        const unavailable = !!colorway.source?.unavailable;

        return colorway.colors.map((color) => {
          // Resolve the specific affiliate link for this color variant
          const affiliate_variant_href =
            (color.name && affiliateColorsMap.get(color.name)) ||
            affiliateVariantBaseHref;

          const variant_href = color?.variant_href || colorway.source.href;
          // Normalize hex values using chroma
          const hex = chroma(color.hex).hex();

          return {
            ...color,
            hex,
            affiliate_variant_href,
            variant_href,
            brandName: brand.name,
            brandId: brand.id,
            yarnId: yarn.id,
            yarnName: yarn.name,
            yarnWeightId: yarn.weightId,
            unavailable,
          };
        });
      });
    });
  });
}

function buildAllColorways(brandsList: Brand[]): Color[] {
  return brandsList.flatMap((brand) => {
    return brand.yarns.flatMap((yarn) => {
      return yarn.colorways.flatMap((colorway) => {
        return colorway.colors.map((color) => {
          const href = color?.variant_href || colorway.source.href;
          const hex = chroma(color.hex).hex();
          return {
            name: color.name,
            hex,
            brandId: brand.id,
            brandName: brand.name,
            yarnId: yarn.id,
            yarnName: yarn.name,
            yarnWeightId: yarn.weightId,
            dateAccessed: colorway.source.accessed,
            href,
            unavailable: !!colorway.source?.unavailable || undefined,
            unavailableDate: colorway.source?.unavailable || undefined,
          };
        });
      });
    });
  });
}

/**
 * Get the location code based on the user's language
 * This is a guess, but it should be accurate enough for our purposes, to give the user the correct affiliate links
 *
 * @return { 'us' | 'other' } The location code
 */
function getLocationCode(): 'us' | 'other' {
  if (typeof window === 'undefined') return 'us';
  if (!window.navigator?.language) return 'us';
  const lastTwoLetters = window.navigator.language.slice(-2);
  return lastTwoLetters.toLowerCase() === 'us' ? 'us' : 'other';
}
