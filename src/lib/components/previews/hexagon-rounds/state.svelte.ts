import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
import { gauges, previews, weather } from '$lib/state';
import { chunkArray, exists, setTargets } from '$lib/utils';
import chroma from 'chroma-js';
import Preview from './Preview.svelte';
import Settings from './Settings.svelte';
import { untrack } from 'svelte';

export class HexagonRoundsPreviewClass {
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
    });
  }

  // *******************
  // Constant properties
  // *******************
  name = 'Hexagon Rounds';

  id = 'hxrd';

  svg = $state();

  img = {
    light: './images/preview_icons/Hexagon Rounds.png',
    dark: './images/preview_icons/Hexagon Rounds White.png',
  };

  wpTagId = 15;

  wpTagSlug = 'hexagon-rounds';

  settingsComponent = Settings;

  previewComponent = Preview;

  sections = $state([]);

  STITCH_SIZE = 10;

  // *******************
  // User settings properties
  // *******************
  settings = $state({
    selectedTarget: 'tmax',
    roundsPerHexagon: 13,
    columns: 4,
    additionalRoundsColor: '#f0f3f3',
    hexagonBorder: 0,
  });

  // *******************
  // Derived properties
  // *******************

  weatherDataInUse = $derived(weather.data);

  weatherHexagons = $derived(
    chunkArray(this.weatherDataInUse, this.settings.roundsPerHexagon),
  );

  // Calculate the width of a hexagon (point to point)
  hexagonWidth = $derived(
    (this.settings.roundsPerHexagon + this.settings.hexagonBorder) *
      this.STITCH_SIZE *
      2,
  );

  // Calculate the height of a hexagon (flat to flat)
  hexagonHeight = $derived(
    (this.hexagonWidth * Math.sqrt(3)) / 2, // This gives us the proper height for tessellation
  );

  numberOfHexagonsWithWeatherData = $derived(
    Math.ceil(this.weatherDataInUse.length / this.settings.roundsPerHexagon),
  );

  hexagonsPerTwoRows = $derived(this.settings.columns * 2 + 1);

  pairsOfFullRows = $derived(
    Math.floor(this.numberOfHexagonsWithWeatherData / this.hexagonsPerTwoRows),
  );

  // Helper constants for clarity
  longRowSize = $derived(this.settings.columns + 1);
  shortRowSize = $derived(this.settings.columns);

  // The number of hexagons with weather data left over after filling full pairs of rows.
  remainder = $derived(
    this.numberOfHexagonsWithWeatherData % this.hexagonsPerTwoRows,
  );

  // The total number of rows.
  rows = $derived(
    this.pairsOfFullRows * 2 +
      (this.remainder === 0 ? 0 : this.remainder < this.longRowSize ? 1 : 2),
  );

  // Determine the size of the very last row based on the total row count.
  hexagonsInLastRow = $derived(
    this.rows === 0
      ? 0
      : this.rows % 2 === 0
        ? this.longRowSize
        : this.shortRowSize,
  );

  // Find how many hexagons with weather data are actually in that last row.
  hexagonsInLastRowWithWeatherData = $derived.by(() => {
    if (this.remainder === 0) {
      // If no remainder, the last row is a full, short row (unless there's no data).
      return this.numberOfHexagonsWithWeatherData > 0
        ? this.hexagonsInLastRow
        : 0;
    }
    // If remainder fits in the first new row (a long one).
    if (this.remainder < this.hexagonsInLastRow) {
      return this.remainder;
    }

    // If remainder spills over into the second new row (a short one).
    const remainder =
      this.remainder - this.hexagonsPerTwoRows + this.hexagonsInLastRow;
    if (remainder < 0) return this.longRowSize + remainder;
    return remainder;
  });

  // The empty hexagons are now a simple subtraction.
  hexagonsWithNoWeatherData = $derived.by(() => {
    const emptyHexagons =
      this.hexagonsInLastRow - this.hexagonsInLastRowWithWeatherData;
    if (emptyHexagons === this.longRowSize) return 0;
    return emptyHexagons;
  });

  // 5. Finally, calculate the total hexagon slots with the corrected logic for odd rows.
  totalHexagons = $derived(
    this.rows % 2 === 0
      ? (this.rows / 2) * this.hexagonsPerTwoRows
      : Math.floor(this.rows / 2) * this.hexagonsPerTwoRows +
          this.hexagonsInLastRow,
  );

  width = $derived((this.settings.columns + 1) * this.hexagonWidth);

  height = $derived(this.rows * this.hexagonHeight + this.hexagonHeight / 2);

  totalRounds = $derived(
    this.totalHexagons *
      (this.settings.roundsPerHexagon + this.settings.hexagonBorder),
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
    hash += `${this.settings.roundsPerHexagon}${CHARACTERS_FOR_URL_HASH.separator}${this.settings.columns}${CHARACTERS_FOR_URL_HASH.separator}${this.settings.hexagonBorder}${CHARACTERS_FOR_URL_HASH.separator}${chroma(this.settings.additionalRoundsColor).hex().substring(1)}`;
    hash += ')';
    return hash;
  });

  // *******************
  // Method for loading settings from a url hash string
  // *******************
  load(hash: string) {
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

    // If no valid separator found or no parts, stop
    if (!parts || !parts.length) return;

    // Destructure parts into named settings
    const [roundsPerHexagon, columns, hexagonBorder, additionalRoundsColor] =
      parts;

    // Try parsing each setting safely
    if (Number.isFinite(+roundsPerHexagon))
      this.settings.roundsPerHexagon = +roundsPerHexagon;
    if (Number.isFinite(+columns)) this.settings.columns = +columns;
    if (Number.isFinite(+hexagonBorder))
      this.settings.hexagonBorder = +hexagonBorder;

    if (
      typeof additionalRoundsColor !== 'undefined' &&
      additionalRoundsColor !== null &&
      additionalRoundsColor !== ''
    ) {
      try {
        this.settings.additionalRoundsColor = chroma(
          additionalRoundsColor,
        ).hex();
      } catch (e) {
        console.warn('Invalid color value in hash:', additionalRoundsColor);
      }
    }
  }
}

export const hexagonRoundsPreview = new HexagonRoundsPreviewClass();
