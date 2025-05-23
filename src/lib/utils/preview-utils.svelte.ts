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

import WeatherDetails from '$lib/components/WeatherDetails.svelte';
import {
  drawerState,
  gauges,
  isDesktop,
  locations,
  modal,
  previewWeatherTargets,
  weather,
} from '$lib/state';
import type { WeatherDay, WeatherParam } from '$lib/types';
import { exists, getTargetParentGaugeId } from '$lib/utils';

export const showPreviewImageWeatherDetails = (targets) => {
  previewWeatherTargets.value = targets;

  if (isDesktop.current) {
    modal.trigger({
      type: 'component',
      component: {
        ref: WeatherDetails,
        props: {
          weatherTargets: targets,
        },
      },
    });
  } else {
    drawerState.weatherDetails = true;
  }
};
export const svgToPNG = async ({
  svgNode,
  width,
  height,
  download = true,
  canvasId = 'temporary-canvas',
}) => {
  const canvas = document.createElement('canvas');
  canvas.id = canvasId;
  canvas.width = width;
  canvas.height = height;
  canvas.style.display = 'none';
  document.getElementsByTagName('body')[0].appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const outerHTML = new XMLSerializer().serializeToString(svgNode);

  // Read the SVG string using the fromString method
  // of Canvg
  const { Canvg } = await import('canvg');
  let v = Canvg.fromString(ctx, outerHTML);

  // Start drawing the SVG on the canvas
  v.start();

  // Convert the Canvas to an image
  let img = canvas.toDataURL('img/png');
  if (download) img = img.replace('image/png', 'image/octet-stream');
  return img;
};

export const downloadPreviewPNG = async (
  /** @type {number} */ width,
  /** @type {number} */ height,
  /** @type {Node} */ svg,
) => {
  const img = await svgToPNG({ svgNode: svg, width, height });

  const a = document.createElement('a');
  const fileName = `Temperature-Blanket-Preview-${locations.projectFilename}.png`;
  a.setAttribute('download', fileName);
  a.setAttribute('href', img);
  a.setAttribute('target', '_blank');
  a.click();

  document.getElementById('temporary-canvas')?.remove();
};

/**
 * [setSecondaryTargets description]
 *
 * @return  {string[]}                 [secondaryTargets]
 */
export const setSecondaryTargets = (newItem, existingItems) => {
  if (!existingItems) return;
  const targetId = newItem[0];
  const index = +newItem[1];
  existingItems.forEach((target, selfIndex, targetsArray) => {
    if (target.indexes.includes(index))
      target.indexes.splice(target.indexes.indexOf(index), 1); // remove index from the old param
    if (target.indexes.length === 0) targetsArray.splice(selfIndex, 1); // clear that param
  });
  const paramExists = existingItems.filter(
    (item) => item.targetId === targetId,
  );
  if (exists(paramExists)) {
    // if there's other indexes for that param
    paramExists[0].indexes.push(index);
  } else {
    // create new param object
    existingItems.push({
      targetId,
      indexes: [index],
    });
  }
  existingItems.forEach((item) => {
    item.indexes.sort((a, b) => a - b);
  });
  return existingItems;
};

/**
 * [getSecondaryTargetIndexes description]
 *
 * @param   {[Array]}  secondaryTargets  [secondaryTargets description]
 *
 * @return  {[Array]}
 */
/**
 * Returns an array of objects containing the indexes and target IDs of secondary targets.
 *
 * @param {Array<{index: number, targetId: string}>} secondaryTargets - The array of secondary targets.
 * @returns {Array<{index: number, targetId: string}>} - An array of objects with the index and target ID.
 */
export const getSecondaryTargetIndexes = (secondaryTargets) => {
  if (!secondaryTargets) return [];
  const indexes: { index: number; targetId: string }[] = [];
  secondaryTargets.forEach((item) => {
    item.indexes.forEach((position) => {
      indexes.push({
        index: position,
        targetId: item.targetId,
      });
    });
  });
  indexes.sort((a, b) => a.index - b.index);
  return indexes;
};

/**
 * Returns an array of indexes where month separators should be placed.
 *
 */
export const getMonthSepparatorIndexes = (): number[] => {
  const spaceIndexes: number[] = [];
  weather.data.forEach((day, index, all) => {
    if (index === 0) {
      spaceIndexes.push(0);
      return;
    }
    const date = {
      current: new Date(day.date),
      previous: new Date(all[index - 1].date),
    };
    if (date.current.getUTCMonth() !== date.previous.getUTCMonth()) {
      spaceIndexes.push(index);
    }
  });
  spaceIndexes.shift();
  return spaceIndexes;
};

/**
 * Returns an array of target IDs for each square section based on the provided parameters.
 *
 * @param {number} squareSectionsCount - The total number of square sections.
 * @param {WeatherParam['id']} primaryTarget - The primary target ID.
 * @param {{indexes: number, targetId: WeatherParam['id']}[]} secondaryTargets - An array of secondary target objects, each containing an index and target ID.
 * @returns {WeatherParam['id'][]} - An array of target IDs for each square section. (eg. ['tavg',tmax','tmin',...])
 */
