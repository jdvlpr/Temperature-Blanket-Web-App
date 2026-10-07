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

// The first page: the project at a glance. Its name, places and dates, the
// weather in short, the preview, and each gauge's palette as a strip.

import { locations } from '$lib/state/location-state.svelte';
import { previews } from '$lib/state/preview-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import { preferences } from '$lib/storage/preferences.svelte';
import type { TISO8601DateString } from '$lib/types/weather-types';
import { stringToDate } from '$lib/utils/date-utils';
import { getAverage } from '$lib/utils/number-utils';
import { svgToPNG } from '$lib/utils/preview-utils.svelte';
import { formatRangeEnd, rangeRuleSentence } from '$lib/utils/range-format';
import { pluralize } from '$lib/utils/string-utils';
import {
  INK,
  SIZE,
  inkOn,
  measure,
  paragraph,
  text,
  wrap,
  type Pdf,
} from '../draw';
import { Flow, fitImage, lineHeight, ptToMm } from '../layout';

export type SummaryGauge = {
  label: string;
  colors: { hex?: string }[];
  isCategory: boolean;
  rangeOptions?: { includeFromValue?: boolean; includeToValue?: boolean };
};

const formatDate = (date?: TISO8601DateString) =>
  date
    ? stringToDate(date).toLocaleDateString(undefined, {
        timeZone: 'UTC',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : '';

function temperatures(): string | null {
  const unit = preferences.value.units === 'imperial' ? '°F' : '°C';
  const values = (list?: (number | null)[]) =>
    (list ?? []).filter((n): n is number => n !== null);
  const low = values(weather.params.tmin);
  const average = values(weather.params.tavg);
  const high = values(weather.params.tmax);
  if (!low.length && !high.length) return null;
  const parts = [
    low.length && `Lowest ${formatRangeEnd(Math.min(...low), unit)}`,
    average.length && `Average ${formatRangeEnd(getAverage(average), unit)}`,
    high.length && `Highest ${formatRangeEnd(Math.max(...high), unit)}`,
  ].filter(Boolean);
  return `Temperatures: ${parts.join(', ')}`;
}

/** The open preview as a picture, or null if there isn't one to take */
async function previewImage() {
  const active = previews.active;
  if (!active?.svg || !active.width || !active.height) return null;
  try {
    const data = await svgToPNG({
      svgNode: active.svg,
      width: active.width,
      height: active.height,
      download: false,
      canvasId: 'pdf-preview-canvas',
    });
    return { data, width: active.width, height: active.height };
  } catch (error) {
    console.warn("Can't add the preview to the PDF", error);
    return null;
  } finally {
    document.getElementById('pdf-preview-canvas')?.remove();
  }
}

/** A palette as one strip of its colors, numbered when there's room */
function strip(pdf: Pdf, flow: Flow, colors: { hex?: string }[]) {
  const { doc } = pdf;
  const { left, width } = flow.box;
  const height = 8;
  flow.ensure(height);
  const each = width / colors.length;
  colors.forEach((color, i) => {
    const hex = color.hex ?? '#ffffff';
    doc.setFillColor(hex);
    // A hair wider, so no paper shows between colors
    doc.rect(left + each * i, flow.y, each + 0.05, height, 'F');
    const label = String(i + 1);
    if (measure(pdf, label, { size: SIZE.min, bold: true }) + 1 < each)
      text(
        pdf,
        label,
        left + each * i + each / 2,
        flow.y + height / 2 + ptToMm(SIZE.min) * 0.36,
        { size: SIZE.min, bold: true, color: inkOn(hex) },
        'center',
      );
  });
  doc.setDrawColor(INK.line);
  doc.setLineWidth(0.3);
  doc.rect(left, flow.y, width, height, 'S');
  flow.y += height;
}

export async function drawSummary(
  pdf: Pdf,
  flow: Flow,
  { name, gauges }: { name: string; gauges: SummaryGauge[] },
) {
  const { left, width } = flow.box;

  // Name, or what the project is
  const title = wrap(pdf, name || 'Temperature Blanket', width, {
    size: SIZE.title,
    bold: true,
  });
  flow.y += paragraph(pdf, title, left, flow.y, {
    size: SIZE.title,
    bold: true,
  });
  flow.y += 2;

  // Each place and its dates
  for (const location of locations.all) {
    const line = `${location.label ?? ''} · ${formatDate(location.from)} – ${formatDate(location.to)}`;
    flow.y += paragraph(
      pdf,
      wrap(pdf, line, width, { size: SIZE.body }),
      left,
      flow.y,
      { size: SIZE.body },
    );
  }

  const count = weather.data.length;
  const facts = [
    count && `${count} ${pluralize(weather.grouping, count)}`,
    preferences.value.units === 'imperial'
      ? 'Imperial units (°F, inches)'
      : 'Metric units (°C, millimeters)',
  ].filter(Boolean) as string[];
  const temperatureLine = temperatures();
  const factLines = [
    ...wrap(pdf, facts.join('  ·  '), width, { size: SIZE.small }),
    ...(temperatureLine
      ? wrap(pdf, temperatureLine, width, { size: SIZE.small })
      : []),
  ];
  flow.y += paragraph(pdf, factLines, left, flow.y + 1, {
    size: SIZE.small,
    color: INK.muted,
  });
  flow.y += 6;

  // The preview, as big as fits with the palettes still below it
  const image = await previewImage();
  if (image) {
    const palettesHeight = gauges.length * 22;
    const maxHeight = Math.max(60, Math.min(130, flow.room - palettesHeight));
    const size = fitImage(image.width, image.height, width, maxHeight);
    flow.ensure(size.height);
    pdf.doc.addImage(
      image.data,
      'PNG',
      left + (width - size.width) / 2,
      flow.y,
      size.width,
      size.height,
    );
    flow.y += size.height + 6;
  }

  // Each palette, with how its ranges work
  for (const gauge of gauges) {
    if (!gauge.colors.length) continue;
    flow.ensure(lineHeight(SIZE.body) + 8 + lineHeight(SIZE.small) * 2 + 4);
    flow.y += paragraph(pdf, [gauge.label], left, flow.y, {
      size: SIZE.body,
      bold: true,
    });
    flow.y += 1;
    strip(pdf, flow, gauge.colors);
    if (!gauge.isCategory && gauge.rangeOptions) {
      flow.y += paragraph(
        pdf,
        [
          `${gauge.colors.length} colors. ${rangeRuleSentence({
            includeFromValue: gauge.rangeOptions.includeFromValue,
            includeToValue: gauge.rangeOptions.includeToValue,
          })}`,
        ],
        left,
        flow.y + 1,
        { size: SIZE.small, color: INK.muted },
      );
    }
    flow.y += 5;
  }
}
