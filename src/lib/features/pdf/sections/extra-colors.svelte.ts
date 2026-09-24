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
import { previews } from '$lib/state/preview-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import type { jsPDF } from 'jspdf';
import pdfConfig from '../pdf-config';
import pdfFooter from './footer.svelte';

const { itemTopMargin, itemHeight, linePadding } = pdfConfig.gauge;

// Column positions for the Additional Colors table
const columns = {
  color: { name: 'Color', position: 2 },
  name: { name: 'Name', position: 25 },
  usedFor: { name: 'Used For', position: 75 },
};
const tableWidth = 185;

/**
 * A page listing the preview's in-use accent/border colors and their yarn
 * details, after the gauge pages.
 */
const pdfExtraColors = {
  include: () =>
    weather.pdfOptions.additionalColors && previews.extraColors.length > 0,

  pages: () => (pdfExtraColors.include() ? 1 : 0),

  create: (doc: jsPDF, totalPages: number) => {
    if (!pdfExtraColors.include()) return;
    const extraColors = previews.extraColors;

    doc.addPage();

    // Title
    doc.setFontSize(pdfConfig.font.h2);
    doc.setFont(pdfConfig.font.heading, 'normal');
    doc.text('Additional Colors', pdfConfig.leftMargin, pdfConfig.topMargin);

    // Header
    doc.setFontSize(pdfConfig.font.p);
    doc.setFont(pdfConfig.font.paragraph, '');
    Object.values(columns).forEach(({ name, position }) => {
      doc.text(
        name,
        pdfConfig.leftMargin + position,
        pdfConfig.topMargin + itemHeight,
      );
    });
    const x1 = pdfConfig.leftMargin;
    const x2 = pdfConfig.leftMargin + tableWidth;
    let y = pdfConfig.topMargin + linePadding * 3;
    doc.line(x1, y, x2, y);
    y = pdfConfig.topMargin + itemHeight + linePadding;
    doc.line(x1, y, x2, y);

    let l = pdfConfig.topMargin + (itemHeight + linePadding) * 2;
    extraColors.forEach(({ label, color }, i) => {
      // Vertical Lines
      [
        0,
        columns.name.position - linePadding,
        columns.usedFor.position - linePadding,
        tableWidth,
      ].forEach((position) => {
        doc.line(
          pdfConfig.leftMargin + position,
          pdfConfig.topMargin + linePadding * 3,
          pdfConfig.leftMargin + position,
          l + 5,
        );
      });

      // Item Number
      doc.setFontSize(pdfConfig.font.p);
      doc.text((i + 1).toString(), pdfConfig.leftMargin + linePadding, l);

      // Item Color
      doc.setFillColor(color.hex ?? '#ffffff');
      doc.rect(pdfConfig.leftMargin + 8, l - 8, itemHeight, itemHeight, 'F');

      // Item Yarn and Name
      if (color.name && color.brandName && color.yarnName) {
        doc.setFontSize(pdfConfig.font.micro);
        doc.text(
          color.brandName,
          pdfConfig.leftMargin + columns.name.position,
          l - 6.2,
        );
        doc.text(
          color.yarnName,
          pdfConfig.leftMargin + columns.name.position,
          l - 4,
        );
        doc.setFontSize(pdfConfig.font.mini);
        doc.text(color.name, pdfConfig.leftMargin + columns.name.position, l);
      }

      // Used For
      doc.setFontSize(pdfConfig.font.p);
      doc.text(label, pdfConfig.leftMargin + columns.usedFor.position, l);

      // Underline
      doc.line(x1, l + 5, x2, l + 5);

      l += itemTopMargin;
    });

    const pageCurrent = doc.getCurrentPageInfo().pageNumber - 1;
    pdfFooter.create(doc, pageCurrent, totalPages);
  },
};

export { pdfExtraColors as default };
