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

import type { ComponentType } from 'svelte';

export type PreviewCategories =
  | 'Calendar'
  | 'Chevrons'
  | 'Continuous Square'
  | 'Corner to Corner'
  | 'Daylight Rows'
  | 'Month Rows'
  | 'Month Squares'
  | 'Split Month Squares'
  | 'Squares';

export interface Preview {
  name: PreviewCategories;
  id: string;
  width: number | null;
  height: number | null;
  svg: SVGElement | null;
  img: {
    light: string;
    dark: string;
  };
  wpTagId: number; // In a Wordpress installation, this is the id of the taxonomy
  wpTagSlug: string; // In a Wordpress installation, this is the slug of the taxonomy
  settings: ComponentType;
  preview: ComponentType;
}
