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

import { gauges, locations, weather } from '$lib/state';
import { preferences } from '$lib/storage/preferences.svelte';
import type { ExportOptions, SpreadsheetData } from './types';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const DATA_LABELS: Record<
  string,
  { label: string; unitImperial: string; unitMetric: string }
> = {
  tmax: { label: 'High Temp', unitImperial: '°F', unitMetric: '°C' },
  tavg: { label: 'Avg Temp', unitImperial: '°F', unitMetric: '°C' },
  tmin: { label: 'Low Temp', unitImperial: '°F', unitMetric: '°C' },
  prcp: { label: 'Rain', unitImperial: 'in', unitMetric: 'mm' },
  snow: { label: 'Snow', unitImperial: 'in', unitMetric: 'cm' },
  dayt: { label: 'Day Length', unitImperial: 'hrs', unitMetric: 'hrs' },
};

function hexToRgb(hex: string): { red: number; green: number; blue: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { red: 0, green: 0, blue: 0 };
  return {
    red: parseInt(result[1], 16) / 255,
    green: parseInt(result[2], 16) / 255,
    blue: parseInt(result[3], 16) / 255,
  };
}

function getSelectedDataTypes(options: ExportOptions): string[] {
  return Object.entries(options.dataToInclude)
    .filter(([, v]) => v)
    .map(([k]) => k);
}

function createWeatherGrid(
  weatherData: typeof weather.data,
  options: ExportOptions,
): (string | number | boolean | null)[][] {
  const units = preferences.value.units as 'imperial' | 'metric';
  const selectedTypes = getSelectedDataTypes(options);
  const colsPerMonth = selectedTypes.length + 2;

  // Determine the year and days in each month
  const years = weatherData.map((d) => d.date.getUTCFullYear());
  const year =
    years.length > 0 ? Math.min(...years) : new Date().getUTCFullYear();
  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];

  // Build date lookup
  const dateMap = new Map<string, (typeof weatherData)[0]>();
  for (const day of weatherData) {
    const key = `${day.date.getUTCMonth()}-${day.date.getUTCDate()}`;
    dateMap.set(key, day);
  }

  const grid: (string | number | boolean | null)[][] = [];
  const maxDays = Math.max(...daysInMonth);

  // Row 1: Month headers (merged later)
  const monthRow: (string | null)[] = [];
  for (const month of MONTHS) {
    monthRow.push(month);
    for (let i = 1; i < colsPerMonth; i++) monthRow.push(null);
  }
  grid.push(monthRow);

  // Row 2: Sub-headers
  const subHeaderRow: string[] = [];
  for (let m = 0; m < 12; m++) {
    subHeaderRow.push('Day');
    for (const type of selectedTypes) {
      const info = DATA_LABELS[type];
      const unit = units === 'imperial' ? info.unitImperial : info.unitMetric;
      subHeaderRow.push(`${info.label} (${unit})`);
    }
    subHeaderRow.push('Done');
  }
  grid.push(subHeaderRow);

  // Data rows (only actual days per month)
  for (let day = 1; day <= maxDays; day++) {
    const row: (string | number | boolean | null)[] = [];
    for (let month = 0; month < 12; month++) {
      if (day <= daysInMonth[month]) {
        row.push(day);
        const dayData = dateMap.get(`${month}-${day}`);
        for (const type of selectedTypes) {
          if (dayData) {
            const val = (dayData as any)[type]?.[units];
            row.push(val ?? null);
          } else {
            row.push(null);
          }
        }
        row.push(false);
      } else {
        // Empty cells for months with fewer days
        for (let i = 0; i < colsPerMonth; i++) row.push(null);
      }
    }
    grid.push(row);
  }

  return grid;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function createConditionalFormattingRules(
  sheetId: number,
  options: ExportOptions,
): gapi.client.sheets.Request[] {
  const requests: gapi.client.sheets.Request[] = [];
  const selectedTypes = getSelectedDataTypes(options);
  const colsPerMonth = selectedTypes.length + 2;

  // Map gauge IDs to data types
  const gaugeToTypes: Record<string, string[]> = {
    temp: ['tmax', 'tavg', 'tmin'],
    prcp: ['prcp'],
    snow: ['snow'],
    dayt: ['dayt'],
  };

  for (const gauge of gauges.allCreated) {
    const applyKey = gauge.id as keyof typeof options.gaugesToApply;
    if (!options.gaugesToApply[applyKey]) continue;
    if (!gauge.ranges || !gauge.colors) continue;

    const relevantTypes = gaugeToTypes[gauge.id] || [];
    const typeIndices = selectedTypes
      .map((t, i) => (relevantTypes.includes(t) ? i : -1))
      .filter((i) => i >= 0);

    if (typeIndices.length === 0) continue;

    for (let rangeIdx = 0; rangeIdx < gauge.ranges.length; rangeIdx++) {
      const range = gauge.ranges[rangeIdx];
      const color = gauge.colors[rangeIdx];
      if (!color?.hex || !('from' in range) || !('to' in range)) continue;

      const rgb = hexToRgb(color.hex);

      // Apply to each month's relevant columns
      for (let month = 0; month < 12; month++) {
        for (const typeIdx of typeIndices) {
          const col = month * colsPerMonth + 1 + typeIdx; // +1 for Day column
          requests.push({
            addConditionalFormatRule: {
              rule: {
                ranges: [
                  {
                    sheetId,
                    startRowIndex: 2,
                    endRowIndex: 33,
                    startColumnIndex: col,
                    endColumnIndex: col + 1,
                  },
                ],
                booleanRule: {
                  condition: {
                    type: 'NUMBER_BETWEEN',
                    values: [
                      { userEnteredValue: String(range.from) },
                      { userEnteredValue: String(range.to) },
                    ],
                  },
                  format: { backgroundColor: rgb },
                },
              },
              index: rangeIdx,
            },
          });
        }
      }
    }
  }

  return requests;
}

