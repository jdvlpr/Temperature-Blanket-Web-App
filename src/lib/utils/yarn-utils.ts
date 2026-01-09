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
import { getTextColor } from '$lib/utils/color-utils';
import { brands } from '$lib/data/yarns/brands';

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

export const getColorways = ({
  selectedBrandId,
  selectedYarnId,
  selectedYarnWeightId,
}) => {
  return ALL_COLORWAYS_WITH_AFFILIATE_LINKS.filter((colorway) => {
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

type PaletteImageOptions = {
  colors: Array<{
    hex: string;
    name?: string;
    brandName?: string;
    yarnName?: string;
  }>;
  includeColorway?: boolean;
  includeHex?: boolean;
  includeBrand?: boolean;
  includeYarn?: boolean;
  includeSpacing?: boolean;
};

export function generatePaletteImage({
  colors,
  includeColorway = false,
  includeHex = false,
  includeBrand = false,
  includeYarn = false,
  includeSpacing = true,
}: PaletteImageOptions): string {
  // Create high-resolution canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Use device pixel ratio for better resolution (default to 2 if not available)
  const dpr = window.devicePixelRatio || 2;

  // Configuration
  const padding = 20;
  const rowHeight = 60;
  const spacing = includeSpacing ? 12 : 0;
  const normalFontSize = 14;
  const smallFontSize = 10;
  const textPadding = 10;

  // Footer configuration
  const footerFontSize = 10;
  const footerMargin = 20;
  const footerHeight = footerMargin;
  const minWidth = 325; // Minimum width to accommodate footer text

  // Calculate dimensions
  const logicalHeight =
    colors.length * (rowHeight + spacing) +
    padding * 2 -
    spacing +
    footerHeight;

  const logicalWidth = Math.max(minWidth, padding * 2);

  // Setup canvas
  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;
  ctx.scale(dpr, dpr);
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;

  // Fill background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // Draw each color row
  colors.forEach((color, index) => {
    const y = padding + index * (rowHeight + spacing);
    const rowWidth = logicalWidth - padding * 2;

    // Draw color background with appropriate rounded corners
    ctx.fillStyle = color.hex;
    ctx.beginPath();
    const radius = 8;

    if (includeSpacing) {
      // All boxes have rounded corners when spacing is enabled
      ctx.moveTo(padding, y + radius);
      ctx.lineTo(padding, y + rowHeight - radius);
      ctx.quadraticCurveTo(
        padding,
        y + rowHeight,
        padding + radius,
        y + rowHeight,
      );
      ctx.lineTo(padding + rowWidth - radius, y + rowHeight);
      ctx.quadraticCurveTo(
        padding + rowWidth,
        y + rowHeight,
        padding + rowWidth,
        y + rowHeight - radius,
      );
      ctx.lineTo(padding + rowWidth, y + radius);
      ctx.quadraticCurveTo(
        padding + rowWidth,
        y,
        padding + rowWidth - radius,
        y,
      );
      ctx.lineTo(padding + radius, y);
      ctx.quadraticCurveTo(padding, y, padding, y + radius);
    } else {
      // When spacing is disabled, only round the top and bottom boxes
      if (index === 0) {
        // Top box with rounded top corners
        ctx.moveTo(padding, y + radius);
        ctx.lineTo(padding, y + rowHeight);
        ctx.lineTo(padding + rowWidth, y + rowHeight);
        ctx.lineTo(padding + rowWidth, y + radius);
        ctx.quadraticCurveTo(
          padding + rowWidth,
          y,
          padding + rowWidth - radius,
          y,
        );
        ctx.lineTo(padding + radius, y);
        ctx.quadraticCurveTo(padding, y, padding, y + radius);
      } else if (index === colors.length - 1) {
        // Bottom box with rounded bottom corners
        ctx.moveTo(padding, y);
        ctx.lineTo(padding, y + rowHeight - radius);
        ctx.quadraticCurveTo(
          padding,
          y + rowHeight,
          padding + radius,
          y + rowHeight,
        );
        ctx.lineTo(padding + rowWidth - radius, y + rowHeight);
        ctx.quadraticCurveTo(
          padding + rowWidth,
          y + rowHeight,
          padding + rowWidth,
          y + rowHeight - radius,
        );
        ctx.lineTo(padding + rowWidth, y);
        ctx.lineTo(padding, y);
      } else {
        // Middle boxes with no rounded corners
        ctx.rect(padding, y, rowWidth, rowHeight);
      }
    }
    ctx.fill();

    // Prepare text with appropriate size based on content
    const useSmallFont =
      includeColorway &&
      color.name &&
      (includeBrand || includeYarn || includeHex);
    const textInfo = [];

    if (includeBrand && color.brandName && includeYarn && color.yarnName) {
      textInfo.push({
        text: `${color.brandName} - ${color.yarnName}`,
        fontSize: useSmallFont ? smallFontSize : normalFontSize,
      });
    } else if (includeBrand && color.brandName) {
      textInfo.push({
        text: color.brandName,
        fontSize: useSmallFont ? smallFontSize : normalFontSize,
      });
    } else if (includeYarn && color.yarnName) {
      textInfo.push({
        text: color.yarnName,
        fontSize: useSmallFont ? smallFontSize : normalFontSize,
      });
    }

    if (includeColorway && color.name) {
      textInfo.push({
        text: color.name,
        fontSize: normalFontSize,
      });
    }

    if (includeHex) {
      textInfo.push({
        text: color.hex,
        fontSize: useSmallFont ? smallFontSize : normalFontSize,
      });
    }

    // Draw text if we have any
    if (textInfo.length > 0) {
      const textColor = getTextColor(color.hex);
      ctx.fillStyle = textColor;
      ctx.textAlign = 'left';

      // Calculate total text block height
      const totalTextHeight = textInfo.reduce(
        (acc, { fontSize }) => acc + fontSize * 1.2,
        0,
      );

      // Center text block vertically
      let textY = y + (rowHeight - totalTextHeight) / 2;

      // Draw each line of text
      textInfo.forEach(({ text, fontSize }) => {
        ctx.font = `${fontSize}px Arial`;
        textY += fontSize;
        ctx.fillText(text, padding + textPadding, textY);
        textY += fontSize * 0.2; // Add small spacing between lines
      });
    }
  });

  // Draw footer text
  ctx.fillStyle = '#666666';
  ctx.textAlign = 'center';

  // Split text into regular and bold parts
  const prefix = 'Create your own yarn palette at ';
  const urlPart = 'temperature-blanket.com/yarn';

  // Center the footer text
  const textY = logicalHeight - footerMargin;

  // Draw regular text
  ctx.font = `${footerFontSize}px Arial`;
  const prefixWidth = ctx.measureText(prefix).width;
  ctx.fillText(prefix, logicalWidth / 2 - prefixWidth / 2, textY);

  // Draw URL in bold
  ctx.font = `bold ${footerFontSize}px Arial`;
  ctx.fillText(urlPart, logicalWidth / 2 + prefixWidth / 2, textY);

  // Return as high-quality PNG data URL
  return canvas.toDataURL('image/png', 1.0);
}
