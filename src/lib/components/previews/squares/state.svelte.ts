import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
import { gauges, previews, weather } from '$lib/state';
import {
  getMonthSepparatorIndexes,
  getSquareSectionTargetIds,
  getWeatherTargets,
  setSecondaryTargets,
  setTargets,
} from '$lib/utils';
import chroma from 'chroma-js';
import Preview from './Preview.svelte';
import Settings from './Settings.svelte';
import type { WeatherParam } from '$lib/types';

type SquaresPreviewSettings = {
  primaryTarget: WeatherParam['id'];
  squareSize: number;
  columns: number;
  secondaryTargets: { indexes: number; targetId: WeatherParam['id'] }[];
  squaresAtBeginning: number;
  squaresBetweenMonthsCount: number;
  additionalSquaresColor: string;
  primaryTargetAsBackup: boolean;
};

export class SquaresPreviewClass {
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

  id = 'sqrs';

  name = 'Squares';

  svg = $state<SVGSVGElement | null>(null);

  img = $state({
    light: './images/preview_icons/Squares.png',
    dark: './images/preview_icons/Squares White.png',
  });

  wpTagId = 4;

  wpTagSlug = 'squares';

  previewComponent = Preview;

  settingsComponent = Settings;

  SQUARE_SECTION_SIZE = 10;

  sections = $state([]);

  // *******************
  // User settings properties
  // *******************

  settings = $state<SquaresPreviewSettings>({
    primaryTarget: 'tmax',
    squareSize: 3,
    columns: 17,
    secondaryTargets: [],
    squaresAtBeginning: 0,
    squaresBetweenMonthsCount: 0,
    additionalSquaresColor: '#f0f3f3',
    primaryTargetAsBackup: true,
  });

  // *******************
  // Derived properties
  // *******************

  monthSepparatorSquaresIndexes = $derived.by(() => {
    if (this.settings.squaresBetweenMonthsCount === 0) return [];
    let squaresIndexes = [];
    let monthSepparatorIndexes = getMonthSepparatorIndexes();
    monthSepparatorIndexes = monthSepparatorIndexes.map(
      (n) => n + this.settings.squaresAtBeginning,
    );
    monthSepparatorIndexes.forEach((spaceIndex, index) => {
      for (let i = 0; i < this.settings.squaresBetweenMonthsCount; i++) {
        squaresIndexes.push(
          spaceIndex + i + index * this.settings.squaresBetweenMonthsCount,
        );
      }
    });
    return squaresIndexes;
  });

  squaresCreatedCount = $derived(
    weather.data?.length +
      this.monthSepparatorSquaresIndexes.length +
      this.settings.squaresAtBeginning,
  );

  rows = $derived(Math.ceil(this.squaresCreatedCount / this.settings.columns));

  squaresTotalCount = $derived(this.settings.columns * this.rows);

  additionalSquaresAtBeginningIndexes = $derived.by(() => {
    const indexes = [];
    for (let i = 0; i < this.settings.squaresAtBeginning; i++) {
      indexes.push(i);
    }
    return indexes;
  });

  additionalSquaresAtEndIndexes = $derived.by(() => {
    const squares = [];
    for (
      let position = this.squaresCreatedCount;
      position < this.squaresTotalCount;
      position++
    ) {
      squares.push(position);
    }
    return squares;
  });

  additionalSquaresIndexes = $derived(
    this.additionalSquaresAtBeginningIndexes
      .concat(this.monthSepparatorSquaresIndexes)
      .concat(this.additionalSquaresAtEndIndexes),
  );

  width = $derived(
    this.settings.columns * this.SQUARE_SECTION_SIZE * this.settings.squareSize,
  );

  height = $derived(
    this.rows * this.SQUARE_SECTION_SIZE * this.settings.squareSize,
  );

  details = $derived({
    rows: this.rows,
    additionalSquares: this.additionalSquaresIndexes.length,
  });

  filterTargets = $derived([
    ...new Set(
      getSquareSectionTargetIds(
        this.settings.squareSize * this.settings.squareSize,
        this.settings.primaryTarget,
        this.settings.secondaryTargets,
      ),
    ),
  ]);

  targets = $derived(
    getWeatherTargets({
      weatherParameters: this.filterTargets.reduce(
        (a, v) => ({ ...a, [v]: true }),
        {},
      ),
    }),
  );

