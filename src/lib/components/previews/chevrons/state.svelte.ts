import { CHARACTERS_FOR_URL_HASH } from '$lib/constants/page-constants';
import { gauges } from '$lib/state/gauges-state.svelte';
import { previews } from '$lib/state/preview-state.svelte';
import { project } from '$lib/state/project-state.svelte';
import { weather } from '$lib/state/weather-state.svelte';
import type { BasePreviewSettings } from '$lib/types/preview-types';
import type { WeatherParam } from '$lib/types/gauge-types';
import { setTargets } from '$lib/utils/preview-utils.svelte';
import { upToDate } from '$lib/utils/other-utils';
import Preview from './Preview.svelte';
import Settings from './Settings.svelte';

interface ChevronsPreviewSettings extends BasePreviewSettings {
  selectedTargets: WeatherParam['id'][];
  chevronsPerRow: number;
  chevronSideLength: number;
}

export class ChevronsPreviewClass {
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
  name = 'Chevrons';

  id = 'chev';

  svg = $state();

  img = {
    light: './images/preview_icons/Chevrons.png',
    dark: './images/preview_icons/Chevrons White.png',
  };

  wpTagId = 7;

  wpTagSlug = 'chevrons';

  settingsComponent = Settings;

  previewComponent = Preview;

  sections = $state([]);

  ROW_HEIGHT = 5;

  // *******************
  // User settings properties
  // *******************
  settings = $state<ChevronsPreviewSettings>({
    selectedTargets: ['tmax'],
    chevronsPerRow: 30,
    chevronSideLength: 32,
    useSeasonTargets: false,
  });

  // *******************
  // Derived properties
  // *******************
  chevronSideLength = $derived(this.settings.chevronSideLength * Math.sqrt(2));

  chevronHeight = $derived(this.chevronSideLength / 2);

  width = $derived(this.settings.chevronsPerRow * this.chevronSideLength);

  height = $derived(
    this.ROW_HEIGHT * weather.data?.length +
      this.ROW_HEIGHT * this.settings.selectedTargets.length +
      this.settings.chevronSideLength,
  );

  targets = $derived(
    gauges.allCreated
      .map((n) => n.targets)
      .flat()
      .filter((n) => this.settings.selectedTargets.includes(n.id)),
  );

  details = $derived({
    rows: weather.data?.length * this.settings.selectedTargets.length,
  });

  // *******************
  // URL hash derived from settings
  // *******************
  hash = $derived.by(() => {
    let hash = '&';
    hash += `${this.id}=`;
    hash += `${this.settings.selectedTargets.join('')}(${this.settings.chevronsPerRow}${CHARACTERS_FOR_URL_HASH.separator}${
      this.settings.chevronSideLength
    })`;
    return hash;
  });

  // *******************
  // Method for loading settings from a url hash string
  // *******************
  load(hash) {
    let startIndex, endIndex, separatorIndex;
    for (let i = 0; i < hash.length; i++) {
      if (hash[i] === '(') startIndex = i;
      if (
        hash[i] === CHARACTERS_FOR_URL_HASH.separator ||
        hash[i] === CHARACTERS_FOR_URL_HASH.separator_alt
      )
        separatorIndex = i;
      if (hash[i] === ')') endIndex = i;
    }
    if (!startIndex || !separatorIndex || !endIndex) return; // format of hash was wrong, so stop processing
    const params = hash.substring(0, startIndex).match(/.{1,4}/g);
    this.settings.selectedTargets = params;
    this.settings.chevronsPerRow = +hash.substring(
      startIndex + 1,
      separatorIndex,
    );
    this.settings.chevronSideLength = +hash.substring(
      separatorIndex + 1,
      endIndex,
    );
    if (!upToDate(project.onLoaded.version, '1.747'))
      this.settings.chevronSideLength = Math.round(
        (this.settings.chevronSideLength / 2) * Math.sqrt(2),
      ); // Version 1.747 changed chevronWidth to the length of each side of the chevron
    previews.activeId = this.id;
  }
}

export const chevronsPreview = new ChevronsPreviewClass();
