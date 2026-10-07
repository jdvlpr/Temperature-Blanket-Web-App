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
import { INK, SIZE, paragraph, swatch, text, wrap, type Pdf } from '../draw';
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
  const columns = tableColumns(left, width, targets.length);
  const withColor = targets.map((target) =>
    gauges.allCreated.some((g) => g.id === getTargetParentGaugeId(target.id)),
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
    const date = day.date.toLocaleDateString(undefined, { timeZone: 'UTC' });
    let place =
      locations.all.find((l) => l.index === day.location)?.label ?? '';
    // Just the place's own name: "Lyon", not "Lyon, France"
    if (place.includes(',')) place = place.slice(0, place.indexOf(','));

    const numberWidth = 9;
    const dayWidth = columns.day.width - CELL_PAD * 2 - numberWidth;
    const placeLines = place
      ? wrap(pdf, place, dayWidth, { size: SIZE.small })
      : [];
    const values = targets.map((target, i) => {
      const { label, value } = valueOf(day, target.id);
      const room =
        columns.data[i].width -
        CELL_PAD * 2 -
        (withColor[i] ? DOT_R * 2 + 1.5 : 0);
      return {
        lines: label ? wrap(pdf, label, room, { size: SIZE.body }) : [],
        color: withColor[i] ? getColorInfo({ param: target.id, value }) : null,
        hasValue: value !== null,
      };
    });
    const contentHeight = Math.max(
      lineHeight(SIZE.small) * (1 + placeLines.length),
      ...values.map((v) => lineHeight(SIZE.body) * v.lines.length),
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
      paragraph(
        pdf,
        lines,
        cell.x + CELL_PAD,
        middle(lineHeight(SIZE.body) * lines.length),
        { size: SIZE.body },
      );
      if (color && hasValue && color.index !== undefined && !isNaN(color.index))
        swatch(pdf, {
          cx: cell.x + cell.width - CELL_PAD - DOT_R,
          cy: top + height / 2,
          r: DOT_R,
          hex: color.hex ?? '#ffffff',
          number: color.index + 1,
        });
    });

    flow.y = top + height;
  });

  flow.onNewPage = null;
}
