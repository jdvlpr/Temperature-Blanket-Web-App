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

/**
 * Which rows of a long list are in view, so only those are drawn. Rows are
 * one fixed height. `box`: the list scrolls in its own element; `window`:
 * the page scrolls, and the list's top is measured where it is each time
 * (what's above it changes height).
 */
export class VirtualRows {
  /** Rows drawn beyond the view, each way */
  static OVERSCAN = 8;

  count = $state(0);
  rowHeight = $state(36);
  /** How far into the list the view starts, in px (may be negative in window mode) */
  offset = $state(0);
  viewHeight = $state(600);

  first = $derived(
    Math.max(
      0,
      Math.floor(this.offset / this.rowHeight) - VirtualRows.OVERSCAN,
    ),
  );
  last = $derived(
    Math.min(
      this.count,
      Math.max(
        0,
        Math.ceil((this.offset + this.viewHeight) / this.rowHeight) +
          VirtualRows.OVERSCAN,
      ),
    ),
  );
  /** The indexes to draw */
  visible = $derived(
    Array.from(
      { length: Math.max(0, this.last - this.first) },
      (_, i) => this.first + i,
    ),
  );
  /** Rows a page (PageUp/PageDown) moves */
  pageRows = $derived(
    Math.max(1, Math.floor(this.viewHeight / this.rowHeight) - 2),
  );

  /** Whether a row is fully drawn now */
  isDrawn = (row: number) => row >= this.first && row < this.last;
}
