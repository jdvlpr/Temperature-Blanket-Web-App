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

import { gauges } from '$lib/state/gauges-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import { preferences } from '$lib/storage/preferences.svelte';
import type {
  GaugeRangeOptions,
  GaugeStateInterface,
} from '$lib/types/gauge-types';
import pdfConfig from '../pdf-config';
import pdfColorDetails from './color-details.svelte';
import pdfFooter from './footer.svelte';

// Read shared layout constants from pdf-config (avoids circular import with color-details)
const {
  MAX_COLORS_PER_PAGE,
  titleTopMargin,
  headerTopMargin,
  itemTopMargin,
  itemHeight,
  linePadding,
  headerItems,
} = pdfConfig.gauge;

const pdfGauge = {
  MAX_COLORS_PER_PAGE,
  titleTopMargin,
  headerTopMargin,
  itemTopMargin,
  itemHeight,
  linePadding,
  headerItems,

  createHeaderHorizontalLines: (doc, x1, x2) => {
    // OverLine
    let y = pdfConfig.topMargin + linePadding * 3;
    doc.line(x1, y, pdfConfig.leftMargin + x2, y);
    // Underline
    y = pdfConfig.topMargin + itemHeight + linePadding;
    doc.line(x1, y, pdfConfig.leftMargin + x2, y);
  },

  createHeaderItems: (doc, items, gauge: GaugeStateInterface) => {
    for (let index = 0; index < Object.entries(items).length; index += 1) {
      doc.setFontSize(pdfConfig.font.p);
      doc.setFont(pdfConfig.font.paragraph, '');

      let title = Object.values(items)[index].name;

      if (gauge?.unit.type === 'category' && title === 'From') {
        doc.text(
          'Title',
          pdfConfig.leftMargin + Object.values(items)[index].position,
          pdfConfig.topMargin + itemHeight,
        );
      } else if (
        gauge?.unit.type !== 'category' &&
        (title === 'From' || title === 'To')
      ) {
        doc.text(
          title,
          pdfConfig.leftMargin + Object.values(items)[index].position,
          pdfConfig.topMargin + itemHeight - 1,
        );
        doc.setFontSize(pdfConfig.font.micro);
        // Set a gray text color
        doc.setTextColor(128, 128, 128);
        const label = pdfGauge.getGaugeRangeLabel({
          title,
          rangeOptions: gauge?.rangeOptions,
        });
        doc.text(
          label,
          pdfConfig.leftMargin + Object.values(items)[index].position,
          pdfConfig.topMargin + itemHeight + 1,
        );
        doc.setFontSize(pdfConfig.font.p);
        // Revert to a black text color
        doc.setTextColor(0, 0, 0);
      } else if (
        !gauge ||
        (gauge?.unit.type === 'category' && title !== 'To') ||
        gauge?.unit.type !== 'category'
      ) {
        doc.text(
          title,
          pdfConfig.leftMargin + Object.values(items)[index].position,
          pdfConfig.topMargin + itemHeight,
        );
      }
    }
  },

  getGaugeRangeLabel: ({
    title,
    rangeOptions,
  }: {
    title: string;
    rangeOptions: GaugeRangeOptions;
  }) => {
    const includeFrom = rangeOptions.includeFromValue;
    const includeTo = rangeOptions.includeToValue;
    const excluding = 'Excluding';
    const including = 'Including';
    if (title === 'From' && includeFrom) return including;
    if (title === 'From' && !includeFrom) return excluding;
    if (title === 'To' && includeTo) return including;
    if (title === 'To' && !includeTo) return excluding;
    return '';
  },

  createHeader: (doc, gauge: GaugeStateInterface) => {
    // Gauge Title
    doc.setFontSize(pdfConfig.font.h2);
    doc.setFont(pdfConfig.font.heading, 'normal');
    doc.text(gauge.label, pdfConfig.leftMargin, pdfConfig.topMargin);
    pdfGauge.createHeaderItems(doc, headerItems, gauge);
    pdfGauge.createHeaderHorizontalLines(
      doc,
      pdfConfig.leftMargin,
      pdfConfig.colorDetails.positionX - linePadding,
    );
  },

  create: function (doc, gaugeId, totalPages: number) {
    let gauge = gauges.allCreated.find((g) => g.id === gaugeId);

    // Gauge Item
    const length = gauge.ranges.length;
    let l = pdfConfig.topMargin + (itemHeight + linePadding) * 2;
    for (let i = 0; i < length; i++, l += itemTopMargin) {
      if (i % MAX_COLORS_PER_PAGE === 0) {
        doc.addPage();
        pdfGauge.createHeader(doc, gauge);
        if (weather.pdfOptions.showDaysInRange)
          pdfColorDetails.createColorDetailsHeader(doc, gauge, (d, items) =>
            pdfGauge.createHeaderItems(d, items, gauge),
          );
        l = pdfConfig.topMargin + (itemHeight + linePadding) * 2;
        const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber - 1;
        pdfFooter.create(doc, pageCurrent, totalPages);
      }
      // Vertical Lines
      const vLinePositions = [
        0,
        headerItems.name.position - linePadding,
        headerItems.from.position - linePadding,
      ];

      if (gauge?.unit.type !== 'category')
        vLinePositions.push(headerItems.to.position - linePadding);

      vLinePositions.push(pdfConfig.colorDetails.positionX - linePadding);

      vLinePositions.forEach((item) => {
        doc.line(
          pdfConfig.leftMargin + item,
          pdfConfig.topMargin + linePadding * 3,
          pdfConfig.leftMargin + item,
          l + 5,
        );
      });
      // Item Number
      doc.setFontSize(pdfConfig.font.p);
      doc.text((i + 1).toString(), pdfConfig.leftMargin + linePadding, l);
      // Item Color
      doc.setFillColor(gauge.colors[i].hex);
      doc.rect(pdfConfig.leftMargin + 8, l - 8, itemHeight, itemHeight, 'F');
      // Item Yarn and Name
      if (
        gauge.colors[i]?.name &&
        gauge.colors[i]?.brandName &&
        gauge.colors[i]?.yarnName
      ) {
        doc.setFontSize(pdfConfig.font.micro);
        doc.text(
          gauge.colors[i]?.brandName,
          pdfConfig.leftMargin + headerItems.name.position,
          l - 6.2,
        );
        doc.text(
          gauge.colors[i]?.yarnName,
          pdfConfig.leftMargin + headerItems.name.position,
          l - 4,
        );
        doc.setFontSize(pdfConfig.font.mini);
        doc.text(
          gauge.colors[i]?.name,
          pdfConfig.leftMargin + headerItems.name.position,
          l,
        );
        doc.setFontSize(pdfConfig.font.p);
      }
      // Range Values
      doc.setFontSize(pdfConfig.font.p);

      if (gauge?.unit.type === 'category') {
        const label = gauge.ranges[i].label;
        doc.text(label, pdfConfig.leftMargin + headerItems.from.position, l);
      } else {
        // Item From & To Values
        const from =
          String(gauge.ranges[i].from) +
          ' ' +
          gauge.unit.label[preferences.value.units];
        const to =
          String(gauge.ranges[i].to) +
          ' ' +
          gauge.unit.label[preferences.value.units];
        doc.text(from, pdfConfig.leftMargin + headerItems.from.position, l);
        doc.text(to, pdfConfig.leftMargin + headerItems.to.position, l);
      }

      // Underline
      doc.line(
        pdfConfig.leftMargin,
        l + 5,
        pdfConfig.leftMargin + pdfConfig.colorDetails.positionX - linePadding,
        l + 5,
      );

      // Color Details
      if (weather.pdfOptions.showDaysInRange)
        pdfColorDetails.create(doc, gauge, i, l);
    }
  },
};

export { pdfGauge as default };
