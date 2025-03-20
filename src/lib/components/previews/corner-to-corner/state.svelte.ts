import { CHARACTERS_FOR_URL_HASH } from '$lib/constants';
import { gauges, previews, weather } from '$lib/state';
import { setTargets } from '$lib/utils';
import Preview from './Preview.svelte';
import Settings from './Settings.svelte';

export class CornerToCornerPreviewClass {
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
  name = 'Corner to Corner';

  id = 'crnr';

  svg = $state();

  img = {
    light: './images/preview_icons/Corner to Corner.png',
    dark: './images/preview_icons/Corner to Corner White.png',
  };

  wpTagId = 5;

  wpTagSlug = 'corner-to-corner';

  settingsComponent = Settings;

  previewComponent = Preview;

  sections = $state([]);

  STITCH_SIZE = 5;

  // *******************
  // User settings properties
  // *******************
  settings = $state({
    selectedTarget: 'tmax',
    lineLength: 15,
    dimensions: '100x100',
  });

  // *******************
  // Derived properties
  // *******************

  dimensions = $derived(this.settings.dimensions.split('x').map((n) => +n));

  width = $derived(this.dimensions[0] * this.STITCH_SIZE);

  height = $derived(this.dimensions[1] * this.STITCH_SIZE);

  targets = $derived(
    gauges.allCreated
      .flatMap((n) => n.targets)
      .filter((n) => this.settings.selectedTarget === n.id),
  );

  totalLength = $derived(
    weather.data ? weather.data?.length * this.settings.lineLength : 0,
  );

  lengthFactors = $derived.by(() => {
    if (!this.totalLength) return;
    const factors = [];
    for (let i = 0; i < this.totalLength; i++) {
      if (this.totalLength % i === 0) factors.push(i);
    }
    factors.push(this.totalLength);
    return factors;
  });

  possibleDimensions = $derived.by(() => {
    if (!this.lengthFactors) return;
    const dimensions = [];
    this.lengthFactors.forEach((factor, index, factors) => {
      if (index < factors.length / 2) {
        dimensions.push([factor, factors[factors.length - index - 1]]);
      }
    });
    return dimensions;
  });

  dimensionsOptions = $derived.by(() => {
    if (!this.possibleDimensions) return;
    const options = [];
    this.possibleDimensions.forEach((item) => {
      options.push(item.join('x'));
    });
    if (!options.includes(this.settings.dimensions)) {
      this.settings.dimensions = options[options.length - 1];
    }
    return options;
  });

  // *******************
  // URL hash derived from settings
  // *******************
  hash = $derived.by(() => {
    if (!this.settings.dimensions) return '';
    let hash = '&';
    hash += `${this.id}=`;
    hash += `${this.settings.selectedTarget}(${this.settings.lineLength}${CHARACTERS_FOR_URL_HASH.separator}${this.settings.dimensions})`;
    return hash;
  });

  // *******************
  // Method for loading settings from a url hash string
  // *******************
  load(hash) {
    let startIndex, endIndex;
    const separatorIndex = [];
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex = i;
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] === CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndex.push(i);
      if (hash[i] === ')') endIndex = i;
    }
    if (!startIndex || !separatorIndex[0] || !endIndex) return; // format of hash was wrong, so stop processing
    this.settings.selectedTarget = hash.substring(0, startIndex);
    this.settings.lineLength = +hash.substring(
      startIndex + 1,
      separatorIndex[0],
    );
    let dimensions;
    if (separatorIndex[1]) {
      // Legacy (before v1.700, to accommodate for total length, but it's not needed
      // _details.totalLength = +hash.substring(separatorIndex[0] + 1, separatorIndex[1]);
      dimensions = hash.substring(separatorIndex[1] + 1, endIndex);
    } else {
      dimensions = hash.substring(separatorIndex[0] + 1, endIndex);
    }
    this.settings.dimensions = dimensions;
    this.settings.dimensions = this.settings.dimensions.replace('×', 'x'); // sometimes firefox formatted this as multiplication sign

    previews.activeId = this.id;
  }
}

export const cornerToCornerPreview = new CornerToCornerPreviewClass();
