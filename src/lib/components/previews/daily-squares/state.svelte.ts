import { CHARACTERS_FOR_URL_HASH, HOURS_PER_DAY } from '$lib/constants';
import { gauges, previews, weather } from '$lib/state';
import { dateToISO8601String, displayNumber, setTargets } from '$lib/utils';
import Preview from './Preview.svelte';
import Settings from './Settings.svelte';

export class DailySquaresPreviewClass {
  constructor() {
    $effect.root(() => {
      // If a gauge is created or deleted, handle updating the available weather parameter targets
      $effect(() => {
        if (gauges.allCreated.length) {
          this.settings.selectedTargets = setTargets(
            this.settings.selectedTargets,
          );
        }
      });
    });
  }

  // *******************
  // Constant properties
  // *******************
  name = 'Daily Squares';

  id = 'dysq';

  svg = $state();

  img = {
    light: './images/preview_icons/Daily Squares.png',
    dark: './images/preview_icons/Daily Squares White.png',
  };

  wpTagId = null; // TODO: set wp tag id

  wpTagSlug = 'daily-squares';

  settingsComponent = Settings;

  previewComponent = Preview;

  sections = $state([]);

  STITCH_SIZE = 10;

  // *******************
  // User settings properties
  // *******************
  settings = $state({
    selectedTargets: ['tmax'],
    daysPerSquare: 13,
    columns: 9,
  });

  // *******************
  // Derived properties
  // *******************

  #squareSize = $derived(this.settings.daysPerSquare * this.STITCH_SIZE * 2);

  width = $derived(this.#squareSize * this.settings.columns);

  numberOfSquaresWithWeatherData = $derived(
    Math.ceil(weather.data.length / this.settings.daysPerSquare),
  );

  rows = $derived(
    Math.ceil(this.numberOfSquaresWithWeatherData / this.settings.columns),
  );

  height = $derived(this.#squareSize * this.rows);

  totalSquares = $derived(this.rows * this.settings.columns);

  targets = $derived(
    gauges.allCreated
      .map((n) => n.targets)
      .flat()
      .filter((n) => this.settings.selectedTargets.includes(n.id)),
  );

  // *******************
  // URL hash derived from settings
  // *******************
  hash = $derived.by(() => {
    let hash = '&';
    hash += `${this.id}=`;
    hash += `${this.settings.selectedTargets.join('')}`;
    hash += '(';
    hash += `${this.settings.daysPerSquare}${CHARACTERS_FOR_URL_HASH.separator}${this.settings.columns}`;
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
    // targets
    // Extract the targets from the hash and update the settings
    let targets = hash.substring(0, startIndex);
    targets = targets.match(/.{1,4}/g);
    this.settings.selectedTargets = targets;

    // days per square
    this.settings.daysPerSquare = +hash.substring(
      startIndex + 1,
      separatorIndexes[0],
    );

    // columns
    this.settings.columns = +hash.substring(separatorIndexes[0] + 1, endIndex);

    previews.activeId = this.id;
  }
}

export const dailySquaresPreview = new DailySquaresPreviewClass();