function createMergeRequests(
  sheetId: number,
  options: ExportOptions,
): gapi.client.sheets.Request[] {
  const selectedTypes = getSelectedDataTypes(options);
  const colsPerMonth = selectedTypes.length + 2;
  const requests: gapi.client.sheets.Request[] = [];

  for (let month = 0; month < 12; month++) {
    const startCol = month * colsPerMonth;
    requests.push({
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: startCol,
          endColumnIndex: startCol + colsPerMonth,
        },
        mergeType: 'MERGE_ALL',
      },
    });
  }

  return requests;
}

function createCheckboxRequests(
  sheetId: number,
  options: ExportOptions,
): gapi.client.sheets.Request[] {
  const selectedTypes = getSelectedDataTypes(options);
  const colsPerMonth = selectedTypes.length + 2;
  const requests: gapi.client.sheets.Request[] = [];

  for (let month = 0; month < 12; month++) {
    const col = month * colsPerMonth + colsPerMonth - 1; // Last column of month
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 2,
          endRowIndex: 33,
          startColumnIndex: col,
          endColumnIndex: col + 1,
        },
        cell: { dataValidation: { condition: { type: 'BOOLEAN' } } },
        fields: 'dataValidation',
      },
    });
  }

  return requests;
}

// Import shared utility for consistent range checks
import { isValueInRange } from '$lib/utils/range-utils.svelte';

function createGaugeLegendData(
  gauge: (typeof gauges.allCreated)[0],
  options: ExportOptions,
): (string | number)[][] {
  if (!gauge.ranges || !gauge.colors) return [];

  const includeFrom = gauge.rangeOptions?.includeFromValue ?? true;
  const includeTo = gauge.rangeOptions?.includeToValue ?? false;

  const rows: (string | number)[][] = [];

  // Header row
  const header = [
    `Range Start (${includeFrom ? 'including' : 'excluding'})`,
    `Range End (${includeTo ? 'including' : 'excluding'})`,
    'Color (Hex)',
    'Yarn Info',
  ];
  if (options.includeDayCounts) header.push('Day Count', 'Percentage');
  rows.push(header);

  for (let i = 0; i < gauge.ranges.length; i++) {
    const range = gauge.ranges[i];
    const color = gauge.colors[i];
    const yarnInfo =
      color?.brandName && color?.yarnName
        ? `${color.brandName} - ${color.yarnName}${color.name ? ` - ${color.name}` : ''}`
        : color?.name || '';

    const row: (string | number)[] = [
      'from' in range && range.from !== undefined ? range.from : '',
      'to' in range && range.to !== undefined ? range.to : '',
      color?.hex || '',
      yarnInfo,
    ];

    if (options.includeDayCounts) {
      const dayCount = countDaysInRange(gauge, i);
      const pct =
        weather.data.length > 0
          ? ((dayCount / weather.data.length) * 100).toFixed(1) + '%'
          : '0%';
      row.push(dayCount, pct);
    }

    rows.push(row);
  }

  // Add instructional note at the bottom
  rows.push([]); // Empty row
  rows.push([]); // Empty row
  rows.push([
    "NOTE: If you change the hex color or range values above, you'll need to also update the Conditional Formatting rules in order for changes to take effect. Go to the Weather Data sheet, then from the menu select Format > Conditional Formatting and update the color rules.",
  ]);

  return rows;
}