export const getSquareSectionTargetIds = (
  squareSectionsCount: number,
  primaryTarget: string,
  secondaryTargets: { indexes: number; targetId: WeatherParam['id'] }[],
): WeatherParam['id'] => {
  const secondaryParamIndexes = getSecondaryTargetIndexes(secondaryTargets);
  const defaultParam = primaryTarget;
  const params = [];

  for (
    let sectionIndex = 0;
    sectionIndex < squareSectionsCount;
    sectionIndex++
  ) {
    let added = false;

    // Use Array.find() instead of forEach() loop for better performance
    const targetIndex = secondaryParamIndexes.findIndex(
      (item) => item.index === sectionIndex,
    );

    if (targetIndex !== -1) {
      params.push(secondaryParamIndexes[targetIndex].targetId);
      added = true;
    }

    if (!added) {
      params.push(defaultParam);
    }
  }

  return params;
};

type WeatherMonthsDataType = {
  location: WeatherDay['location'];
  year: number;
  month: number;
  days: number;
  start: number;
};
export const weatherMonthsData = ({
  weatherData,
}: {
  weatherData: WeatherDay[];
}): WeatherMonthsDataType[] => {
  if (!weatherData) return [];

  const unique = new Set(); // Use a Set instead of an array for faster lookup
  const data: WeatherMonthsDataType[] = [];

  weatherData.forEach((n) => {
    const date = n.date;
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth();
    const day = new Date(year, month, 1).getUTCDay();
    const days = new Date(year, month + 1, 0).getUTCDate();
    const id = `${year}${month}`;

    // Check if the id is already present in the Set
    if (!unique.has(id)) {
      unique.add(id); // Add the id to the Set
      data.push({
        location: n.location,
        year,
        month,
        days,
        start: day,
      });
    }
  });

  return data;
};

export const getDaysInLongestMonth = (monthsData) => {
  return Math.max(...monthsData.map((month) => month.days));
};

export const getFactors = ({ length }) => {
  const factors = [];
  for (let i = 0; i < length; i++) {
    if (length % i === 0) factors.push(i);
  }
  factors.push(length);
  return factors;
};

export const getPossibleDimensions = ({ factors, currentDimensions }) => {
  const dimensions = [];
  const opposite = [];

  // Iterate over the factors array
  for (let index = 0; index < factors.length / 2; index++) {
    const factor = factors[index];
    const opp = factors[factors.length - index - 1];

    dimensions.push([factor, opp]);
    opposite.push([opp, factor]);
  }

  if (
    dimensions.length === 1 &&
    dimensions[0][0] === 1 &&
    dimensions[0][1] === 1
  ) {
    // There's only one month
    const value = dimensions.map((n) => n[0] + 'x' + n[1])[0];
    if (value !== currentDimensions) {
      currentDimensions = value;
    }
    return [value];
  }

  let options = [...dimensions, ...opposite.reverse()];

  // Use a Set to filter out duplicates and convert back to an array
  options = [...new Set(options.map((n) => n[0] + 'x' + n[1]))];

  if (!options.includes(currentDimensions)) {
    currentDimensions = options[Math.ceil(options.length / 2) - 1];
  }

  return options;
};

/**
 * If a gauge gets removed and it contains the target weather param, reset the primary weather param
 *
 * @param   {String || Array}  data  String of weather param 'tavg', or array of strings of weather params '['tavg','prcp'], or array of square secondary weather params
 *
 * @return  {String || Array}
 */
export const setTargets = (data) => {
  if (typeof data === 'string') {
    // If a gauge gets removed and it contains the target weather param, reset the primary weather param
    if (data === null) return gauges.allCreated[0].targets[0].id;
    return gauges.allCreated
      .map((g) => g.id)
      .includes(getTargetParentGaugeId(data))
      ? data
      : gauges.allCreated[0].targets[0].id;
  }

  if (typeof data === 'object') {
    // If a gauge gets removed and it contains the target weather param, reset the secondary weather param

    if (data.length === 0) return [];

    let _targets = data;

    const isSecondarySquareParamData = data.some((n) => n?.targetId); // for square secondary params, arrays contain objects, not just strings

    if (isSecondarySquareParamData)
      _targets = data.map((n) => n.targetId).flat();
    _targets = _targets.filter((n) => {
      n = getTargetParentGaugeId(n);
      return $state.snapshot(gauges.allCreated.map((g) => g.id).includes(n));
    });

    if (_targets.length === 0) {
      _targets = [gauges.allCreated[0]?.targets[0].id];
    }

    if (isSecondarySquareParamData) {
      const _data = [];
      _targets.forEach((target) => {
        if (
          data
            .map((n) => n.targetId)
            .flat()
            .includes(target)
        ) {
          _data.push(data.filter((n) => n.targetId === target)[0]);
        }
      });
      _targets = _data;
    }
    return _targets;
  }
};