  // *******************
  // URL hash derived from settings
  // *******************

  hash = $derived.by(() => {
    let hash = '&';
    hash += `${this.id}=`;
    hash += `${this.settings.primaryTarget}(${this.settings.squareSize}${CHARACTERS_FOR_URL_HASH.separator}${this.settings.columns}${
      CHARACTERS_FOR_URL_HASH.separator
    }${this.settings.squaresBetweenMonthsCount}${CHARACTERS_FOR_URL_HASH.separator}${chroma(
      this.settings.additionalSquaresColor,
    )
      .hex()
      .substring(1)})`;

    if (this.settings.primaryTargetAsBackup) hash += '1';
    else hash += '0';

    hash += `${this.settings.squaresAtBeginning}!`;

    if (this.settings.secondaryTargets.length) {
      this.settings.secondaryTargets.forEach((item) => {
        hash += `${item.targetId}(${item.indexes.join(CHARACTERS_FOR_URL_HASH.separator)})`;
      });
    }
    return hash;
  });

  // *******************
  // Method for loading settings from a url hash string
  // *******************
  load(hash) {
    let startIndex = [],
      endIndex = [];
    let exclamationIndex: number[] = [];
    const separatorIndex = [];
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex.push(i);
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] === CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndex.push(i);
      if (hash[i] === ')') endIndex.push(i);
      if (hash[i] === '!') exclamationIndex.push(i);
    }
    if (!startIndex || !separatorIndex || !endIndex) return; // format of hash was wrong, so stop processing

    this.settings.primaryTarget = hash.substring(0, startIndex[0]);
    // SquareSize
    this.settings.squareSize = +hash.substring(
      startIndex[0] + 1,
      separatorIndex[0],
    );
    // Columns
    this.settings.columns = +hash.substring(
      separatorIndex[0] + 1,
      separatorIndex[1],
    );

    // Layout
    if (
      hash.substring(separatorIndex[1] + 1, separatorIndex[2]).length > 1 &&
      +hash.substring(separatorIndex[1] + 1, separatorIndex[1] + 2) === 0
    )
      this.settings.squaresBetweenMonthsCount = +hash.substring(
        separatorIndex[1] + 2,
        separatorIndex[2],
      );
    else if (
      hash.substring(separatorIndex[1] + 1, separatorIndex[2]).length >= 1
    )
      this.settings.squaresBetweenMonthsCount = +hash.substring(
        separatorIndex[1] + 1,
        separatorIndex[2],
      );

    this.settings.additionalSquaresColor = chroma(
      hash.substring(separatorIndex[2] + 1, endIndex[0]),
    ).hex();

    // primarytargetAsBackup
    const _primaryTargetAsBackup = hash.substring(
      endIndex[0] + 1,
      endIndex[0] + 2,
    );
    if (_primaryTargetAsBackup === '0')
      this.settings.primaryTargetAsBackup = false;
    else this.settings.primaryTargetAsBackup = true;

    // Squares at beginning
    if (exclamationIndex.length) {
      const squaresAtBeginning = +hash.substring(
        endIndex[0] + 2,
        exclamationIndex[0],
      );
      if (typeof squaresAtBeginning === 'number') {
        this.settings.squaresAtBeginning = squaresAtBeginning;
      }
    }

    // Secondary Targets
    if (startIndex.length > 1) {
      for (let i = 1; i < startIndex.length; i++) {
        let targetId = hash.substring(startIndex[i] - 4, startIndex[i]);
        if (targetId === 'time') targetId = 'dayt'; // Bug fix in 1.67 (previous id was 'daytime' so it got cut off because it wasn't four characters long)
        const secondaryParamSeparatorIndex = separatorIndex.filter(
          (item) => item > startIndex[i] && item < endIndex[i],
        );
        let start = startIndex[i] + 1;
        for (
          let positionIndex = 0;
          positionIndex < secondaryParamSeparatorIndex.length + 1;
          positionIndex++
        ) {
          let end = secondaryParamSeparatorIndex[positionIndex] || endIndex[i];
          let value = hash.substring(start, end);
          start = end + 1;
          this.settings.secondaryTargets = setSecondaryTargets(
            [targetId, +value],
            this.settings.secondaryTargets,
          );
        }
      }
    }
    previews.activeId = this.id;
  }
}

export const squaresPreview = new SquaresPreviewClass();
