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

export interface Brand {
  name: string;
  id: string;
  yarns: Yarn[];
}

// Yarn Weights from Ravelry Standard Yarn Weights
// See https://www.ravelry.com/help/yarn/weights?highlight=11
export type YarnWeight =
  | 'Thread'
  | 'Cobweb'
  | 'Lace'
  | 'Light Fingering'
  | 'Fingering'
  | 'Sport'
  | 'DK'
  | 'Worsted'
  | 'Aran'
  | 'Bulky'
  | 'Super Bulky'
  | 'Jumbo';

export interface Yarn {
  colorways: Colorway[];
  name: string;
  /** snake_case version of the name */
  id: Lowercase<string>;
  weight?: YarnWeight;
}

export interface Colorway {
  source: {
    /** Short name for the URL, for example: yarnwebsite.com */
    name: string;
    href: string;
    /** YYYY-MM-DD date when the colorways were accessed */
    accessed: string;
    /** If the href is no longer available or no longer points to the colorways
     * then this is a YYYY-MM-DD date when the href stopped working
     */
    unavailable?: string;
  };
  colors: Color[];
}

export interface AffiliateYarn {
  brand_id: string;
  yarn_id: string;
  colors: Color[];
}

export interface Color {
  name?: string;
  /** lowercase HTML hex code */
  hex?: Lowercase<string>;
  brandId?: string;
  brandName?: string;
  yarnId?: string;
  yarnName?: string;
  dateAccessed?: string;
  href?: string;
  variant_href?: string;
  affiliate_variant_href?: string | null;
  //* Id used for draggable sorting */
  id?: number;
  locked?: boolean;
}

// Gauge Types
export interface GaugeRange {
  from: number;
  to: number;
}

export interface GaugeSettings {
  colors: Color[];
  id: string;
  numberOfColors: number;
  ranges: GaugeRange[];
  rangeOptions: {
    auto: {
      /** In the gauge settings URL hash string, for temperature gauges, '_h' is for 'tmax', '_a' is for 'tavg', '_l' is for 'tmin'. For all gauges, '_r' or nothing is for 'ranges'. The position should be at the end of the settings string, but it's found via pattern matching rather than by position in the string. TODO: can the position be reliably predicted? */
      optimization: string;
      start: {
        high: number | null;
        low: number | null;
      };
      increment: number | null;
      roundIncrement: boolean;
    };
    manual: {
      /** In the gauge settings URL hash string, this starts from the default separator character to the end of the settings string.
       * It's only set if the mode is 'manual' */
      start: number | null;
      /** In the gauge settings URL hash string, this starts from the 6th character to the default separator character.
       * It's only set if the mode is 'manual'  */
      increment: number | null;
    };
    /** In the gauge settings URL hash string, this is the 3rd character. It's value is 'h' for 'high-to-low' or 'l' for 'low-to-high'. */
    direction: 'high-to-low' | 'low-to-high';
    /** In the gauge settings URL hash string, the range calculation method is determined from this and the includeToValue setting, it's the 4th character.
     *
     * '0' means "include from, don't include to"
     *
     * '1' means "don't include from, include to"
     *
     * '2' means "include from, include to"
     *
     * '3' means "don't include from, don't include to"
     *
     * */
    includeFromValue: boolean;
    /** In the gauge settings URL hash string, the range calculation method is determined from this and the includeFromValue setting; it's the 4th character.
     *
     * '0' means "include from, don't include to"
     *
     * '1' means "don't include from, include to"
     *
     * '2' means "include from, include to"
     *
     * '3' means "don't include from, don't include to"
     *
     * */
    includeToValue: boolean;
    /** In the gauge settings URL hash string, this is the 2nd character. It's value is 'l' for 'true' or 'u' for 'false'. */
    linked: boolean;
    /** In the gauge settings URL hash string, this is the 1st character. It's value is 'a' for 'auto' or 'm' for 'manual'. */
    mode: 'auto' | 'manual';
    /** In the gauge settings URL hash string, this is the 5th character. It's value is 't' for 'true' or 'f' for 'false'. */
    isCustomRanges: boolean;
  };
  schemeId: string;
}
