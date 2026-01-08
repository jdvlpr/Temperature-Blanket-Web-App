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

import { PUBLIC_SITE_TITLE } from '$env/static/public';
import pdfConfig from '../pdf-config';

const pdfHeader = {
  create: function (doc) {
    doc.setFont(pdfConfig.font.heading, 'Bold');
    doc.setFontSize(pdfConfig.font.h1);
    doc.text(PUBLIC_SITE_TITLE, pdfConfig.leftMargin, pdfConfig.topMargin);
  },
};

export { pdfHeader as default };
