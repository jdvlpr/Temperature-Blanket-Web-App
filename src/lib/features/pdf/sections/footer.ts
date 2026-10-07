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

// Each page's footer, added once every page is drawn, so it can say how
// many there are: "Page 2 of 5" and where the data came from, as links

import { PUBLIC_BASE_DOMAIN_NAME, PUBLIC_BASE_URL } from '$env/static/public';
import { locations } from '$lib/state/location-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import type { WeatherSource } from '$lib/types/weather-types';
import { INK, SIZE, measure, style, type Pdf } from '../draw';
import { FOOTER_OFFSET, type Box } from '../layout';

const SOURCES: Record<WeatherSource, { name: string; url: string }> = {
  Meteostat: { name: 'meteostat.net', url: 'https://meteostat.net' },
  'Open-Meteo': { name: 'open-meteo.com', url: 'https://open-meteo.com' },
};

type Piece = { text: string; url?: string };

/** "Weather from meteostat.net · temperature-blanket.com", links and all */
function credits(): Piece[] {
  // Each place may say where its weather came from; if none do, the project's source
  const named = locations.all
    .map((location) => location.source)
    .filter((source): source is WeatherSource => !!source);
  const sources = [...new Set(named.length ? named : [weather.source.name])];
  const pieces: Piece[] = [{ text: 'Weather from ' }];
  sources.forEach((source, i) => {
    if (i) pieces.push({ text: ', ' });
    pieces.push({ text: SOURCES[source].name, url: SOURCES[source].url });
  });
  pieces.push({ text: '  \u00b7  ' });
  pieces.push({ text: PUBLIC_BASE_DOMAIN_NAME, url: PUBLIC_BASE_URL });
  return pieces;
}

export function drawFooters(pdf: Pdf, box: Box) {
  const { doc } = pdf;
  const pieces = credits();
  const textStyle = { size: SIZE.small, color: INK.muted };
  const widths = pieces.map((piece) => measure(pdf, piece.text, textStyle));
  const total = doc.getNumberOfPages();
  const y = box.pageHeight - FOOTER_OFFSET;

  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    style(pdf, textStyle);
    doc.text(`Page ${page} of ${total}`, box.left, y);

    // Right-aligned, as one line
    let x = box.right - widths.reduce((sum, w) => sum + w, 0);
    pieces.forEach((piece, i) => {
      style(pdf, textStyle);
      if (piece.url) doc.textWithLink(piece.text, x, y, { url: piece.url });
      else doc.text(piece.text, x, y);
      x += widths[i];
    });
  }
}
