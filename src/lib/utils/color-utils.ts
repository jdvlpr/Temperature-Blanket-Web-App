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

import { CHARACTERS_FOR_URL_HASH } from '$lib/constants/page-constants';
import {
  allGaugesAttributes,
  gauges,
  getTargetParentGaugeId,
} from '$lib/state/gauges-state.svelte';
import type { Color } from '$lib/types/yarn-types';
import type { GaugeRange, WeatherParam } from '$lib/types/gauge-types';
import { capitalizeFirstLetter } from '$lib/utils/other-utils';
import { getColorPropertiesFromYarnStringAndHex } from '$lib/utils/yarn-utils';
import {
  getProjectParametersFromURLHash,
  getTitleFromLocationsMeta,
} from '$lib/utils/project-utils.svelte';
import { isValueInRange } from '$lib/utils/range-utils.svelte';
import { pluralize } from '$lib/utils/string-utils';
import { getBrands } from '$lib/data/yarns/colorways.svelte';
import chroma from 'chroma-js';

/**
 * Returns the appropriate text color based on the given color.
 *
 * @param {string} color - The color to determine the text color for.
 * @return {string} The text color, either "black" or "white".
 */
export const getTextColor = (color: string): 'black' | 'white' => {
  return chroma.valid(color)
    ? chroma(color).luminance() >= 0.5
      ? 'black'
      : 'white'
    : 'black';
};

/**
 * Converts an array of color objects to a string representation of yarn details.
 *
 * @param {object} options - The options object.
 * @param {object[]} options.colors - The array of color objects.
 * @return {string} The string representation of yarn details.
 */
export const colorsToYarnDetails = ({
  colors,
}: {
  colors: Color[];
}): string => {
  const yarnDetailsIds = [
    ...new Set(
      colors
        .filter((n) => n?.brandId && n?.yarnId)
        .map((n) => `${n.brandId}-${n.yarnId}`),
    ),
  ];

  let allColorsMatchDetails = false;
  const details = yarnDetailsIds.map((n) => {
    const indexes: number[] = [];
    colors.forEach((color, i) => {
      const id = `${color?.brandId}-${color?.yarnId}`;
      if (n === id) indexes.push(i);
    });
    if (indexes.length === colors.length) allColorsMatchDetails = true;
    return `${n}(${indexes.join(CHARACTERS_FOR_URL_HASH.separator)})`;
  });
  if (details.length === 1 && allColorsMatchDetails) return yarnDetailsIds[0];
  return details.join('');
};

/**
 * [yarnDetailsToColors description]
 *
 * @param   {string}  string  String from URL hash or palette Code ("bernat-super_value" | "bernat-super_value(1'2)"
 * @param   {object[]}  colors  colors objects without yarn details {hex}[]
 *
 * @return  {object[]}         colors objects {hex, name, brandId, yarnId, brandName, yarnName}[]
 */
export const yarnDetailsToColors = ({
  string,
  colors,
}: {
  string: string;
  colors: Color[];
}): Color[] => {
  if (string === ' ' || !string.length) return colors;
  const parentesisStartIndexes: number[] = [];
  const parentesisEndIndexes: number[] = [];
  const yarnDetailsSeparatorIndexes: number[] = [];

  for (let i = 0; i < string.length; i++) {
    if (string[i] === '(') parentesisStartIndexes.push(i);
    if (string[i] === '-') yarnDetailsSeparatorIndexes.push(i);
    if (string[i] === ')') parentesisEndIndexes.push(i);
  }

  if (yarnDetailsSeparatorIndexes.length === 0) return colors;

  if (
    parentesisStartIndexes.length === 0 &&
    parentesisEndIndexes.length === 0
  ) {
    colors = colors.map((color) => {
      const colorProperties = getColorPropertiesFromYarnStringAndHex({
        yarnString: string,
        hex: color.hex,
      });
      return {
        hex: color.hex,
        ...colorProperties,
      };
    });
  }

  if (parentesisStartIndexes.length === 0 && parentesisEndIndexes.length === 0)
    return colors;

  let groupIndex = 0;
  for (let i = 0; i < parentesisStartIndexes.length; i++) {
    const yarnString = string.substring(groupIndex, parentesisStartIndexes[i]);
    const colorIndexesString = string.substring(
      parentesisStartIndexes[i] + 1,
      parentesisEndIndexes[i],
    );
    let colorIndexes: number[] = [];

    if (!isNaN(Number(colorIndexesString)))
      colorIndexes = [Number(colorIndexesString)];
    else if (colorIndexesString.includes(CHARACTERS_FOR_URL_HASH.separator))
      colorIndexes = colorIndexesString
        .split(CHARACTERS_FOR_URL_HASH.separator)
        .map((n) => Number(n));
    else if (colorIndexesString.includes(CHARACTERS_FOR_URL_HASH.separator_alt))
      colorIndexes = colorIndexesString
        .split(CHARACTERS_FOR_URL_HASH.separator_alt)
        .map((n) => Number(n));

    colorIndexes.forEach((colorIndex) => {
      const color = colors[colorIndex];
      const colorProperties = getColorPropertiesFromYarnStringAndHex({
        yarnString,
        hex: color.hex,
      });
      colors[colorIndex] = {
        ...colors[colorIndex],
        ...colorProperties,
      };
    });
    groupIndex = parentesisEndIndexes[i] + 1;
  }

  return colors;
};

