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

import { weather } from '$lib/state/weather-state.svelte';
import { getDaysInRange, getDaysPercent } from '$lib/utils/range-utils.svelte';
import pdfConfig from '../pdf-config';

// Read shared layout constants from pdf-config (avoids importing gauge.svelte.ts)
const { positionX, columnWidth } = pdfConfig.colorDetails;
const { linePadding, itemHeight } = pdfConfig.gauge;

const pdfColorDetails = {
  positionX,
  columnWidth,
  createHeaderHorizontalLines: (doc, items) => {
    // Lines
    const x1 = pdfConfig.leftMargin + positionX - linePadding;
    const x2 =
      pdfConfig.leftMargin +
      positionX +
      Object.keys(items).length * columnWidth -
      linePadding;
    // OverLine
    let y = pdfConfig.topMargin + linePadding * 3;
    doc.line(x1, y, x2, y);
    // Underline
    y = pdfConfig.topMargin + itemHeight + linePadding;
    doc.line(x1, y, x2, y);
  },
  createColorDetailsHeader: (doc, gauge, createHeaderItemsFn) => {
    const header = weather.grouping === 'week' ? 'Weeks' : 'Days';
    const items = {
      davg: {
        name: `${header} High`,
        position: positionX,
      },
      dmax: {
        name: `${header} Average`,
        position: positionX + columnWidth,
      },
      dmin: {
        name: `${header} Low`,
        position: positionX + columnWidth * 2,
      },
    };
    if (gauge.targets.length === 1) {
      delete items.davg;
      delete items.dmax;
      delete items.dmin;
      items.days = {
        name: header,
        position: positionX,
      };
    }
    createHeaderItemsFn(doc, items);
    pdfColorDetails.createHeaderHorizontalLines(doc, items);
  },
  create: (doc, gauge, colorIndex, line) => {
    // Setup Details
    const details = gauge.targets.map((item) => {
      const count = getDaysInRange({
        id: item.id,
        range: gauge.ranges[colorIndex],
        direction: gauge?.rangeOptions?.direction,
        includeFromValue: gauge?.rangeOptions?.includeFromValue,
        includeToValue: gauge?.rangeOptions?.includeToValue,
        gaugeUnitType: gauge.unit.type,
      }).length;
      const percentage = `(${getDaysPercent(count)}%)`;
      return `${count} ${percentage}`;
    });
    doc.setFontSize(pdfConfig.font.p);
    doc.setFont(pdfConfig.font.paragraph, '');
    // Days avg, max, and min
    for (
      let i = 0, x = positionX;
      i < details.length;
      i += 1, x += columnWidth
    ) {
      doc.text(details[i], pdfConfig.leftMargin + x, line);
    }
    // underline
    const width = gauge.targets.length * columnWidth;
    doc.line(
      pdfConfig.leftMargin + positionX - linePadding,
      line + 5,
      pdfConfig.leftMargin + positionX + width - linePadding,
      line + 5,
    );
    // Vertical Lines
    const vLinePositions = [
      positionX + columnWidth - linePadding,
      positionX + columnWidth * 2 - linePadding,
      positionX + columnWidth * 3 - linePadding,
    ];
    if (details.length === 1) vLinePositions.length = 1;
    vLinePositions.forEach((item) => {
      doc.line(
        pdfConfig.leftMargin + item,
        pdfConfig.topMargin + linePadding * 3,
        pdfConfig.leftMargin + item,
        line + 5,
      );
    });
  },
};

export { pdfColorDetails as default };
