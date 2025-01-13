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

import type { Preview } from '$lib/types/preview-types';
import CalendarPreview from './CalendarPreview.svelte';
import CalendarSettings from './CalendarSettings.svelte';
import ChevronsPreview from './ChevronsPreview.svelte';
import ChevronsSettings from './ChevronsSettings.svelte';
import ContinuousSquarePreview from './ContinuousSquarePreview.svelte';
import ContinuousSquareSettings from './ContinuousSquareSettings.svelte';
import CornerToCornerPreview from './CornerToCornerPreview.svelte';
import CornerToCornerSettings from './CornerToCornerSettings.svelte';
import DaytimeRowsPreview from './DaytimeRowsPreview.svelte';
import DaytimeRowsSettings from './DaytimeRowsSettings.svelte';
import MonthRowsPreview from './MonthRowsPreview.svelte';
import MonthRowsSettings from './MonthRowsSettings.svelte';
import MonthSquaresPreview from './MonthSquaresPreview.svelte';
import MonthSquaresSettings from './MonthSquaresSettings.svelte';
import RowsPreview from './RowsPreview.svelte';
import RowsSettings from './RowsSettings.svelte';
import SplitMonthSquaresPreview from './SplitMonthSquaresPreview.svelte';
import SplitMonthSquaresSettings from './SplitMonthSquaresSettings.svelte';
import SquaresPreview from './SquaresPreview.svelte';
import SquaresSettings from './SquaresSettings.svelte';

export const previews: Preview[] = $state([
  {
    name: 'Calendar',
    id: 'clnr',
    width: null,
    height: null,
    svg: null,
    img: {
      light: './images/preview_icons/Calendar.png',
      dark: './images/preview_icons/Calendar White.png',
    },
    wpTagId: 6,
    wpTagSlug: 'calendar',
    settings: CalendarSettings,
    preview: CalendarPreview,
  },
  {
    name: 'Chevrons',
    id: 'chev',
    width: null,
    height: null,
    svg: null,
    img: {
      light: './images/preview_icons/Chevrons.png',
      dark: './images/preview_icons/Chevrons White.png',
    },
    wpTagId: 7,
    wpTagSlug: 'chevrons',
    settings: ChevronsSettings,
    preview: ChevronsPreview,
  },
  {
    name: 'Continuous Square',
    id: 'cosq',
    width: null,
    height: null,
    svg: null,
    img: {
      light: './images/preview_icons/cosq_black.png',
      dark: './images/preview_icons/cosq_white.png',
    },
    wpTagId: 8,
    wpTagSlug: 'continuous-square',
    preview: ContinuousSquarePreview,
    settings: ContinuousSquareSettings,
  },
  {
    name: 'Corner to Corner',
    id: 'crnr',
    width: null,
    height: null,
    svg: null,
    img: {
      light: './images/preview_icons/Corner to Corner.png',
      dark: './images/preview_icons/Corner to Corner White.png',
    },
    wpTagId: 5,
    wpTagSlug: 'corner-to-corner',
    settings: CornerToCornerSettings,
    preview: CornerToCornerPreview,
  },
  {
    name: 'Daytime Rows',
    id: 'rsun',
    width: null,
    height: null,
    svg: null,
    img: {
      light: './images/preview_icons/Daylight Rows.png',
      dark: './images/preview_icons/Daylight Rows White.png',
    },
    wpTagId: 4,
    wpTagSlug: 'daylight-rows',
    preview: DaytimeRowsPreview,
    settings: DaytimeRowsSettings,
  },
  {
    name: 'Month Rows',
    id: 'mrws',
    width: null,
    height: null,
    svg: null,
    img: {
      light: './images/preview_icons/mrws_black.png',
      dark: './images/preview_icons/mrws_white.png',
    },
    wpTagId: 11,
    wpTagSlug: 'month-rows',
    preview: MonthRowsPreview,
    settings: MonthRowsSettings,
  },
  {
    name: 'Month Squares',
    id: 'msqs',
    width: null,
    height: null,
    svg: null,
    img: {
      light: './images/preview_icons/msqs_black.png',
      dark: './images/preview_icons/msqs_white.png',
    },
    wpTagId: 9,
    wpTagSlug: 'month-squares',
    preview: MonthSquaresPreview,
    settings: MonthSquaresSettings,
  },
  {
    name: 'Rows',
    id: 'rows',
    width: null,
    height: null,
    svg: null,
    img: {
      light: './images/preview_icons/rows_black.png',
      dark: './images/preview_icons/rows_white.png',
    },
    wpTagId: 2,
    wpTagSlug: 'rows',
    preview: RowsPreview,
    settings: RowsSettings,
  },
  {
    name: 'Split Month Squares',
    id: 'smsq',
    width: null,
    height: null,
    svg: null,
    img: {
      light: './images/preview_icons/smsq_black.png',
      dark: './images/preview_icons/smsq_white.png',
    },
    wpTagId: 10,
    wpTagSlug: 'split-month-squares',
    preview: SplitMonthSquaresPreview,
    settings: SplitMonthSquaresSettings,
  },
  {
    name: 'Squares',
    id: 'sqrs',
    width: null,
    height: null,
    svg: null,
    img: {
      light: './images/preview_icons/Squares.png',
      dark: './images/preview_icons/Squares White.png',
    },
    wpTagId: 3,
    wpTagSlug: 'squares',
    preview: SquaresPreview,
    settings: SquaresSettings,
  },
]);
