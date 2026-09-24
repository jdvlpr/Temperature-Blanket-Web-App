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

import { CHARACTERS_FOR_URL_HASH } from '$lib/constants/page-constants';
import { gauges } from '$lib/state/gauges-state.svelte';
import { previews } from '$lib/state/preview-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import type { WeatherParam } from '$lib/types/gauge-types';
import type {
  BasePreviewSettings,
  SecondaryTarget,
} from '$lib/types/preview-types';
import type { Color } from '$lib/types/yarn-types';
import {
  getMonthSepparatorIndexes,
  getSquareSectionTargetIds,
  setSecondaryTargets,
  setTargets,
} from '$lib/utils/preview-utils.svelte';
import { getWeatherTargets } from '$lib/utils/weather-utils.svelte';
import {
  resolveExtraColors,
  type ExtraColorDetails,
  type PreviewExtraColor,
} from '$lib/utils/extra-colors-utils';
import chroma from 'chroma-js';
import Preview from './Preview.svelte';
import Settings from './Settings.svelte';

// How rows after the first one are laid out:
// fewer  - every other row has one fewer hexagon (N, N-1, N, ...)
// more   - every other row has one more hexagon (N, N+1, N, ...)
// offset - every row has N hexagons, every other row shifted half a hexagon
export type HexagonsRowLayout = 'fewer' | 'more' | 'offset';

export const HEXAGONS_ROW_LAYOUTS: {
  value: HexagonsRowLayout;
  label: string;
}[] = [
  { value: 'fewer', label: 'One fewer every other row' },
  { value: 'more', label: 'One more every other row' },
  { value: 'offset', label: 'Same size, offset' },
];

interface HexagonsPreviewSettings extends BasePreviewSettings {
  primaryTarget: WeatherParam['id'];
  // Number of rounds in each hexagon
  hexagonSize: number;
  // Rounds (0 is the center) that use a different weather parameter than the primary target
  secondaryTargets: SecondaryTarget[];
  primaryTargetAsBackup: boolean;
  columns: number;
  rowLayout: HexagonsRowLayout;
  hexagonsAtBeginning: number;
  hexagonsBetweenMonthsCount: number;
  additionalHexagonsColor: NonNullable<Color['hex']>;
  joinStitches: number;
  joinColor: NonNullable<Color['hex']>;
}

export interface HexagonsPosition {
  // Center of the hexagon
  x: number;
  y: number;
}

export interface HexagonsSection extends HexagonsPosition {
  isWeatherHexagon: boolean;
  dayIndex: number;
  // One color per round, from the center outward
  colors: NonNullable<Color['hex']>[];
}

export class HexagonsPreviewClass {
  constructor() {
    $effect.root(() => {
      // If a gauge is created or deleted, handle updating the available weather parameter targets
      $effect(() => {
        if (gauges.allCreated.length) {
          this.settings.primaryTarget = setTargets(this.settings.primaryTarget);
          this.settings.secondaryTargets = setTargets(
            this.settings.secondaryTargets,
          );
        }
      });
    });
  }

  // *******************
  // Constant properties
  // *******************

  id = 'hxgs';

  name = 'Hexagons';

  svg = $state<SVGSVGElement | null>(null);

  img = $state({
    light: './images/preview_icons/Hexagons.png',
    dark: './images/preview_icons/Hexagons White.png',
  });

  wpTagId: number | null = null; //TODO: create in wp

  wpTagSlug = 'hexagons';

  previewComponent = Preview;

  settingsComponent = Settings;

  // Size of one round of stitches, used for both the hexagon and its border
  ROUND_SIZE = 10;

  sections = $state<HexagonsSection[]>([]);

  // *******************
  // User settings properties
  // *******************

  settings = $state<HexagonsPreviewSettings>({
    primaryTarget: 'tmax',
    hexagonSize: 3,
    secondaryTargets: [],
    primaryTargetAsBackup: true,
    columns: 14,
    rowLayout: 'fewer',
    hexagonsAtBeginning: 0,
    hexagonsBetweenMonthsCount: 0,
    additionalHexagonsColor: '#f0f3f3',
    joinStitches: 0,
    joinColor: '#e8e3e2',
    useSeasonTargets: false,
  });

  // *******************
  // Derived properties
  // *******************

