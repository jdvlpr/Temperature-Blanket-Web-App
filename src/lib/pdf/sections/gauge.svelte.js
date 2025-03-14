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

import { gauges, localState, showDaysInRange } from '$lib/state';
import pdfConfig from '../pdf-config';
import pdfColorDetails from './color-details.svelte';
import pdfFooter from './footer.svelte';

const pdfGauge = {
  MAX_COLORS_PER_PAGE: 15,
  titleTopMargin: 10,
  headerTopMargin: 20,
  itemTopMargin: 15,
  itemHeight: 11,
  linePadding: 2,
  headerItems: {
    color: {
      name: 'Color',
      position: 2,
    },
    name: {
      name: 'Name',
      position: 25,
    },
    from: {
      name: `From`,
      position: 56,
    },
    to: {
      name: 'To',
      position: 75,
    },
  },

  createHeaderHorizontalLines: (doc, x1, x2) => {
    // OverLine
    let y = pdfConfig.topMargin + pdfGauge.linePadding * 3;
    doc.line(x1, y, pdfConfig.leftMargin + x2, y);
    // Underline
    y = pdfConfig.topMargin + pdfGauge.itemHeight + pdfGauge.linePadding;
    doc.line(x1, y, pdfConfig.leftMargin + x2, y);
  },
  createHeaderItems: (doc, items, gauge) => {
    for (let index = 0; index < Object.entries(items).length; index += 1) {
      doc.setFontSize(pdfConfig.font.p);
      doc.setFont(pdfConfig.font.paragraph, '');

      let title = Object.values(items)[index].name;

      if (
        (title === 'From' && !gauge.rangeOptions.includeFromValue) ||
        (title === 'To' && !gauge.rangeOptions.includeToValue)
      ) {
        doc.text(
          title,
          pdfConfig.leftMargin + Object.values(items)[index].position,
          pdfConfig.topMargin + pdfGauge.itemHeight - 1,
        );
        doc.setFontSize(pdfConfig.font.micro);
        doc.text(
          '(not including)',
          pdfConfig.leftMargin + Object.values(items)[index].position,
          pdfConfig.topMargin + pdfGauge.itemHeight + 1,
        );
        doc.setFontSize(pdfConfig.font.p);
      } else {
        doc.text(
          title,
          pdfConfig.leftMargin + Object.values(items)[index].position,
          pdfConfig.topMargin + pdfGauge.itemHeight,
        );
      }
    }
  },
  createHeader: (doc, gauge) => {
    // Gauge Title
    doc.setFontSize(pdfConfig.font.h2);
    doc.setFont(pdfConfig.font.heading, 'normal');
    doc.text(gauge.label, pdfConfig.leftMargin, pdfConfig.topMargin);
    pdfGauge.createHeaderItems(doc, pdfGauge.headerItems, gauge);
    pdfGauge.createHeaderHorizontalLines(
      doc,
      pdfConfig.leftMargin,
      pdfColorDetails.positionX - pdfGauge.linePadding,
    );
  },
  create: function (doc, gaugeId) {
    let gauge = gauges.allCreated.find((g) => g.id === gaugeId);

    // Gauge Item
    const length = gauge.ranges.length;
    let l =
      pdfConfig.topMargin + (pdfGauge.itemHeight + pdfGauge.linePadding) * 2;
    for (let i = 0; i < length; i++, l += pdfGauge.itemTopMargin) {
      if (i % pdfGauge.MAX_COLORS_PER_PAGE === 0) {
        doc.addPage();
        // pdfHeader.create(doc);
        pdfGauge.createHeader(doc, gauge);
        if (showDaysInRange.value)
          pdfColorDetails.createColorDetailsHeader(doc, gauge);
        l =
          pdfConfig.topMargin +
          (pdfGauge.itemHeight + pdfGauge.linePadding) * 2;
        const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber - 1; // minus one because first page is blank...
        pdfFooter.create(doc, pageCurrent);
      }
      // Vertical Lines
      const vLinePositions = [
        0,
        pdfGauge.headerItems.name.position - pdfGauge.linePadding,
        pdfGauge.headerItems.from.position - pdfGauge.linePadding,
        pdfGauge.headerItems.to.position - pdfGauge.linePadding,
        pdfColorDetails.positionX - pdfGauge.linePadding,
      ];
      vLinePositions.forEach((item) => {
        doc.line(
          pdfConfig.leftMargin + item,
          pdfConfig.topMargin + pdfGauge.linePadding * 3,
          pdfConfig.leftMargin + item,
          l + 5,
        );
      });
      // Item Number
      doc.setFontSize(pdfConfig.font.p);
      doc.text(
        (i + 1).toString(),
        pdfConfig.leftMargin + pdfGauge.linePadding,
        l,
      );
      // Item Color
      doc.setFillColor(gauge.colors[i].hex);
      doc.rect(
        pdfConfig.leftMargin + 8,
        l - 8,
        pdfGauge.itemHeight,
        pdfGauge.itemHeight,
        'F',
      );
      // Item Yarn and Name
      if (
        gauge.colors[i]?.name &&
        gauge.colors[i]?.brandName &&
        gauge.colors[i]?.yarnName
      ) {
        doc.setFontSize(pdfConfig.font.micro);
        doc.text(
          gauge.colors[i]?.brandName,
          pdfConfig.leftMargin + pdfGauge.headerItems.name.position,
          l - 6.2,
        );
        doc.text(
          gauge.colors[i]?.yarnName,
          pdfConfig.leftMargin + pdfGauge.headerItems.name.position,
          l - 4,
        );
        doc.setFontSize(pdfConfig.font.mini);
        doc.text(
          gauge.colors[i]?.name,
          pdfConfig.leftMargin + pdfGauge.headerItems.name.position,
          l,
        );
        doc.setFontSize(pdfConfig.font.p);
      }
      // Item From & To Values
      const from =
        String(gauge.ranges[i].from) +
        ' ' +
        gauge.unit.label[localState.value.units];
      const to =
        String(gauge.ranges[i].to) +
        ' ' +
        gauge.unit.label[localState.value.units];
      doc.setFontSize(pdfConfig.font.p);
      doc.text(
        from,
        pdfConfig.leftMargin + pdfGauge.headerItems.from.position,
        l,
      );
      doc.text(to, pdfConfig.leftMargin + pdfGauge.headerItems.to.position, l);
      // Underline
      doc.line(
        pdfConfig.leftMargin,
        l + 5,
        pdfConfig.leftMargin + pdfColorDetails.positionX - pdfGauge.linePadding,
        l + 5,
      );
      // Color Details
      if (showDaysInRange.value) pdfColorDetails.create(doc, gauge, i, l);
    }
  },
};

export { pdfGauge as default };
