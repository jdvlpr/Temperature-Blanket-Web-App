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

import { weather } from '$lib/state';
import { getDaysInRange, getDaysPercent } from '$lib/utils';
import pdfConfig from '../pdf-config';
import pdfGauge from './gauge.svelte.ts';

const pdfColorDetails = {
  positionX: 95,
  columnWidth: 30,
  createHeaderHorizontalLines: (doc, items) => {
    // Lines
    const x1 =
      pdfConfig.leftMargin + pdfColorDetails.positionX - pdfGauge.linePadding;
    const x2 =
      pdfConfig.leftMargin +
      pdfColorDetails.positionX +
      Object.keys(items).length * pdfColorDetails.columnWidth -
      pdfGauge.linePadding;
    // OverLine
    let y = pdfConfig.topMargin + pdfGauge.linePadding * 3;
    doc.line(x1, y, x2, y);
    // Underline
    y = pdfConfig.topMargin + pdfGauge.itemHeight + pdfGauge.linePadding;
    doc.line(x1, y, x2, y);
  },
  createColorDetailsHeader: (doc, gauge) => {
    const header = weather.grouping === 'week' ? 'Weeks' : 'Days';
    const items = {
      davg: {
        name: `${header} High`,
        position: pdfColorDetails.positionX,
      },
      dmax: {
        name: `${header} Average`,
        position: pdfColorDetails.positionX + pdfColorDetails.columnWidth,
      },
      dmin: {
        name: `${header} Low`,
        position: pdfColorDetails.positionX + pdfColorDetails.columnWidth * 2,
      },
    };
    if (gauge.targets.length === 1) {
      delete items.davg;
      delete items.dmax;
      delete items.dmin;
      items.days = {
        name: header,
        position: pdfColorDetails.positionX,
      };
    }
    pdfGauge.createHeaderItems(doc, items);
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
      let i = 0, x = pdfColorDetails.positionX;
      i < details.length;
      i += 1, x += pdfColorDetails.columnWidth
    ) {
      doc.text(details[i], pdfConfig.leftMargin + x, line);
    }
    // underline
    const width = gauge.targets.length * pdfColorDetails.columnWidth;
    doc.line(
      pdfConfig.leftMargin + pdfColorDetails.positionX - pdfGauge.linePadding,
      line + 5,
      pdfConfig.leftMargin +
        pdfColorDetails.positionX +
        width -
        pdfGauge.linePadding,
      line + 5,
    );
    // Vertical Lines
    const vLinePositions = [
      pdfColorDetails.positionX +
        pdfColorDetails.columnWidth -
        pdfGauge.linePadding,
      pdfColorDetails.positionX +
        pdfColorDetails.columnWidth * 2 -
        pdfGauge.linePadding,
      pdfColorDetails.positionX +
        pdfColorDetails.columnWidth * 3 -
        pdfGauge.linePadding,
    ];
    if (details.length === 1) vLinePositions.length = 1;
    vLinePositions.forEach((item) => {
      doc.line(
        pdfConfig.leftMargin + item,
        pdfConfig.topMargin + pdfGauge.linePadding * 3,
        pdfConfig.leftMargin + item,
        line + 5,
      );
    });
  },
};

export { pdfColorDetails as default };