export const colorsToCode = (
  colors: Color[],
  params: { includePrefixes: boolean } = { includePrefixes: true },
): string => {
  const { includePrefixes } = params;
  let text = colors
    .map((n) =>
      n.hex?.includes('#') ? n.hex.substring(n.hex.indexOf('#') + 1) : n.hex,
    )
    .join('');
  if (includePrefixes) text = 'palette:' + text;
  return text;
};

export const stringToColors = ({
  string,
}: {
  string: string;
}): Color[] | false => {
  string = string.replace(/[^a-zA-Z0-9,-\s]/g, ''); // remove all other characters except allowed numbers, commas, hyphen and space
  if (string.includes(',')) string = string.replace(/[,]/g, ' '); // replace all commas with spaces
  if (string.includes('-')) string = string.replace(/[-]/g, ' '); // replace all hyphens with spaces
  let _colors: string[] = [];
  if (string.includes(' ')) _colors = string.split(' ');
  else if (chroma.valid(string))
    _colors = [string]; // string is only one valid color
  else _colors = string.match(/.{1,6}/g) || []; // new color every six characters
  if (!_colors.length) return false;
  _colors = _colors.filter((color) => color !== ''); // remove empty colors
  if (!_colors.every((color) => chroma.valid(color))) return false;
  return _colors.map((color) => {
    return { hex: chroma(color).hex() as Color['hex'] };
  });
};

export const getColorsFromInput = ({
  string,
}: {
  string: string;
}): Color[] | false => {
  if (!string || string === ' ' || !string?.length) return false;

  // project checker
  let colors: Color[] | false =
    getColorsFromProjectURL(string) || getColorsFromYarnSearchURL(string);

  if (colors) return colors;

  if (string.includes('coolors.co/'))
    string = string.substring(string.lastIndexOf('/') + 1); // URL from coolers.co
  if (string.includes('palette:'))
    string = string.substring(string.indexOf('palette:') + 8); // Shared from code (palette:hexcolors...)
  let yarnDetails;
  if (string.includes('yarn:')) {
    yarnDetails = string.substring(string.indexOf('yarn:') + 5);
    string = string.substring(0, string.indexOf('yarn:'));
  }
  // yarn details
  colors = stringToColors({ string });

  if (yarnDetails && colors)
    colors = yarnDetailsToColors({ string: yarnDetails, colors });

  return colors;
};

export type ColorInfo = Color & {
  index?: number;
  gaugeLength: number | undefined;
};

export const getColorInfo = ({
  param,
  value,
}: {
  param: WeatherParam['id'];
  value: number | null;
}): ColorInfo => {
  let color: ColorInfo = {
    hex: '#ffffff' as Color['hex'],
    gaugeLength: undefined,
  }; // default white color will show on the preview if the weather value has no range associated with it

  const gaugeId = getTargetParentGaugeId(param);

  const gauge = gauges.getSnapshot(gaugeId);

  if (
    value === null ||
    !gauge ||
    !gauge.ranges ||
    !gauge.colors ||
    gauge.ranges.length !== gauge.colors.length
  ) {
    return color;
  }

  const { ranges, colors, rangeOptions } = gauge;
  const gaugeLength = ranges.length;

  if (gauge.unit.type === 'category') {
    color = {
      ...colors[value],
      index: value,
      gaugeLength,
    };
  } else {
    if (!rangeOptions) return color;
    for (let i = 0; i < gaugeLength; i++) {
      const range = ranges[i] as GaugeRange;
      if (
        isValueInRange({
          value,
          range,
          direction: rangeOptions.direction,
          includeFromValue: rangeOptions.includeFromValue,
          includeToValue: rangeOptions.includeToValue,
        })
      ) {
        color = {
          ...colors[i],
          index: i,
          gaugeLength,
        };
      }
    }
  }

  color = { ...color, gaugeLength };

  return color;
};

