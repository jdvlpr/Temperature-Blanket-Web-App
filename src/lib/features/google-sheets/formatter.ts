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
import { getTextColor } from '$lib/utils/color-utils';
import { MOON_PHASE_NAMES } from '$lib/constants/weather-constants';

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
  dayt: { label: 'Daytime', unitImperial: 'hrs', unitMetric: 'hrs' },
  moon: { label: 'Moon Phase', unitImperial: '', unitMetric: '' },
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
            if (type === 'moon') {
              const moonId = (dayData as any).moon;
              row.push(
                typeof moonId === 'number' ? MOON_PHASE_NAMES[moonId] : null,
              );
            } else {
              const val = (dayData as any)[type]?.[units];
              row.push(val ?? null);
            }
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

  // Map gauge IDs to data types.
  // This helps identify which columns in the monthly block are relevant for a gauge.
  const gaugeToTypes: Record<string, string[]> = {
    temp: ['tmax', 'tavg', 'tmin'],
    prcp: ['prcp'],
    snow: ['snow'],
    dayt: ['dayt'],
    moon: ['moon'],
  };

  for (const gauge of gauges.allCreated) {
    const applyKey = gauge.id as keyof typeof options.gaugesToApply;
    if (!options.gaugesToApply[applyKey]) continue;
    if (!gauge.ranges || !gauge.colors) continue;

    const relevantTypes = gaugeToTypes[gauge.id] || [];
    // Identify indices of relevant columns within a monthly block (0-based from data start)
    const typeIndices = selectedTypes
      .map((t, i) => (relevantTypes.includes(t) ? i : -1))
      .filter((i) => i >= 0);

    if (typeIndices.length === 0) continue;

    const includeFrom = gauge.rangeOptions?.includeFromValue ?? true;
    const includeTo = gauge.rangeOptions?.includeToValue ?? false;
    const direction = gauge.rangeOptions?.direction ?? 'low-to-high';

    for (let rangeIdx = 0; rangeIdx < gauge.ranges.length; rangeIdx++) {
      const range = gauge.ranges[rangeIdx];
      const color = gauge.colors[rangeIdx];
      if (!color?.hex || !('from' in range) || !('to' in range)) continue;

      const rgb = hexToRgb(color.hex);
      const textColor = getTextColor(color.hex);
      const textRgb = hexToRgb(textColor === 'white' ? '#ffffff' : '#000000');

      const from = range.from as number;
      const to = range.to as number;

      // Construct formula based on range inclusion preferences and direction
      let formula = '';
      if (direction === 'high-to-low') {
        const opFrom = includeFrom ? '<=' : '<';
        const opTo = includeTo ? '>=' : '>';
        // Example: AND(val <= 39, val > 36)
        // We use RC (R1C1 relative reference) style implicitly by referring to top-left cell in range
        // BUT for conditional formatting 'custom formula', we should refer to the top-left cell of the APPLIED range.
        // We will build the formula once we know the start cell. Using A1 notation relative to start cell is standard.
        // However, we apply this to multiple disjunct ranges (columns in different months).
        // It's safer to add a rule PER MONTH column so the relative reference is clean.
      }

      // Apply to each month's relevant columns
      for (let month = 0; month < 12; month++) {
        for (const typeIdx of typeIndices) {
          const colIndex = month * colsPerMonth + 1 + typeIdx; // 0-indexed column index
          // Convert column index to A1 notation column letter (e.g., 0->A, 1->B)
          // Since we might go beyond Z, we need proper conversion or just rely on the API applying it to the range.
          // In Custom Formula, if we say "=A1>5" and applying to B1:B10, it checks B1>5 (relative).
          // So we need to refer to the TOP-LEFT cell of the range being formatted.
          const colLetter = getColumnLetter(colIndex); // Helper we need to add
          const startCell = `${colLetter}3`; // Data starts at row 3 (index 2)

          let conditionFormula = '';
          if (direction === 'high-to-low') {
            const lowCheck = includeTo
              ? `${startCell}>=${to}`
              : `${startCell}>${to}`;
            const highCheck = includeFrom
              ? `${startCell}<=${from}`
              : `${startCell}<${from}`;
            conditionFormula = `=AND(ISNUMBER(${startCell}), ${lowCheck}, ${highCheck})`;
          } else {
            const lowCheck = includeFrom
              ? `${startCell}>=${from}`
              : `${startCell}>${from}`;
            const highCheck = includeTo
              ? `${startCell}<=${to}`
              : `${startCell}<${to}`;
            conditionFormula = `=AND(ISNUMBER(${startCell}), ${lowCheck}, ${highCheck})`;
          }

          requests.push({
            addConditionalFormatRule: {
              rule: {
                ranges: [
                  {
                    sheetId,
                    startRowIndex: 2,
                    endRowIndex: 33, // Updated to only cover max days if needed, but 33 covers 31 days safely
                    startColumnIndex: colIndex,
                    endColumnIndex: colIndex + 1,
                  },
                ],
                booleanRule: {
                  condition: {
                    type: 'CUSTOM_FORMULA',
                    values: [{ userEnteredValue: conditionFormula }],
                  },
                  format: {
                    backgroundColor: rgb,
                    textFormat: { foregroundColor: textRgb },
                  },
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

function getColumnLetter(colIndex: number): string {
  let temp,
    letter = '';
  while (colIndex >= 0) {
    temp = colIndex % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    colIndex = Math.floor(colIndex / 26) - 1;
  }
  return letter;
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

// Helper to get all column letters in 'Weather Data' that correspond to valid data
function getWeatherDataColumnLetters(
  options: ExportOptions,
  targetType: string,
): string[] {
  const selectedTypes = getSelectedDataTypes(options);
  const colsPerMonth = selectedTypes.length + 2;
  const colIndexInMonth = selectedTypes.indexOf(targetType);

  if (colIndexInMonth === -1) return [];

  const letters: string[] = [];
  for (let month = 0; month < 12; month++) {
    // Month start col + 1 (Day col) + type offset
    const colIdx = month * colsPerMonth + 1 + colIndexInMonth;
    letters.push(getColumnLetter(colIdx));
  }
  return letters;
}

function createGaugeLegendData(
  gauge: (typeof gauges.allCreated)[0],
  options: ExportOptions,
): (string | number | boolean)[][] {
  if (!gauge.ranges || !gauge.colors) return [];

  const includeFrom = gauge.rangeOptions?.includeFromValue ?? true;
  const includeTo = gauge.rangeOptions?.includeToValue ?? false;
  const direction = gauge.rangeOptions?.direction ?? 'low-to-high';

  // Determine which data types this gauge applies to
  const gaugeToTypes: Record<string, string[]> = {
    temp: ['tmax', 'tavg', 'tmin'],
    prcp: ['prcp'],
    snow: ['snow'],
    dayt: ['dayt'],
    moon: ['moon'],
  };
  const possibleTypes = gaugeToTypes[gauge.id] || [];
  // Filter by what's actually selected in options
  const selectedTypesInOrder = getSelectedDataTypes(options);
  const applicableTypes = possibleTypes.filter((t) =>
    selectedTypesInOrder.includes(t),
  );

  const rows: (string | number | boolean)[][] = [];

  // 1. Build Header Row
  // "Day Count" header merged above the sub-columns?
  // The user asked for "Day Count | Percentage", and under Day Count: "High Temp | Low Temp", etc.
  // This implies a double header structure for accurate labeling.
  // Row 1: Range Start | Range End | Color | Yarn Info | Day Count (merged) | Percentage (merged)
  // Row 2: ... | ... | ... | ... | High Temp | Low Temp | High Temp | Low Temp

  const headerRow1 = [
    `Range Start (${includeFrom ? 'including' : 'excluding'})`,
    `Range End (${includeTo ? 'including' : 'excluding'})`,
    'Color (Hex)',
    'Yarn Info',
  ];

  const headerRow2 = ['', '', '', '']; // Spacers for first 4 cols

  if (options.includeDayCounts && applicableTypes.length > 0) {
    // Add Day Count header
    headerRow1.push('Day Count');
    // Add spacer cols for Day Count if multiple types
    for (let k = 1; k < applicableTypes.length; k++) headerRow1.push('');

    // Add Percentage header
    headerRow1.push('Percentage');
    // Add spacer cols for Percentage if multiple types
    for (let k = 1; k < applicableTypes.length; k++) headerRow1.push('');

    // Fill Row 2 with Labels
    // Day Count columns
    for (const t of applicableTypes) {
      const info = DATA_LABELS[t];
      headerRow2.push(
        `${info.label} (${preferences.value.units === 'imperial' ? info.unitImperial : info.unitMetric})`,
      );
    }
    // Percentage columns
    for (const t of applicableTypes) {
      const info = DATA_LABELS[t];
      headerRow2.push(
        `${info.label} (${preferences.value.units === 'imperial' ? info.unitImperial : info.unitMetric})`,
      );
    }
  }

  rows.push(headerRow1);
  if (options.includeDayCounts && applicableTypes.length > 0) {
    rows.push(headerRow2);
  }

  // 2. Build Data Rows
  for (let i = 0; i < gauge.ranges.length; i++) {
    const range = gauge.ranges[i];
    const color = gauge.colors[i];
    const yarnInfo =
      color?.brandName && color?.yarnName
        ? `${color.brandName} - ${color.yarnName}\n${color.name || ''}`
        : color?.name || '';

    const rangeFrom =
      'from' in range && range.from !== undefined ? range.from : '';
    const rangeTo = 'to' in range && range.to !== undefined ? range.to : '';

    // Legend Row (Start | End | Hex | Info)
    const row: (string | number | boolean)[] = [
      rangeFrom,
      rangeTo,
      color?.hex || '',
      yarnInfo,
    ];

    if (options.includeDayCounts && applicableTypes.length > 0) {
      // Day Counts
      for (const type of applicableTypes) {
        // Formula: =COUNTIFS('Weather Data'!B:B, ">=Start", 'Weather Data'!B:B, "<End") + ... for each month
        // Actually, COUNTIFS allows multiple ranges. We can sum checks for each month column? No, COUNTIFS criteria must match distinct ranges.
        // A single COUNTIFS checks B AND C AND D...
        // To count total occurances across multiple non-contiguous columns (Jan Temp, Feb Temp...)
        // We essentially need =COUNTIFS(JanCol, criteria) + COUNTIFS(FebCol, criteria)...
        // That's a long formula, but robust.

        const letters = getWeatherDataColumnLetters(options, type);
        const parts: string[] = [];

        for (const letCol of letters) {
          // Check based on range settings
          // Range values are in Col A (1) and Col B (2) of THIS sheet (the Legend sheet).
          // Actually, constructing the criteria string is tricky because A2/B2 are relative.
          // Row is (i + 3) if double header, or (i + 2).
          // Let's assume double header exists.
          // Reference to Range Start: $A3
          // Reference to Range End: $B3
          // We use absolute column so we can copy paste if needed, relative row.

          // The row index in the sheet will be: start row (1-based) + current index.
          // Header 1: row 1. Header 2: row 2. Data starts row 3.
          // So current row is i + 3.

          const rowIdx = i + 3;
          const refFrom = `$A${rowIdx}`;
          const refTo = `$B${rowIdx}`;

          let criteriaLower = '';
          let criteriaUpper = '';

          if (direction === 'high-to-low') {
            // From 39 To 36. Include From(Yes), Include To(No) -> >36 AND <=39
            // From is High, To is Low.
            const opLow = includeTo ? '>=' : '>';
            const opHigh = includeFrom ? '<=' : '<';
            criteriaLower = `"${opLow}"&${refTo}`; // Check against lower bound (To value)
            criteriaUpper = `"${opHigh}"&${refFrom}`; // Check against upper bound (From value)
          } else {
            // Low to High. From 10 To 20. Include From(Yes), Include To(No) -> >=10 AND <20
            const opLow = includeFrom ? '>=' : '>';
            const opHigh = includeTo ? '<=' : '<';
            criteriaLower = `"${opLow}"&${refFrom}`;
            criteriaUpper = `"${opHigh}"&${refTo}`;
          }

          parts.push(
            `COUNTIFS('Weather Data'!${letCol}:${letCol}, ${criteriaLower}, 'Weather Data'!${letCol}:${letCol}, ${criteriaUpper})`,
          );
        }

        const finalFormula = '=' + parts.join('+');
        row.push(finalFormula);
      }

      // Percentages
      // =DayCountCell / (TotalRows * 12) ? No, total valid days.
      // Easiest is to sum the DayCount column? No, cyclic dependency if we sum column.
      // Or just =DayCount / [Total Days In Year].
      // Is [Total Days In Year] constant? Yes.
      // We can hardcode total days or use a formula that counts all non-blank cells?
      // COUNT('Weather Data'!B:B) * 12 is rough.
      // Better: Sum of all checks.
      // Let's just use SUM(Month columns count) as denominator?
      // A simple approximation: =E3 / 365 (or 366).
      // Or more robust: =E3 / COUNT('Weather Data'!B:B ... all columns)
      // Determining denominator dynamically is hard without a specific "Total Cell".
      // Let's use the known length of weather data: weather.data.length.
      const totalDays = weather.data.length;

      // Col Index for Day Count cell.
      // 0(A), 1(B), 2(C), 3(D).
      // 4 is first Day Count.
      // If we have multiple types, they are at 4, 5...
      // Percentage for Type 1 (at index 4) should refer to cell at index 4.
      // Percentage starts after ALL day count columns.
      // Count cols count = applicableTypes.length.
      // Start of Pct = 4 + applicableTypes.length.
      // Relative reference: RC[-offset].
      // R[0]C[-numTypes] ...

      // Actually, we are pushing cells in order.
      // We have `row` array so far.
      // Indices of the Day Count values we just pushed:
      // Start index = 4.
      // Current type index k (0 to N-1).
      // Day count value is at row[4 + k].
      // We are now pushing percentages.
      // For type k, we reference column letter of (4 + k).
      // A(0).. E(4).
      // Col index = 4 + typeIndex.

      for (let k = 0; k < applicableTypes.length; k++) {
        const colIdxOfCount = 4 + k;
        const letter = getColumnLetter(colIdxOfCount);
        const rowIdx = i + 3;
        // Formula: =E3 / 365
        row.push(`=${letter}${rowIdx}/${totalDays}`);
      }
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

// Helper to get applicable types count for layout calculations
function getApplicableTypesCount(
  gauge: (typeof gauges.allCreated)[0],
  options: ExportOptions,
): number {
  if (!options.includeDayCounts) return 0;
  const gaugeToTypes: Record<string, string[]> = {
    temp: ['tmax', 'tavg', 'tmin'],
    prcp: ['prcp'],
    snow: ['snow'],
    dayt: ['dayt'],
    moon: ['moon'],
  };
  const possibleTypes = gaugeToTypes[gauge.id] || [];
  const selectedTypesInOrder = getSelectedDataTypes(options);
  const applicableTypes = possibleTypes.filter((t) =>
    selectedTypesInOrder.includes(t),
  );
  return applicableTypes.length;
}

function createLegendColorRequests(
  sheetId: number,
  gauge: (typeof gauges.allCreated)[0],
  options: ExportOptions, // Added options to know about header rows
): gapi.client.sheets.Request[] {
  if (!gauge.colors) return [];
  const requests: gapi.client.sheets.Request[] = [];
  const headerRows = getApplicableTypesCount(gauge, options) > 0 ? 2 : 1;

  for (let i = 0; i < gauge.colors.length; i++) {
    const color = gauge.colors[i];
    if (!color?.hex) continue;

    const rgb = hexToRgb(color.hex);
    const textColor = getTextColor(color.hex);
    const textRgb = hexToRgb(textColor === 'white' ? '#ffffff' : '#000000');

    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: i + headerRows, // Data starts after headers
          endRowIndex: i + headerRows + 1,
          startColumnIndex: 2,
          endColumnIndex: 3,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: rgb,
            textFormat: { foregroundColor: textRgb },
          },
        },
        fields:
          'userEnteredFormat.backgroundColor,userEnteredFormat.textFormat.foregroundColor',
      },
    });
  }

  return requests;
}

function createPercentageFormatRequests(
  sheetId: number,
  gauge: (typeof gauges.allCreated)[0],
  options: ExportOptions,
): gapi.client.sheets.Request[] {
  // New helper for percentage formatting
  const requests: gapi.client.sheets.Request[] = [];
  const count = getApplicableTypesCount(gauge, options);
  if (count === 0) return requests;

  const headerRows = 2; // With Day Counts, we always have 2 header rows
  const startCol = 4 + count; // Start after 'Info' (4) + DayCount cols (count)

  // Apply percentage format to the Percentage columns for all data rows
  if (gauge.ranges && gauge.ranges.length > 0) {
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: headerRows,
          endRowIndex: headerRows + gauge.ranges.length,
          startColumnIndex: startCol,
          endColumnIndex: startCol + count,
        },
        cell: {
          userEnteredFormat: {
            numberFormat: { type: 'PERCENT', pattern: '0.00%' },
          },
        },
        fields: 'userEnteredFormat.numberFormat',
      },
    });
  }
  return requests;
}

function createLegendMergeRequests(
  sheetId: number,
  options: ExportOptions,
  gauge: (typeof gauges.allCreated)[0],
): gapi.client.sheets.Request[] {
  // New helper for merging legend headers
  const requests: gapi.client.sheets.Request[] = [];
  if (!options.includeDayCounts) return requests;

  // Determine applicable types count
  const gaugeToTypes: Record<string, string[]> = {
    temp: ['tmax', 'tavg', 'tmin'],
    prcp: ['prcp'],
    snow: ['snow'],
    dayt: ['dayt'],
    moon: ['moon'],
  };
  const possibleTypes = gaugeToTypes[gauge.id] || [];
  const selectedTypesInOrder = getSelectedDataTypes(options);
  const applicableTypes = possibleTypes.filter((t) =>
    selectedTypesInOrder.includes(t),
  );
  const count = applicableTypes.length;

  if (count > 0) {
    // Merge "Day Count" (Col 4, Index 4) across `count` columns
    // Start Col Index: 4. End Col Index: 4 + count.
    requests.push({
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 4,
          endColumnIndex: 4 + count,
        },
        mergeType: 'MERGE_ALL',
      },
    });

    // Merge "Percentage" (Col 4+count, Index 4+count) across `count` columns
    // Start: 4 + count. End: 4 + count + count.
    requests.push({
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 4 + count,
          endColumnIndex: 4 + 2 * count,
        },
        mergeType: 'MERGE_ALL',
      },
    });
  }
  if (count > 0) {
    // Merge for Note row
    // The note is at: Header Rows (2) + Gauge Ranges Count + 2 empty rows + 1 note row (0-indexed).
    // Row Index = 2 + (gauge.ranges?.length || 0) + 2.
    // But if no Day counts, there is only 1 header row.
    const headerRows = options.includeDayCounts ? 2 : 1;
    const noteRowIdx = headerRows + (gauge.ranges?.length || 0) + 2;
    const totalLegendCols = 4 + 2 * count;

    requests.push({
      mergeCells: {
        range: {
          sheetId,
          startRowIndex: noteRowIdx,
          endRowIndex: noteRowIdx + 1,
          startColumnIndex: 0,
          endColumnIndex: totalLegendCols > 4 ? totalLegendCols : 4, // Merge at least 4 cols
        },
        mergeType: 'MERGE_ALL',
      },
    });
    // Set Wrap Strategy for Note
    requests.push({
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: noteRowIdx,
          endRowIndex: noteRowIdx + 1,
          startColumnIndex: 0,
          endColumnIndex: 1,
        },
        cell: {
          userEnteredFormat: { wrapStrategy: 'WRAP' },
        },
        fields: 'userEnteredFormat.wrapStrategy',
      },
    });
  }
  return requests;
}

function createResizeRequests(
  sheetId: number,
  gauge: (typeof gauges.allCreated)[0],
  options: ExportOptions,
): gapi.client.sheets.Request[] {
  const count = getApplicableTypesCount(gauge, options);
  // Columns: 0(Start), 1(End), 2(Color), 3(Info), ...
  // Auto-resize all columns used
  const totalCols = 4 + (options.includeDayCounts ? 2 * count : 0);
  return [
    {
      autoResizeDimensions: {
        dimensions: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: totalCols,
        },
      },
    },
  ];
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

    requests.push(...createLegendColorRequests(sheetIndex, gauge, options));
    requests.push(...createLegendMergeRequests(sheetIndex, options, gauge));
    requests.push(
      ...createPercentageFormatRequests(sheetIndex, gauge, options),
    ); // Apply percentage format
    requests.push(...createResizeRequests(sheetIndex, gauge, options)); // Auto resize columns
    sheetIndex++;
  }

  return { title: projectName, sheets, requests, values };
}
