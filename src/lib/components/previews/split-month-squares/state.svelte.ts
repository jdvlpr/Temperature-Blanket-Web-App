import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
import { gauges, previews, weather } from '$lib/state';
import {
  getDaysInLongestMonth,
  getFactors,
  getMiddleValueOfArray,
  getPossibleDimensions,
  setTargets,
  weatherMonthsData,
} from '$lib/utils';
import chroma from 'chroma-js';
import Preview from './Preview.svelte';
import Settings from './Settings.svelte';

export class SplitMonthSquaresPreviewClass {
  constructor() {
    $effect.root(() => {
      // If a gauge is created or deleted, handle updating the available weather parameter targets
      $effect(() => {
        if (gauges.allCreated.length) {
          this.settings.leftTarget = setTargets(this.settings.leftTarget);
          this.settings.rightTarget = setTargets(this.settings.rightTarget);
        }
      });

      // If a new weather search happens, and the current dimensions are not possible, set new dimensions
      $effect(() => {
        if (
          weather.data.length &&
          !this.possibleDimensions.includes(this.settings.dimensions)
        )
          this.settings.dimensions = getMiddleValueOfArray(
            this.possibleDimensions,
          );
      });
    });
  }

  // *******************
  // Constant properties
  // *******************
  name = 'Split Month Squares';

  id = 'smsq';

  svg = $state();

  img = {
    light: './images/preview_icons/smsq_black.png',
    dark: './images/preview_icons/smsq_white.png',
  };

  wpTagId = 10;

  wpTagSlug = 'split-month-squares';

  settingsComponent = Settings;

  previewComponent = Preview;

  sections = $state([]);

  STITCH_SIZE = 10;

  // *******************
  // User settings properties
  // *******************
  settings = $state({
    leftTarget: 'tmin',
    rightTarget: 'tmax',
    dimensions: '3x4',
    additionalRoundsColor: '#f0f3f3',
    additionalRoundsPerSquare: 1,
  });

  // *******************
  // Derived properties
  // *******************

  weatherMonths = $derived(weatherMonthsData({ weatherData: weather.data }));

  factors = $derived(getFactors({ length: this.weatherMonths.length }));

  possibleDimensions = $derived(
    getPossibleDimensions({ factors: this.factors }),
  );

  daysInLongestMonth = $derived(getDaysInLongestMonth(this.weatherMonths));

  roundsPerSquare = $derived(
    this.daysInLongestMonth + this.settings.additionalRoundsPerSquare,
  );

  squareSize = $derived(this.roundsPerSquare * 2 * this.STITCH_SIZE);

  dimensionsWidth = $derived(+this.settings.dimensions.split('x')[0]);

  dimensionsHeight = $derived(+this.settings.dimensions.split('x')[1]);

  width = $derived(
    this.dimensionsWidth * this.squareSize + this.STITCH_SIZE / 2,
  );

  height = $derived(
    this.dimensionsHeight * this.squareSize + this.STITCH_SIZE / 2,
  );

  targets = $derived(
    gauges.allCreated
      .flatMap((n) => n.targets)
      .filter(
        (n) =>
          this.settings.rightTarget === n.id ||
          this.settings.leftTarget === n.id,
      ),
  );

  details = $derived({ roundsPerSquare: this.roundsPerSquare });

  totalRounds = $derived(this.weatherMonths.length * this.roundsPerSquare);

  // *******************
  // URL hash derived from settings
  // *******************
  hash = $derived.by(() => {
    let hash = '&';
    hash += `${this.id}=`;
    hash += `${this.settings.leftTarget}${this.settings.rightTarget}(${this.settings.dimensions}${CHARACTERS_FOR_URL_HASH.separator}${
      this.settings.additionalRoundsPerSquare
    }${CHARACTERS_FOR_URL_HASH.separator}${chroma(this.settings.additionalRoundsColor).hex().substring(1)})`;
    return hash;
  });

  // *******************
  // Method for loading settings from a url hash string
  // *******************
  load(hash) {
    let startIndex = [],
      endIndex = [];
    const separatorIndex = [];
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex.push(i);
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] === CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndex.push(i);
      if (hash[i] === ')') endIndex.push(i);
    }
    if (!startIndex || !separatorIndex || !endIndex) return; // format of hash was wrong, so stop processing

    // targets
    let targets = hash.substring(0, startIndex[0]);
    targets = targets.match(/.{1,4}/g);
    this.settings.leftTarget = targets[0];
    this.settings.rightTarget = targets[1];

    this.settings.dimensions = hash.substring(
      startIndex[0] + 1,
      separatorIndex[0],
    );
    this.settings.dimensions = this.settings.dimensions.replace('×', 'x'); // sometimes firefox formated this as multiplcation sign
    this.settings.additionalRoundsPerSquare = +hash.substring(
      separatorIndex[0] + 1,
      separatorIndex[1],
    );
    this.settings.additionalRoundsColor = chroma(
      hash.substring(separatorIndex[1] + 1, endIndex[0]),
    ).hex();

    previews.activeId = this.id;
  }
}

export const splitMonthSquaresPreview = new SplitMonthSquaresPreviewClass();