/**
 * Retrieves colors from a project URL.
 *
 * @param {string} string - The project URL.
 * @returns {string[]} - An array of colors extracted from the URL, or false if the URL is invalid.
 */
const getColorsFromProjectURL = (string: string): Color[] | false => {
  let url;
  try {
    url = new URL(string);
  } catch (error) {
    return false;
  }

  const urlParams = new URLSearchParams(url.search);

  if (!urlParams.has('project')) return false; // it doesn't have project

  // hash params
  const params = url.hash.split('&').reduce(
    (res, item) => {
      const parts = item.split('=');
      res[parts[0]] = {
        key: parts[0],
        value: decodeURIComponent(parts[1]),
      };
      return res;
    },
    {} as Record<string, { key: string; value: string }>,
  );

  let colors: Color[] = [];
  allGaugesAttributes.forEach((gauge) => {
    if (gauge.id in params === true) {
      let text = params[gauge.id].value;

      // text = text.replace(/!.*?~/g, ''); // remove options !ahlSpectral~
      if (text.includes('~')) text = text.substring(text.indexOf('~') + 1); // remove pallete name from beginning Spectral~
      if (text.includes('!')) {
        // It has extra settings
        let colorsString = text.substring(0, text.indexOf('!'));
        colorsString = colorsString.replace(/\(.*?\)/g, ''); // remove ranges (number,number)
        let newColors = stringToColors({
          string: colorsString,
        });
        let extraText = text.substring(text.indexOf('!') + 1);

        if (extraText.includes('!')) {
          // if has yarn details too
          let yarnDetails = extraText.substring(extraText.lastIndexOf('!') + 1);

          if (newColors) {
            const colorsWithYarnDetails = yarnDetailsToColors({
              string: yarnDetails,
              colors: newColors,
            });
            colors = [...colors, ...colorsWithYarnDetails];
          }
        } else if (newColors) {
          colors = [...colors, ...newColors];
        }
      } else {
        text = text.replace(/\(.*?\)/g, ''); // remove ranges (number,number)
        let newColors = stringToColors({
          string: text,
        });
        if (newColors) colors = [...colors, ...newColors];
      }
    }
  });

  return colors;
};

/**
 * Parses a yarn search URL and extracts the colors from it.
 * @param {string} string - The yarn search URL to parse.
 * @returns {string[]} - An array of colors extracted from the URL, or false if the URL is invalid.
 */
const getColorsFromYarnSearchURL = (string: string): Color[] | false => {
  let url;
  try {
    url = new URL(string);
  } catch (error) {
    return false;
  }

  if (url.pathname !== '/yarn' && url.pathname !== '/yarn/') return false;

  const urlParams = new URLSearchParams(url.search);

  if (!urlParams.has('s')) return false; // it doesn't have search query

  let colors = stringToColors({ string: urlParams.get('s') ?? '' });

  if (urlParams.has('f')) {
    const yarnDetails = urlParams.get('f');
    if (yarnDetails?.includes('-') && colors) {
      colors = yarnDetailsToColors({
        string: yarnDetails,
        colors,
      });
    }
  }
  return colors;
};

export const getColorName = ({
  color,
  brandId,
  yarnId,
  showGenericName = true,
  showNamedHexCodes = true,
}: {
  color: string;
  brandId: string | undefined;
  yarnId: string | undefined;
  showGenericName?: boolean;
  showNamedHexCodes?: boolean;
}): string | null => {
  if (!brandId || !yarnId)
    return getGenericColorName({
      color,
      showGenericName,
      showNamedHexCodes,
    });
  const yarn = getBrands()
    .find((brand) => brand.id === brandId)
    ?.yarns.find((yarn) => yarn.id === yarnId);
  if (!yarn)
    return getGenericColorName({
      color,
      showGenericName,
      showNamedHexCodes,
    });
  if (!yarn.colorways)
    return getGenericColorName({
      color,
      showGenericName,
      showNamedHexCodes,
    });
  for (const colorway of yarn.colorways) {
    for (const item of colorway.colors) {
      const delta = chroma.deltaE(color, item.hex ?? '#ffffff');
      if (delta === 0) return item.name ?? null; // TODO: allow for setting the threshold?
    }
  }
  return getGenericColorName({
    color,
    showGenericName,
    showNamedHexCodes,
  });
};

