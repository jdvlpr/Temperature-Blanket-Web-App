// Copyright (c) 2024, Thomas (https://github.com/jdvlpr)
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

import { ALL_COLORWAYS_WITH_AFFILIATE_LINKS } from '$lib/constants';
import { getColorName } from '$lib/utils';
import { brands } from '$lib/yarns/brands';

/**
 * [getColorPropertiesFromYarnStringAndHex description]
 *
 * @param   {string}  yarnString  brandId-yarnId
 * @param   {string}  hex         #ffffff
 *
 * @return  {object}              color object
 */
export const getColorPropertiesFromYarnStringAndHex = ({ yarnString, hex }) => {
  const { brandId, yarnId } = stringToBrandAndYarnDetails(yarnString);

  const matchingColor = ALL_COLORWAYS_WITH_AFFILIATE_LINKS.find(
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
export const stringToBrandAndYarnDetails = (text) => {
  if (!text.includes('-')) return { brandId: null, yarnId: null };

  if (text.includes('worsted-8')) {
    text = text.replace('worsted-8', 'worsted_8');
  }

  const [brandCode, yarnCode] = text.split('-');

  const brand = brands.find((brand) => brand.id === brandCode);
  const brandId = brand ? brand.id : null;
  const brandName = brand ? brand.name : null;

  const yarn = brandId
    ? brand.yarns.find((yarn) => yarn.id === yarnCode)
    : null;
  const yarnId = yarn ? yarn.id : null;
  const yarnName = yarn ? yarn.name : null;

  return { brandId, yarnId, brandName, yarnName };
};

export const paletteContiansSomeNamedColorways = ({
  palette,
  brandId,
  yarnId,
}) => {
  if (!palette || !brandId || !yarnId) return;
  return palette.some((n) => {
    const name = getColorName({
      color: n,
      brandId,
      yarnId,
      showGenericName: false,
      showNamedHexCodes: false,
    });
    return !!name;
  });
};

export const paletteContiansAllNamedColorways = ({
  palette,
  brandId,
  yarnId,
}) => {
  if (!palette || !brandId || !yarnId) return;
  return palette.every((n) => {
    const name = getColorName({
      color: n,
      brandId,
      yarnId,
      showGenericName: false,
      showNamedHexCodes: false,
    });
    return !!name;
  });
};

export const getFilteredYarns = ({ selectedBrandId }) => {
  return selectedBrandId
    ? brands?.filter((brand) => brand.id === selectedBrandId)[0]?.yarns
    : brands.flatMap((n) => n.yarns);
};

export const getColorways = ({ selectedBrandId, selectedYarnId }) => {
  if (selectedBrandId && selectedYarnId)
    return ALL_COLORWAYS_WITH_AFFILIATE_LINKS.filter(
      (colorway) => colorway.brandId === selectedBrandId,
    ).filter((colorway) => colorway.yarnId === selectedYarnId);
  if (selectedBrandId)
    return ALL_COLORWAYS_WITH_AFFILIATE_LINKS.filter(
      (colorway) => colorway.brandId === selectedBrandId,
    );
  return ALL_COLORWAYS_WITH_AFFILIATE_LINKS;
};
