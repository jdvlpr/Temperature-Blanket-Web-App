import { CHARACTERS_FOR_URL_HASH } from '$lib/constants/page-constants';
import { gauges } from '$lib/state/gauges-state.svelte';
import { previews } from '$lib/state/preview-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import type { Color } from '$lib/types/yarn-types';
import type { WeatherParam } from '$lib/types/gauge-types';
import { setTargets } from '$lib/utils/preview-utils.svelte';
import Preview from './Preview.svelte';
import Settings from './Settings.svelte';

type HexagonsPreviewSettings = {
  primaryTarget: WeatherParam['id'];
  hexagonSize: number;
  dimensions: string;
  joinStitches: number;
  joinColor: Color['hex'];
};

export class HexagonsPreviewClass {
  constructor() {
    $effect.root(() => {
      // If a gauge is created or deleted, handle updating the available weather parameter targets
      $effect(() => {
        if (gauges.allCreated.length) {
          this.settings.primaryTarget = setTargets(this.settings.primaryTarget);
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

  wpTagId = null; //TODO: create in wp

  wpTagSlug = 'hexagons';

  previewComponent = Preview;

  settingsComponent = Settings;

  STITCH_SIZE = 5;

  sections = $state([]);

  // *******************
  // User settings properties
  // *******************

  settings = $state<HexagonsPreviewSettings>({
    primaryTarget: 'tmax',
    hexagonSize: 3,
    dimensions: '100x100',
    joinStitches: 0,
    joinColor: '#e8e3e2',
  });

  // *******************
  // Derived properties
  // *******************

  dimensions = $derived(this.settings.dimensions.split('x').map((n) => +n));

  joinWidth = $derived(
    this.settings.joinStitches * 2 * this.STITCH_SIZE * this.dimensions[0],
  );

  width = $derived(
    this.dimensions[0] * this.STITCH_SIZE * this.settings.hexagonSize * 2 +
      this.joinWidth,
  );

  joinHeight = $derived(
    this.settings.joinStitches * 2 * this.STITCH_SIZE * this.dimensions[1],
  );

  height = $derived(
    this.dimensions[1] *
      this.STITCH_SIZE *
      Math.round(this.settings.hexagonSize * Math.sqrt(3)) +
      this.joinHeight,
  );

  targets = $derived(
    gauges.allCreated
      .flatMap((n) => n.targets)
      .filter((n) => this.settings.primaryTarget === n.id),
  );

  lengthFactors = $derived.by(() => {
    if (!weather.data.length) return;
    const factors = [];
    for (let i = 0; i < weather.data.length; i++) {
      if (weather.data.length % i === 0) factors.push(i);
    }
    factors.push(weather.data.length);
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
    hash += `${this.settings.primaryTarget}(${this.settings.hexagonSize}${CHARACTERS_FOR_URL_HASH.separator}${this.settings.dimensions})`;
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
    this.settings.primaryTarget = hash.substring(0, startIndex);
    this.settings.hexagonSize = +hash.substring(
      startIndex + 1,
      separatorIndex[0],
    );
    this.settings.dimensions = hash.substring(separatorIndex[0] + 1, endIndex);
    this.settings.dimensions = this.settings.dimensions.replace('×', 'x'); // sometimes firefox formatted this as multiplication sign

    previews.activeId = this.id;
  }
}

export const hexagonsPreview = new HexagonsPreviewClass();
