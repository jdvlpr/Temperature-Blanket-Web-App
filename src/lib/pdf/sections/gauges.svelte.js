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

import { gaugesState } from '$lib/state';
import pdfGauge from './gauge.svelte';

const gaugeGroup = {
  pages: () => {
    let pages = 0;
    gaugesState.gauges.forEach((gauge) => {
      pages += Math.ceil(gauge.ranges.length / pdfGauge.MAX_COLORS_PER_PAGE);
    });
    return pages;
  },
  create: (doc) => {
    gaugesState.gauges.forEach((gauge) => {
      // doc.addPage();
      // pdfHeader.create(doc);
      // doc.setFontSize(pdfConfig.font.h2);
      // doc.setFont(pdfConfig.font.heading, 'normal');
      pdfGauge.create(doc, gauge.id);
      // pdfFooter.create(doc);
    });
  },
};

export { gaugeGroup as default };
