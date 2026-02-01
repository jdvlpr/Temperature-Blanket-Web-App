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

export interface ExportOptions {
  /** Weather data parameters to include */
  dataToInclude: {
    tmax: boolean;
    tavg: boolean;
    tmin: boolean;
    prcp: boolean;
    snow: boolean;
    dayt: boolean;
    moon: boolean;
  };
  /** Gauges to apply conditional formatting for */
  gaugesToApply: {
    temp: boolean;
    prcp: boolean;
    snow: boolean;
    dayt: boolean;
    moon: boolean;
  };
  /** Whether to include day counts and percentages in gauge tabs */
  includeDayCounts: boolean;
}

export interface SpreadsheetData {
  title: string;
  sheets: gapi.client.sheets.Sheet[];
  requests: gapi.client.sheets.Request[];
  values: gapi.client.sheets.ValueRange[];
}
