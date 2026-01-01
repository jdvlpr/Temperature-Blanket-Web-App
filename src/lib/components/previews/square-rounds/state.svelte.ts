import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
import { gauges, previews, weather } from '$lib/state';
import { chunkArray, setTargets } from '$lib/utils';
import chroma from 'chroma-js';
import Preview from './Preview.svelte';
import Settings from './Settings.svelte';
import { untrack } from 'svelte';

export class SquareRoundsPreviewClass {
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
    useSeasonTargets: false,
  });

  // *******************
  // Derived properties
  // *******************

  weatherDataInUse = $derived.by(() => {
    if (this.settings.layoutBorder > 0)
      return weather.data.slice(0, -this.settings.layoutBorder);

    return weather.data;
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
    const openParen = hash.indexOf('(');
    const closeParen = hash.indexOf(')');

    // If either parenthesis is missing or in the wrong order, stop
    if (openParen === -1 || closeParen === -1 || closeParen < openParen) return;

    // Extract the part before the parentheses as targets
    const targets = hash.substring(0, openParen);
    this.settings.selectedTarget = targets;

    // Set the current active id to this
    previews.activeId = this.id;

    // Extract the content inside the parentheses
    const innerContent = hash.substring(openParen + 1, closeParen);

    // Split the content by known separators
    const separators = [
      CHARACTERS_FOR_URL_HASH.separator,
      CHARACTERS_FOR_URL_HASH.separator_alt,
    ];

    let parts = null;

    for (const sep of separators) {
      if (innerContent.includes(sep)) {
        parts = innerContent.split(sep);
        break;
      }
    }

    // If no valid separator found or not enough parts, stop
    if (!parts || parts.length < 5) return;

    // Destructure parts into named settings
    const [
      daysPerSquare,
      columns,
      squareBorder,
      layoutBorder,
      additionalRoundsColor,
    ] = parts;

    // Try parsing each setting safely
    if (Number.isFinite(+daysPerSquare))
      this.settings.daysPerSquare = +daysPerSquare;
    if (Number.isFinite(+columns)) this.settings.columns = +columns;
    if (Number.isFinite(+squareBorder))
      this.settings.squareBorder = +squareBorder;
    if (Number.isFinite(+layoutBorder))
      this.settings.layoutBorder = +layoutBorder;

    try {
      this.settings.additionalRoundsColor = chroma(additionalRoundsColor).hex();
    } catch (e) {
      console.warn('Invalid color value in hash:', additionalRoundsColor);
    }
  }
}

export const squareRoundsPreview = new SquareRoundsPreviewClass();
