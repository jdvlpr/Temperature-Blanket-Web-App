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

// Every day's (or week's) weather, a row each: its date and place, then a
// column for each chosen value with that value's numbered color beside it

import { MOON_PHASE_NAMES } from '$lib/constants/weather-constants';
import { gauges, getTargetParentGaugeId } from '$lib/state/gauges-state.svelte';
import { locations } from '$lib/state/location-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import { preferences } from '$lib/storage/preferences.svelte';
import type { WeatherParam } from '$lib/types/gauge-types';
import type { WeatherDay } from '$lib/types/weather-types';
import { getColorInfo } from '$lib/utils/color-utils';
import { convertTime } from '$lib/utils/unit-utils.svelte';
import {
  INK,
  SIZE,
  measure,
  paragraph,
  swatch,
  text,
  wrap,
  type Pdf,
} from '../draw';
import { Flow, lineHeight, ptToMm, tableColumns } from '../layout';

export type TableTarget = {
  id: WeatherParam['id'];
  pdfHeader: { metric: string; imperial: string };
};

const CELL_PAD = 1.6;
const DOT_R = 2.9;

type Measured = WeatherDay['tmax'];

/** A day's value for a target: as written, and as a number for its color */
function valueOf(day: WeatherDay, id: WeatherParam['id']) {
  const units = preferences.value.units ?? 'metric';
  if (id === 'moon') {
    const phase = day.moon;
    return {
      label:
        phase !== null && phase !== undefined ? MOON_PHASE_NAMES[phase] : '',
      value: phase ?? null,
    };
  }
  const data = day[id as keyof WeatherDay] as Measured | undefined;
  const value =
    data && typeof data === 'object' && 'metric' in data
      ? (data[units] as number | null)
      : null;
  if (value === null) return { label: '', value: null };
  return {
    label:
      id === 'dayt'
        ? convertTime(value, { displayUnits: false })
        : String(value),
    value,
  };
}

/** "High (°F)" as a title and its unit */
function header(target: TableTarget) {
  const full = target.pdfHeader[preferences.value.units ?? 'metric'];
  const open = full.indexOf('(');
  return open === -1
    ? { title: full, unit: '' }
    : {
        title: full.slice(0, open).trim(),
        unit: full.slice(open).trim(),
      };
}

