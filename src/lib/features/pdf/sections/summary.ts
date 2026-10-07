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

/** The picture's longest side, in pixels: sharp in print (about 250 dpi
 * across a page), and small enough for a phone's memory */
const PREVIEW_MAX_SIDE = 1800;

/**
 * The open preview as a JPEG, or null if there isn't one to take. A JPEG goes
 * into the PDF as it is, where a PNG is decoded pixel by pixel first; with a
 * big preview that took more memory than iOS Safari allows a tab, and the
 * page reloaded instead of saving the PDF. Drawn once (no animation loop),
 * and the canvas let go of straight after.
 */
async function previewImage() {
  const active = previews.active;
  if (!active?.svg || !active.width || !active.height) return null;
  const scale = Math.min(
    1,
    PREVIEW_MAX_SIDE / Math.max(active.width, active.height),
  );
  const width = Math.round(active.width * scale);
  const height = Math.round(active.height * scale);
  // Drawn at the preview's own size, as the gallery's picture is (so it
  // fills its canvas), then copied down to the size the PDF needs
  const full = document.createElement('canvas');
  const small = document.createElement('canvas');
  try {
    full.width = active.width;
    full.height = active.height;
    const fullCtx = full.getContext('2d');
    if (!fullCtx) return null;
    const { Canvg } = await import('canvg');
    const drawing = Canvg.fromString(
      fullCtx,
      new XMLSerializer().serializeToString(active.svg),
      { ignoreAnimation: true, ignoreMouse: true },
    );
    await drawing.render();

    small.width = width;
    small.height = height;
    const ctx = small.getContext('2d');
    if (!ctx) return null;
    // JPEG has no transparency: the paper's white behind the preview
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(full, 0, 0, width, height);
    return {
      data: small.toDataURL('image/jpeg', 0.9),
      width,
      height,
    };
  } catch (error) {
    console.warn("Can't add the preview to the PDF", error);
    return null;
  } finally {
    // Safari keeps a canvas's memory until it's sized down
    for (const canvas of [full, small]) {
      canvas.width = 0;
      canvas.height = 0;
    }
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
      'JPEG',
      left + (width - size.width) / 2,
      flow.y,
      size.width,
      size.height,
    );
    flow.y += size.height + 6;
  }
}
