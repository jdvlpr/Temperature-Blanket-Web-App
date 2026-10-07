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
// weather in short, and the preview.

import { locations } from '$lib/state/location-state.svelte';
import { previews } from '$lib/state/preview-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import { preferences } from '$lib/storage/preferences.svelte';
import type { TISO8601DateString } from '$lib/types/weather-types';
import { stringToDate } from '$lib/utils/date-utils';
import { getAverage } from '$lib/utils/number-utils';
import { svgToPNG } from '$lib/utils/preview-utils.svelte';
import { formatRangeEnd } from '$lib/utils/range-format';
import { pluralize } from '$lib/utils/string-utils';
import { INK, SIZE, paragraph, wrap, type Pdf } from '../draw';
import { Flow, fitImage } from '../layout';

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

export async function drawSummary(
  pdf: Pdf,
  flow: Flow,
  { name }: { name: string },
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

  // The preview, as big as fits on the page
  const image = await previewImage();
  if (image) {
    const maxHeight = Math.max(60, flow.room);
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
}
