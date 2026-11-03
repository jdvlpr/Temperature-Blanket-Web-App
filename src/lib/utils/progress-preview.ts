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

// My Progress on a preview: every preview marks each day's (or week's)
// parts with `data-dayindex`, an index into weather.data, so the days not
// made yet fade back in gray, whatever the layout. Made days, and parts that
// aren't a day's (borders), keep their full color. No boundary line.

/** How much of a day not made yet shows */
export const UNMADE_OPACITY = 0.15;

/** The SVG filter turning a day not made yet gray (CSS `grayscale()` isn't
 * applied to SVG shapes everywhere; an SVG filter is). Downloads keep true colors. */
export const UNMADE_FILTER_ID = 'tb-unmade-gray';
export const UNMADE_FILTER = `<filter id="${UNMADE_FILTER_ID}" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values="0"/></filter>`;

/** A stylesheet fading those days in the preview on the page (its filter is
 * `UNMADE_FILTER`, drawn once in the page) */
export function progressStyle(unmade: readonly number[]): string {
  if (!unmade.length) return '';
  const selectors = unmade
    .map((index) => `#preview-svg-image [data-dayindex="${index}"]`)
    .join(',');
  return `<style>${selectors}{opacity:${UNMADE_OPACITY};filter:url(#${UNMADE_FILTER_ID})}</style>`;
}