export function drawWeatherTable(pdf: Pdf, flow: Flow, targets: TableTarget[]) {
  const { doc } = pdf;
  const { left, width } = flow.box;
  const withColor = targets.map((target) =>
    gauges.allCreated.some((g) => g.id === getTargetParentGaugeId(target.id)),
  );
  const swatchSpace = (i: number) => (withColor[i] ? DOT_R * 2 + 1.5 : 0);
  const labels = targets.map((target) =>
    weather.data.map((day) => valueOf(day, target.id).label),
  );
  // Numbers never wrap; words (moon phases) wrap, but only between words
  const wraps = targets.map((target) => target.id === 'moon');
  const widest = labels.map((list, i) =>
    Math.max(
      0,
      ...(wraps[i] ? list.flatMap((label) => label.split(' ')) : list).map(
        (part) => measure(pdf, part, { size: SIZE.body }),
      ),
    ),
  );
  const headerWidths = targets.map((target) => {
    const { title, unit } = header(target);
    return Math.max(
      measure(pdf, title, { size: SIZE.small, bold: true }),
      measure(pdf, unit, { size: SIZE.small }),
    );
  });

  // Each column as wide as its widest value (and its heading) would like
  const numberWidth =
    measure(pdf, String(weather.data.length), { size: SIZE.small }) + 2.5;
  const dates = weather.data.map((day) =>
    day.date.toLocaleDateString(undefined, { timeZone: 'UTC' }),
  );
  const columns = tableColumns(left, width, {
    day:
      CELL_PAD * 2 +
      numberWidth +
      Math.max(
        20,
        ...dates.map((date) =>
          measure(pdf, date, { size: SIZE.small, bold: true }),
        ),
      ),
    data: targets.map((_, i) =>
      Math.max(
        CELL_PAD * 2 + swatchSpace(i) + widest[i],
        CELL_PAD * 2 + headerWidths[i],
      ),
    ),
  });

  // Room for a value beside its color, and the size that fits it there: a
  // column's values all shrink together, if they must, so they match
  const valueRoom = targets.map(
    (_, i) => columns.data[i].width - CELL_PAD * 2 - swatchSpace(i),
  );
  const columnSize = targets.map((_, i) =>
    widest[i] > valueRoom[i]
      ? SIZE.body * (valueRoom[i] / widest[i])
      : SIZE.body,
  );

  const drawHeader = () => {
    const top = flow.y;
    const height = lineHeight(SIZE.small) * 2 + CELL_PAD * 2;
    doc.setFillColor('#f5f5f4');
    doc.rect(left, top, width, height, 'F');
    paragraph(
      pdf,
      [`#  ${weather.groupingHeading} & Place`],
      columns.day.x + CELL_PAD,
      top + CELL_PAD,
      { size: SIZE.small, bold: true },
    );
    targets.forEach((target, i) => {
      const { title, unit } = header(target);
      const x = columns.data[i].x + CELL_PAD;
      paragraph(pdf, [title], x, top + CELL_PAD, {
        size: SIZE.small,
        bold: true,
      });
      if (unit)
        paragraph(pdf, [unit], x, top + CELL_PAD + lineHeight(SIZE.small), {
          size: SIZE.small,
          color: INK.muted,
        });
    });
    flow.y = top + height;
  };

  drawHeader();
  flow.onNewPage = drawHeader;

  weather.data.forEach((day, index) => {
    const date = dates[index];
    let place =
      locations.all.find((l) => l.index === day.location)?.label ?? '';
    // Just the place's own name: "Lyon", not "Lyon, France"
    if (place.includes(',')) place = place.slice(0, place.indexOf(','));

    const dayWidth = columns.day.width - CELL_PAD * 2 - numberWidth;
    const placeLines = place
      ? wrap(pdf, place, dayWidth, { size: SIZE.small })
      : [];
    const values = targets.map((target, i) => {
      const { value } = valueOf(day, target.id);
      const label = labels[i][index];
      return {
        lines: !label
          ? []
          : wraps[i]
            ? wrap(pdf, label, valueRoom[i], { size: columnSize[i] })
            : [label],
        color: withColor[i] ? getColorInfo({ param: target.id, value }) : null,
        hasValue: value !== null,
      };
    });
    const contentHeight = Math.max(
      lineHeight(SIZE.small) * (1 + placeLines.length),
      ...values.map((v, i) => lineHeight(columnSize[i]) * v.lines.length),
      DOT_R * 2,
    );
    const height = contentHeight + CELL_PAD * 2;

    flow.ensure(height);
    const top = flow.y;

    if (index % 2 === 1) {
      doc.setFillColor(INK.card);
      doc.rect(left, top, width, height, 'F');
    }
    doc.setDrawColor(INK.line);
    doc.setLineWidth(0.2);
    doc.line(left, top + height, left + width, top + height);

    const middle = (lines: number) => top + (height - lines) / 2;
    text(
      pdf,
      `${index + 1}`,
      columns.day.x + CELL_PAD,
      middle(lineHeight(SIZE.small)) + ptToMm(SIZE.small) * 0.8,
      { size: SIZE.small, color: INK.muted },
    );
    const dayX = columns.day.x + CELL_PAD + numberWidth;
    const dayTop = middle(lineHeight(SIZE.small) * (1 + placeLines.length));
    paragraph(pdf, [date], dayX, dayTop, { size: SIZE.small, bold: true });
    paragraph(pdf, placeLines, dayX, dayTop + lineHeight(SIZE.small), {
      size: SIZE.small,
      color: INK.muted,
    });

    values.forEach(({ lines, color, hasValue }, i) => {
      const cell = columns.data[i];
      // The value's color just before it, as one: "① 100"; values line up
      // down the column whether or not a day has a color
      const textX = cell.x + CELL_PAD + (withColor[i] ? DOT_R * 2 + 1.5 : 0);
      // Centered on the row by the middle of the digits, as the color's
      // number is centered on its circle, so the two line up
      const cy = top + height / 2;
      const size = columnSize[i];
      const step = lineHeight(size);
      lines.forEach((line, n) =>
        text(
          pdf,
          line,
          textX,
          cy + ptToMm(size) * 0.36 + step * (n - (lines.length - 1) / 2),
          { size },
        ),
      );
      if (color && hasValue && color.index !== undefined && !isNaN(color.index))
        swatch(pdf, {
          cx: cell.x + CELL_PAD + DOT_R,
          cy,
          r: DOT_R,
          hex: color.hex ?? '#ffffff',
          number: color.index + 1,
        });
    });

    flow.y = top + height;
  });

  flow.onNewPage = null;
}
