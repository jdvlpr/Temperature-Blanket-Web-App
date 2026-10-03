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
  getBrands,
  getColorwaysWithAffiliateLinks,
} from '$lib/data/yarns/colorways.svelte';
import type { Color, Yarn } from '$lib/types/yarn-types';

/**
 * [getColorPropertiesFromYarnStringAndHex description]
 *
 * @param   {string}  yarnString  brandId-yarnId
 * @param   {string}  hex         #ffffff
 *
 * @return  {object}              color object
 */
export const getColorPropertiesFromYarnStringAndHex = ({
  yarnString,
  hex,
}: {
  yarnString: string;
  hex: Color['hex'];
}): Color | null => {
  const { brandId, yarnId } = stringToBrandAndYarnDetails(yarnString);

  const matchingColor = getColorwaysWithAffiliateLinks().find(
    (color) =>
      color.brandId === brandId && color.yarnId === yarnId && color.hex === hex,
  );

  return matchingColor || null;
};

/**
 * [stringToBrandAndYarnId description]
 *
 * @param   {string}  text  brandId-yarnId
 *
 * @return  {object}        {brandId: string | null, yarnId: string | null, brandName: string | null, yarnName: string | null}
 */
export const stringToBrandAndYarnDetails = (
  text: string,
): {
  brandId: string | null;
  yarnId: string | null;
  brandName?: string | null;
  yarnName?: string | null;
} => {
  if (!text.includes('-')) return { brandId: null, yarnId: null };

  if (text.includes('worsted-8')) {
    text = text.replace('worsted-8', 'worsted_8');
  }

  const [brandCode, yarnCode] = text.split('-');

  const brand = getBrands().find((brand) => brand.id === brandCode);
  const brandId = brand ? brand.id : null;
  const brandName = brand ? brand.name : null;

  const yarn = brandId
    ? brand?.yarns.find((yarn) => yarn.id === yarnCode)
    : null;
  const yarnId = yarn ? yarn.id : null;
  const yarnName = yarn ? yarn.name : null;

  return { brandId, yarnId, brandName, yarnName };
};

export const getFilteredYarns = ({
  selectedBrandId,
}: {
  selectedBrandId?: string;
}): Yarn[] | undefined => {
  return selectedBrandId
    ? getBrands()?.filter((brand) => brand.id === selectedBrandId)[0]?.yarns
    : getBrands().flatMap((n) => n.yarns);
};

export const getColorways = ({
  selectedBrandId,
  selectedYarnId,
  selectedYarnWeightId,
}: {
  selectedBrandId?: string;
  selectedYarnId?: string;
  selectedYarnWeightId?: string;
}): Color[] => {
  return getColorwaysWithAffiliateLinks()
    .filter((colorway) => {
      if (!selectedBrandId) return true;
      return colorway.brandId === selectedBrandId;
    })
    .filter((colorway) => {
      if (!selectedYarnId) return true;
      return colorway.yarnId === selectedYarnId;
    })
    .filter((colorway) => {
      if (!selectedYarnWeightId) return true;
      return colorway.yarnWeightId === selectedYarnWeightId;
    });
};
