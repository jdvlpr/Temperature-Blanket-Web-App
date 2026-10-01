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
