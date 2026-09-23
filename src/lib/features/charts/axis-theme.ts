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

// Shared axis styling for the weather charts, so the planner chart and the
// standalone forecast chart stay visually consistent and don't repeat the same
// tick/grid/title color and structure. The y2 axis differs between charts
// (units label vs. a 0-100% precipitation scale), so its title/max are params.

/** Muted slate used for all axis ticks, titles, and gridlines. */
export const AXIS_COLOR = '#94a3b8';

/** X axis: category scale with muted ticks/title and no chart-area gridlines. */
export function buildXAxis() {
  return {
    ticks: { color: AXIS_COLOR },
    title: { color: AXIS_COLOR },
    grid: {
      drawOnChartArea: false, // only want the grid lines for one axis to show up
    },
  };
}

/** Left (primary) linear y axis — temperature. `title` is the units label. */
export function buildYAxis({ title }: { title: string }) {
  return {
    type: 'linear' as const,
    position: 'left' as const,
    grid: {
      drawOnChartArea: true, // only want the grid lines for one axis to show up
      color: AXIS_COLOR,
    },
    title: {
      text: title,
      display: true,
      color: AXIS_COLOR,
    },
    ticks: { color: AXIS_COLOR },
  };
}

/**
 * Right (secondary) linear y axis. `max` is optional — the forecast chart caps
 * it at 100 for precipitation probability; the planner chart leaves it auto.
 */
export function buildY2Axis({ title, max }: { title: string; max?: number }) {
  return {
    type: 'linear' as const,
    position: 'right' as const,
    beginAtZero: true,
    ...(max !== undefined ? { max } : {}),
    grid: {
      drawOnChartArea: false, // only want the grid lines for one axis to show up
    },
    title: {
      text: title,
      display: true,
      color: AXIS_COLOR,
    },
    ticks: { color: AXIS_COLOR },
  };
}
