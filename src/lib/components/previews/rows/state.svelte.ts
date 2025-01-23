import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
import { gauges, previews, weather } from '$lib/state';
import { displayNumber, setTargets, sum } from '$lib/utils';
import chroma from 'chroma-js';
import Preview from './Preview.svelte';
import Settings from './Settings.svelte';

export class RowsPreviewClass {
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
  stitchSize = 10;

  id = 'rows';

  name = 'Rows';

  sections = $state([]);

  svg = $state(null);

  img = $state({
    light: './images/preview_icons/Rows.png',
    dark: './images/preview_icons/Rows White.png',
  });

  wpTagId = 2;

  wpTagSlug = 'rows';

  previewComponent = Preview;

  settingsComponent = Settings;

  // *******************
  // User settings properties
  // *******************
  settings = $state({
    selectedTargets: ['tmax'],
    stitchesPerRow: 300,
    stitchesPerDay: 300,
    lengthTarget: 'none',
    extrasColor: '#f0f3f3',
  });

  // *******************
  // Derived properties
  // *******************
  totalStitches = $derived.by(() => {
    if (this.settings.lengthTarget === 'none')
      return this.settings.stitchesPerRow * weather.data?.length;
    if (this.settings.lengthTarget === 'custom')
      return this.settings.stitchesPerDay * weather.data?.length;
    return sum(this.settings.lengthTarget);
  });

  rows = $derived(Math.ceil(this.totalStitches / this.settings.stitchesPerRow));

  width = $derived(this.settings.stitchesPerRow * this.stitchSize);

  height = $derived(
    this.rows * this.stitchSize * this.settings.selectedTargets.length,
  );

  countOfAdditionalStitches = $derived(
    displayNumber(
      this.rows * this.settings.stitchesPerRow - this.totalStitches,
      6,
    ),
  );

  totalSections = $derived(
    this.countOfAdditionalStitches > 0
      ? weather.data?.length + 1
      : weather.data?.length,
  );

  targets = $derived(
    gauges.allCreated
      .flatMap((n) => n.targets)
      .filter((n) => this.settings.selectedTargets.includes(n.id)),
  );

  totalRows = $derived(this.rows * this.settings.selectedTargets.length);

  // *******************
  // URL hash derived from settings
  // *******************
  hash = $derived.by(() => {
    let hash = '&';
    hash += `${this.id}=`;
    hash += `${this.settings.selectedTargets.join('')}`;
    hash += '(';
    hash += this.settings.stitchesPerRow;
    // here's the rub...
    if (
      this.countOfAdditionalStitches > 0 &&
      this.settings.lengthTarget !== 'none'
    )
      hash += `${CHARACTERS_FOR_URL_HASH.separator}${chroma(this.settings.extrasColor).hex().substring(1)}`;
    if (this.settings.lengthTarget === 'custom')
      hash += `!${this.settings.stitchesPerDay}`;
    else if (this.settings.lengthTarget !== 'none')
      hash += `!${this.settings.lengthTarget}`;
    hash += ')';
    return hash;
  });

  // *******************
  // Method for loading settings from a url hash string
  // *******************
  load(hash) {
    // Initialize variables
    let startIndex, separatorIndex, exclamationIndex, lengthEndIndex;

    // Iterate through the hash string to find the indices of specific characters
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex = i;
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] == CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndex = i;
      if (hash[i] === '!') exclamationIndex = i;
      if (hash[i] === ')') lengthEndIndex = i;
    }

    // If the format of the hash is incorrect, stop processing
    if (!startIndex || !lengthEndIndex) return;

    // Extract the targets from the hash and update the settings
    let targets = hash.substring(0, startIndex);
    targets = targets.match(/.{1,4}/g);
    this.settings.selectedTargets = targets;

    // Extract the stitches per row from the hash and update the settings
    let stitchesPerRow;
    if (separatorIndex) {
      stitchesPerRow = +hash.substring(startIndex + 1, separatorIndex);
    } else if (exclamationIndex) {
      stitchesPerRow = +hash.substring(startIndex + 1, exclamationIndex);
    } else if (lengthEndIndex) {
      stitchesPerRow = +hash.substring(startIndex + 1, lengthEndIndex);
    }
    this.settings.stitchesPerRow = stitchesPerRow;

    // Extract the color from the hash and update the settings
    let color = '';
    if (separatorIndex && exclamationIndex) {
      color = hash.substring(separatorIndex + 1, exclamationIndex);
    } else if (separatorIndex && lengthEndIndex) {
      color = hash.substring(separatorIndex + 1, lengthEndIndex);
    }
    if (chroma.valid(color)) this.settings.extrasColor = chroma(color).hex();

    // Extract the length target or stitches per row from the hash and update the settings
    if (exclamationIndex) {
      let content = hash.substring(exclamationIndex + 1, lengthEndIndex);
      if (isNaN(+content)) this.settings.lengthTarget = content;
      else if (!isNaN(+content)) {
        this.settings.stitchesPerDay = +content;
        this.settings.lengthTarget = 'custom';
      }
    }

    // Update active preview
    previews.activeId = this.id;
  }
}

export const rowsPreview = new RowsPreviewClass();
