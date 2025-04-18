import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
import { gauges, previews, weather } from '$lib/state';
import { chunkArray, setTargets } from '$lib/utils';
import chroma from 'chroma-js';
import Preview from './Preview.svelte';
import Settings from './Settings.svelte';
import { untrack } from 'svelte';

export class DailySquaresPreviewClass {
  constructor() {
    $effect.root(() => {
      // If a gauge is created or deleted, handle updating the available weather parameter targets
      $effect(() => {
        if (gauges.allCreated.length) {
          this.settings.selectedTarget = setTargets(
            this.settings.selectedTarget,
          );
        }
      });

      $effect(() => {
        weather.data.length;
        // When weather data is loaded or changed, set the default layout border based on 365 or 366 days of weather data, if not the active preview
        untrack(() => {
          if (previews.activeId === this.id) return;
          if (weather.data.length === 365) this.settings.layoutBorder = 1;
          else if (weather.data.length === 366) this.settings.layoutBorder = 2;
        });
      });
    });
  }

  // *******************
  // Constant properties
  // *******************
  name = 'Square Rounds';

  id = 'sqrd';

  svg = $state();

  img = {
    light: './images/preview_icons/Square Rounds.png',
    dark: './images/preview_icons/Square Rounds White.png',
  };

  wpTagId = 14;

  wpTagSlug = 'square-rounds';

  settingsComponent = Settings;

  previewComponent = Preview;

  sections = $state([]);

  STITCH_SIZE = 10;

  // *******************
  // User settings properties
  // *******************
  settings = $state({
    selectedTarget: 'tmax',
    daysPerSquare: 13,
    columns: 4,
    additionalRoundsColor: '#f0f3f3',
    squareBorder: 0,
    layoutBorder: 2,
  });

  // *******************
  // Derived properties
  // *******************

  weatherDataInUse = $derived.by(() => {
    if (this.settings.layoutBorder > 0)
      return weather.rawData.slice(0, -this.settings.layoutBorder);

    return weather.rawData;
  });

  weatherSquares = $derived(
    chunkArray(this.weatherDataInUse, this.settings.daysPerSquare),
  );

  squareSize = $derived(
    (this.settings.daysPerSquare + this.settings.squareBorder) *
      this.STITCH_SIZE *
      2,
  );

  numberOfSquaresWithWeatherData = $derived(
    Math.ceil(this.weatherDataInUse.length / this.settings.daysPerSquare),
  );

  rows = $derived(
    Math.ceil(this.numberOfSquaresWithWeatherData / this.settings.columns),
  );

  totalSquares = $derived(this.rows * this.settings.columns);

  extraSquares = $derived(
    this.totalSquares - this.numberOfSquaresWithWeatherData,
  );

  layoutBorderWidth = $derived(this.settings.layoutBorder * this.STITCH_SIZE);

  width = $derived(
    this.settings.columns * this.squareSize + this.layoutBorderWidth * 2,
  );

  height = $derived(this.rows * this.squareSize + this.layoutBorderWidth * 2);

  totalRounds = $derived(
    this.totalSquares *
      (this.settings.daysPerSquare + this.settings.squareBorder),
  );

  targets = $derived(
    gauges.allCreated
      .map((n) => n.targets)
      .flat()
      .filter((n) => this.settings.selectedTarget.includes(n.id)),
  );

  // *******************
  // URL hash derived from settings
  // *******************
  hash = $derived.by(() => {
    let hash = '&';
    hash += `${this.id}=`;
    hash += `${this.settings.selectedTarget}`;
    hash += '(';
    hash += `${this.settings.daysPerSquare}${CHARACTERS_FOR_URL_HASH.separator}${this.settings.columns}${CHARACTERS_FOR_URL_HASH.separator}${this.settings.squareBorder}${CHARACTERS_FOR_URL_HASH.separator}${this.settings.layoutBorder}${CHARACTERS_FOR_URL_HASH.separator}${chroma(this.settings.additionalRoundsColor).hex().substring(1)}`;
    hash += ')';
    return hash;
  });

  // *******************
  // Method for loading settings from a url hash string
  // *******************
  load(hash) {
    let startIndex, endIndex;
    const separatorIndexes = [];

    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex = i;
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] == CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndexes.push(i);
      if (hash[i] === ')') endIndex = i;
    }

    if (!startIndex || !endIndex) return; // format of hash was wrong, so stop processing

    previews.activeId = this.id;

    // targets
    // Extract the targets from the hash and update the settings
    let targets = hash.substring(0, startIndex);
    // targets = targets.match(/.{1,4}/g);
    this.settings.selectedTarget = targets;

    let currentSeparatorIndex = 0;

    // days per square
    this.settings.daysPerSquare = +hash.substring(
      startIndex + 1,
      separatorIndexes[currentSeparatorIndex],
    );

    // columns
    this.settings.columns = +hash.substring(
      separatorIndexes[currentSeparatorIndex] + 1,
      separatorIndexes[currentSeparatorIndex + 1],
    );

    currentSeparatorIndex++;
    if (separatorIndexes.length < currentSeparatorIndex + 1) return; // Check to make sure the next separator index exists

    this.settings.squareBorder = +hash.substring(
      separatorIndexes[currentSeparatorIndex] + 1,
      separatorIndexes[currentSeparatorIndex + 1],
    );

    currentSeparatorIndex++;
    if (separatorIndexes.length < currentSeparatorIndex + 1) return; // Check to make sure the next separator index exists

    this.settings.layoutBorder = +hash.substring(
      separatorIndexes[currentSeparatorIndex] + 1,
      separatorIndexes[currentSeparatorIndex + 1],
    );

    currentSeparatorIndex++;
    if (separatorIndexes.length < currentSeparatorIndex + 1) return; // Check to make sure the next separator index exists

    this.settings.additionalRoundsColor = chroma(
      hash.substring(separatorIndexes[currentSeparatorIndex] + 1, endIndex),
    ).hex();
  }
}

export const squareRoundsPreview = new DailySquaresPreviewClass();