export const getGenericColorName = ({
  color,
  showGenericName = true,
  showNamedHexCodes = true,
}: {
  color: string;
  showGenericName?: boolean;
  showNamedHexCodes?: boolean;
}): string | null => {
  let name: string | null = null;
  if (chroma(color).name().includes('#')) name = chroma(color).name();
  else
    name = `${chroma(color).hex()} (${capitalizeFirstLetter(chroma(color).name())})`;
  if (showGenericName) return name;
  if (name.includes('(') && showNamedHexCodes) return name;
  return null;
};

export const sortColorsLightToDark = ({
  colors,
}: {
  colors: Color[];
}): Color[] => {
  const unlockedColors = colors
    .filter((color) => !color?.locked)
    .map((color) => {
      return {
        ...color,
        _delta: chroma.deltaE('#ffffff', color.hex ?? '#ffffff'), // underscore to differentiate between potentially existing delta property
      };
    })
    .sort((a, b) => {
      return a._delta > b._delta ? 1 : b._delta > a._delta ? -1 : 0;
    })
    .map(({ _delta, ...color }) => color);

  // Insert locked colors back into the sorted list based on their original index
  const sortedColors: Color[] = [];
  let addedLockedColors = 0;
  for (let i = 0; i < colors.length; i++) {
    if (colors[i]?.locked) {
      sortedColors.push(colors[i]);
      addedLockedColors++;
    } else {
      sortedColors.push(unlockedColors[i - addedLockedColors]);
    }
  }
  return sortedColors;
};

export const sortColorsDarktoLight = ({
  colors,
}: {
  colors: Color[];
}): Color[] => {
  const unlockedColors = colors
    .filter((color) => !color?.locked)
    .map((color) => {
      return {
        ...color,
        _delta: chroma.deltaE('#ffffff', color.hex ?? '#ffffff'), // underscore to differentiate between potentially existing delta property
      };
    })
    .sort((a, b) => (a._delta < b._delta ? 1 : b._delta < a._delta ? -1 : 0))
    .map(({ _delta, ...color }) => color);

  // Insert locked colors back into the sorted list based on their original index
  const sortedColors: Color[] = [];
  let addedLockedColors = 0;
  for (let i = 0; i < colors.length; i++) {
    if (colors[i]?.locked) {
      sortedColors.push(colors[i]);
      addedLockedColors++;
    } else {
      sortedColors.push(unlockedColors[i - addedLockedColors]);
    }
  }
  return sortedColors;
};

export const sortColorsByName = ({
  colors,
}: {
  colors: Color[];
}): Color[] => {
  const unlockedColors = colors
    .filter((color) => !color?.locked)
    .sort((a, b) => {
      var textA = (a.name ?? '').toUpperCase();
      var textB = (b.name ?? '').toUpperCase();
      return textA < textB ? -1 : textA > textB ? 1 : 0;
    });
  // Insert locked colors back into the sorted list based on their original index
  const sortedColors: Color[] = [];
  let addedLockedColors = 0;
  for (let i = 0; i < colors.length; i++) {
    if (colors[i]?.locked) {
      sortedColors.push(colors[i]);
      addedLockedColors++;
    } else {
      sortedColors.push(unlockedColors[i - addedLockedColors]);
    }
  }
  return sortedColors;
};

export const sortColorsByNameZtoA = ({
  colors,
}: {
  colors: Color[];
}): Color[] => {
  const unlockedColors = colors
    .filter((color) => !color?.locked)
    .sort((a, b) => {
      var textA = (a.name ?? '').toUpperCase();
      var textB = (b.name ?? '').toUpperCase();
      return textA > textB ? -1 : textA < textB ? 1 : 0;
    });
  // Insert locked colors back into the sorted list based on their original index
  const sortedColors: Color[] = [];
  let addedLockedColors = 0;
  for (let i = 0; i < colors.length; i++) {
    if (colors[i]?.locked) {
      sortedColors.push(colors[i]);
      addedLockedColors++;
    } else {
      sortedColors.push(unlockedColors[i - addedLockedColors]);
    }
  }
  return sortedColors;
};

