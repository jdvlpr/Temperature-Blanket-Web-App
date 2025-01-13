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

import { PUBLIC_BASE_DOMAIN_NAME, PUBLIC_BASE_URL } from '$env/static/public';
import { locationsState } from '$lib/state';
import pdfConfig from '../pdf-config';
import gauges from './gauges';
import weatherData from './weather-data.svelte';

const pdfFooter = {
  pages: () => {
    return gauges.pages() + weatherData.pages();
  },
  create: (doc, page) => {
    // page number
    doc.setFontSize(pdfConfig.font.p);
    doc.setFont(pdfConfig.font.paragraph, 'normal');
    doc.text(`Page ${page} of ${pdfFooter.pages()}`, pdfConfig.leftMargin, 273);

    // footer text
    doc.setFontSize(pdfConfig.font.p);
    doc.setFont(pdfConfig.font.paragraph, 'normal');
    doc.textWithLink(
      `Data from ${PUBLIC_BASE_DOMAIN_NAME}`,
      pdfConfig.leftMargin + 30,
      273,
      {
        url: PUBLIC_BASE_URL,
      },
    );
    const sources = [
      ...new Set(locationsState.locations.map((n) => n?.source)),
    ];
    let margin = 97;
    if (sources.every((source) => source === undefined)) return; // TODO: investigate this bug; source should be defined
    sources.forEach((source) => {
      doc.text(' & ', pdfConfig.leftMargin + margin, 273);
      if (source === 'Meteostat') {
        doc.textWithLink(
          'meteostat.net',
          pdfConfig.leftMargin + margin + 5,
          273,
          {
            url: 'https://meteostat.net',
          },
        );
      }
      if (source === 'Open-Meteo') {
        doc.textWithLink(
          'open-meteo.com',
          pdfConfig.leftMargin + margin + 5,
          273,
          {
            url: 'https://open-meteo.com',
          },
        );
      }
      margin += 36;
    });
  },
};

export { pdfFooter as default };
