import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
import { gauges, previews, weather } from '$lib/state';
import type { BasePreviewSettings, Color, WeatherParam } from '$lib/types';
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

interface MonthRowsPreviewSettings extends BasePreviewSettings {
  selectedTargets: WeatherParam['id'][];
  dimensions: string;
  direction: 'top-to-bottom' | 'left-to-right';
  stitchesPerRow: number;
  extrasColor: Color['hex'];
  borderStitches: number;
  borderColor: Color['hex'];
}

export class MonthRowsPreviewClass {
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
  name = 'Month Rows';

  id = 'mrws';

  svg = $state();

  img = {
    light: './images/preview_icons/mrws_black.png',
    dark: './images/preview_icons/mrws_white.png',
  };

  wpTagId = 11;

  wpTagSlug = 'month-rows';

  settingsComponent = Settings;

  previewComponent = Preview;

  months = $state([]);

  borders = $state([]);

  STITCH_SIZE = 10;

  // *******************
  // User settings properties
  // *******************
  settings = $state<MonthRowsPreviewSettings>({
    selectedTargets: ['tmax'],
    dimensions: '2x6',
    direction: 'top-to-bottom',
    stitchesPerRow: 80,
    extrasColor: '#f0f3f3',
    borderStitches: 1,
    borderColor: '#f0f3f3',
    useSeasonTargets: false,
  });

  // *******************
  // Derived properties
  // *******************

  weatherMonths = $derived(weatherMonthsData({ weatherData: weather.data }));

  factors = $derived(getFactors({ length: this.weatherMonths.length }));

  possibleDimensions = $derived(
    getPossibleDimensions({ factors: this.factors }),
  );

  dimensionsWidth = $derived(+this.settings.dimensions.split('x')[0]);

  dimensionsHeight = $derived(+this.settings.dimensions.split('x')[1]);

  monthsInData = $derived(weatherMonthsData({ weatherData: weather.data }));

  daysInLongestMonth = $derived(getDaysInLongestMonth(this.monthsInData));

  rowsPerMonth = $derived(
    this.daysInLongestMonth * this.settings.selectedTargets.length,
  );

  width = $derived(
    this.settings.stitchesPerRow * this.dimensionsWidth * this.STITCH_SIZE +
      (this.dimensionsWidth + 1) *
        this.settings.borderStitches *
        this.STITCH_SIZE,
  );

  height = $derived(
    this.dimensionsHeight *
      this.rowsPerMonth *
      this.settings.selectedTargets.length *
      this.STITCH_SIZE +
      (this.dimensionsHeight + 1) *
        this.settings.borderStitches *
        this.STITCH_SIZE,
  );

  targets = $derived(
    gauges.allCreated
      .flatMap((n) => n.targets)
      .filter((n) => this.settings.selectedTargets.includes(n.id)),
  );

  details = $derived({ rowsPerMonth: this.rowsPerMonth });

  totalRows = $derived(this.monthsInData?.length * this.rowsPerMonth);

  // *******************
  // URL hash derived from settings
  // *******************
  hash = $derived.by(() => {
    let hash = '&';
    hash += `${this.id}=`;
    hash += `${this.settings.selectedTargets.join('')}`;
    hash += CHARACTERS_FOR_URL_HASH.separator;
    hash += `${this.settings.dimensions}`;
    hash += CHARACTERS_FOR_URL_HASH.separator;
    hash += `${this.settings.direction === 'left-to-right' ? '0' : '1'}`;
    hash += this.settings.stitchesPerRow;
    // here's the rub...
    hash += `${CHARACTERS_FOR_URL_HASH.separator}${chroma(this.settings.extrasColor).hex().substring(1)}`;
    hash += this.settings.borderStitches;
    hash += `${CHARACTERS_FOR_URL_HASH.separator}${chroma(this.settings.borderColor).hex().substring(1)}`;
    return hash;
  });

  // *******************
  // Method for loading settings from a url hash string
  // *******************
  load(hash) {
    let separatorIndex = [];

    for (let i = 0; i < hash.length; i++) {
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] == CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndex.push(i);
    }

    if (!separatorIndex.length) return; // format of hash was wrong, so stop processing

    let position = 0;
    let targets = hash.substring(position, separatorIndex[0]);
    targets = targets.match(/.{1,4}/g);
    this.settings.selectedTargets = targets;

    position = separatorIndex[0] + 1;
    this.settings.dimensions = hash.substring(position, separatorIndex[1]); // dimensions
    this.settings.dimensions = this.settings.dimensions.replace('×', 'x'); // sometimes firefox formated this as multiplcation sign

    position = separatorIndex[1] + 1;
    this.settings.direction =
      hash.substring(position, position + 1) === '0'
        ? 'left-to-right'
        : 'top-to-bottom';

    position += 1;
    this.settings.stitchesPerRow = +hash.substring(position, separatorIndex[2]);

    position = separatorIndex[2] + 1;
    this.settings.extrasColor = chroma.valid(
      hash.substring(position, position + 6),
    )
      ? chroma(hash.substring(position, position + 6)).hex()
      : this.settings.extrasColor;

    position += 6;
    this.settings.borderStitches = +hash.substring(position, separatorIndex[3]);

    position = separatorIndex[3] + 1;
    this.settings.borderColor = chroma.valid(
      hash.substring(position, position + 6),
    )
      ? chroma(hash.substring(position, position + 6)).hex()
      : this.settings.borderColor;

    previews.activeId = this.id;
  }
}

export const monthRowsPreview = new MonthRowsPreviewClass();