function countDaysInRange(
  gauge: (typeof gauges.allCreated)[0],
  rangeIndex: number,
): number {
  if (!gauge.ranges) return 0;
  const units = preferences.value.units as 'imperial' | 'metric';
  const range = gauge.ranges[rangeIndex];
  const targetId = gauge.targets?.[0]?.id;

  if (
    !targetId ||
    !('from' in range) ||
    range.from === undefined ||
    range.to === undefined
  )
    return 0;

  const includeFrom = gauge.rangeOptions?.includeFromValue ?? true;
  const includeTo = gauge.rangeOptions?.includeToValue ?? false;
  const direction = gauge.rangeOptions?.direction;

  let count = 0;
  for (const day of weather.data) {
    const value = (day as any)[targetId]?.[units];

    // Use shared utility to handle direction (high-to-low) correctly
    if (
      isValueInRange({
        value,
        range,
        direction,
        includeFromValue: includeFrom,
        includeToValue: includeTo,
      })
    ) {
      count++;
    }
  }
  return count;
}

function createLegendColorRequests(
  sheetId: number,
  gauge: (typeof gauges.allCreated)[0],
): gapi.client.sheets.Request[] {
  if (!gauge.colors) return [];
  const requests: gapi.client.sheets.Request[] = [];

  for (let i = 0; i < gauge.colors.length; i++) {
    const color = gauge.colors[i];
    if (!color?.hex) continue;

    const rgb = hexToRgb(color.hex);
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: i + 1,
          endRowIndex: i + 2,
          startColumnIndex: 2,
          endColumnIndex: 3,
        },
        cell: { userEnteredFormat: { backgroundColor: rgb } },
        fields: 'userEnteredFormat.backgroundColor',
      },
    });
  }

  return requests;
}

export function buildSpreadsheetData(options: ExportOptions): SpreadsheetData {
  const projectName =
    `Temperature Blanket: ${locations.projectFilename}` ||
    'Temperature Blanket';
  const sheets: gapi.client.sheets.Sheet[] = [];
  const requests: gapi.client.sheets.Request[] = [];
  const values: gapi.client.sheets.ValueRange[] = [];

  const selectedTypes = getSelectedDataTypes(options);
  const colsPerMonth = selectedTypes.length + 2; // Day + data columns + Done
  const totalColumns = 12 * colsPerMonth;

  let sheetIndex = 0;

  // Weather Data sheet with enough columns
  sheets.push({
    properties: {
      sheetId: sheetIndex,
      title: 'Weather Data',
      gridProperties: { columnCount: totalColumns, rowCount: 34 },
    },
  });
  const grid = createWeatherGrid(weather.data, options);
  values.push({ range: "'Weather Data'!A1", values: grid });

  requests.push(...createMergeRequests(sheetIndex, options));
  requests.push(...createCheckboxRequests(sheetIndex, options));
  requests.push(...createConditionalFormattingRules(sheetIndex, options));

  sheetIndex++;

  // Gauge Legend sheets
  for (const gauge of gauges.allCreated) {
    const applyKey = gauge.id as keyof typeof options.gaugesToApply;
    if (!options.gaugesToApply[applyKey]) continue;

    const title = gauge.label || `${gauge.id} Gauge`;
    sheets.push({ properties: { sheetId: sheetIndex, title } });

    const legendData = createGaugeLegendData(gauge, options);
    values.push({ range: `'${title}'!A1`, values: legendData });

    requests.push(...createLegendColorRequests(sheetIndex, gauge));
    sheetIndex++;
  }

  return { title: projectName, sheets, requests, values };
}
