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

const pdfConfig = {
  colorNumberBackground: '#ffffff',
  leftMargin: 10,
  topMargin: 25,
  font: {
    heading: 'Helvetica',
    paragraph: 'Helvetica',
    symbol: 'Symbol',
    h1: 20,
    h2: 16,
    p: 12,
    mini: 8,
    micro: 6,
  },
  // Shared layout constants for the gauge section (used by gauge + color-details)
  gauge: {
    MAX_COLORS_PER_PAGE: 15,
    titleTopMargin: 10,
    headerTopMargin: 20,
    itemTopMargin: 15,
    itemHeight: 11,
    linePadding: 2,
    headerItems: {
      color: { name: 'Color', position: 2 },
      name: { name: 'Name', position: 25 },
      from: { name: 'From', position: 56 },
      to: { name: 'To', position: 75 },
    },
  },
  // Shared layout constants for the color-details section
  colorDetails: {
    positionX: 95,
    columnWidth: 30,
  },
};

export { pdfConfig as default };
