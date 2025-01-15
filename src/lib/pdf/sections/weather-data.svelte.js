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

import {
  allGaugesAttributes,
  gauges,
  locations,
  project,
  weather,
} from '$lib/state';
import {
  capitalizeFirstLetter,
  convertTime,
  getAverage,
  getColorInfo,
  getTargetParentGaugeId,
  pluralize,
} from '$lib/utils';
import pdfConfig from '../pdf-config';
import pdfFooter from './footer.svelte';

const pdfWeatherData = {
  linePadding: 2,
  LINE_HEIGHT: 7,
  MAX_ROWS: 31,
  MAX_ROWS_FULL_PAGE: 34,
  MICRO_FONT_LOCATION_LENGTH: 12,
  MINI_FONT_LOCATION_LENGTH: 8,
  headings: [
    {
      text: 'Day', // uses groupingHeading below, the default is "Day"
      positionX: pdfConfig.leftMargin,
    },
    {
      text: 'Location',
      positionX: pdfConfig.leftMargin + 34,
    },
  ],
  weatherDataColumnWidth: 23,
  weatherDataPositionX: pdfConfig.leftMargin + 55,
  headerMarginY: 10,
  get xEnd() {
    return (
      this.weatherDataPositionX +
      this.weatherDataColumnWidth *
        allGaugesAttributes.map((n) => n.targets).flat().length -
      this.linePadding
    );
  },
  pages: () => {
    let rows = weather.data.length;
    rows -= pdfWeatherData.MAX_ROWS; // count first page rows
    let pages = 1; // add first page
    pages += Math.ceil(rows / pdfWeatherData.MAX_ROWS_FULL_PAGE); // Add the rest of the pages
    return pages;
  },
  create: function (doc) {
    doc.addPage();
    // pdfHeader.create(doc);
    // Heading
    doc.setFontSize(pdfConfig.font.h2);
    doc.setFont(pdfConfig.font.heading, 'normal');
    const description = `Weather Data for ${locations.all.length} ${pluralize('Location', locations.all.length)}, ${weather.data.length} ${pluralize(capitalizeFirstLetter(weather.grouping), weather.data.length)}`;
    doc.text(description, pdfConfig.leftMargin, pdfConfig.topMargin);
    // Low Avg High Temps
    doc.setFontSize(pdfConfig.font.p);
    doc.setFont(pdfConfig.font.paragraph, 'normal');
    const tempSymbol = project.units === 'metric' ? 'C' : 'F';
    const average = `Lowest Temperature: ${Math.min(...weather.params.tmin.filter((n) => n !== null))} °${tempSymbol}`;
    doc.text(average, pdfConfig.leftMargin, pdfConfig.topMargin + 9);
    const high = `Average Temperature: ${getAverage(weather.params.tavg.filter((n) => n !== null))} °${tempSymbol}`;
    doc.text(high, pdfConfig.leftMargin + 60, pdfConfig.topMargin + 9);
    const low = `Highest Temperature: ${Math.max(...weather.params.tmax.filter((n) => n !== null))} °${tempSymbol}`;
    doc.text(low, pdfConfig.leftMargin + 125, pdfConfig.topMargin + 9);

    // Create footer
    const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber - 1; // minus one because first page is blank...
    pdfFooter.create(doc, pageCurrent);
    // Create Data Header
    pdfWeatherData.createDataHeader(doc, pdfConfig.topMargin + 20);

    for (
      let i = 0,
        pageRows = 0,
        line =
          pdfConfig.topMargin +
          this.headerMarginY * this.linePadding +
          this.LINE_HEIGHT;
      i < weather.data.length;
      i++, line += this.LINE_HEIGHT, pageRows += 1
    ) {
      if (i === pdfWeatherData.MAX_ROWS) {
        // End of first page
        doc.addPage();
        // pdfHeader.create(doc);
        // Create Data Header
        pdfWeatherData.createDataHeader(doc, pdfConfig.topMargin);
        line = pdfConfig.topMargin + this.LINE_HEIGHT;
        const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber - 1; // minus one because first page is blank...
        pdfFooter.create(doc, pageCurrent);
        pageRows = 0;
      } else if (
        pageRows % pdfWeatherData.MAX_ROWS_FULL_PAGE === 0 &&
        i !== pdfWeatherData.MAX_ROWS_FULL_PAGE &&
        pageRows !== 0
      ) {
        doc.addPage();
        // pdfHeader.create(doc);
        // Create Data Header
        pdfWeatherData.createDataHeader(doc, pdfConfig.topMargin);
        line = pdfConfig.topMargin + this.LINE_HEIGHT;
        const pageCurrent = doc.internal.getCurrentPageInfo().pageNumber - 1; // minus one because first page is blank...
        pdfFooter.create(doc, pageCurrent);
      }
      doc.setFontSize(pdfConfig.font.p);
      doc.setFont(pdfConfig.font.paragraph, 'normal');
      // Date
      const heading = `${i + 1}) ${weather.data[i]?.date.toLocaleDateString()}`;
      doc.text(heading, this.headings[0].positionX, line);
      // Location
      let location = String(
        locations.all.filter((n) => n.index === weather.data[i].location)[0]
          .label,
      );
      if (location.includes(',')) {
        location = location.slice(0, location.indexOf(','));
      }
      if (location.length > this.MINI_FONT_LOCATION_LENGTH) {
        doc.setFontSize(pdfConfig.font.mini);
        if (location.length > this.MICRO_FONT_LOCATION_LENGTH) {
          doc.setFontSize(pdfConfig.font.micro);
          location = location.slice(0, this.MICRO_FONT_LOCATION_LENGTH + 6);
        } else location = location.slice(0, this.MINI_FONT_LOCATION_LENGTH + 4);
      }
      doc.text(location, this.headings[1].positionX, line);
      doc.setFontSize(pdfConfig.font.p);
      // Data
      pdfWeatherData.createRowData(doc, weather.data[i], line);
      // Horizontal Line
      doc.line(
        pdfConfig.leftMargin - this.linePadding,
        line + this.linePadding,
        this.xEnd,
        line + this.linePadding,
      );
      // Vertical Lines
      // Day
      doc.line(
        pdfConfig.leftMargin - this.linePadding,
        line + this.linePadding,
        pdfConfig.leftMargin - this.linePadding,
        line - this.LINE_HEIGHT - 2,
      );
      // Location
      doc.line(
        this.headings[1].positionX - this.linePadding,
        line + this.linePadding,
        this.headings[1].positionX - this.linePadding,
        line - this.LINE_HEIGHT - 2,
      );
      // End
      doc.line(
        this.xEnd,
        line + this.linePadding,
        this.xEnd,
        line - this.LINE_HEIGHT - 2,
      );
    }
  },
  createDataHeader: function (doc, marginY) {
    const positionY = marginY;
    const yBottomLine = positionY + 2;
    const yTopLine = positionY - 5;
    doc.setFont(pdfConfig.font.paragraph, 'bold');
    doc.setFontSize(pdfConfig.font.p);
    // Date and Location
    for (let i = 0; i < this.headings.length; i += 1) {
      let text = this.headings[i].text;
      if (this.headings[i].text === 'Day') text = weather.groupingHeading;
      doc.text(text, this.headings[i].positionX, positionY);
      doc.line(
        this.headings[i].positionX - this.linePadding,
        yBottomLine,
        this.headings[i].positionX - this.linePadding,
        yTopLine,
      );
    }
    // Row Data
    const targets = allGaugesAttributes.map((n) => n.targets).flat();
    targets.forEach((target, i) => {
      const x = this.weatherDataPositionX + this.weatherDataColumnWidth * i;
      doc.text(target.pdfHeader[project.units], x, positionY);
      doc.line(
        x - this.linePadding,
        yBottomLine,
        x - this.linePadding,
        yTopLine,
      );
    });
    // End line
    doc.line(this.xEnd, yBottomLine, this.xEnd, yTopLine);
    // Horizontal Top Line
    doc.line(
      pdfConfig.leftMargin - this.linePadding,
      yTopLine,
      this.xEnd,
      yTopLine,
    );
    // Horizontal Bottom Line
    doc.line(
      pdfConfig.leftMargin - this.linePadding,
      yBottomLine,
      this.xEnd,
      yBottomLine,
    );
  },
  createRowData: function (doc, day, line) {
    doc.setFont(pdfConfig.font.paragraph, 'normal');
    const params = allGaugesAttributes.map((n) => n.targets).flat();
    for (
      let i = 0, marginRight = this.weatherDataPositionX;
      i < params.length;
      i++, marginRight += this.weatherDataColumnWidth
    ) {
      const param = params[i].id;
      // Number
      let sValue;
      if (day[param][project.units] === null) {
        sValue = '';
      } else {
        if (param === 'dayt') {
          sValue = convertTime(day[param][project.units], {
            displayUnits: false,
          });
        } else {
          sValue = String(day[param][project.units]); // gauge.unit.label[Project.units]
        }
      }
      // const sValue = param.id.toString(); //gauge.unit.label[Project.units]
      doc.setFontSize(pdfConfig.font.p);
      doc.text(sValue, marginRight, line);

      // Vertical Lines
      doc.line(
        this.weatherDataPositionX +
          this.weatherDataColumnWidth * i -
          this.linePadding,
        line + this.linePadding,
        this.weatherDataPositionX +
          this.weatherDataColumnWidth * i -
          this.linePadding,
        line - this.LINE_HEIGHT - 2,
      );

      const parentGaugeId = getTargetParentGaugeId(param);
      const hasGauge = gauges.allCreated
        .map((gauge) => gauge.id)
        .includes(parentGaugeId);

      if (hasGauge) {
        // Color box
        const gaugeId = allGaugesAttributes.filter((gauge) =>
          gauge.targets.some((item) => item.id === param),
        )[0].id;
        const colorInfo = getColorInfo(gaugeId, day[param][project.units]);
        doc.setFillColor(colorInfo.hex);
        doc.rect(marginRight + 15, line - 4, 5, 5, 'F');
        // Color Number
        doc.setFillColor(pdfConfig.colorNumberBackground);
        doc.rect(marginRight + 16, line - 3, 3, 3, 'F');
        doc.setFontSize(pdfConfig.font.mini);
        const colorNumber =
          colorInfo?.index !== null && !isNaN(colorInfo?.index)
            ? String(colorInfo.index + 1)
            : '';
        doc.text(colorNumber, marginRight + 17.4, line - 0.5, {
          align: 'center',
        });
      }
    }
  },
};

export { pdfWeatherData as default };
