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

import type { WeatherParam } from '$lib/types/gauge-types';
<<<<<<< HEAD
import { chevronsPreview } from '$lib/components/previews/chevrons/state.svelte';
import { continuousSquarePreview } from '$lib/components/previews/continuous-square/state.svelte';
import { cornerToCornerPreview } from '$lib/components/previews/corner-to-corner/state.svelte';
import { daytimeRowsPreview } from '$lib/components/previews/daytime-rows/state.svelte';
import { hexagonRoundsPreview } from '$lib/components/previews/hexagon-rounds/state.svelte';
import { hexagonsPreview } from '$lib/components/previews/hexagons/state.svelte';
import { monthRowsPreview } from '$lib/components/previews/month-rows/state.svelte';
import { monthSquaresPreview } from '$lib/components/previews/month-squares/state.svelte';
import { rowsPreview } from '$lib/components/previews/rows/state.svelte';
import { splitMonthSquaresPreview } from '$lib/components/previews/split-month-squares/state.svelte';
import { squareRoundsPreview } from '$lib/components/previews/square-rounds/state.svelte';
import { squaresPreview } from '$lib/components/previews/squares/state.svelte';
=======
import type { TwelvePointStarPreviewClass } from '$lib/components/previews/12-point-star/state.svelte';
import type { CalendarPreviewClass } from '$lib/components/previews/calendar/state.svelte';
import type { ChevronsPreviewClass } from '$lib/components/previews/chevrons/state.svelte';
import type { ContinuousSquarePreviewClass } from '$lib/components/previews/continuous-square/state.svelte';
import type { CornerToCornerPreviewClass } from '$lib/components/previews/corner-to-corner/state.svelte';
import type { DaytimeRowsPreviewClass } from '$lib/components/previews/daytime-rows/state.svelte';
import type { HexagonRoundsPreviewClass } from '$lib/components/previews/hexagon-rounds/state.svelte';
import type { MonthRowsPreviewClass } from '$lib/components/previews/month-rows/state.svelte';
import type { MonthSquaresPreviewClass } from '$lib/components/previews/month-squares/state.svelte';
import type { RowsPreviewClass } from '$lib/components/previews/rows/state.svelte';
import type { SplitMonthSquaresPreviewClass } from '$lib/components/previews/split-month-squares/state.svelte';
import type { SquareRoundsPreviewClass } from '$lib/components/previews/square-rounds/state.svelte';
import type { SquaresPreviewClass } from '$lib/components/previews/squares/state.svelte';
>>>>>>> main

export const previewWeatherTargets = $state({
  value: [] as WeatherParam[],
  getter: undefined as ((index: number) => WeatherParam[]) | undefined,
});

// The union of every preview's real (heavy) instance type. These are
// type-only imports, so they're erased at build time and don't pull the
// implementation modules into the bundle - only `importFn` does that, lazily.
type PreviewInstance =
  | TwelvePointStarPreviewClass
  | CalendarPreviewClass
  | ChevronsPreviewClass
  | ContinuousSquarePreviewClass
  | CornerToCornerPreviewClass
  | DaytimeRowsPreviewClass
  | HexagonRoundsPreviewClass
  | MonthRowsPreviewClass
  | MonthSquaresPreviewClass
  | RowsPreviewClass
  | SplitMonthSquaresPreviewClass
  | SquareRoundsPreviewClass
  | SquaresPreviewClass;

interface PreviewManifestEntry {
  id: string;
  name: string;
  img: { light: string; dark: string };
  wpTagSlug: string;
  importFn: () => Promise<PreviewInstance>;
}