  monthSepparatorHexagonsIndexes = $derived.by(() => {
    if (this.settings.hexagonsBetweenMonthsCount === 0) return [];
    const indexes: number[] = [];
    getMonthSepparatorIndexes()
      .map((n) => n + this.settings.hexagonsAtBeginning)
      .forEach((spaceIndex, index) => {
        for (let i = 0; i < this.settings.hexagonsBetweenMonthsCount; i++) {
          indexes.push(
            spaceIndex + i + index * this.settings.hexagonsBetweenMonthsCount,
          );
        }
      });
    return indexes;
  });

  hexagonsCreatedCount = $derived(
    weather.data.length +
      this.monthSepparatorHexagonsIndexes.length +
      this.settings.hexagonsAtBeginning,
  );

  // Hexagons are pointy-topped. The radius is from the center to a corner.
  radius = $derived(this.settings.hexagonSize * this.ROUND_SIZE);

  joinSize = $derived(this.settings.joinStitches * this.ROUND_SIZE);

  // Radius of the hexagon including its border
  outerRadius = $derived(this.radius + this.joinSize);

  hexWidth = $derived(Math.sqrt(3) * this.outerRadius);

  hexHeight = $derived(2 * this.outerRadius);

  // Rows overlap by a quarter of a hexagon's height
  rowSpacing = $derived(this.hexHeight * 0.75);

  // Number of hexagons in a row, based on the row layout
  getRowLength(row: number) {
    const { columns, rowLayout } = this.settings;
    if (row % 2 === 0 || rowLayout === 'offset') return columns;
    if (rowLayout === 'fewer') return Math.max(1, columns - 1);
    return columns + 1;
  }

  // Whether a row is shifted right by half a hexagon
  isRowShifted(row: number) {
    if (this.settings.rowLayout === 'more') return row % 2 === 0;
    return row % 2 === 1;
  }

  // Positions of every hexagon, left to right, top to bottom,
  // with enough rows to fit all the hexagons that were created
  positions = $derived.by(() => {
    const positions: HexagonsPosition[] = [];
    for (let row = 0; positions.length < this.hexagonsCreatedCount; row++) {
      const xOffset = this.isRowShifted(row) ? this.hexWidth / 2 : 0;
      for (let column = 0; column < this.getRowLength(row); column++) {
        positions.push({
          x: xOffset + this.hexWidth / 2 + column * this.hexWidth,
          y: this.outerRadius + row * this.rowSpacing,
        });
      }
    }
    return positions;
  });

  rows = $derived(
    this.positions.length
      ? Math.round(
          (this.positions[this.positions.length - 1].y - this.outerRadius) /
            this.rowSpacing,
        ) + 1
      : 0,
  );

  hexagonsTotalCount = $derived(this.positions.length);

  additionalHexagonsIndexes = $derived.by(() => {
    const indexes: number[] = [];
    for (let i = 0; i < this.settings.hexagonsAtBeginning; i++) indexes.push(i);
    indexes.push(...this.monthSepparatorHexagonsIndexes);
    for (let i = this.hexagonsCreatedCount; i < this.hexagonsTotalCount; i++)
      indexes.push(i);
    return indexes;
  });

  // Radius of a round (0 is the center)
  getRoundRadius(round: number) {
    return (this.radius * (round + 1)) / this.settings.hexagonSize;
  }

  // Rounded up because the PNG export needs whole-pixel canvas dimensions
  width = $derived(
    Math.ceil(
      Math.max(0, ...this.positions.map((n) => n.x)) + this.hexWidth / 2,
    ),
  );

  height = $derived(
    Math.ceil(this.hexHeight + Math.max(0, this.rows - 1) * this.rowSpacing),
  );

  details = $derived({
    rows: this.rows,
    additionalHexagons: this.additionalHexagonsIndexes.length,
  });

  // The weather parameter used by each round, from the center outward
  roundTargetIds = $derived(
    getSquareSectionTargetIds(
      this.settings.hexagonSize,
      this.settings.primaryTarget,
      this.settings.secondaryTargets,
    ),
  );

  targets = $derived(
    getWeatherTargets({
      weatherParameters: Object.fromEntries(
        this.roundTargetIds.map((id) => [id, true]),
      ),
    }),
  );