export const getSortedPalette = ({
  palette,
  sortColors,
}: {
  palette: Color[];
  sortColors: string;
}): Color[] => {
  switch (sortColors) {
    case 'none':
    case 'custom':
      return palette;
    case 'light-to-dark':
      return sortColorsLightToDark({ colors: palette });
    case 'dark-to-light':
      return sortColorsDarktoLight({ colors: palette });
    case 'name':
      return sortColorsByName({ colors: palette });
    case 'name-z-to-a':
      return sortColorsByNameZtoA({ colors: palette });
    default:
      return palette;
  }
};

type GalleryProjectSummary = {
  projectUrl: string;
  yarnUrls: string;
  locations: string;
  databaseId: string | number;
};

type GalleryPalette = {
  colors: Color[];
  projectId: string | number;
  schemeName: string;
};

export const getPalettesFromProjects = ({
  projects,
  selectedBrandId = '',
  selectedYarnId = '',
  palettesContainOnlyFilteredYarn = false,
}: {
  projects: GalleryProjectSummary[];
  selectedBrandId?: string;
  selectedYarnId?: string;
  palettesContainOnlyFilteredYarn?: boolean;
}): GalleryPalette[] => {
  if (!projects.length) return [];
  let _palettes: GalleryPalette[] = [];
  projects.forEach((project) => {
    const params = getProjectParametersFromURLHash(
      new URL(project.projectUrl).hash.substring(1),
    );

    (JSON.parse(project.yarnUrls) as string[]).forEach((yarn_url, i) => {
      const isNotPresetScheme = allGaugesAttributes.every(
        (p) => !params?.[p.id]?.value?.includes('~'),
      );
      let colors = getColorsFromInput({ string: yarn_url });
      const someColorsAreYarn =
        colors &&
        colors.some(
          (color) => color?.name && color?.brandName && color?.yarnName,
        );
      const isUniquePalette = !_palettes
        .map((palette) => JSON.stringify(palette.colors))
        .includes(JSON.stringify(colors));

      let hasSelectedBrandAndYarn = true;
      if (selectedBrandId && selectedYarnId) {
        if (palettesContainOnlyFilteredYarn)
          hasSelectedBrandAndYarn = !!colors && colors.every(
            (color) =>
              color?.brandId === selectedBrandId &&
              color?.yarnId === selectedYarnId,
          );
        else
          hasSelectedBrandAndYarn = !!colors && colors.some(
            (color) =>
              color?.brandId === selectedBrandId &&
              color?.yarnId === selectedYarnId,
          );
      } else if (selectedBrandId) {
        if (palettesContainOnlyFilteredYarn)
          hasSelectedBrandAndYarn = !!colors && colors.every(
            (color) => color?.brandId === selectedBrandId,
          );
        else
          hasSelectedBrandAndYarn = !!colors && colors.some(
            (color) => color?.brandId === selectedBrandId,
          );
      }

      if (
        isNotPresetScheme &&
        someColorsAreYarn &&
        isUniquePalette &&
        hasSelectedBrandAndYarn &&
        colors
      ) {
        const title = getTitleFromLocationsMeta(project.locations);
        let schemeName =
          "<div class='flex flex-wrap justify-start items-center gap-x-4 text-xs'>";
        schemeName += '<p class="line-clamp-1">'; // start line-clamp-1
        schemeName += `<span class="mr-4">${colors.length} ${pluralize('color', colors.length)}</span>`;
        let yarnDetails = colors
          .filter((color) => color?.brandId && color?.yarnId)
          .map((color) => {
            return color.brandName + ' - ' + color.yarnName;
          });
        if (yarnDetails.length) {
          yarnDetails = [...new Set([...yarnDetails])];
          yarnDetails.forEach((yarnDetail, index, allitems) => {
            schemeName += `${yarnDetail}`;
            if (index + 1 !== allitems.length) schemeName += ', ';
          });
        }
        schemeName += '</p>'; // end line-clamp-1

        schemeName += `<a href="/gallery/${
          project.databaseId
        }" target="_blank" rel="noreferrer" class="underline line-clamp-1" title="Open Project Preview Page" onclick="event.stopPropagation()"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-external-link size-4 inline"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
<span class="whitespace-pre-wrap">${title} ${i > 0 ? ` - ${i + 1}` : ''}</span></a>`;
        schemeName += '</div>';

        _palettes.push({
          colors,
          projectId: project.databaseId,
          schemeName,
        });
      }
    });
  });
  return _palettes;
};