// A lightweight manifest entry: enough to render the PreviewSelect dropdown
// and the gallery list without loading any preview's (heavy) implementation
// module. `load()` swaps the entry for the real instance in place.
const manifest: PreviewManifestEntry[] = [
  {
    id: 'twsr',
    name: '12-Point Star',
    img: {
      light: './images/preview_icons/12 Point Star.png',
      dark: './images/preview_icons/12 Point Star White.png',
    },
    wpTagSlug: '12-point-star',
    importFn: async () =>
      (await import('$lib/components/previews/12-point-star/state.svelte'))
        .twelvePointStarPreview,
  },
  {
    id: 'clnr',
    name: 'Calendar',
    img: {
      light: './images/preview_icons/Calendar.png',
      dark: './images/preview_icons/Calendar White.png',
    },
    wpTagSlug: 'calendar',
    importFn: async () =>
      (await import('$lib/components/previews/calendar/state.svelte'))
        .calendarPreview,
  },
  {
    id: 'chev',
    name: 'Chevrons',
    img: {
      light: './images/preview_icons/Chevrons.png',
      dark: './images/preview_icons/Chevrons White.png',
    },
    wpTagSlug: 'chevrons',
    importFn: async () =>
      (await import('$lib/components/previews/chevrons/state.svelte'))
        .chevronsPreview,
  },
  {
    id: 'cosq',
    name: 'Continuous Square',
    img: {
      light: './images/preview_icons/cosq_black.png',
      dark: './images/preview_icons/cosq_white.png',
    },
    wpTagSlug: 'continuous-square',
    importFn: async () =>
      (await import('$lib/components/previews/continuous-square/state.svelte'))
        .continuousSquarePreview,
  },
  {
    id: 'crnr',
    name: 'Corner to Corner',
    img: {
      light: './images/preview_icons/Corner to Corner.png',
      dark: './images/preview_icons/Corner to Corner White.png',
    },
    wpTagSlug: 'corner-to-corner',
    importFn: async () =>
      (await import('$lib/components/previews/corner-to-corner/state.svelte'))
        .cornerToCornerPreview,
  },
  {
    id: 'rsun',
    name: 'Daytime Rows',
    img: {
      light: './images/preview_icons/Daylight Rows.png',
      dark: './images/preview_icons/Daylight Rows White.png',
    },
    wpTagSlug: 'daylight-rows',
    importFn: async () =>
      (await import('$lib/components/previews/daytime-rows/state.svelte'))
        .daytimeRowsPreview,
  },
  {
    id: 'hxrd',
    name: 'Hexagon Rounds',
    img: {
      light: './images/preview_icons/Hexagon Rounds.png',
      dark: './images/preview_icons/Hexagon Rounds White.png',
    },
    wpTagSlug: 'hexagon-rounds',
    importFn: async () =>
      (await import('$lib/components/previews/hexagon-rounds/state.svelte'))
        .hexagonRoundsPreview,
  },
  {
    id: 'mrws',
    name: 'Month Rows',
    img: {
      light: './images/preview_icons/mrws_black.png',
      dark: './images/preview_icons/mrws_white.png',
    },
    wpTagSlug: 'month-rows',
    importFn: async () =>
      (await import('$lib/components/previews/month-rows/state.svelte'))
        .monthRowsPreview,
  },
  {
    id: 'msqs',
    name: 'Month Squares',
    img: {
      light: './images/preview_icons/msqs_black.png',
      dark: './images/preview_icons/msqs_white.png',
    },
    wpTagSlug: 'month-squares',
    importFn: async () =>
      (await import('$lib/components/previews/month-squares/state.svelte'))
        .monthSquaresPreview,
  },
  {
    id: 'rows',
    name: 'Rows',
    img: {
      light: './images/preview_icons/Rows.png',
      dark: './images/preview_icons/Rows White.png',
    },
    wpTagSlug: 'rows',
    importFn: async () =>
      (await import('$lib/components/previews/rows/state.svelte')).rowsPreview,
  },
  {
    id: 'smsq',
    name: 'Split Month Squares',
    img: {
      light: './images/preview_icons/smsq_black.png',
      dark: './images/preview_icons/smsq_white.png',
    },
    wpTagSlug: 'split-month-squares',
    importFn: async () =>
      (
        await import('$lib/components/previews/split-month-squares/state.svelte')
      ).splitMonthSquaresPreview,
  },
  {
    id: 'sqrd',
    name: 'Square Rounds',
    img: {
      light: './images/preview_icons/Square Rounds.png',
      dark: './images/preview_icons/Square Rounds White.png',
    },
    wpTagSlug: 'square-rounds',
    importFn: async () =>
      (await import('$lib/components/previews/square-rounds/state.svelte'))
        .squareRoundsPreview,
  },
  {
    id: 'sqrs',
    name: 'Squares',
    img: {
      light: './images/preview_icons/Squares.png',
      dark: './images/preview_icons/Squares White.png',
    },
    wpTagSlug: 'squares',
    importFn: async () =>
      (await import('$lib/components/previews/squares/state.svelte'))
        .squaresPreview,
  },
];

class PreviewsState {
<<<<<<< HEAD
  all = $state([
    calendarPreview,
    chevronsPreview,
    continuousSquarePreview,
    cornerToCornerPreview,
    daytimeRowsPreview,
    hexagonsPreview,
    hexagonRoundsPreview,
    monthRowsPreview,
    monthSquaresPreview,
    rowsPreview,
    splitMonthSquaresPreview,
    squareRoundsPreview,
    squaresPreview,
  ]);
=======
  // The runtime array holds a mix of not-yet-loaded manifest entries and
  // loaded instances; `load()` is the only place that swaps one for the
  // other. Every other reader in the app only ever sees a fully-loaded
  // instance via `active` (see below), so it's typed as such.
  all = $state<(PreviewManifestEntry | PreviewInstance)[]>([...manifest]);
>>>>>>> main

  activeId = $state<string>();

  // `activeId` is only ever set (in `load()`) in the same step that swaps
  // the matching manifest entry for its real instance, so this is always a
  // loaded instance in practice - hence the assertion.
  active = $derived(
    this.all.find((n) => n.id === this.activeId) as PreviewInstance | undefined,
  );

  showInformation = $state(false);

  hash = $derived(this.active?.hash || '');

  // Loads (if needed) and activates the preview with the given id. Manifest
  // entries are dynamically imported on first load and swapped in place for
  // the real instance, so later calls for the same id are effectively free.
  async load(id: string) {
    const index = this.all.findIndex((n) => n.id === id);
    if (index === -1) return;

    const entry = this.all[index];
    const instance = 'importFn' in entry ? await entry.importFn() : entry;

    this.all[index] = instance;
    this.activeId = id;

    return instance;
  }
}

export const previews = new PreviewsState();