  // Returns the corner points of a hexagon centered at x, y
  getPoints(x: number, y: number, radius: number) {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 180) * (60 * i - 90);
      points.push(
        `${x + radius * Math.cos(angle)},${y + radius * Math.sin(angle)}`,
      );
    }
    return points.join(' ');
  }

  // *******************
  // Extra (non-gauge) colors and their yarn details
  // *******************

  extraColorDetails = $state<ExtraColorDetails>({});

  extraColors = $derived<PreviewExtraColor[]>(
    resolveExtraColors(
      [
        {
          role: 'accent',
          label: 'Accent Color (for additional hexagons)',
          hex: this.settings.additionalHexagonsColor,
          inUse: this.additionalHexagonsIndexes.length > 0,
        },
        {
          role: 'border',
          label: 'Border Color',
          hex: this.settings.joinColor,
          inUse: this.settings.joinStitches > 0,
        },
      ],
      this.extraColorDetails,
    ),
  );

  // *******************
  // URL hash derived from settings
  // *******************
  hash = $derived.by(() => {
    const separator = CHARACTERS_FOR_URL_HASH.separator;
    const layoutCode = HEXAGONS_ROW_LAYOUTS.findIndex(
      (n) => n.value === this.settings.rowLayout,
    );
    let hash = '&';
    hash += `${this.id}=`;
    hash += `${this.settings.primaryTarget}(${[
      this.settings.hexagonSize,
      this.settings.columns,
      layoutCode,
      this.settings.hexagonsAtBeginning,
      this.settings.hexagonsBetweenMonthsCount,
      chroma(this.settings.additionalHexagonsColor).hex().substring(1),
      this.settings.primaryTargetAsBackup ? 1 : 0,
    ].join(separator)})`;

    this.settings.secondaryTargets.forEach((item) => {
      hash += `${item.targetId}(${item.indexes.join(separator)})`;
    });

    if (this.settings.joinStitches > 0) {
      hash += `!${this.settings.joinStitches}${separator}${chroma(
        this.settings.joinColor,
      )
        .hex()
        .substring(1)}`;
    }

    return hash;
  });

  // *******************
  // Method for loading settings from a url hash string
  // *******************
  load(hash: string) {
    const separator = new RegExp(
      `[${CHARACTERS_FOR_URL_HASH.separator}${CHARACTERS_FOR_URL_HASH.separator_alt}]`,
    );
    const startIndex = hash.indexOf('(');
    const endIndex = hash.indexOf(')');
    if (startIndex < 1 || endIndex < startIndex) return; // format of hash was wrong, so stop processing

    const [
      hexagonSize,
      columns,
      layoutCode,
      hexagonsAtBeginning,
      hexagonsBetweenMonthsCount,
      additionalHexagonsColor,
      primaryTargetAsBackup,
    ] = hash.substring(startIndex + 1, endIndex).split(separator);

    this.settings.primaryTarget = hash.substring(
      0,
      startIndex,
    ) as WeatherParam['id'];
    if (+hexagonSize > 0) this.settings.hexagonSize = +hexagonSize;
    if (+columns > 0) this.settings.columns = +columns;
    this.settings.rowLayout =
      HEXAGONS_ROW_LAYOUTS[+layoutCode]?.value ?? 'fewer';
    this.settings.hexagonsAtBeginning = +hexagonsAtBeginning || 0;
    this.settings.hexagonsBetweenMonthsCount = +hexagonsBetweenMonthsCount || 0;
    if (chroma.valid(additionalHexagonsColor)) {
      this.settings.additionalHexagonsColor = chroma(
        additionalHexagonsColor,
      ).hex() as NonNullable<Color['hex']>;
    }

    this.settings.primaryTargetAsBackup = primaryTargetAsBackup !== '0';

    // Secondary targets for each round, like tmin(0'1)tavg(2)
    const exclamationIndex = hash.indexOf('!', endIndex);
    const secondaryTargetsHash = hash.substring(
      endIndex + 1,
      exclamationIndex === -1 ? undefined : exclamationIndex,
    );
    let secondaryTargets: SecondaryTarget[] = [];
    for (const [, targetId, indexes] of secondaryTargetsHash.matchAll(
      /(\w+)\(([^)]*)\)/g,
    )) {
      indexes
        .split(separator)
        .filter((n) => n !== '')
        .forEach((index) => {
          secondaryTargets =
            setSecondaryTargets(
              [targetId as WeatherParam['id'], +index],
              secondaryTargets,
            ) || [];
        });
    }
    this.settings.secondaryTargets = secondaryTargets;

    // Border stitches around each hexagon (join stitches and join color)
    const [joinStitches, joinColor] =
      exclamationIndex === -1
        ? []
        : hash.substring(exclamationIndex + 1).split(separator);
    this.settings.joinStitches = +joinStitches || 0;
    if (chroma.valid(joinColor)) {
      this.settings.joinColor = chroma(joinColor).hex() as NonNullable<
        Color['hex']
      >;
    }

    previews.activeId = this.id;
  }
}

export const hexagonsPreview = new HexagonsPreviewClass();
