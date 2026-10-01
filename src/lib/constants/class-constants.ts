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

// For rows that run edge to edge inside a rounded list with overflow-hidden.
// The browser's focus outline is drawn outside the element, so the list cuts
// it off. This draws it inside the row instead.
export const ROW_FOCUS =
  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-500';

// For the list itself: its first row rounds its top corners and its last row
// its bottom ones, like the list does, so a focused row's ring follows the
// list's shape. Rows can be the list's children or sit in its <li>s.
export const LIST_ENDS =
  '[&>:first-child]:rounded-t-container [&>:last-child]:rounded-b-container [&>li:first-child>*]:rounded-t-container [&>li:last-child>*]:rounded-b-container';

// The Project menu's lists and their rows, shared by the screens it opens.
// A row's trailing icon says where it goes: a chevron opens a screen in the
// panel, an external-link icon opens a new tab, and none acts in place.
export const PANEL_LIST = `bg-surface-100 dark:bg-surface-900 rounded-container divide-surface-200-800 flex flex-col divide-y overflow-hidden ${LIST_ENDS}`;
export const PANEL_ROW = `hover:preset-tonal-surface flex min-h-12 w-full items-center gap-3 px-4 py-2 text-left transition-colors ${ROW_FOCUS}`;
