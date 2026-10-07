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

// A project's PDF: a summary page, a page or more for each gauge's colors
// (as the View menu's list or grid), the preview's other colors, and a table
// of the weather, each day with its colors. Drawn with jsPDF, all as text
// and shapes, so it can be searched and copied from.

import { PUBLIC_BASE_DOMAIN_NAME } from '$env/static/public';
import { allGaugesAttributes, gauges } from '$lib/state/gauges-state.svelte';
import { locations } from '$lib/state/location-state.svelte';
import { previews } from '$lib/state/preview-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import { preferences } from '$lib/storage/preferences.svelte';
import type { GaugeStateInterface } from '$lib/types/gauge-types';
import type { Color } from '$lib/types/yarn-types';
import { getDaysInRange, getDaysPercent } from '$lib/utils/range-utils.svelte';
import { rangeRuleSentence } from '$lib/utils/range-format';
import { pluralize } from '$lib/utils/string-utils';
import { INK, SIZE, paragraph, wrap, type Pdf } from './draw';
import { addAppFont } from './fonts';
import { Flow, lineHeight, pageBox } from './layout';
import type { PdfSettings } from './options';
import { drawFooters } from './sections/footer';
import { drawPalette, type PaletteItem } from './sections/palette';
import { drawSummary } from './sections/summary';
import { drawWeatherTable } from './sections/weather-table';

/** What a color says about its yarn, as on the site */
function yarnFields(color: Color, settings: PdfSettings) {
  const hex = color.hex ?? '#ffffff';
  const name = color.name || hex;
  return {
    hex,
    name,
    yarn:
      [color.brandName, color.yarnName].filter(Boolean).join(' · ') ||
      undefined,
    hexLabel: settings.hex && name !== hex ? hex.toUpperCase() : undefined,
  };
}

function gaugeItems(
  gauge: GaugeStateInterface,
  settings: PdfSettings,
): PaletteItem[] {
  const units = preferences.value.units ?? 'metric';
  const unit = gauge.unit.label?.[units] ?? '';
  const isCategory = gauge.unit.type === 'category';
  const showDays = settings.showDaysInRange && weather.data.length > 0;

  return (gauge.colors ?? []).map((color, i) => {
    const r = gauge.ranges?.[i] as
      { from?: number; to?: number; label?: string } | undefined;
    const days = showDays
      ? gauge.targets.map((target) => {
          const count = getDaysInRange({
            id: target.id,
            range: gauge.ranges![i],
            direction: gauge.rangeOptions?.direction,
            includeFromValue: gauge.rangeOptions?.includeFromValue,
            includeToValue: gauge.rangeOptions?.includeToValue,
            gaugeUnitType: gauge.unit.type,
          }).length;
          return {
            label: target.gaugeLabel ?? target.label,
            count: `${count} ${pluralize(weather.grouping, count)}`,
            percent: `${getDaysPercent(count)}%`,
          };
        })
      : undefined;
    return {
      ...yarnFields(color, settings),
      number: i + 1,
      range: !r
        ? undefined
        : isCategory || r.label
          ? { label: r.label ?? '' }
          : {
              from: r.from ?? 0,
              to: r.to ?? 0,
              unit,
              raised: gauge.unit.type === 'temperature',
            },
      days,
    };
  });
}

/** A section's heading and the lines under it, kept with what follows */
function heading(pdf: Pdf, flow: Flow, title: string, notes: string[] = []) {
  const { left, width } = flow.box;
  const titleLines = wrap(pdf, title, width, {
    size: SIZE.heading,
    bold: true,
  });
  const noteLines = notes.flatMap((note) =>
    wrap(pdf, note, width, { size: SIZE.small }),
  );
  const height =
    lineHeight(SIZE.heading) * titleLines.length +
    lineHeight(SIZE.small) * noteLines.length +
    4;
  // Not alone at the bottom of a page: room for a row of colors too
  flow.ensure(height + 20);
  flow.y += paragraph(pdf, titleLines, left, flow.y, {
    size: SIZE.heading,
    bold: true,
  });
  flow.y += paragraph(pdf, noteLines, left, flow.y + 1, {
    size: SIZE.small,
    color: INK.muted,
  });
  flow.y += 4;
}

/** Each section after the first starts a page */
function startSection(flow: Flow) {
  if (flow.y > flow.box.top) flow.newPage();
}

export async function createPdf({
  settings,
  gaugeIds,
  name,
  download = true,
}: {
  settings: PdfSettings;
  gaugeIds: string[];
  /** The saved project's name, if it has one */
  name: string;
  /** Save it as a file (off for tests) */
  download?: boolean;
}) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: settings.pageSize });
  const pdf: Pdf = { doc, font: await addAppFont(doc) };
  const box = pageBox(settings.pageSize);
  const flow = new Flow(doc, box);
  const chosen = gauges.allCreated.filter((gauge) =>
    gaugeIds.includes(gauge.id),
  );

  if (settings.summary)
    await drawSummary(pdf, flow, {
      name,
      gauges: chosen.map((gauge) => ({
        label: gauge.label,
        colors: gauge.colors,
        isCategory: gauge.unit.type === 'category',
        rangeOptions: gauge.rangeOptions,
      })),
    });

  for (const gauge of chosen) {
    startSection(flow);
    const isCategory = gauge.unit.type === 'category';
    heading(
      pdf,
      flow,
      gauge.label,
      !isCategory && gauge.rangeOptions
        ? [
            `${gauge.colors.length} colors, in order. ${rangeRuleSentence(gauge.rangeOptions)}`,
          ]
        : [`${gauge.colors.length} colors, in order.`],
    );
    drawPalette(pdf, flow, gaugeItems(gauge, settings), {
      layout: settings.layout,
      filled: settings.fill,
    });
  }

  const extras = settings.additionalColors ? previews.extraColors : [];
  if (extras.length) {
    if (flow.y > box.top) flow.y += 8;
    heading(pdf, flow, 'Additional Colors', [
      "The preview's border and accent colors.",
    ]);
    drawPalette(
      pdf,
      flow,
      extras.map(({ label, color }) => ({
        ...yarnFields(color, settings),
        role: label,
      })),
      { layout: settings.layout, filled: settings.fill },
    );
  }

  const targets = allGaugesAttributes
    .flatMap((gauge) => gauge.targets)
    .filter((target) => settings.weatherDataParams.includes(target.id));
  if (targets.length && weather.data.length) {
    startSection(flow);
    const count = weather.data.length;
    heading(pdf, flow, 'Weather Data', [
      `${locations.all.length} ${pluralize('location', locations.all.length)}, ${count} ${pluralize(weather.grouping, count)}. The circle beside each value is its color, numbered as in its gauge.`,
    ]);
    drawWeatherTable(pdf, flow, targets);
  }

  drawFooters(pdf, box);

  const title = name || locations.projectTitle || 'Temperature Blanket';
  doc.setProperties({
    title,
    subject: 'Temperature blanket pattern',
    creator: PUBLIC_BASE_DOMAIN_NAME,
  });
  doc.setLanguage('en-US');
  if (download)
    doc.save(`Temperature-Blanket-${locations.projectFilename}.pdf`);
  return doc;
}
